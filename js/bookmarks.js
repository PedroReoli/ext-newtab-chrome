/**
 * Bookmarks Engine: Distinct Explorer vs Ribbon Modes, Interactive Clickable Breadcrumbs, Fluid Non-Blocking Folder Tree & Shared Cards Grid
 */

let allBookmarkNodes = [];
let currentFolderId = '1';
let selectedBookmarkIds = new Set();
let currentBookmarksViewMode = 'explorer';

// Smart Filters State
let filterRootFolderId = 'all';
let filterDepthLevel = 'all';
let filterHideEmpty = false;

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

  // Smart Filters Controls
  const rootSelect = document.getElementById('filter-root-folder-select');
  const depthSelect = document.getElementById('filter-hierarchy-depth-select');
  const hideEmptyCb = document.getElementById('filter-hide-empty-folders');

  if (!sidebarEl) return;

  loadChromeBookmarks();

  if (modeExplorerBtn && modeRibbonBtn) {
    modeExplorerBtn.addEventListener('click', () => setBookmarksViewMode('explorer'));
    modeRibbonBtn.addEventListener('click', () => setBookmarksViewMode('ribbon'));
  }

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', collapseAllFolderTree);
  }

  if (rootSelect) {
    rootSelect.addEventListener('change', (e) => {
      filterRootFolderId = e.target.value;
      if (filterRootFolderId !== 'all') {
        currentFolderId = filterRootFolderId;
      }
      renderSidebarFolderTree(allBookmarkNodes);
      renderHorizontalRibbon(allBookmarkNodes);
      renderFolderContents(currentFolderId);
    });
  }

  if (depthSelect) {
    depthSelect.addEventListener('change', (e) => {
      filterDepthLevel = e.target.value;
      renderSidebarFolderTree(allBookmarkNodes);
      renderFolderContents(currentFolderId);
    });
  }

  if (hideEmptyCb) {
    hideEmptyCb.addEventListener('change', (e) => {
      filterHideEmpty = e.target.checked;
      renderSidebarFolderTree(allBookmarkNodes);
      renderHorizontalRibbon(allBookmarkNodes);
      renderFolderContents(currentFolderId);
    });
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

      populateRootFolderSelect(treeNodes);

      const barNode = findBookmarkNodeById(treeNodes, '1');
      if (barNode && barNode.children && barNode.children.length > 0) {
        const firstUserFolder = barNode.children.find(c => c.children) || barNode.children[0];
        if (firstUserFolder) {
          currentFolderId = firstUserFolder.id;
        }
      }

      renderSidebarFolderTree(treeNodes);
      renderHorizontalRibbon(treeNodes);
      renderFolderContents(currentFolderId);
    });
  } else {
    allBookmarkNodes = getDemoBookmarkTree();
    populateRootFolderSelect(allBookmarkNodes);
    renderSidebarFolderTree(allBookmarkNodes);
    renderHorizontalRibbon(allBookmarkNodes);
    renderFolderContents('101');
  }
}

function populateRootFolderSelect(treeNodes) {
  const rootSelect = document.getElementById('filter-root-folder-select');
  if (!rootSelect) return;

  rootSelect.innerHTML = '<option value="all">Todas as Pastas Mãe</option>';
  const rootNode = findBookmarkNodeById(treeNodes, '1') || treeNodes[0];

  if (rootNode && rootNode.children) {
    rootNode.children.forEach(child => {
      if (child.children) {
        const opt = document.createElement('option');
        opt.value = child.id;
        opt.textContent = child.title;
        rootSelect.appendChild(opt);
      }
    });
  }
}

