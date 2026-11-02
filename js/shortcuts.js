/* global ReoliStorage, ReoliIcons, showToast */
let reoliShortcuts = [];
let reoliShortcutGroups = [];
let activeShortcutTag = 'Todos';
let draggedShortcutId = null;
let draggedShortcutIds = [];
let selectedShortcutIds = new Set();
let lastSelectedShortcutId = null;
let activeShortcutGroupId = null;
let pendingGroupShortcutIds = [];
let suppressShortcutClick = false;
let shortcutPopupReturnFocus = null;
let pendingShortcutIcon = '';
let editingShortcutIcon = '';
let editingShortcutGroupId = null;
let shortcutCustomizeMode = false;
let shortcutPointerDrag = null;
let shortcutDragGhost = null;

const LEGACY_SHORTCUTS_KEY = 'custom_newtab_shortcuts';
const LEGACY_VIEW_KEY = 'custom_newtab_shortcuts_view_mode';
const LEGACY_TAG_ORDER_KEY = 'custom_newtab_tag_order';
const REPLACEMENT_DEFAULT_IDS = ['youtube', 'github', 'chatgpt', 'canva'];
const VALID_SHORTCUT_MODES = ['grid', 'compact', 'table'];

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

let shortcutViewMode = VALID_SHORTCUT_MODES.includes(localStorage.getItem(LEGACY_VIEW_KEY))
  ? localStorage.getItem(LEGACY_VIEW_KEY)
  : 'grid';

function normalizeShortcutUrl(value) {
  const input = String(value || '').trim();
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(withProtocol);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch (_error) {
    return null;
  }
}

function normalizeShortcutIcon(value) {
  const input = String(value || '').trim();
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(input)) return input;
  return input ? normalizeShortcutUrl(input) : null;
}

function normalizeTags(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values.map(tag => String(tag).trim()).filter(Boolean))].slice(0, 12);
}

function normalizeShortcut(item, index = 0) {
  if (!item || typeof item !== 'object') return null;
  const url = normalizeShortcutUrl(item.url);
  const name = String(item.name || '').trim().slice(0, 60);
  if (!name || !url) return null;
  const tags = normalizeTags(item.tags);
  return {
    id: String(item.id || `recovered-${Date.now()}-${index}`),
    name,
    url,
    tags: tags.length ? tags : ['Geral'],
    iconUrl: normalizeShortcutIcon(item.iconUrl || item.customIcon) || null,
    groupId: item.groupId ? String(item.groupId) : null
  };
}

function readLegacyShortcuts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_SHORTCUTS_KEY) || 'null');
    return Array.isArray(parsed) ? parsed.map(normalizeShortcut).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

function isReplacementDefaultList(items) {
  return Array.isArray(items) && items.length === REPLACEMENT_DEFAULT_IDS.length
    && REPLACEMENT_DEFAULT_IDS.every(id => items.some(item => item.id === id));
}

function mergeShortcutLists(primary, secondary) {
  const result = [...primary];
  const urls = new Set(primary.map(item => item.url));
  secondary.forEach(item => {
    if (!urls.has(item.url)) {
      result.push(item);
      urls.add(item.url);
    }
  });
  return result;
}

async function saveReoliShortcuts() {
  await ReoliStorage.set({ reolitab_shortcuts: reoliShortcuts, reolitab_shortcut_groups: reoliShortcutGroups });
  localStorage.setItem(LEGACY_SHORTCUTS_KEY, JSON.stringify(reoliShortcuts));
}

function shortcutDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_error) { return url; }
}

function faviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=128`; }
  catch (_error) { return ''; }
}

function createShortcutIcon(shortcut) {
  const wrapper = document.createElement('span');
  wrapper.className = 'shortcut-icon-wrapper';
  const fallback = document.createElement('span');
  fallback.className = 'shortcut-fallback-icon';
  fallback.textContent = shortcut.name.slice(0, 1).toUpperCase();
  const image = document.createElement('img');
  image.className = 'shortcut-icon';
  image.alt = '';
  image.src = shortcut.iconUrl || faviconUrl(shortcut.url);
  image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; });
  fallback.hidden = Boolean(image.src);
  wrapper.append(image, fallback);
  return wrapper;
}

function createShortcutAction(label, iconName, handler, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `shortcut-action${danger ? ' danger' : ''}`;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.append(ReoliIcons.create(iconName, 14));
  button.addEventListener('click', event => { event.stopPropagation(); handler(); });
  return button;
}

function visibleShortcuts() {
  return reoliShortcuts.filter(item => {
    const inGroup = activeShortcutGroupId ? item.groupId === activeShortcutGroupId : !item.groupId;
    const matchesTag = activeShortcutTag === 'Todos' || item.tags.includes(activeShortcutTag);
    return inGroup && matchesTag;
  });
}

function updateShortcutSelection() {
  const bar = document.getElementById('shortcut-selection-bar');
  const count = selectedShortcutIds.size;
  bar.hidden = count === 0;
  document.getElementById('shortcut-selection-count').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
  document.getElementById('create-shortcut-group-btn').disabled = count < 1;
  document.querySelectorAll('.shortcut-card[data-shortcut-id]').forEach(card => card.classList.toggle('selected', selectedShortcutIds.has(card.dataset.shortcutId)));
}

function clearShortcutSelection() {
  selectedShortcutIds.clear();
  lastSelectedShortcutId = null;
  updateShortcutSelection();
}

function selectShortcut(id, event) {
  const visibleIds = visibleShortcuts().map(item => item.id);
  if (event.shiftKey && lastSelectedShortcutId && visibleIds.includes(lastSelectedShortcutId)) {
    const start = visibleIds.indexOf(lastSelectedShortcutId);
    const end = visibleIds.indexOf(id);
    visibleIds.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(itemId => selectedShortcutIds.add(itemId));
  } else if (event.ctrlKey || event.metaKey) {
    if (selectedShortcutIds.has(id)) selectedShortcutIds.delete(id);
    else selectedShortcutIds.add(id);
  } else {
    selectedShortcutIds = new Set([id]);
  }
  lastSelectedShortcutId = id;
  updateShortcutSelection();
}

function shortcutIdsForDrag(id) {
  if (!selectedShortcutIds.has(id)) return [id];
  return visibleShortcuts().filter(item => selectedShortcutIds.has(item.id)).map(item => item.id);
}

function clearShortcutDragIndicators() {
  document.querySelectorAll('.dragging, .drop-before, .drop-after, .drop-group, .drop-end').forEach(item => {
    item.classList.remove('dragging', 'drop-before', 'drop-after', 'drop-group', 'drop-end');
  });
  document.getElementById('shortcuts-grid')?.classList.remove('is-dragging');
}

function beginShortcutDrag(id) {
  draggedShortcutId = id;
  draggedShortcutIds = shortcutIdsForDrag(id);
  suppressShortcutClick = true;
  document.getElementById('shortcuts-grid')?.classList.add('is-dragging');
  draggedShortcutIds.forEach(itemId => document.querySelector(`[data-shortcut-id="${CSS.escape(itemId)}"]`)?.classList.add('dragging'));
}

function finishShortcutDrag() {
  draggedShortcutId = null;
  draggedShortcutIds = [];
  shortcutPointerDrag = null;
  shortcutDragGhost?.remove();
  shortcutDragGhost = null;
  clearShortcutDragIndicators();
  setTimeout(() => { suppressShortcutClick = false; }, 80);
}

function createShortcutDragGhost(x = -9999, y = -9999) {
  shortcutDragGhost?.remove();
  const ghost = document.createElement('div');
  ghost.className = 'shortcut-drag-ghost';
  ghost.textContent = draggedShortcutIds.length === 1 ? '1 atalho' : `${draggedShortcutIds.length} atalhos`;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  document.body.append(ghost);
  shortcutDragGhost = ghost;
  return ghost;
}

function shortcutDropPosition(card, clientX, clientY) {
  const rect = card.getBoundingClientRect();
  const tableMode = document.getElementById('shortcuts-grid').classList.contains('mode-table');
  return tableMode
    ? (clientY < rect.top + rect.height / 2 ? 'before' : 'after')
    : (clientX < rect.left + rect.width / 2 ? 'before' : 'after');
}

function markShortcutDropTarget(card, position) {
  document.querySelectorAll('.drop-before, .drop-after, .drop-group, .drop-end').forEach(item => item.classList.remove('drop-before', 'drop-after', 'drop-group', 'drop-end'));
  if (!card || draggedShortcutIds.includes(card.dataset.shortcutId)) return;
  card.classList.add(position === 'after' ? 'drop-after' : 'drop-before');
}

function moveBatchRelativeTo(targetId, position) {
  const ids = draggedShortcutIds.filter(id => id !== targetId);
  if (!ids.length) return;
  const moving = reoliShortcuts.filter(item => ids.includes(item.id));
  reoliShortcuts = reoliShortcuts.filter(item => !ids.includes(item.id));
  const targetIndex = reoliShortcuts.findIndex(item => item.id === targetId);
  const insertAt = targetIndex < 0 ? reoliShortcuts.length : targetIndex + (position === 'after' ? 1 : 0);
  reoliShortcuts.splice(insertAt, 0, ...moving);
}

function moveBatchToEnd() {
  const ids = [...draggedShortcutIds];
  const moving = reoliShortcuts.filter(item => ids.includes(item.id));
  reoliShortcuts = reoliShortcuts.filter(item => !ids.includes(item.id));
  const groupId = activeShortcutGroupId || null;
  const lastGroupIndex = reoliShortcuts.reduce((result, item, index) => item.groupId === groupId ? index : result, -1);
  reoliShortcuts.splice(lastGroupIndex + 1, 0, ...moving);
}

async function saveShortcutDrop(message) {
  await saveReoliShortcuts();
  renderShortcuts();
  showToast(message);
}

async function moveDraggedShortcutsToGroup(group) {
  const movedIds = [...draggedShortcutIds];
  movedIds.forEach(id => {
    const item = reoliShortcuts.find(shortcut => shortcut.id === id);
    if (item) item.groupId = group.id;
  });
  clearShortcutSelection();
  await saveShortcutDrop(`${movedIds.length} atalho${movedIds.length === 1 ? '' : 's'} movido${movedIds.length === 1 ? '' : 's'} para ${group.name}.`);
}

function pointerDropTarget(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  const group = element?.closest('.shortcut-group-card');
  if (group) return { type: 'group', element: group, groupId: group.dataset.groupId };
  const card = element?.closest('.shortcut-card[data-shortcut-id]');
  if (card && !draggedShortcutIds.includes(card.dataset.shortcutId)) {
    return { type: 'shortcut', element: card, id: card.dataset.shortcutId, position: shortcutDropPosition(card, clientX, clientY) };
  }
  const end = element?.closest('.add-shortcut-card');
  return end ? { type: 'end', element: end } : null;
}

function updatePointerDropTarget(clientX, clientY) {
  document.querySelectorAll('.drop-before, .drop-after, .drop-group, .drop-end').forEach(item => item.classList.remove('drop-before', 'drop-after', 'drop-group', 'drop-end'));
  const target = pointerDropTarget(clientX, clientY);
  shortcutPointerDrag.dropTarget = target;
  if (target?.type === 'shortcut') target.element.classList.add(target.position === 'after' ? 'drop-after' : 'drop-before');
  if (target?.type === 'group') target.element.classList.add('drop-group');
  if (target?.type === 'end') target.element.classList.add('drop-end');
}

async function commitPointerShortcutDrop() {
  const target = shortcutPointerDrag?.dropTarget;
  if (!target) return;
  if (target.type === 'shortcut') {
    moveBatchRelativeTo(target.id, target.position);
    await saveShortcutDrop(`${draggedShortcutIds.length} atalho${draggedShortcutIds.length === 1 ? '' : 's'} reposicionado${draggedShortcutIds.length === 1 ? '' : 's'}.`);
  } else if (target.type === 'end') {
    moveBatchToEnd();
    await saveShortcutDrop(`${draggedShortcutIds.length} atalho${draggedShortcutIds.length === 1 ? '' : 's'} movido${draggedShortcutIds.length === 1 ? '' : 's'} para o fim.`);
  } else if (target.type === 'group') {
    const group = reoliShortcutGroups.find(item => item.id === target.groupId);
    if (group) await moveDraggedShortcutsToGroup(group);
  }
}

function attachPointerShortcutDrag(card, shortcut) {
  let pressTimer = null;
  let start = null;
  const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; start = null; };
  card.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.button !== 0 || event.target.closest('button')) return;
    start = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    pressTimer = setTimeout(() => {
      card.setPointerCapture(event.pointerId);
      beginShortcutDrag(shortcut.id);
      shortcutPointerDrag = { pointerId: event.pointerId, dropTarget: null };
      createShortcutDragGhost(event.clientX + 14, event.clientY + 14);
      if (navigator.vibrate) navigator.vibrate(18);
    }, 260);
  });
  card.addEventListener('pointermove', event => {
    if (!start) return;
    if (!shortcutPointerDrag) {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) cancelPress();
      return;
    }
    event.preventDefault();
    shortcutDragGhost.style.left = `${event.clientX + 14}px`;
    shortcutDragGhost.style.top = `${event.clientY + 14}px`;
    updatePointerDropTarget(event.clientX, event.clientY);
    if (event.clientY < 54) window.scrollBy({ top: -8, behavior: 'auto' });
    else if (event.clientY > window.innerHeight - 54) window.scrollBy({ top: 8, behavior: 'auto' });
  });
  const finishPointer = async event => {
    clearTimeout(pressTimer);
    if (!shortcutPointerDrag || shortcutPointerDrag.pointerId !== event.pointerId) { cancelPress(); return; }
    await commitPointerShortcutDrop();
    finishShortcutDrag();
    start = null;
  };
  card.addEventListener('pointerup', finishPointer);
  card.addEventListener('pointercancel', event => {
    if (shortcutPointerDrag?.pointerId === event.pointerId) finishShortcutDrag();
    cancelPress();
  });
}

function attachShortcutDrag(card, shortcut) {
  card.draggable = true;
  card.addEventListener('dragstart', event => {
    beginShortcutDrag(shortcut.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(draggedShortcutIds));
    const ghost = createShortcutDragGhost();
    event.dataTransfer.setDragImage(ghost, 22, 18);
  });
  card.addEventListener('dragend', finishShortcutDrag);
  card.addEventListener('dragover', event => {
    if (!draggedShortcutId || draggedShortcutIds.includes(shortcut.id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    markShortcutDropTarget(card, shortcutDropPosition(card, event.clientX, event.clientY));
  });
  card.addEventListener('dragleave', event => { if (!card.contains(event.relatedTarget)) card.classList.remove('drop-before', 'drop-after'); });
  card.addEventListener('drop', async event => {
    event.preventDefault();
    const count = draggedShortcutIds.length;
    moveBatchRelativeTo(shortcut.id, shortcutDropPosition(card, event.clientX, event.clientY));
    await saveShortcutDrop(`${count} atalho${count === 1 ? '' : 's'} reposicionado${count === 1 ? '' : 's'}.`);
    finishShortcutDrag();
  });
  attachPointerShortcutDrag(card, shortcut);
}

function renderShortcutTags(container, tags) {
  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'shortcut-tag-badge';
    badge.textContent = tag;
    container.append(badge);
  });
}

function createShortcutCard(shortcut) {
  const card = document.createElement('article');
  card.className = `shortcut-card${selectedShortcutIds.has(shortcut.id) ? ' selected' : ''}`;
  card.dataset.shortcutId = shortcut.id;
  card.tabIndex = 0;
  card.setAttribute('role', 'link');
  card.setAttribute('aria-label', `Abrir ${shortcut.name}`);
  const main = document.createElement('span');
  main.className = 'shortcut-main-info';
  const title = document.createElement('strong');
  title.className = 'shortcut-title';
  title.textContent = shortcut.name;
  const domain = document.createElement('small');
  domain.className = 'shortcut-domain';
  domain.textContent = shortcutDomain(shortcut.url);
  main.append(createShortcutIcon(shortcut), title, domain);
  const tags = document.createElement('span');
  tags.className = 'shortcut-tags';
  renderShortcutTags(tags, shortcut.tags);
  card.append(main, tags);
  if (shortcutCustomizeMode) {
    const actions = document.createElement('span');
    actions.className = 'shortcut-actions';
    actions.append(
      createShortcutAction(`Editar ${shortcut.name}`, 'pencil', () => openShortcutPopup(shortcut)),
      createShortcutAction(`Excluir ${shortcut.name}`, 'trash', () => deleteShortcut(shortcut.id), true)
    );
    card.append(actions);
  }
  const open = event => {
    if (suppressShortcutClick || event.target.closest('button')) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      selectShortcut(shortcut.id, event);
      return;
    }
    if (selectedShortcutIds.size) clearShortcutSelection();
    if (event.ctrlKey || event.metaKey) window.open(shortcut.url, '_blank');
    else window.location.href = shortcut.url;
  };
  card.addEventListener('click', open);
  card.addEventListener('auxclick', event => { if (event.button === 1) window.open(shortcut.url, '_blank'); });
  card.addEventListener('keydown', event => { if (event.key === 'Enter') open(event); });
  card.addEventListener('contextmenu', event => {
    if (!shortcutCustomizeMode) return;
    event.preventDefault();
    openShortcutPopup(shortcut);
  });
  attachShortcutDrag(card, shortcut);
  return card;
}

function orderedShortcutTags() {
  const tags = [...new Set(reoliShortcuts.flatMap(item => item.tags))];
  try {
    const savedOrder = JSON.parse(localStorage.getItem(LEGACY_TAG_ORDER_KEY) || '[]');
    return [...savedOrder.filter(tag => tags.includes(tag)), ...tags.filter(tag => !savedOrder.includes(tag))];
  } catch (_error) { return tags; }
}

function renderShortcutFilters() {
  const bar = document.getElementById('tag-filters-bar');
  const available = ['Todos', ...orderedShortcutTags()];
  if (!available.includes(activeShortcutTag)) activeShortcutTag = 'Todos';
  bar.replaceChildren();
  available.forEach(tag => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tag-pill${tag === activeShortcutTag ? ' active' : ''}`;
    button.textContent = tag;
    button.setAttribute('aria-pressed', String(tag === activeShortcutTag));
    button.addEventListener('click', () => { activeShortcutTag = tag; renderShortcutFilters(); renderShortcuts(); });
    bar.append(button);
  });
}

