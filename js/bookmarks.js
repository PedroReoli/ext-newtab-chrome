/**
 * Bookmarks Engine: Direct User Folder Hierarchy (No Root Wrapper Headers)
 */

let allBookmarkNodes = [];
let currentFolderId = '1';
let selectedBookmarkIds = new Set();
let currentBookmarksViewMode = 'explorer'; // 'explorer' or 'ribbon'

function initBookmarksModule() {
  const sidebarEl = document.getElementById('folder-tree-list');
  const searchInput = document.getElementById('bookmarks-search-input');
  const selectAllCb = document.getElementById('select-all-bookmarks');
  const bulkOpenBtn = document.getElementById('bulk-open-btn');
  const bulkMoveBtn = document.getElementById('bulk-move-btn');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const newBookmarkBtn = document.getElementById('new-bookmark-btn');
  const collapseAllBtn = document.getElementById('collapse-all-folders-btn');
  const modeExplorerBtn = document.getElementById('mode-explorer-btn');
  const modeRibbonBtn = document.getElementById('mode-ribbon-btn');

  if (!sidebarEl) return;

  loadChromeBookmarks();

  if (modeExplorerBtn && modeRibbonBtn) {
    modeExplorerBtn.addEventListener('click', () => setBookmarksViewMode('explorer'));
    modeRibbonBtn.addEventListener('click', () => setBookmarksViewMode('ribbon'));
  }

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', collapseAllFolders);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderFolderContents(currentFolderId, e.target.value.trim().toLowerCase());
    });
  }

  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const currentCards = document.querySelectorAll('.bookmark-select-checkbox');
      selectedBookmarkIds.clear();
      currentCards.forEach(cb => {
        cb.checked = isChecked;
        const id = cb.getAttribute('data-id');
        if (isChecked && id) {
          selectedBookmarkIds.add(id);
          cb.closest('.bookmark-card').classList.add('selected');
        } else {
          cb.closest('.bookmark-card').classList.remove('selected');
        }
      });
      updateBulkToolbarUI();
    });
  }

  if (bulkOpenBtn) bulkOpenBtn.addEventListener('click', bulkOpenBookmarks);
  if (bulkMoveBtn) bulkMoveBtn.addEventListener('click', bulkMoveBookmarks);
  if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', bulkDeleteBookmarks);
  if (newBookmarkBtn) newBookmarkBtn.addEventListener('click', createNewBookmarkInFolder);
}

function loadChromeBookmarks() {
  if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
    chrome.bookmarks.getTree((treeNodes) => {
      allBookmarkNodes = treeNodes;

      // Auto-select first user folder inside Bookmark Bar
      const barNode = findBookmarkNodeById(treeNodes, '1');
      if (barNode && barNode.children && barNode.children.length > 0) {
        const firstUserFolder = barNode.children.find(c => c.children) || barNode.children[0];
        if (firstUserFolder) {
          currentFolderId = firstUserFolder.id;
        }
      }

      renderSidebarFolderTree(treeNodes);
      renderFolderContents(currentFolderId);
      renderHorizontalRibbon(treeNodes);
    });
  } else {
    allBookmarkNodes = getDemoBookmarkTree();
    renderSidebarFolderTree(allBookmarkNodes);
    renderFolderContents('101');
    renderHorizontalRibbon(allBookmarkNodes);
  }
}

function setBookmarksViewMode(mode) {
  currentBookmarksViewMode = mode;
  const explorerContainer = document.getElementById('bookmarks-explorer-container');
  const ribbonContainer = document.getElementById('bookmarks-ribbon-container');
  const modeExplorerBtn = document.getElementById('mode-explorer-btn');
  const modeRibbonBtn = document.getElementById('mode-ribbon-btn');

  if (mode === 'ribbon') {
    explorerContainer.classList.add('hidden');
    ribbonContainer.classList.remove('hidden');
    modeExplorerBtn.classList.remove('active');
    modeRibbonBtn.classList.add('active');
  } else {
    ribbonContainer.classList.add('hidden');
    explorerContainer.classList.remove('hidden');
    modeRibbonBtn.classList.remove('active');
    modeExplorerBtn.classList.add('active');
  }
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent-color); flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Horizontal Bookmark Ribbon (Style Native Browser Bar)
 */
