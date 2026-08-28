/**
 * Theme & Custom Wallpaper Customization Module - High-Density Instant Theme Switcher & GIF Support
 */

const WALLPAPER_PRESETS = {
  none: '',
  cyberpunk: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1920&auto=format&fit=crop',
  nebula: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
  architecture: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1920&auto=format&fit=crop',
  nature: 'https://images.unsplash.com/photo-1511497584788-876761c1298b?q=80&w=1920&auto=format&fit=crop',
  matrix: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop',
  synthwave: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop',
  minimal: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop',
  abstract: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1920&auto=format&fit=crop',
  mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1920&auto=format&fit=crop',
  aurora: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1920&auto=format&fit=crop',
  'cyber-gif': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZ0OGt6b2V5bTF0bzBmaWV6b2ptNDlpaDZidWV6bnpocmNhMjY4dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'synthwave-gif': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl0ZHA5Y3Ixc3JmYWpndTJyd3p2bzE4dGVreWhsczN0MmppNXhxeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d4ce5eQ9b0Y2Z928/giphy.gif'
};

function initThemesModule() {
  loadSavedTheme();
  loadSavedWallpaper();
  initThemeSelectorUI();
  initWallpaperUI();
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('custom_newtab_theme') || 'zinc';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeCardActiveState(savedTheme);
}

function updateThemeCardActiveState(theme) {
  document.querySelectorAll('.theme-card:not(.wallpaper-card)').forEach(card => {
    if (card.getAttribute('data-theme') === theme) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

function initThemeSelectorUI() {
  document.querySelectorAll('.theme-card:not(.wallpaper-card)').forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('custom_newtab_theme', theme);
      updateThemeCardActiveState(theme);
      if (typeof showToast === 'function') {
        showToast(`Tema "${card.textContent.trim()}" aplicado!`);
      }
    });
  });
}

function applyWallpaper(imageUrl) {
  if (imageUrl) {
    document.body.style.backgroundImage = `url('${imageUrl}')`;
    document.body.classList.add('has-custom-wallpaper');
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.classList.remove('has-custom-wallpaper');
  }
}

function loadSavedWallpaper() {
  const type = localStorage.getItem('custom_newtab_wallpaper_type') || 'none';
  const customVal = localStorage.getItem('custom_newtab_wallpaper_val') || '';

  if (type === 'custom' && customVal) {
    applyWallpaper(customVal);
  } else if (WALLPAPER_PRESETS[type]) {
    applyWallpaper(WALLPAPER_PRESETS[type]);
  } else {
    applyWallpaper('');
  }

  updateWallpaperCardActiveState(type);
}

function updateWallpaperCardActiveState(presetType) {
  document.querySelectorAll('.wallpaper-card').forEach(card => {
    if (card.getAttribute('data-wallpaper-preset') === presetType) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

function initWallpaperUI() {
  const presetCards = document.querySelectorAll('.wallpaper-card');
  const customUrlInput = document.getElementById('wallpaper-custom-url');
  const customFileInput = document.getElementById('wallpaper-custom-file');
  const applyUrlBtn = document.getElementById('apply-wallpaper-url-btn');

  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-wallpaper-preset');
      updateWallpaperCardActiveState(type);

      localStorage.setItem('custom_newtab_wallpaper_type', type);
      if (type !== 'custom') {
        localStorage.removeItem('custom_newtab_wallpaper_val');
        applyWallpaper(WALLPAPER_PRESETS[type] || '');
        if (typeof showToast === 'function') showToast('Plano de fundo atualizado!');
      }
    });
  });

  if (applyUrlBtn && customUrlInput) {
    applyUrlBtn.addEventListener('click', () => {
      const url = customUrlInput.value.trim();
      if (url) {
        localStorage.setItem('custom_newtab_wallpaper_type', 'custom');
        localStorage.setItem('custom_newtab_wallpaper_val', url);
        applyWallpaper(url);
        if (typeof showToast === 'function') showToast('Fundo/GIF aplicado!');
      }
    });
  }

  if (customFileInput) {
    customFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          localStorage.setItem('custom_newtab_wallpaper_type', 'custom');
          localStorage.setItem('custom_newtab_wallpaper_val', base64);
          applyWallpaper(base64);
          if (typeof showToast === 'function') showToast('Arquivo GIF/Foto definido como plano de fundo!');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}