function createAddShortcutCard() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shortcut-card add-shortcut-card';
  const icon = document.createElement('span');
  icon.className = 'shortcut-icon-wrapper add-shortcut-icon';
  icon.textContent = '+';
  const label = document.createElement('strong');
  label.className = 'shortcut-title';
  label.textContent = 'Adicionar';
  button.append(icon, label);
  button.addEventListener('click', () => openShortcutPopup());
  button.addEventListener('dragover', event => {
    if (!draggedShortcutIds.length) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.drop-before, .drop-after, .drop-group').forEach(item => item.classList.remove('drop-before', 'drop-after', 'drop-group'));
    button.classList.add('drop-end');
  });
  button.addEventListener('dragleave', event => { if (!button.contains(event.relatedTarget)) button.classList.remove('drop-end'); });
  button.addEventListener('drop', async event => {
    event.preventDefault();
    const count = draggedShortcutIds.length;
    moveBatchToEnd();
    await saveShortcutDrop(`${count} atalho${count === 1 ? '' : 's'} movido${count === 1 ? '' : 's'} para o fim.`);
    finishShortcutDrag();
  });
  return button;
}

function openShortcutGroup(groupId) {
  activeShortcutGroupId = groupId;
  activeShortcutTag = 'Todos';
  clearShortcutSelection();
  renderShortcutFilters();
  renderShortcuts();
}