function renderHorizontalRibbon(treeNodes) {
  const ribbonList = document.getElementById('bookmark-ribbon-list');
  if (!ribbonList) return;

  ribbonList.innerHTML = '';
  const rootNode = findBookmarkNodeById(treeNodes, '1') || treeNodes[0];

  if (!rootNode || !rootNode.children) return;

  rootNode.children.forEach(child => {
    if (child.children) {
      const folderPill = document.createElement('div');
      folderPill.className = 'ribbon-folder-item';

      folderPill.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-color);">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${child.title}</span>
        <div class="ribbon-dropdown"></div>
      `;

      const dropdown = folderPill.querySelector('.ribbon-dropdown');
      child.children.forEach(sub => {
        if (sub.url) {
          const linkItem = document.createElement('a');
          linkItem.className = 'ribbon-link-item';
          linkItem.href = sub.url;
          linkItem.target = '_self';
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(sub.url).hostname}&sz=32`;
          linkItem.innerHTML = `
            <img src="${faviconUrl}" width="14" height="14" style="border-radius:2px;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23a1a1aa\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>';">
            <span>${sub.title || sub.url}</span>
          `;
          dropdown.appendChild(linkItem);
        }
      });

      ribbonList.appendChild(folderPill);
    }
  });
}

function collapseAllFolders() {
  document.querySelectorAll('.folder-subchildren-wrapper').forEach(wrapper => {
    wrapper.style.display = 'none';
  });
  document.querySelectorAll('.folder-toggle-chevron').forEach(chevron => {
    chevron.classList.remove('expanded');
  });
}

/**
 * True Recursive Hierarchical Sidebar Renderer (Direct User Folders, Root Wrappers Skipped)
 */
function renderSidebarFolderTree(treeNodes) {
  const sidebarEl = document.getElementById('folder-tree-list');
  if (!sidebarEl) return;

  sidebarEl.innerHTML = '';

  function renderFolderNode(node, depth, container) {
    if (!node.children) return;

    // Skip root wrappers ('0', '1', '2') and render their user subfolders directly at top level
    if (node.id === '0' || node.id === '1' || node.id === '2') {
      node.children.forEach(child => {
        if (child.children) {
          renderFolderNode(child, depth, container);
        }
      });
      return;
    }

    const hasSubfolders = node.children.some(c => c.children);
    const itemCount = node.children.filter(c => c.url).length;
    const folderTitleText = node.title || 'Pasta';

    const folderItem = document.createElement('div');
    folderItem.className = `folder-tree-item draggable-item ${node.id === currentFolderId ? 'active' : ''}`;
    folderItem.style.paddingLeft = `calc(0.4rem + ${depth * 0.75}rem)`;
    folderItem.setAttribute('data-folder-id', node.id);
    folderItem.setAttribute('draggable', 'true');

    folderItem.innerHTML = `
      <div class="folder-info">
        ${hasSubfolders 
          ? `<svg class="folder-toggle-chevron expanded" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>` 
          : `<span style="width:12px; display:inline-block;"></span>`
        }
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-color); flex-shrink:0;">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="folder-name">${folderTitleText}</span>
      </div>
      <div class="folder-right-actions">
        <button class="folder-edit-btn" title="Renomear Pasta">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <span class="folder-count-badge">${itemCount}</span>
      </div>
    `;

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'folder-subchildren-wrapper';

    folderItem.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id, type: 'folder' }));
      folderItem.classList.add('dragging');
    });

    folderItem.addEventListener('dragend', () => {
      folderItem.classList.remove('dragging');
    });

    folderItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      folderItem.classList.add('drag-over');
    });

    folderItem.addEventListener('dragleave', () => {
      folderItem.classList.remove('drag-over');
    });

    folderItem.addEventListener('drop', (e) => {
      e.preventDefault();
      folderItem.classList.remove('drag-over');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data && data.id && data.id !== node.id) {
          moveBookmarkToTargetFolder(data.id, node.id, folderTitleText);
        }
      } catch (err) {}
    });

    folderItem.addEventListener('click', (e) => {
      if (e.target.closest('.folder-edit-btn')) return;

      currentFolderId = node.id;
      selectedBookmarkIds.clear();
      document.querySelectorAll('.folder-tree-item').forEach(el => el.classList.remove('active'));
      folderItem.classList.add('active');

      const chevron = folderItem.querySelector('.folder-toggle-chevron');
      if (chevron && hasSubfolders) {
        if (childrenContainer.style.display === 'none') {
          childrenContainer.style.display = 'block';
          chevron.classList.add('expanded');
        }
      }

      renderFolderContents(currentFolderId);
    });

    const chevron = folderItem.querySelector('.folder-toggle-chevron');
    if (chevron) {
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        if (childrenContainer.style.display === 'none') {
          childrenContainer.style.display = 'block';
          chevron.classList.add('expanded');
        } else {
          childrenContainer.style.display = 'none';
          chevron.classList.remove('expanded');
        }
      });
    }

    const editBtn = folderItem.querySelector('.folder-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameFolderItem(node.id, folderTitleText);
      });
    }

    container.appendChild(folderItem);

    if (hasSubfolders) {
      node.children.forEach(child => {
        if (child.children) {
          renderFolderNode(child, depth + 1, childrenContainer);
        }
      });
      container.appendChild(childrenContainer);
    }
  }

  renderFolderNode({ id: '0', children: treeNodes }, 0, sidebarEl);
}

