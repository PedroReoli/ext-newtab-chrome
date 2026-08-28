/**
 * Theme Engine Module - Theme Switcher & Visual Customization
 */

function initThemesModule() {
  const currentTheme = localStorage.getItem('custom_newtab_theme') || 'zinc';
  applyTheme(currentTheme);

  // Theme option cards click listeners
  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedTheme = card.getAttribute('data-theme');
      applyTheme(selectedTheme);
    });
  });
}

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('custom_newtab_theme', themeName);

  // Highlight active theme card in settings
  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    if (card.getAttribute('data-theme') === themeName) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}
