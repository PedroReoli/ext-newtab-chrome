/**
 * Shortcuts Module - Multi-Mode View Switcher (Grid Padrão, Grade Mini Compacta, Modo Tabela / Lista)
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
let appTagOrder = [];
let shortcutsViewMode = localStorage.getItem('custom_newtab_shortcuts_view_mode') || 'grid';

function initShortcutsModule() {
  loadShortcuts();
  loadTagOrder();
  initShortcutModal();
  initShortcutsViewModeSwitcher();
}

function initShortcutsViewModeSwitcher() {
  const modeBtns = document.querySelectorAll('.shortcuts-mode-btn');
  modeBtns.forEach(btn => {
    const mode = btn.getAttribute('data-mode');
    if (mode === shortcutsViewMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      shortcutsViewMode = mode;
      localStorage.setItem('custom_newtab_shortcuts_view_mode', mode);
      modeBtns.forEach(b => {
        if (b.getAttribute('data-mode') === mode) b.classList.add('active');
        else b.classList.remove('active');
      });
      renderShortcutsGrid();
      if (typeof showToast === 'function') {
        const labels = { grid: 'Grid Padrão', compact: 'Grade Mini Compacta', table: 'Modo Lista / Tabela' };
        showToast(`Visualização: ${labels[mode]}`);
      }
    });
  });
}

function loadTagOrder() {
  const saved = localStorage.getItem('custom_newtab_tag_order');
  if (saved) {
    try {
      appTagOrder = JSON.parse(saved);
    } catch (e) {
      appTagOrder = [];
    }
  }
}

function saveTagOrder() {
  localStorage.setItem('custom_newtab_tag_order', JSON.stringify(appTagOrder));
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

function getDomainFromUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./i, '');
  } catch (e) {
    return urlStr;
  }
}

// Clean Default Website Globe SVG Icon
const DEFAULT_GLOBE_SVG = `
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
`;

function renderTagFilterPills() {
  const tagContainer = document.getElementById('tag-filters-bar');
  if (!tagContainer) return;

  loadTagOrder();

  const existingTagsSet = new Set();
  appShortcuts.forEach(s => {
    if (s.tags && Array.isArray(s.tags)) {
      s.tags.forEach(t => existingTagsSet.add(t.trim()));
    } else if (typeof s.tags === 'string' && s.tags.trim()) {
      s.tags.split(',').forEach(t => existingTagsSet.add(t.trim()));
    }
  });

  const orderedTags = ['Todos'];
  appTagOrder.forEach(t => {
    if (t !== 'Todos' && existingTagsSet.has(t) && !orderedTags.includes(t)) {
      orderedTags.push(t);
    }
  });

  existingTagsSet.forEach(t => {
    if (!orderedTags.includes(t)) {
      orderedTags.push(t);
    }
  });

  tagContainer.innerHTML = '';
  orderedTags.forEach(tag => {
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

  gridEl.className = `shortcuts-grid mode-${shortcutsViewMode}`;
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

    const customIcon = shortcut.iconUrl || shortcut.customIcon;
    const autoFavicon = getFaviconUrlHD(shortcut.url);

    let iconHtml = '';
    if (customIcon) {
      iconHtml = `<img class="shortcut-icon" src="${customIcon}" alt="${shortcut.name}">`;
    } else if (autoFavicon) {
      iconHtml = `
        <img class="shortcut-icon" src="${autoFavicon}" alt="${shortcut.name}">
        <div class="shortcut-fallback-icon" style="display:none;">${DEFAULT_GLOBE_SVG}</div>
      `;
    } else {
      iconHtml = `<div class="shortcut-fallback-icon">${DEFAULT_GLOBE_SVG}</div>`;
    }

    if (shortcutsViewMode === 'table') {
      const tagsList = Array.isArray(shortcut.tags) ? shortcut.tags : (shortcut.tags ? [shortcut.tags] : []);
      const tagsBadgeHtml = tagsList.map(t => `<span class="shortcut-tag-badge">${t}</span>`).join('');

      card.innerHTML = `
        <div class="shortcut-main-info">
          <div class="shortcut-icon-wrapper">${iconHtml}</div>
          <span class="shortcut-title" style="font-weight:600;">${shortcut.name}</span>
          <span class="shortcut-domain">${getDomainFromUrl(shortcut.url)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          ${tagsBadgeHtml}
          <div class="card-actions" style="position:static; opacity:1; display:flex; gap:4px;">
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
        </div>
      `;
    } else {
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
    }

    const iconImg = card.querySelector('.shortcut-icon');
    if (iconImg) {
      iconImg.addEventListener('error', () => {
        iconImg.style.display = 'none';
        const fallback = card.querySelector('.shortcut-fallback-icon');
        if (fallback) fallback.style.display = 'flex';
      });
    }

    // LEFT CLICK Handling
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-actions')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        window.open(shortcut.url, '_blank');
      } else {
        window.location.href = shortcut.url;
      }
    });

    // MIDDLE CLICK / SCROLL BUTTON CLICK
    card.addEventListener('auxclick', (e) => {
      if (e.target.closest('.card-actions')) return;
      if (e.button === 1) {
        e.preventDefault();
        window.open(shortcut.url, '_blank');
      }
    });

    card.addEventListener('mousedown', (e) => {
      if (e.button === 1 && !e.target.closest('.card-actions')) {
        e.preventDefault();
      }
    });

    // RIGHT CLICK
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openShortcutEditModal(shortcut);
    });

    // EDIT BUTTON
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

    // DELETE BUTTON
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

  if (shortcutsViewMode === 'table') {
    addCard.innerHTML = `
      <div class="shortcut-main-info">
        <div class="shortcut-icon-wrapper add-icon-wrapper" style="width:28px; height:28px;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <span class="shortcut-title" style="font-weight:600; color:var(--accent-color);">Adicionar Novo Atalho</span>
      </div>
    `;
  } else {
    addCard.innerHTML = `
      <div class="shortcut-icon-wrapper add-icon-wrapper">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span class="shortcut-title">Adicionar</span>
    `;
  }
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

function openShortcutEditModal(shortcut = null) {
  const modal = document.getElementById('shortcut-modal');
  const titleEl = document.getElementById('shortcut-modal-title');
  const idInput = document.getElementById('shortcut-modal-id');
  const nameInput = document.getElementById('shortcut-modal-name');
  const urlInput = document.getElementById('shortcut-modal-url');
  const tagsInput = document.getElementById('shortcut-modal-tags');
  const iconUrlInput = document.getElementById('shortcut-modal-icon-url');

  if (!modal) return;

  if (shortcut) {
    if (titleEl) titleEl.textContent = 'Editar Atalho';
    if (idInput) idInput.value = shortcut.id;
    if (nameInput) nameInput.value = shortcut.name || '';
    if (urlInput) urlInput.value = shortcut.url || '';
    if (tagsInput) tagsInput.value = Array.isArray(shortcut.tags) ? shortcut.tags.join(', ') : (shortcut.tags || '');
    if (iconUrlInput) iconUrlInput.value = shortcut.iconUrl || shortcut.customIcon || '';
  } else {
    if (titleEl) titleEl.textContent = 'Adicionar Novo Atalho';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
    if (tagsInput) tagsInput.value = '';
    if (iconUrlInput) iconUrlInput.value = '';
  }

  modal.classList.add('active');
}

function closeShortcutModal() {
  const modal = document.getElementById('shortcut-modal');
  if (modal) modal.classList.remove('active');
}

function initShortcutModal() {
  const modal = document.getElementById('shortcut-modal');
  const closeBtn = document.getElementById('close-shortcut-modal-btn');
  const cancelBtn = document.getElementById('cancel-shortcut-modal-btn');
  const form = document.getElementById('shortcut-modal-form');
  const fileInput = document.getElementById('shortcut-modal-file');

  if (closeBtn) closeBtn.addEventListener('click', closeShortcutModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeShortcutModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShortcutModal();
    });
  }

  let localImageBase64 = '';

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          localImageBase64 = event.target.result;
          const fileNameSpan = document.getElementById('shortcut-modal-file-name');
          if (fileNameSpan) fileNameSpan.textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('shortcut-modal-id').value;
      const name = document.getElementById('shortcut-modal-name').value.trim();
      let url = document.getElementById('shortcut-modal-url').value.trim();
      const tagsStr = document.getElementById('shortcut-modal-tags').value.trim();
      const iconUrl = document.getElementById('shortcut-modal-icon-url').value.trim();

      if (!name || !url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Geral'];
      const finalIcon = localImageBase64 || iconUrl || null;

      if (id) {
        const index = appShortcuts.findIndex(s => s.id === id);
        if (index !== -1) {
          appShortcuts[index] = {
            ...appShortcuts[index],
            name,
            url,
            tags,
            iconUrl: finalIcon
          };
        }
      } else {
        const newShortcut = {
          id: Date.now().toString(),
          name,
          url,
          tags,
          iconUrl: finalIcon
        };
        appShortcuts.push(newShortcut);
      }

      saveShortcuts();
      renderTagFilterPills();
      renderShortcutsGrid();
      closeShortcutModal();
      localImageBase64 = '';
      if (typeof showToast === 'function') showToast(id ? 'Atalho atualizado!' : 'Novo atalho adicionado!');
    });
  }
}