function moveBookmarkToTargetFolder(sourceId, targetFolderId, targetFolderName) {
  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.move(sourceId, { parentId: targetFolderId }, () => {
      showToast(`Item movido para "${targetFolderName}"`);
      loadChromeBookmarks();
    });
  } else {
    showToast(`[Demo] Movido para "${targetFolderName}"`);
  }
}

function getBreadcrumbsPath(nodes, targetId) {
  const path = [];
  function searchPath(currentNodes, target) {
    for (const node of currentNodes) {
      if (node.id === target) {
        if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
          path.unshift(node.title || 'Pasta');
        }
        return true;
      }
      if (node.children) {
        if (searchPath(node.children, target)) {
          if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
            path.unshift(node.title || 'Pasta');
          }
          return true;
        }
      }
    }
    return false;
  }
  searchPath(nodes, targetId);
  return path;
}

function renderFolderContents(folderId, filterQuery = '') {
  const gridEl = document.getElementById('bookmarks-content-grid');
  const breadcrumbsEl = document.getElementById('breadcrumbs');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const folderNode = findBookmarkNodeById(allBookmarkNodes, folderId);

  if (breadcrumbsEl) {
    const path = getBreadcrumbsPath(allBookmarkNodes, folderId);
    if (path.length > 0) {
      breadcrumbsEl.innerHTML = path.map(p => `<span>${p}</span>`).join(' <span class="breadcrumb-separator">/</span> ');
    } else {
      breadcrumbsEl.innerHTML = '<span>Favoritos</span>';
    }
  }

  if (!folderNode || !folderNode.children) {
    gridEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem;">Pasta vazia.</div>';
    updateBulkToolbarUI();
    return;
  }

  const bookmarkLinks = folderNode.children.filter(child => {
    if (!child.url) return false;
    if (!filterQuery) return true;
    return (child.title && child.title.toLowerCase().includes(filterQuery)) || child.url.toLowerCase().includes(filterQuery);
  });

  const subFolders = folderNode.children.filter(child => {
    if (!child.children) return false;
    if (!filterQuery) return true;
    return child.title && child.title.toLowerCase().includes(filterQuery);
  });

  if (bookmarkLinks.length === 0 && subFolders.length > 0) {
    subFolders.forEach(subfolder => {
      const subItemCount = subfolder.children ? subfolder.children.filter(c => c.url).length : 0;
      const subSubfolderCount = subfolder.children ? subfolder.children.filter(c => c.children).length : 0;

      const folderCard = document.createElement('div');
      folderCard.className = 'bookmark-card folder-card-panel draggable-item';
      folderCard.setAttribute('draggable', 'true');

      folderCard.innerHTML = `
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-color); flex-shrink:0;">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <div class="bookmark-info">
          <span class="bookmark-title-text" style="font-weight:600;">${subfolder.title}</span>
          <span class="bookmark-url-text">${subItemCount} favoritos ${subSubfolderCount > 0 ? `• ${subSubfolderCount} pastas` : ''}</span>
        </div>
      `;

      folderCard.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: subfolder.id, type: 'folder' }));
        folderCard.classList.add('dragging');
      });

      folderCard.addEventListener('dragend', () => {
        folderCard.classList.remove('dragging');
      });

      folderCard.addEventListener('click', () => {
        currentFolderId = subfolder.id;
        renderSidebarFolderTree(allBookmarkNodes);
        renderFolderContents(currentFolderId);
      });

      gridEl.appendChild(folderCard);
    });

    updateBulkToolbarUI();
    return;
  }

  if (bookmarkLinks.length === 0) {
    gridEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; grid-column: 1/-1;">Nenhum favorito encontrado nesta pasta.</div>';
    updateBulkToolbarUI();
    return;
  }

  bookmarkLinks.forEach(bookmark => {
    const isSelected = selectedBookmarkIds.has(bookmark.id);
    const card = document.createElement('div');
    card.className = `bookmark-card draggable-item ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-id', bookmark.id);
    card.setAttribute('draggable', 'true');

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;

    card.innerHTML = `
      <input type="checkbox" class="bookmark-select-checkbox" data-id="${bookmark.id}" ${isSelected ? 'checked' : ''}>
      <img class="bookmark-icon" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23a1a1aa\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>';">
      <div class="bookmark-info">
        <span class="bookmark-title-text" title="${bookmark.title}">${bookmark.title || bookmark.url}</span>
        <span class="bookmark-url-text">${new URL(bookmark.url).hostname}</span>
      </div>
      <div class="bookmark-item-actions">
        <button class="bookmark-action-btn edit-bookmark-btn" title="Renomear">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ id: bookmark.id, type: 'bookmark' }));
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    const cb = card.querySelector('.bookmark-select-checkbox');
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      if (cb.checked) {
        selectedBookmarkIds.add(bookmark.id);
        card.classList.add('selected');
      } else {
        selectedBookmarkIds.delete(bookmark.id);
        card.classList.remove('selected');
      }
      updateBulkToolbarUI();
    });

    const editBookmarkBtn = card.querySelector('.edit-bookmark-btn');
    if (editBookmarkBtn) {
      editBookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameBookmarkItem(bookmark.id, bookmark.title || '', bookmark.url);
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target !== cb && !e.target.closest('.bookmark-item-actions')) {
        window.location.href = bookmark.url;
      }
    });

    gridEl.appendChild(card);
  });

  updateBulkToolbarUI();
}

