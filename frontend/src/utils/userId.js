// src/userId.js
export function getUserId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem('voidbuild_user_id');
    if (!id) {
      id =
        'vb_' +
        Math.random().toString(36).slice(2) +
        Date.now().toString(36);
      localStorage.setItem('voidbuild_user_id', id);
    }
    return id;
  } catch (err) {
    console.error('Failed to read or set voidbuild_user_id:', err);
    return null;
  }
}