function openShortcutGroupPopup(group = null, shortcutIds = [...selectedShortcutIds]) {
  const popup = document.getElementById('shortcut-group-popup');
  pendingGroupShortcutIds = shortcutIds;
  document.getElementById('shortcut-group-popup-title').textContent = group ? 'Renomear grupo' : 'Novo grupo';
  document.getElementById('shortcut-group-id').value = group?.id || '';
  document.getElementById('shortcut-group-input').value = group?.name || '';
  document.getElementById('shortcut-group-help').textContent = group
    ? 'Os atalhos do grupo serão preservados.'
    : pendingGroupShortcutIds.length ? `${pendingGroupShortcutIds.length} atalho(s) serão movidos para este grupo.` : 'O grupo será criado vazio.';
  popup.showPopover();
  document.getElementById('shortcut-group-input').focus();
}

async function deleteShortcutGroup(group) {
  if (!confirm(`Excluir o grupo “${group.name}”? Os atalhos voltarão para a tela principal.`)) return;
  reoliShortcutGroups = reoliShortcutGroups.filter(item => item.id !== group.id);
  reoliShortcuts.forEach(item => { if (item.groupId === group.id) item.groupId = null; });
  if (activeShortcutGroupId === group.id) activeShortcutGroupId = null;
  await saveReoliShortcuts();
  renderShortcutFilters();
  renderShortcuts();
  showToast('Grupo excluído. Os atalhos foram preservados.');
}