function renameFolderItem(id, currentTitle) {
  const newTitle = prompt('Digite o novo nome da pasta:', currentTitle);
  if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.update(id, { title: newTitle.trim() }, () => {
        showToast('Pasta renomeada com sucesso!');
        loadChromeBookmarks();
      });
    } else {
      showToast(`[Demo] Renomeado para: ${newTitle.trim()}`);
    }
  }
}

function renameBookmarkItem(id, currentTitle, currentUrl) {
  const newTitle = prompt('Digite o novo nome do favorito:', currentTitle);
  if (!newTitle || !newTitle.trim()) return;

  const newUrl = prompt('Digite a URL do favorito:', currentUrl);
  if (!newUrl || !newUrl.trim()) return;

  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.update(id, { title: newTitle.trim(), url: newUrl.trim() }, () => {
      showToast('Favorito atualizado!');
      loadChromeBookmarks();
    });
  } else {
    showToast(`[Demo] Favorito renomeado!`);
  }
}

function findBookmarkNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findBookmarkNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateBulkToolbarUI() {
  const countEl = document.getElementById('bulk-count');
  const bulkOpenBtn = document.getElementById('bulk-open-btn');
  const bulkMoveBtn = document.getElementById('bulk-move-btn');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const selectAllCb = document.getElementById('select-all-bookmarks');

  const count = selectedBookmarkIds.size;
  if (countEl) countEl.textContent = count;

  const hasSelection = count > 0;
  if (bulkOpenBtn) bulkOpenBtn.disabled = !hasSelection;
  if (bulkMoveBtn) bulkMoveBtn.disabled = !hasSelection;
  if (bulkDeleteBtn) bulkDeleteBtn.disabled = !hasSelection;

  const visibleCheckboxes = document.querySelectorAll('.bookmark-select-checkbox');
  if (selectAllCb && visibleCheckboxes.length > 0) {
    selectAllCb.checked = Array.from(visibleCheckboxes).every(cb => cb.checked);
  }
}

