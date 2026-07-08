/**
 * user_session.js — Shared user session & logout handler
 * Include this script on every page that has a sidebar.
 */

/* ─── Logout ─── */
async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
}

/* ─── Load current user into sidebar ─── */
(async () => {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.ok && data.user) {
      const u = data.user;
      const initial = u.name.charAt(0).toUpperCase();
      const firstName = u.name.split(' ')[0];

      // Update sidebar
      const sbName = document.querySelector('.sb-name');
      const sbAvatar = document.querySelector('.sb-avatar');
      if (sbName) sbName.textContent = u.name;
      if (sbAvatar) sbAvatar.textContent = initial;

      // Update hero welcome (dashboard page)
      const heroH1 = document.querySelector('.hero-h1');
      if (heroH1 && heroH1.textContent.includes('Welcome to')) {
        heroH1.innerHTML = `Welcome to <em>VahanSathi</em>, ${firstName} 👋`;
      }
      // Update documents greeting if present
      const wsGreeting = document.querySelector('.ws-greeting');
      if (wsGreeting) {
        wsGreeting.textContent = wsGreeting.textContent + ', ' + firstName;
      }
    }
  } catch (e) { /* guest / demo mode — leave defaults */ }
})();
