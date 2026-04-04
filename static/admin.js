const els = {
  loginCard: document.getElementById('loginCard'),
  loginForm: document.getElementById('loginForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  loginHint: document.getElementById('loginHint'),

  meLine: document.getElementById('meLine'),
  logoutBtn: document.getElementById('logoutBtn'),

  postsCard: document.getElementById('postsCard'),
  postsListCard: document.getElementById('postsListCard'),
  postsList: document.getElementById('postsList'),
  postsCount: document.getElementById('postsCount'),

  postForm: document.getElementById('postForm'),
  postFormMode: document.getElementById('postFormMode'),
  postId: document.getElementById('postId'),
  postTitle: document.getElementById('postTitle'),
  postBucket: document.getElementById('postBucket'),
  postOgImg: document.getElementById('postOgImg'),
  postReadMinutes: document.getElementById('postReadMinutes'),
  postExcerpt: document.getElementById('postExcerpt'),
  postContent: document.getElementById('postContent'),
  postHint: document.getElementById('postHint'),
  deletePostBtn: document.getElementById('deletePostBtn'),
  newPostBtn: document.getElementById('newPostBtn'),

  usersCard: document.getElementById('usersCard'),
  userForm: document.getElementById('userForm'),
  newUsername: document.getElementById('newUsername'),
  newPassword: document.getElementById('newPassword'),
  newRole: document.getElementById('newRole'),
  userHint: document.getElementById('userHint'),
  usersList: document.getElementById('usersList'),
};

let me = null;
let posts = [];

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
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

function setHint(el, msg) {
  el.textContent = msg || '';
}

function showApp() {
  els.loginCard.style.display = 'none';
  els.postsCard.style.display = 'block';
  els.postsListCard.style.display = 'block';
  els.logoutBtn.style.display = 'inline-flex';

  els.meLine.textContent = me ? `Signed in as ${me.username} (${me.role})` : '';

  if (me && me.role === 'admin') {
    els.usersCard.style.display = 'block';
  } else {
    els.usersCard.style.display = 'none';
  }
}

function showLogin() {
  els.loginCard.style.display = 'block';
  els.postsCard.style.display = 'none';
  els.postsListCard.style.display = 'none';
  els.usersCard.style.display = 'none';
  els.logoutBtn.style.display = 'none';
  els.meLine.textContent = '';
}

function resetPostForm() {
  els.postFormMode.textContent = 'New';
  els.postId.value = '';
  els.postTitle.value = '';
  els.postBucket.value = 'Tech';
  els.postOgImg.value = '';
  els.postReadMinutes.value = '';
  els.postExcerpt.value = '';
  els.postContent.value = '';
  els.deletePostBtn.style.display = 'none';
  setHint(els.postHint, '');
}

function loadPostIntoForm(p) {
  els.postFormMode.textContent = 'Edit';
  els.postId.value = p.id;
  els.postTitle.value = p.title || '';
  els.postBucket.value = p.bucket || 'Tech';
  els.postOgImg.value = p.ogImg || '';
  els.postReadMinutes.value = p.readMinutes || '';
  els.postExcerpt.value = p.excerpt || '';
  els.postContent.value = p.content || '';
  els.deletePostBtn.style.display = 'inline-flex';
  setHint(els.postHint, '');
}

function renderPostsList() {
  els.postsList.innerHTML = '';
  els.postsCount.textContent = `${posts.length}`;

  posts.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'mini-item';
    item.innerHTML = `
      <div>
        <span class="title">${escapeHtml(p.title)}</span>
        <div class="meta">${escapeHtml(p.bucket || '')}</div>
      </div>
      <span class="meta">edit</span>
    `;
    item.onclick = () => {
      window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
    };
    els.postsList.appendChild(item);
  });
}

function renderUsersList(users) {
  els.usersList.innerHTML = '';
  users.forEach((u) => {
    const item = document.createElement('div');
    item.className = 'mini-item';
    item.innerHTML = `
      <div class="role">
        <span class="title">${escapeHtml(u.username)}</span>
        <span class="tag">${escapeHtml(u.role)}</span>
      </div>
      <button class="pill-btn danger" type="button" data-id="${u.id}">
        <span class="dot" style="background: var(--danger)"></span>
        Delete
      </button>
    `;

    const btn = item.querySelector('button');
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete user ${u.username}?`)) return;
      try {
        await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
        await refreshUsers();
      } catch (err) {
        setHint(els.userHint, String(err.message || err));
      }
    };

    els.usersList.appendChild(item);
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function refreshMe() {
  try {
    me = await api('/api/admin/me', { method: 'GET' });
    showApp();
    return true;
  } catch (_) {
    me = null;
    showLogin();
    return false;
  }
}

async function refreshPosts() {
  posts = await api('/api/admin/posts', { method: 'GET' });
  renderPostsList();
}

async function refreshUsers() {
  if (!me || me.role !== 'admin') return;
  const users = await api('/api/admin/users', { method: 'GET' });
  renderUsersList(users);
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setHint(els.loginHint, '');

  try {
    me = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: els.loginUsername.value.trim(),
        password: els.loginPassword.value,
      }),
    });

    showApp();
    resetPostForm();
    await refreshPosts();
    await refreshUsers();
  } catch (err) {
    setHint(els.loginHint, String(err.message || err));
  }
});

els.logoutBtn.addEventListener('click', async () => {
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } finally {
    me = null;
    showLogin();
  }
});

els.newPostBtn.addEventListener('click', () => {
  window.location.href = '/admin/post';
});

els.postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setHint(els.postHint, '');

  const payload = {
    title: els.postTitle.value.trim(),
    bucket: els.postBucket.value,
    content: els.postContent.value,
    excerpt: els.postExcerpt.value.trim() ? els.postExcerpt.value.trim() : null,
    creator: me ? me.username : null,
    ogImg: els.postOgImg.value.trim() ? els.postOgImg.value.trim() : null,
    readMinutes: els.postReadMinutes.value ? Number(els.postReadMinutes.value) : null,
  };

  const id = els.postId.value;

  try {
    if (!id) {
      const created = await api('/api/admin/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setHint(els.postHint, 'Saved.');
      await refreshPosts();
      loadPostIntoForm(created);
    } else {
      const updated = await api(`/api/admin/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setHint(els.postHint, 'Updated.');
      await refreshPosts();
      loadPostIntoForm(updated);
    }
  } catch (err) {
    setHint(els.postHint, String(err.message || err));
  }
});

els.deletePostBtn.addEventListener('click', async () => {
  const id = els.postId.value;
  if (!id) return;
  if (!confirm('Delete this post?')) return;

  setHint(els.postHint, '');
  try {
    await api(`/api/admin/posts/${id}`, { method: 'DELETE' });
    setHint(els.postHint, 'Deleted.');
    resetPostForm();
    await refreshPosts();
  } catch (err) {
    setHint(els.postHint, String(err.message || err));
  }
});

els.userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setHint(els.userHint, '');

  try {
    await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username: els.newUsername.value.trim(),
        password: els.newPassword.value,
        role: els.newRole.value,
      }),
    });

    els.newUsername.value = '';
    els.newPassword.value = '';
    els.newRole.value = 'editor';

    setHint(els.userHint, 'User created.');
    await refreshUsers();
  } catch (err) {
    setHint(els.userHint, String(err.message || err));
  }
});

(async function boot() {
  const ok = await refreshMe();
  if (ok) {
    resetPostForm();
    await refreshPosts();
    await refreshUsers();
  }
})();