function bulkOpenBookmarks() {
  if (selectedBookmarkIds.size === 0) return;

  selectedBookmarkIds.forEach(id => {
    const node = findBookmarkNodeById(allBookmarkNodes, id);
    if (node && node.url && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: node.url, active: false });
    }
  });
  showToast(`${selectedBookmarkIds.size} abas abertas!`);
}

function bulkDeleteBookmarks() {
  if (selectedBookmarkIds.size === 0) return;

  if (confirm(`Tem certeza de que deseja excluir ${selectedBookmarkIds.size} favoritos selecionados?`)) {
    selectedBookmarkIds.forEach(id => {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.remove(id);
      }
    });
    showToast(`${selectedBookmarkIds.size} favoritos excluídos!`);
    selectedBookmarkIds.clear();
    loadChromeBookmarks();
  }
}

function bulkMoveBookmarks() {
  if (selectedBookmarkIds.size === 0) return;

  const targetFolderTitle = prompt('Digite o nome ou ID da pasta de destino:');
  if (!targetFolderTitle) return;

  function findFolderByTitle(nodes, title) {
    for (const node of nodes) {
      if (node.children && (node.title.toLowerCase() === title.toLowerCase() || node.id === title)) return node;
      if (node.children) {
        const found = findFolderByTitle(node.children, title);
        if (found) return found;
      }
    }
    return null;
  }

  const targetFolder = findFolderByTitle(allBookmarkNodes, targetFolderTitle);
  if (targetFolder && typeof chrome !== 'undefined' && chrome.bookmarks) {
    selectedBookmarkIds.forEach(id => {
      chrome.bookmarks.move(id, { parentId: targetFolder.id });
    });
    selectedBookmarkIds.clear();
    showToast('Favoritos movidos com sucesso!');
    loadChromeBookmarks();
  } else {
    alert('Pasta de destino não encontrada.');
  }
}

function createNewBookmarkInFolder() {
  const title = prompt('Nome do novo favorito:');
  let url = prompt('URL do novo favorito:');

  if (!title || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.create({
      parentId: currentFolderId,
      title: title,
      url: url
    }, () => {
      showToast('Novo favorito adicionado!');
      loadChromeBookmarks();
    });
  }
}

function getDemoBookmarkTree() {
  return [
    {
      id: '0',
      title: 'Root',
      children: [
        {
          id: '1',
          title: 'Barra de Favoritos',
          children: [
            { id: '101', title: 'DOMUS', children: [{ id: '101a', title: 'Site DOMUS', url: 'https://domus.com' }] },
            { id: '102', title: 'Job', children: [{ id: '102a', title: 'Empresa', url: 'https://job.com' }] },
            { id: '103', title: 'Dev', url: 'https://github.com' }
          ]
        }
      ]
    }
  ];
}
