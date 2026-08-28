// Initial Default Shortcuts List
const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: '2', name: 'GitHub', url: 'https://github.com' },
  { id: '3', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: '4', name: 'n8n', url: 'https://n8n.io' },
  { id: '5', name: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { id: '6', name: 'Gmail', url: 'https://mail.google.com' },
  { id: '7', name: 'Google Drive', url: 'https://drive.google.com' },
  { id: '8', name: 'Calendar', url: 'https://calendar.google.com' },
  { id: '9', name: 'Gemini', url: 'https://gemini.google.com' },
  { id: '10', name: 'Notion', url: 'https://www.notion.so' },
  { id: '11', name: 'LinkedIn', url: 'https://www.linkedin.com' },
  { id: '12', name: 'Spotify', url: 'https://open.spotify.com' },
  { id: '13', name: 'Reddit', url: 'https://www.reddit.com' },
  { id: '14', name: 'Twitter / X', url: 'https://x.com' },
  { id: '15', name: 'Netflix', url: 'https://www.netflix.com' }
];

// App State
let shortcuts = [];

// DOM Elements
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const clearSearchBtn = document.getElementById('clear-search');
const shortcutsGrid = document.getElementById('shortcuts-grid');
const resetDefaultBtn = document.getElementById('reset-default-btn');

// Modal Elements
const shortcutModal = document.getElementById('shortcut-modal');
const modalTitle = document.getElementById('modal-title');
const shortcutForm = document.getElementById('shortcut-form');
const shortcutIdInput = document.getElementById('shortcut-id');
const shortcutNameInput = document.getElementById('shortcut-name');
const shortcutUrlInput = document.getElementById('shortcut-url');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initSearch();
  loadShortcuts();
  initModalListeners();
});

/* -------------------------------------------------------------
 * Clock & Date Module
 * ------------------------------------------------------------- */
function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();

  // Format Time (HH:MM)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${hours}:${minutes}`;

  // Format Date in Portuguese
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  let dateString = now.toLocaleDateString('pt-BR', options);
  dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
  dateEl.textContent = dateString;
}

/* -------------------------------------------------------------
 * Search Module
 * ------------------------------------------------------------- */
function initSearch() {
  // Focus search input automatically
  searchInput.focus();

  // Show/Hide clear button based on input content
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim().length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
  });

  // Clear search on button click
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
  });

  // Handle Form Submission (Google search or URL navigation)
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    // Check if user entered a direct URL
    const isUrlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    if (isUrlPattern.test(query) && !query.includes(' ')) {
      let url = query;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.location.href = url;
    } else {
      // Standard Google Search
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  });
}

/* -------------------------------------------------------------
 * Shortcuts & Favicon Module
 * ------------------------------------------------------------- */
function loadShortcuts() {
  const saved = localStorage.getItem('custom_newtab_shortcuts');
  if (saved) {
    try {
      shortcuts = JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler atalhos do localStorage', e);
      shortcuts = [...DEFAULT_SHORTCUTS];
    }
  } else {
    shortcuts = [...DEFAULT_SHORTCUTS];
    saveShortcuts();
  }
  renderShortcuts();
}

function saveShortcuts() {
  localStorage.setItem('custom_newtab_shortcuts', JSON.stringify(shortcuts));
}

function getFaviconUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch (e) {
    return null;
  }
}

function renderShortcuts() {
  shortcutsGrid.innerHTML = '';

  // Render each shortcut
  shortcuts.forEach(shortcut => {
    const card = document.createElement('a');
    card.className = 'shortcut-card';
    card.href = shortcut.url;
    card.target = '_self'; // Open in current tab

    const faviconUrl = getFaviconUrl(shortcut.url);
    const initial = shortcut.name ? shortcut.name.charAt(0).toUpperCase() : '?';

    card.innerHTML = `
      <div class="card-actions">
        <button class="action-btn edit-btn" title="Editar" data-id="${shortcut.id}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-btn delete-btn" title="Remover" data-id="${shortcut.id}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <div class="shortcut-icon-wrapper">
        ${faviconUrl 
          ? `<img class="shortcut-icon" src="${faviconUrl}" alt="${shortcut.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <span class="shortcut-fallback-icon" style="display:none;">${initial}</span>`
          : `<span class="shortcut-fallback-icon">${initial}</span>`
        }
      </div>
      <span class="shortcut-title">${shortcut.name}</span>
    `;

    // Attach Edit & Delete Listeners
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(shortcut);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteShortcut(shortcut.id);
    });

    shortcutsGrid.appendChild(card);
  });

  // Render "Add Shortcut" Card Button
  const addCard = document.createElement('div');
  addCard.className = 'shortcut-card add-shortcut-card';
  addCard.title = 'Adicionar Novo Atalho';
  addCard.innerHTML = `
    <div class="shortcut-icon-wrapper add-icon-wrapper">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
    <span class="shortcut-title">Adicionar</span>
  `;
  addCard.addEventListener('click', () => openModal());
  shortcutsGrid.appendChild(addCard);
}

function deleteShortcut(id) {
  if (confirm('Tem certeza de que deseja remover este atalho?')) {
    shortcuts = shortcuts.filter(s => s.id !== id);
    saveShortcuts();
    renderShortcuts();
  }
}

// Reset Default Shortcuts
resetDefaultBtn.addEventListener('click', () => {
  if (confirm('Deseja restaurar a lista padrão de atalhos? Suas alterações serão substituídas.')) {
    shortcuts = [...DEFAULT_SHORTCUTS];
    saveShortcuts();
    renderShortcuts();
  }
});

/* -------------------------------------------------------------
 * Modal Module
 * ------------------------------------------------------------- */
function initModalListeners() {
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close when clicking outside modal box
  shortcutModal.addEventListener('click', (e) => {
    if (e.target === shortcutModal) {
      closeModal();
    }
  });

  // Handle Form Submit (Add or Edit)
  shortcutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = shortcutIdInput.value;
    const name = shortcutNameInput.value.trim();
    let url = shortcutUrlInput.value.trim();

    if (!name || !url) return;

    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (id) {
      // Edit Existing
      const index = shortcuts.findIndex(s => s.id === id);
      if (index !== -1) {
        shortcuts[index] = { id, name, url };
      }
    } else {
      // Add New
      const newShortcut = {
        id: Date.now().toString(),
        name,
        url
      };
      shortcuts.push(newShortcut);
    }

    saveShortcuts();
    renderShortcuts();
    closeModal();
  });
}

function openModal(shortcut = null) {
  if (shortcut) {
    modalTitle.textContent = 'Editar Atalho';
    shortcutIdInput.value = shortcut.id;
    shortcutNameInput.value = shortcut.name;
    shortcutUrlInput.value = shortcut.url;
  } else {
    modalTitle.textContent = 'Adicionar Atalho';
    shortcutIdInput.value = '';
    shortcutNameInput.value = '';
    shortcutUrlInput.value = '';
  }
  shortcutModal.classList.remove('hidden');
  shortcutNameInput.focus();
}

function closeModal() {
  shortcutModal.classList.add('hidden');
  shortcutForm.reset();
}
