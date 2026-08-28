/**
 * Main Application Orchestrator, Navbar Tabs & Modal Controller
 */

let customIconBase64 = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all sub-modules
  initClockModule();
  initSearchModule();
  initShortcutsModule();
  initBookmarksModule();
  initAutomationsModule();
  initThemesModule();
  initBackupModule();

  // Initialize UI navigation & modal listeners
  initNavbarTabs();
  initSettingsModal();
  initKeyboardShortcuts();
});

/* -------------------------------------------------------------
 * Top Navbar Tab Switching
 * ------------------------------------------------------------- */
function initNavbarTabs() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      viewPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

/* -------------------------------------------------------------
 * Settings Modal Controller & Modal Tabs
 * ------------------------------------------------------------- */
function initSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const cancelShortcutBtn = document.getElementById('cancel-shortcut-btn');
  const shortcutForm = document.getElementById('shortcut-form');
  const iconFileInput = document.getElementById('shortcut-custom-icon-file');
  const clearCustomIconBtn = document.getElementById('clear-custom-icon');

  const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
  const modalTabContents = document.querySelectorAll('.modal-tab-content');

  modalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      modalTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      modalTabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      openShortcutEditModal(null, 'tab-appearance');
    });
  }

  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  if (cancelShortcutBtn) cancelShortcutBtn.addEventListener('click', closeSettingsModal);

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // Local File Upload Reader -> Convert image file to Data URL
  if (iconFileInput) {
    iconFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          customIconBase64 = event.target.result;
          showIconPreview(customIconBase64);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Clear Custom Icon
  if (clearCustomIconBtn) {
    clearCustomIconBtn.addEventListener('click', () => {
      customIconBase64 = null;
      document.getElementById('shortcut-custom-icon-url').value = '';
      document.getElementById('shortcut-custom-icon-file').value = '';
      hideIconPreview();
    });
  }

  // Shortcut Form Submit (Add / Edit with Custom Icons & Tags)
  if (shortcutForm) {
    shortcutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idInput = document.getElementById('shortcut-id');
      const nameInput = document.getElementById('shortcut-name');
      const urlInput = document.getElementById('shortcut-url');
      const tagsInput = document.getElementById('shortcut-tags');
      const iconUrlInput = document.getElementById('shortcut-custom-icon-url');

      const id = idInput.value;
      const name = nameInput.value.trim();
      let url = urlInput.value.trim();
      const tagsStr = tagsInput ? tagsInput.value.trim() : '';
      const iconUrl = customIconBase64 || (iconUrlInput ? iconUrlInput.value.trim() : '');

      if (!name || !url) return;

      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      const tagsArray = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Geral'];

      if (id) {
        // Edit Existing Shortcut
        const index = appShortcuts.findIndex(s => s.id === id);
        if (index !== -1) {
          appShortcuts[index] = { ...appShortcuts[index], name, url, tags: tagsArray, iconUrl };
        }
      } else {
        // Create New Shortcut
        appShortcuts.push({
          id: Date.now().toString(),
          name,
          url,
          tags: tagsArray,
          iconUrl
        });
      }

      saveShortcuts();
      renderTagFilterPills();
      renderShortcutsGrid();
      closeSettingsModal();
    });
  }
}

function showIconPreview(src) {
  const previewWrapper = document.getElementById('icon-preview-wrapper');
  const previewImg = document.getElementById('icon-preview-img');
  if (previewWrapper && previewImg) {
    previewImg.src = src;
    previewWrapper.style.display = 'flex';
  }
}

function hideIconPreview() {
  const previewWrapper = document.getElementById('icon-preview-wrapper');
  if (previewWrapper) {
    previewWrapper.style.display = 'none';
  }
}

function openShortcutEditModal(shortcut = null, defaultTab = 'tab-shortcut') {
  const settingsModal = document.getElementById('settings-modal');
  const modalHeaderTitle = document.getElementById('modal-header-title');
  const idInput = document.getElementById('shortcut-id');
  const nameInput = document.getElementById('shortcut-name');
  const urlInput = document.getElementById('shortcut-url');
  const tagsInput = document.getElementById('shortcut-tags');
  const iconUrlInput = document.getElementById('shortcut-custom-icon-url');

  customIconBase64 = null;

  if (shortcut) {
    modalHeaderTitle.textContent = 'Editar Atalho';
    idInput.value = shortcut.id;
    nameInput.value = shortcut.name;
    urlInput.value = shortcut.url;
    tagsInput.value = Array.isArray(shortcut.tags) ? shortcut.tags.join(', ') : (shortcut.tags || '');
    
    if (shortcut.iconUrl) {
      if (shortcut.iconUrl.startsWith('data:')) {
        customIconBase64 = shortcut.iconUrl;
        if (iconUrlInput) iconUrlInput.value = '';
      } else {
        if (iconUrlInput) iconUrlInput.value = shortcut.iconUrl;
      }
      showIconPreview(shortcut.iconUrl);
    } else {
      if (iconUrlInput) iconUrlInput.value = '';
      hideIconPreview();
    }
  } else {
    modalHeaderTitle.textContent = 'Adicionar Atalho';
    idInput.value = '';
    nameInput.value = '';
    urlInput.value = '';
    tagsInput.value = '';
    if (iconUrlInput) iconUrlInput.value = '';
    hideIconPreview();
  }

  const tabBtn = document.querySelector(`.modal-tab-btn[data-tab="${defaultTab}"]`);
  if (tabBtn) tabBtn.click();

  settingsModal.classList.remove('hidden');
  if (defaultTab === 'tab-shortcut') {
    nameInput.focus();
  }
}

function closeSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  settingsModal.classList.add('hidden');
}

/* -------------------------------------------------------------
 * Global Keyboard Shortcuts
 * ------------------------------------------------------------- */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.focus();
    }

    if (e.key === 'Escape') {
      closeSettingsModal();
    }
  });
}
