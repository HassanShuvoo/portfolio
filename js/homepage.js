// Keep the shared mobile navigation accessible without changing other pages.
(function () {
  const toggle = document.querySelector('.homepage-pdf .mobile-menu-btn');
  const menu = document.getElementById('main-nav-links');
  if (toggle && menu) {
    toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(menu.classList.contains('active'))));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggle.setAttribute('aria-expanded', 'false')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('active')) { menu.classList.remove('active'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); } });
  }
})();