function createShortcutGroupCard(group) {
  const card = document.createElement('article');
  card.className = 'shortcut-card shortcut-group-card';
  card.dataset.groupId = group.id;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  const count = reoliShortcuts.filter(item => item.groupId === group.id).length;
  const icon = document.createElement('span');
  icon.className = 'shortcut-icon-wrapper';
  icon.textContent = '▰';
  const title = document.createElement('strong');
  title.className = 'shortcut-title';
  title.textContent = group.name;
  const total = document.createElement('span');
  total.className = 'shortcut-group-count';
  total.textContent = `${count} atalho${count === 1 ? '' : 's'}`;
  card.append(icon, title, total);
  if (shortcutCustomizeMode) {
    const actions = document.createElement('span');
    actions.className = 'shortcut-actions';
    actions.append(
      createShortcutAction(`Renomear ${group.name}`, 'pencil', () => openShortcutGroupPopup(group, [])),
      createShortcutAction(`Excluir ${group.name}`, 'trash', () => deleteShortcutGroup(group), true)
    );
    card.append(actions);
  }
  card.addEventListener('click', event => { if (!event.target.closest('button')) openShortcutGroup(group.id); });
  card.addEventListener('keydown', event => { if (event.key === 'Enter') openShortcutGroup(group.id); });
  card.addEventListener('dragover', event => {
    if (!draggedShortcutIds.length) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.drop-before, .drop-after, .drop-group, .drop-end').forEach(item => item.classList.remove('drop-before', 'drop-after', 'drop-group', 'drop-end'));
    card.classList.add('drop-group');
  });
  card.addEventListener('dragleave', () => card.classList.remove('drop-group'));
  card.addEventListener('drop', async event => {
    event.preventDefault();
    await moveDraggedShortcutsToGroup(group);
    finishShortcutDrag();
  });
  return card;
}

