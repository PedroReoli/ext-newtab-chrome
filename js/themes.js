/* global ReoliStorage, showToast */
const REOLI_THEMES = new Set(['obsidian', 'midnight', 'graphite', 'light', 'forest', 'violet', 'ember', 'rose']);

function applyTheme(theme) {
  const safeTheme = REOLI_THEMES.has(theme) ? theme : 'obsidian';
  document.documentElement.dataset.theme = safeTheme;
  document.querySelectorAll('[data-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === safeTheme)));
}

async function initThemesModule() {
  const values = await ReoliStorage.get('reolitab_theme');
  applyTheme(values.reolitab_theme || 'obsidian');
  document.querySelectorAll('.theme-picker [data-theme]').forEach(button => button.addEventListener('click', async () => {
    applyTheme(button.dataset.theme);
    await ReoliStorage.set({ reolitab_theme: button.dataset.theme });
    showToast(`Tema ${button.textContent.trim()} aplicado.`);
  }));
}
