export function fieldErrorsFromZod(err) {
  const issues = err?.issues || err?.errors || [];
  const out = {};
  for (const issue of issues) {
    const key = Array.isArray(issue.path) ? issue.path[0] : issue.path;
    if (key != null && key !== '' && !out[key]) {
      out[key] = issue.message;
    }
  }
  if (!Object.keys(out).length) {
    out.form = err?.message || 'Please fix the highlighted fields.';
  }
  return out;
}