function updateShortcutGroupContext() {
  const context = document.getElementById('shortcut-group-context');
  const group = reoliShortcutGroups.find(item => item.id === activeShortcutGroupId);
  context.hidden = !group;
  document.getElementById('shortcut-group-name').textContent = group?.name || '';
}

function renderShortcuts() {
  const grid = document.getElementById('shortcuts-grid');
  grid.className = `shortcuts-grid mode-${shortcutViewMode}${shortcutCustomizeMode ? ' is-customizing' : ''}`;
  grid.replaceChildren();
  updateShortcutGroupContext();
  if (!activeShortcutGroupId) reoliShortcutGroups.forEach(group => grid.append(createShortcutGroupCard(group)));
  visibleShortcuts().forEach(shortcut => grid.append(createShortcutCard(shortcut)));
  grid.append(createAddShortcutCard());
  updateShortcutSelection();
}

function setShortcutCustomizeMode(enabled) {
  shortcutCustomizeMode = enabled;
  const button = document.getElementById('customize-shortcuts-btn');
  button.classList.toggle('active', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  button.textContent = enabled ? 'Concluir' : 'Personalizar';
  renderShortcuts();
}

function setShortcutViewMode(mode) {
  if (!VALID_SHORTCUT_MODES.includes(mode)) return;
  shortcutViewMode = mode;
  localStorage.setItem(LEGACY_VIEW_KEY, mode);
  document.querySelectorAll('.shortcut-mode-button').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderShortcuts();
}

function openShortcutPopup(shortcut = null) {
  const popup = document.getElementById('shortcut-popup');
  shortcutPopupReturnFocus = document.activeElement;
  editingShortcutIcon = shortcut?.iconUrl || '';
  editingShortcutGroupId = shortcut?.groupId || activeShortcutGroupId || null;
  pendingShortcutIcon = '';
  document.getElementById('shortcut-popup-title').textContent = shortcut ? 'Editar atalho' : 'Novo atalho';
  document.getElementById('shortcut-id').value = shortcut?.id || '';
  document.getElementById('shortcut-name').value = shortcut?.name || '';
  document.getElementById('shortcut-url').value = shortcut?.url || '';
  document.getElementById('shortcut-tags').value = shortcut?.tags?.join(', ') || '';
  document.getElementById('shortcut-icon-url').value = shortcut?.iconUrl?.startsWith('http') ? shortcut.iconUrl : '';
  document.getElementById('shortcut-file').value = '';
  document.getElementById('shortcut-file-name').textContent = shortcut?.iconUrl?.startsWith('data:image') ? 'Imagem atual preservada' : 'Escolher imagem';
  document.getElementById('shortcut-form-error').hidden = true;
  popup.showPopover();
  document.getElementById('shortcut-name').focus();
}

function closeShortcutPopup() {
  const popup = document.getElementById('shortcut-popup');
  if (popup.matches(':popover-open')) popup.hidePopover();
  if (shortcutPopupReturnFocus?.isConnected) shortcutPopupReturnFocus.focus();
  shortcutPopupReturnFocus = null;
}

async function deleteShortcut(id) {
  if (!confirm('Deseja realmente excluir este atalho?')) return;
  reoliShortcuts = reoliShortcuts.filter(item => item.id !== id);
  await saveReoliShortcuts();
  renderShortcutFilters();
  renderShortcuts();
  showToast('Atalho excluído.');
}

function readShortcutImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 1.5 * 1024 * 1024) {
    showToast('Escolha uma imagem de até 1,5 MB.');
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    pendingShortcutIcon = String(reader.result || '');
    document.getElementById('shortcut-file-name').textContent = file.name;
  });
  reader.readAsDataURL(file);
}

