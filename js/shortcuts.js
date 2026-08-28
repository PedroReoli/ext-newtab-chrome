/**
 * Shortcuts Module - Compact Grid, Custom Icons/Favicons & Bug-Free Click Handling
 */

const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'YouTube', url: 'https://www.youtube.com/', tags: ['Mídia'] },
  { id: '2', name: 'YouTube Music', url: 'https://music.youtube.com/', tags: ['Mídia'] },
  { id: '3', name: 'Felipe Cabrera', url: 'https://plataforma.felipecabrera.dev/app', tags: ['Estudo'] },
  { id: '4', name: 'Pedro Reis', url: 'https://pedroreis.vercel.app/', tags: ['Pessoal'] },
  { id: '5', name: 'GitHub', url: 'https://github.com/PedroReoli', tags: ['Dev'] },
  { id: '6', name: 'Canva', url: 'https://www.canva.com/pt_br/', tags: ['Design'] },
  { id: '7', name: 'ChatGPT', url: 'https://chatgpt.com/', tags: ['IA'] },
  { id: '8', name: 'Gemini', url: 'https://gemini.google.com/app', tags: ['IA'] },
  { id: '9', name: 'Resume.AI', url: 'https://chatgpt.com/g/g-p-6a1de257ed3c8191a5488d1a2ed87cee-pedro-carreira/c/6a667610-2548-83e9-8efa-97205ea2a4b8', tags: ['IA'] }
];

let appShortcuts = [];
let activeTagFilter = 'Todos';

function initShortcutsModule() {
  loadShortcuts();
}

function loadShortcuts() {
  const saved = localStorage.getItem('custom_newtab_shortcuts');
  if (saved) {
    try {
      appShortcuts = JSON.parse(saved);
    } catch (e) {
      appShortcuts = [...DEFAULT_SHORTCUTS];
    }
  } else {
    appShortcuts = [...DEFAULT_SHORTCUTS];
    saveShortcuts();
  }
  renderTagFilterPills();
  renderShortcutsGrid();
}

function saveShortcuts() {
  localStorage.setItem('custom_newtab_shortcuts', JSON.stringify(appShortcuts));
}

function getFaviconUrlHD(urlStr) {
  try {
    const url = new URL(urlStr);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch (e) {
    return null;
  }
}

// Clean Default Website Globe SVG Icon
const DEFAULT_GLOBE_SVG = `
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
`;

function renderTagFilterPills() {
  const tagContainer = document.getElementById('tag-filters-bar');
  if (!tagContainer) return;

  const tagsSet = new Set(['Todos']);
  appShortcuts.forEach(s => {
    if (s.tags && Array.isArray(s.tags)) {
      s.tags.forEach(t => tagsSet.add(t.trim()));
    } else if (typeof s.tags === 'string' && s.tags.trim()) {
      s.tags.split(',').forEach(t => tagsSet.add(t.trim()));
    }
  });

  tagContainer.innerHTML = '';
  tagsSet.forEach(tag => {
    const pill = document.createElement('button');
    pill.className = `tag-pill ${tag === activeTagFilter ? 'active' : ''}`;
    pill.textContent = tag;
    pill.addEventListener('click', () => {
      activeTagFilter = tag;
      renderTagFilterPills();
      renderShortcutsGrid();
    });
    tagContainer.appendChild(pill);
  });
}

function renderShortcutsGrid() {
  const gridEl = document.getElementById('shortcuts-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  const filteredShortcuts = appShortcuts.filter(s => {
    if (activeTagFilter === 'Todos') return true;
    if (Array.isArray(s.tags)) return s.tags.includes(activeTagFilter);
    if (typeof s.tags === 'string') return s.tags.split(',').map(t => t.trim()).includes(activeTagFilter);
    return false;
  });

  filteredShortcuts.forEach((shortcut, index) => {
    const card = document.createElement('div');
    card.className = 'shortcut-card animate-entrance';
    card.style.setProperty('--index', index);

    // Determine icon: Custom Icon > Auto Favicon > Default Globe SVG
    const customIcon = shortcut.iconUrl || shortcut.customIcon;
    const autoFavicon = getFaviconUrlHD(shortcut.url);

    let iconHtml = '';
    if (customIcon) {
      iconHtml = `<img class="shortcut-icon" src="${customIcon}" alt="${shortcut.name}">`;
    } else if (autoFavicon) {
      iconHtml = `
        <img class="shortcut-icon" src="${autoFavicon}" alt="${shortcut.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="shortcut-fallback-icon" style="display:none;">${DEFAULT_GLOBE_SVG}</div>
      `;
    } else {
      iconHtml = `<div class="shortcut-fallback-icon">${DEFAULT_GLOBE_SVG}</div>`;
    }

    card.innerHTML = `
      <div class="card-actions">
        <button class="action-btn edit-btn" title="Editar Atalho">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-btn delete-btn" title="Excluir">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="shortcut-icon-wrapper">
        ${iconHtml}
      </div>
      <span class="shortcut-title">${shortcut.name}</span>
    `;

    // LEFT CLICK on Card Body: Navigate to URL
    card.addEventListener('click', (e) => {
      // If clicking inside .card-actions or action buttons, do NOT navigate!
      if (e.target.closest('.card-actions')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      window.location.href = shortcut.url;
    });

    // RIGHT CLICK: Open Settings Modal for this shortcut
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openShortcutEditModal(shortcut);
    });

    // EDIT BUTTON: Completely stop navigation and open edit modal
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openShortcutEditModal(shortcut);
      };
      editBtn.addEventListener('click', handleEdit);
      editBtn.addEventListener('mousedown', handleEdit);
    }

    // DELETE BUTTON: Completely stop navigation and prompt delete
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        deleteShortcutItem(shortcut.id);
      };
      deleteBtn.addEventListener('click', handleDelete);
      deleteBtn.addEventListener('mousedown', handleDelete);
    }

    gridEl.appendChild(card);
  });

  // Add "+" Shortcut Card Button
  const addCard = document.createElement('div');
  addCard.className = 'shortcut-card add-shortcut-card animate-entrance';
  addCard.style.setProperty('--index', filteredShortcuts.length);
  addCard.title = 'Adicionar Atalho';
  addCard.innerHTML = `
    <div class="shortcut-icon-wrapper add-icon-wrapper">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
    <span class="shortcut-title">Adicionar</span>
  `;
  addCard.addEventListener('click', () => openShortcutEditModal());
  gridEl.appendChild(addCard);
}

function deleteShortcutItem(id) {
  if (confirm('Deseja realmente excluir este atalho?')) {
    appShortcuts = appShortcuts.filter(s => s.id !== id);
    saveShortcuts();
    renderTagFilterPills();
    renderShortcutsGrid();
  }
}
