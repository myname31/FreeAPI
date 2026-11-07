(() => {
  const root = document.documentElement;
  const storageKey = 'wa-rest-api-theme';
  const media = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(preference) {
    const resolved = preference === 'system' ? (media.matches ? 'light' : 'dark') : preference;
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
    try { localStorage.setItem(storageKey, preference); } catch (_) {}
    document.querySelectorAll('[data-set-theme]').forEach(button => {
      button.classList.toggle('active', button.dataset.setTheme === preference);
      button.setAttribute('aria-pressed', String(button.dataset.setTheme === preference));
    });
  }

  let preference = 'dark';
  try { preference = localStorage.getItem(storageKey) || 'dark'; } catch (_) {}
  applyTheme(preference);

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    toggle?.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
    });
    document.querySelectorAll('[data-set-theme]').forEach(button => {
      button.addEventListener('click', () => {
        preference = button.dataset.setTheme;
        applyTheme(preference);
      });
    });
  });

  media.addEventListener?.('change', () => {
    if (preference === 'system') applyTheme('system');
  });
})();