async function loadAndRecoverShortcuts() {
  const values = await ReoliStorage.get(['reolitab_shortcuts', 'reolitab_shortcut_groups']);
  reoliShortcutGroups = Array.isArray(values.reolitab_shortcut_groups)
    ? values.reolitab_shortcut_groups
      .filter(item => item && typeof item === 'object' && item.id && String(item.name || '').trim())
      .map(item => ({ id: String(item.id), name: String(item.name).trim().slice(0, 40) }))
    : [];
  const current = Array.isArray(values.reolitab_shortcuts)
    ? values.reolitab_shortcuts.map(normalizeShortcut).filter(Boolean)
    : [];
  const legacy = readLegacyShortcuts();
  let recovered = false;
  if (legacy.length && (!current.length || isReplacementDefaultList(current))) {
    reoliShortcuts = legacy;
    recovered = true;
  } else if (legacy.length && current.length) {
    reoliShortcuts = mergeShortcutLists(legacy, current);
    recovered = reoliShortcuts.length > current.length;
  } else if (!current.length || isReplacementDefaultList(current)) {
    reoliShortcuts = DEFAULT_SHORTCUTS.map(normalizeShortcut);
  } else {
    reoliShortcuts = current;
  }
  await saveReoliShortcuts();
  if (recovered && !localStorage.getItem('reolitab_shortcuts_recovered_v58')) {
    localStorage.setItem('reolitab_shortcuts_recovered_v58', '1');
    setTimeout(() => showToast(`${legacy.length} atalhos antigos recuperados.`), 200);
  }
}

