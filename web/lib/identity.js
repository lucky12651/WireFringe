export function accountEmail(user) {
  return String(user?.email || user?.username || '').trim();
}

export function accountName(user) {
  return String(user?.displayName || user?.username || '').trim();
}