function setBookmarksViewMode(mode) {
  currentBookmarksViewMode = mode;
  const viewWrapper = document.getElementById('bookmarks-view');
  const modeExplorerBtn = document.getElementById('mode-explorer-btn');
  const modeRibbonBtn = document.getElementById('mode-ribbon-btn');

  if (mode === 'ribbon') {
    if (viewWrapper) {
      viewWrapper.classList.remove('mode-explorer');
      viewWrapper.classList.add('mode-ribbon');
    }
    if (modeExplorerBtn) modeExplorerBtn.classList.remove('active');
    if (modeRibbonBtn) modeRibbonBtn.classList.add('active');
    renderHorizontalRibbon(allBookmarkNodes);
    renderFolderContents(currentFolderId);
    showToast('Modo Barra Horizontal (Ribbon) Ativado');
  } else {
    if (viewWrapper) {
      viewWrapper.classList.remove('mode-ribbon');
      viewWrapper.classList.add('mode-explorer');
    }
    if (modeRibbonBtn) modeRibbonBtn.classList.remove('active');
    if (modeExplorerBtn) modeExplorerBtn.classList.add('active');
    renderSidebarFolderTree(allBookmarkNodes);
    renderFolderContents(currentFolderId);
    showToast('Modo Explorer (2 Colunas) Ativado');
  }
}

function countBookmarksRecursive(node) {
  if (!node) return 0;
  if (node.url) return 1;
  let count = 0;
  if (node.children) {
    node.children.forEach(child => {
      count += countBookmarksRecursive(child);
    });
  }
  return count;
}