async function initShortcutsModule() {
  await loadAndRecoverShortcuts();
  renderShortcutFilters();
  setShortcutViewMode(shortcutViewMode);
  document.getElementById('add-shortcut-btn').addEventListener('click', () => openShortcutPopup());
  document.getElementById('customize-shortcuts-btn').addEventListener('click', () => setShortcutCustomizeMode(!shortcutCustomizeMode));
  document.getElementById('shortcut-group-back').addEventListener('click', () => openShortcutGroup(null));
  document.getElementById('clear-shortcut-selection-btn').addEventListener('click', clearShortcutSelection);
  const createGroupButton = document.getElementById('create-shortcut-group-btn');
  createGroupButton.addEventListener('click', () => openShortcutGroupPopup(null));
  createGroupButton.addEventListener('dragover', event => { if (draggedShortcutIds.length) event.preventDefault(); });
  createGroupButton.addEventListener('drop', event => { event.preventDefault(); openShortcutGroupPopup(null, draggedShortcutIds); });
  document.querySelectorAll('.shortcut-mode-button').forEach(button => button.addEventListener('click', () => setShortcutViewMode(button.dataset.mode)));
  document.getElementById('close-shortcut-popup-btn').addEventListener('click', closeShortcutPopup);
  document.getElementById('cancel-shortcut-popup-btn').addEventListener('click', closeShortcutPopup);
  document.getElementById('shortcut-file').addEventListener('change', event => readShortcutImage(event.target.files[0]));
  const groupPopup = document.getElementById('shortcut-group-popup');
  const closeGroupPopup = () => { if (groupPopup.matches(':popover-open')) groupPopup.hidePopover(); pendingGroupShortcutIds = []; };
  document.getElementById('close-shortcut-group-popup-btn').addEventListener('click', closeGroupPopup);
  document.getElementById('cancel-shortcut-group-popup-btn').addEventListener('click', closeGroupPopup);
  document.getElementById('shortcut-group-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('shortcut-group-id').value;
    const name = document.getElementById('shortcut-group-input').value.trim();
    if (!name) return;
    if (id) {
      const group = reoliShortcutGroups.find(item => item.id === id);
      if (group) group.name = name;
    } else {
      const groupId = crypto.randomUUID();
      reoliShortcutGroups.push({ id: groupId, name });
      pendingGroupShortcutIds.forEach(shortcutId => {
        const shortcut = reoliShortcuts.find(item => item.id === shortcutId);
        if (shortcut) shortcut.groupId = groupId;
      });
    }
    await saveReoliShortcuts();
    closeGroupPopup();
    clearShortcutSelection();
    renderShortcuts();
    showToast(id ? 'Grupo renomeado.' : 'Grupo criado.');
  });
  document.getElementById('shortcut-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('shortcut-id').value;
    const name = document.getElementById('shortcut-name').value.trim();
    const url = normalizeShortcutUrl(document.getElementById('shortcut-url').value);
    const tags = normalizeTags(document.getElementById('shortcut-tags').value);
    const typedIcon = document.getElementById('shortcut-icon-url').value.trim();
    const iconUrl = pendingShortcutIcon || normalizeShortcutIcon(typedIcon) || editingShortcutIcon || null;
    const error = document.getElementById('shortcut-form-error');
    if (!name || !url || (typedIcon && !normalizeShortcutIcon(typedIcon))) {
      error.textContent = 'Informe nome e endereço válidos. O ícone deve usar http ou https.';
      error.hidden = false;
      return;
    }
    const next = { id: id || crypto.randomUUID(), name, url, tags: tags.length ? tags : ['Geral'], iconUrl, groupId: editingShortcutGroupId };
    const index = reoliShortcuts.findIndex(item => item.id === id);
    if (index >= 0) reoliShortcuts[index] = next;
    else reoliShortcuts.push(next);
    await saveReoliShortcuts();
    renderShortcutFilters();
    renderShortcuts();
    closeShortcutPopup();
    showToast(id ? 'Atalho atualizado.' : 'Atalho criado.');
  });
}
