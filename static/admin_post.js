let me = null;

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

function setHint(msg) {
  const el = document.getElementById('hint');
  if (el) el.textContent = msg || '';
}

function qs(name) {
  return new URLSearchParams(window.location.search || '').get(name);
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function focusEditor() {
  const editor = document.getElementById('editor');
  if (editor) editor.focus();
}

function exec(cmd, value = null) {
  focusEditor();
  document.execCommand(cmd, false, value);
}

function formatBlock(tagName) {
  focusEditor();
  document.execCommand('formatBlock', false, tagName);
}

async function refreshMe() {
  try {
    me = await api('/api/admin/me', { method: 'GET' });
    const meLine = document.getElementById('meLine');
    if (meLine) meLine.textContent = `Signed in as ${me.username} (${me.role})`;
    return true;
  } catch (_) {
    me = null;
    return false;
  }
}

function collectPayload() {
  const title = document.getElementById('postTitle').value.trim();
  const bucket = document.getElementById('postBucket').value;
  const ogImgRaw = document.getElementById('postOgImg').value.trim();
  const readMinutesRaw = document.getElementById('postReadMinutes').value;
  const excerptRaw = document.getElementById('postExcerpt').value.trim();
  const editor = document.getElementById('editor');

  return {
    title,
    bucket,
    content: editor ? editor.innerHTML : '',
    excerpt: excerptRaw ? excerptRaw : null,
    creator: me ? me.username : null,
    ogImg: ogImgRaw ? ogImgRaw : null,
    readMinutes: readMinutesRaw ? Number(readMinutesRaw) : null,
  };
}

function fillForm(post) {
  document.getElementById('postId').value = post.id;
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postBucket').value = post.bucket || 'Tech';
  document.getElementById('postOgImg').value = post.ogImg || '';
  document.getElementById('postReadMinutes').value = post.readMinutes || '';
  document.getElementById('postExcerpt').value = post.excerpt || '';
  document.getElementById('editor').innerHTML = post.content || '';

  const editorMode = document.getElementById('editorMode');
  if (editorMode) editorMode.textContent = 'Edit post';

  const del = document.getElementById('deleteBtn');
  if (del) del.style.display = 'inline-flex';

  const viewBtn = document.getElementById('viewBtn');
  if (viewBtn) {
    viewBtn.style.display = 'inline-flex';
    viewBtn.href = `/post?id=${encodeURIComponent(post.id)}`;
  }
}

function setNewMode() {
  document.getElementById('postId').value = '';
  document.getElementById('postTitle').value = '';
  document.getElementById('postBucket').value = 'Tech';
  document.getElementById('postOgImg').value = '';
  document.getElementById('postReadMinutes').value = '';
  document.getElementById('postExcerpt').value = '';
  document.getElementById('editor').innerHTML = '';

  const editorMode = document.getElementById('editorMode');
  if (editorMode) editorMode.textContent = 'New post';

  const del = document.getElementById('deleteBtn');
  if (del) del.style.display = 'none';

  const viewBtn = document.getElementById('viewBtn');
  if (viewBtn) viewBtn.style.display = 'none';
}

async function loadPostIfNeeded() {
  const id = qs('id');
  if (!id) {
    setNewMode();
    return;
  }

  const post = await api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'GET' });
  fillForm(post);
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return await res.json();
}

function wireToolbar() {
  const toolbar = document.querySelector('.admin-editor-toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.hasAttribute('data-cmd')) {
      exec(btn.getAttribute('data-cmd'));
      return;
    }

    if (btn.hasAttribute('data-block')) {
      formatBlock(btn.getAttribute('data-block'));
      return;
    }
  });

  document.getElementById('linkBtn').addEventListener('click', () => {
    const url = prompt('Link URL (https://...)');
    if (!url) return;
    exec('createLink', url);
  });

  document.getElementById('unlinkBtn').addEventListener('click', () => {
    exec('unlink');
  });

  document.getElementById('imageUrlBtn').addEventListener('click', () => {
    const url = prompt('Image URL (https://...)');
    if (!url) return;
    exec('insertImage', url);
  });

  const uploadBtn = document.getElementById('uploadImageBtn');
  const fileInput = document.getElementById('imageFileInput');

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;

    setHint('Uploading image...');
    try {
      const out = await uploadImage(file);
      exec('insertImage', out.url);
      setHint('Image inserted.');
    } catch (err) {
      setHint(String(err.message || err));
    }
  });
}

function wireForm() {
  const form = document.getElementById('editorForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setHint('');

    const payload = collectPayload();
    if (!payload.title) {
      setHint('Title is required.');
      return;
    }

    const id = document.getElementById('postId').value;

    try {
      if (!id) {
        const created = await api('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        setHint('Saved.');
        history.replaceState(null, '', `/admin/post?id=${encodeURIComponent(created.id)}`);
        fillForm(created);
      } else {
        const updated = await api(`/api/admin/post?id=${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setHint('Updated.');
        fillForm(updated);
      }
    } catch (err) {
      setHint(String(err.message || err));
    }
  });

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    const id = document.getElementById('postId').value;
    if (!id) return;
    if (!confirm('Delete this post?')) return;

    setHint('');
    try {
      await api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setHint('Deleted.');
      history.replaceState(null, '', '/admin/post');
      setNewMode();
    } catch (err) {
      setHint(String(err.message || err));
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin';
    }
  });
}

(async function boot() {
  const ok = await refreshMe();
  if (!ok) {
    window.location.href = '/admin';
    return;
  }

  wireToolbar();
  wireForm();

  try {
    await loadPostIfNeeded();
  } catch (err) {
    setHint(String(err.message || err));
  }
})();