function renderHorizontalRibbon(treeNodes) {
  const ribbonList = document.getElementById('bookmark-ribbon-list');
  if (!ribbonList) return;

  ribbonList.innerHTML = '';
  const rootNode = findBookmarkNodeById(treeNodes, '1') || treeNodes[0];

  if (!rootNode || !rootNode.children) return;

  rootNode.children.forEach(child => {
    if (child.children) {
      const totalCount = countBookmarksRecursive(child);
      if (filterHideEmpty && totalCount === 0) return;

      const folderPill = document.createElement('div');
      const isSelected = child.id === currentFolderId;
      folderPill.className = `ribbon-folder-item ${isSelected ? 'active' : ''}`;

      folderPill.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${child.title} (${totalCount})</span>
      `;

      folderPill.addEventListener('click', () => {
        currentFolderId = child.id;
        document.querySelectorAll('.ribbon-folder-item').forEach(p => p.classList.remove('active'));
        folderPill.classList.add('active');
        renderFolderContents(currentFolderId);
      });

      ribbonList.appendChild(folderPill);
    }
  });
}

function collapseAllFolderTree() {
  const wrappers = document.querySelectorAll('.folder-subchildren-wrapper');
  const chevrons = document.querySelectorAll('.folder-toggle-chevron');

  wrappers.forEach(w => w.style.display = 'none');
  chevrons.forEach(c => c.classList.remove('expanded'));

  showToast('Todas as subpastas foram recolhidas.');
}

function renderSidebarFolderTree(treeNodes) {
  const sidebarEl = document.getElementById('folder-tree-list');
  if (!sidebarEl) return;

  sidebarEl.innerHTML = '';

  function renderFolderNode(node, depth, container) {
    if (!node.children) return;

    if (node.id === '0' || node.id === '1' || node.id === '2') {
      node.children.forEach(child => {
        if (child.children) {
          renderFolderNode(child, depth, container);
        }
      });
      return;
    }

    const totalRecursiveCount = countBookmarksRecursive(node);

    if (filterHideEmpty && totalRecursiveCount === 0) return;

    if (filterRootFolderId !== 'all') {
      const isDescendantOrSelf = isNodeInSubtree(node.id, filterRootFolderId);
      if (!isDescendantOrSelf) return;
    }

    if (filterDepthLevel !== 'all') {
      const currentLevel = depth + 1;
      if (filterDepthLevel === '1' && currentLevel !== 1) return;
      if (filterDepthLevel === '2' && currentLevel !== 2) return;
      if (filterDepthLevel === '3' && currentLevel < 3) return;
    }

    const hasSubfolders = node.children.some(c => c.children);
    const folderTitleText = node.title || 'Pasta';

    const folderItem = document.createElement('div');
    folderItem.className = `folder-tree-item draggable-item ${node.id === currentFolderId ? 'active' : ''}`;
    folderItem.style.paddingLeft = `calc(0.4rem + ${depth * 0.75}rem)`;
    folderItem.setAttribute('data-folder-id', node.id);

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
        <span class="folder-count-badge">${totalRecursiveCount}</span>
      </div>
    `;

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'folder-subchildren-wrapper';

    const chevron = folderItem.querySelector('.folder-toggle-chevron');
    if (chevron) {
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExp = chevron.classList.contains('expanded');
        if (isExp) {
          childrenContainer.style.display = 'none';
          chevron.classList.remove('expanded');
        } else {
          childrenContainer.style.display = 'block';
          chevron.classList.add('expanded');
        }
      });
    }

    folderItem.addEventListener('click', (e) => {
      if (e.target.closest('.folder-edit-btn')) return;

      currentFolderId = node.id;
      selectedBookmarkIds.clear();
      document.querySelectorAll('.folder-tree-item').forEach(el => el.classList.remove('active'));
      folderItem.classList.add('active');

      if (hasSubfolders && childrenContainer) {
        childrenContainer.style.display = 'block';
        if (chevron) chevron.classList.add('expanded');
      }

      renderFolderContents(currentFolderId);
    });

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

function isNodeInSubtree(nodeId, rootId) {
  if (nodeId === rootId) return true;
  const rootNode = findBookmarkNodeById(allBookmarkNodes, rootId);
  if (!rootNode) return false;
  return !!findBookmarkNodeById([rootNode], nodeId);
}

function renderFolderContents(folderId, filterQuery = '') {
  const gridEl = document.getElementById('bookmarks-content-grid');
  const breadcrumbsEl = document.getElementById('breadcrumbs');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const folderNode = findBookmarkNodeById(allBookmarkNodes, folderId);

  if (breadcrumbsEl) {
    const pathObjs = getBreadcrumbsObjectsPath(allBookmarkNodes, folderId);
    breadcrumbsEl.innerHTML = '';

    if (pathObjs.length === 0) {
      breadcrumbsEl.innerHTML = '<span class="breadcrumb-item-clickable active">Favoritos</span>';
    } else {
      pathObjs.forEach((item, index) => {
        if (index > 0) {
          const sep = document.createElement('span');
          sep.className = 'breadcrumb-separator';
          sep.textContent = '/';
          breadcrumbsEl.appendChild(sep);
        }

        const span = document.createElement('span');
        span.className = 'breadcrumb-item-clickable';
        span.textContent = item.title;

        if (item.id === folderId) {
          span.classList.add('active');
        }

        span.addEventListener('click', () => {
          currentFolderId = item.id;
          selectedBookmarkIds.clear();
          renderSidebarFolderTree(allBookmarkNodes);
          renderHorizontalRibbon(allBookmarkNodes);
          renderFolderContents(currentFolderId);
        });

        breadcrumbsEl.appendChild(span);
      });
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
    if (filterHideEmpty && countBookmarksRecursive(child) === 0) return false;
    if (!filterQuery) return true;
    return child.title && child.title.toLowerCase().includes(filterQuery);
  });

  if (bookmarkLinks.length === 0 && subFolders.length > 0) {
    subFolders.forEach(subfolder => {
      const subItemCount = countBookmarksRecursive(subfolder);

      const folderCard = document.createElement('div');
      folderCard.className = 'bookmark-card folder-card-panel draggable-item';

      folderCard.innerHTML = `
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-color); flex-shrink:0;">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <div class="bookmark-info">
          <span class="bookmark-title-text" title="${subfolder.title}">${subfolder.title}</span>
          <span class="bookmark-url-text">${subItemCount} favoritos total</span>
        </div>
      `;

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

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;

    card.innerHTML = `
      <input type="checkbox" class="bookmark-select-checkbox" data-id="${bookmark.id}" ${isSelected ? 'checked' : ''}>
      <img class="bookmark-icon" src="${faviconUrl}">
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

    const iconImg = card.querySelector('.bookmark-icon');
    if (iconImg) {
      iconImg.addEventListener('error', () => {
        iconImg.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a1a1aa\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>';
      });
    }

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

function getBreadcrumbsObjectsPath(nodes, targetId) {
  const path = [];
  function searchPath(currentNodes, target) {
    for (const node of currentNodes) {
      if (node.id === target) {
        if (node.id !== '0') {
          path.unshift({ id: node.id, title: node.title || 'Pasta' });
        }
        return true;
      }
      if (node.children) {
        if (searchPath(node.children, target)) {
          if (node.id !== '0') {
            path.unshift({ id: node.id, title: node.title || 'Pasta' });
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
