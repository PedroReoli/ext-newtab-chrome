/* global chrome, ReoliStorage, AutomationScheduler, showToast */
let reoliAutomations = [];
let automationHistory = [];
let automationsMasterEnabled = true;
let automationSort = localStorage.getItem('reolitab_automation_sort') || 'next';

function normalizeAutomations(value) {
  return Array.isArray(value) ? value.map(item => ({ ...item, enabled: item.enabled !== false })) : [];
}

function automationDaysFromForm() {
  return [...document.querySelectorAll('#automation-days-fieldset input:checked')].map(input => Number(input.value));
}

function applyRecurrencePreset(recurrence) {
  const checks = [...document.querySelectorAll('#automation-days-fieldset input')];
  const fieldset = document.getElementById('automation-days-fieldset');
  fieldset.hidden = recurrence === 'once';
  if (recurrence === 'weekdays') checks.forEach(input => { input.checked = AutomationScheduler.WEEKDAYS.includes(Number(input.value)); input.disabled = true; });
  else if (recurrence === 'daily') checks.forEach(input => { input.checked = true; input.disabled = true; });
  else checks.forEach(input => { input.disabled = false; });
}

async function syncAutomationSchedules() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try { await chrome.runtime.sendMessage({ type: 'SYNC_AUTOMATIONS' }); } catch (_error) { /* Browser preview. */ }
  }
}

async function saveAutomations() {
  await ReoliStorage.set({ reolitab_automations: reoliAutomations });
  await syncAutomationSchedules();
}

function latestHistoryFor(id) {
  return automationHistory.find(entry => entry.automationId === id);
}

function nextExecutionFor(automation) {
  return automationsMasterEnabled && automation.enabled ? AutomationScheduler.computeNextOccurrence(automation) : null;
}

function sortedAutomations() {
  const items = [...reoliAutomations];
  if (automationSort === 'name') return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  if (automationSort === 'status') return items.sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name, 'pt-BR'));
  return items.sort((a, b) => {
    const aNext = nextExecutionFor(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bNext = nextExecutionFor(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aNext - bNext || a.name.localeCompare(b.name, 'pt-BR');
  });
}

function createAutomationAction(symbol, label, handler, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `automation-icon-button${danger ? ' danger' : ''}`;
  button.textContent = symbol;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', handler);
  return button;
}

function createAutomationMeta(label, value, date = null) {
  const item = document.createElement('div');
  item.className = 'automation-meta-item';
  const caption = document.createElement('span');
  caption.textContent = label;
  const output = date ? document.createElement('time') : document.createElement('strong');
  output.textContent = value;
  if (date) output.dateTime = date.toISOString();
  item.append(caption, output);
  return item;
}

function createAutomationToggle(automation) {
  const label = document.createElement('label');
  label.className = 'automation-toggle';
  label.title = automation.enabled ? 'Desativar automação' : 'Ativar automação';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = automation.enabled;
  input.setAttribute('aria-label', `${automation.enabled ? 'Desativar' : 'Ativar'} ${automation.name}`);
  const track = document.createElement('span');
  track.setAttribute('aria-hidden', 'true');
  const status = document.createElement('small');
  status.textContent = automation.enabled ? 'Ativa' : 'Pausada';
  input.addEventListener('change', () => setAutomationEnabled(automation.id, input.checked));
  label.append(input, track, status);
  return label;
}

function createAutomationCard(automation) {
  const active = automationsMasterEnabled && automation.enabled;
  const card = document.createElement('article');
  card.className = `automation-card${active ? '' : ' disabled'}`;

  const schedule = document.createElement('div');
  schedule.className = 'automation-schedule';
  const clock = document.createElement('strong');
  clock.textContent = automation.time;
  const recurrence = document.createElement('span');
  recurrence.textContent = AutomationScheduler.recurrenceLabel(automation);
  schedule.append(clock, recurrence);

  const content = document.createElement('div');
  content.className = 'automation-content';
  const heading = document.createElement('div');
  heading.className = 'automation-title-row';
  const title = document.createElement('h3');
  title.textContent = automation.name;
  const state = document.createElement('span');
  state.className = `automation-state ${active ? 'active' : 'paused'}`;
  state.textContent = active ? 'Programada' : automationsMasterEnabled ? 'Desativada' : 'Pausa geral';
  heading.append(title, state);
  const url = document.createElement('div');
  url.className = 'automation-url';
  url.textContent = automation.url;
  url.title = automation.url;

  const nextDate = nextExecutionFor(automation);
  const last = latestHistoryFor(automation.id);
  const meta = document.createElement('div');
  meta.className = 'automation-meta';
  meta.append(
    createAutomationMeta('Próxima', active ? AutomationScheduler.formatNext(nextDate) : 'Pausada', nextDate),
    createAutomationMeta('Última', last ? `${new Date(last.executedAt).toLocaleString('pt-BR')} · ${last.status === 'success' ? 'OK' : 'Falhou'}` : 'Ainda não executada')
  );
  content.append(heading, url, meta);

  const controls = document.createElement('div');
  controls.className = 'automation-controls';
  controls.append(createAutomationToggle(automation));
  const actions = document.createElement('div');
  actions.className = 'automation-actions';
  actions.append(
    createAutomationAction('▶️', `Testar ${automation.name}`, () => testAutomation(automation)),
    createAutomationAction('✏️', `Editar ${automation.name}`, () => editAutomation(automation)),
    createAutomationAction('📄', `Duplicar ${automation.name}`, () => duplicateAutomation(automation)),
    createAutomationAction('🗑️', `Excluir ${automation.name}`, () => deleteAutomation(automation.id), true)
  );
  controls.append(actions);
  card.append(schedule, content, controls);
  return card;
}

function renderAutomations() {
  const list = document.getElementById('automations-list');
  const enabledCount = reoliAutomations.filter(item => item.enabled).length;
  const pausedCount = reoliAutomations.length - enabledCount;
  document.getElementById('automation-summary').textContent = reoliAutomations.length
    ? `${enabledCount} ativa${enabledCount === 1 ? '' : 's'} · ${pausedCount} pausada${pausedCount === 1 ? '' : 's'}`
    : 'Nenhuma automação cadastrada';
  list.replaceChildren();
  if (!reoliAutomations.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const title = document.createElement('strong');
    title.textContent = 'Sua agenda está vazia';
    const help = document.createElement('span');
    help.textContent = 'Use o formulário ao lado para programar a primeira página.';
    empty.append(title, help);
    list.append(empty);
    return;
  }
  sortedAutomations().forEach(automation => list.append(createAutomationCard(automation)));
}

function updateMasterPresentation() {
  const master = document.getElementById('automations-master-toggle');
  master.checked = automationsMasterEnabled;
  document.getElementById('master-toggle-label').textContent = automationsMasterEnabled ? 'Tudo ativo' : 'Tudo pausado';
}

function resetAutomationForm() {
  const form = document.getElementById('automation-form');
  form.reset();
  document.getElementById('automation-id').value = '';
  document.getElementById('automation-form-title').textContent = 'Nova automação';
  document.getElementById('cancel-automation-edit-btn').hidden = true;
  document.getElementById('automation-form-error').hidden = true;
  document.getElementById('automation-recurrence').value = 'weekdays';
  document.getElementById('automation-open-active').checked = true;
  applyRecurrencePreset('weekdays');
}

function editAutomation(automation) {
  document.getElementById('automation-id').value = automation.id;
  document.getElementById('automation-name').value = automation.name;
  document.getElementById('automation-url').value = automation.url;
  document.getElementById('automation-time').value = automation.time;
  document.getElementById('automation-recurrence').value = automation.recurrence;
  document.getElementById('automation-open-active').checked = automation.openActive !== false;
  document.querySelectorAll('#automation-days-fieldset input').forEach(input => { input.checked = automation.daysOfWeek?.includes(Number(input.value)); });
  applyRecurrencePreset(automation.recurrence);
  if (automation.recurrence === 'custom') document.querySelectorAll('#automation-days-fieldset input').forEach(input => { input.checked = automation.daysOfWeek?.includes(Number(input.value)); });
  document.getElementById('automation-form-title').textContent = 'Editar automação';
  document.getElementById('cancel-automation-edit-btn').hidden = false;
  document.getElementById('automation-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function setAutomationEnabled(id, enabled) {
  const item = reoliAutomations.find(automation => automation.id === id);
  if (!item || item.enabled === enabled) return;
  const previous = item.enabled;
  item.enabled = enabled;
  renderAutomations();
  try {
    await saveAutomations();
    showToast(enabled ? 'Automação ativada.' : 'Automação desativada.');
  } catch (error) {
    item.enabled = previous;
    renderAutomations();
    showToast(`Não foi possível alterar: ${error.message}`);
  }
}

async function duplicateAutomation(item) {
  reoliAutomations.push({ ...item, id: crypto.randomUUID(), name: `${item.name} — cópia`, enabled: false, lastTriggeredAt: null });
  await saveAutomations();
  renderAutomations();
  showToast('Cópia criada desativada.');
}

async function deleteAutomation(id) {
  if (!confirm('Excluir esta automação?')) return;
  reoliAutomations = reoliAutomations.filter(item => item.id !== id);
  await saveAutomations();
  renderAutomations();
  showToast('Automação excluída.');
}

async function testAutomation(automation) {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const result = await chrome.runtime.sendMessage({ type: 'TEST_AUTOMATION', automation });
    if (!result?.ok) { showToast('Não foi possível abrir a página.'); return; }
  } else window.open(automation.url, '_blank', 'noopener');
  showToast('Página de teste aberta uma vez.');
}

function registerAutomationStorageSync() {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.reolitab_automations) reoliAutomations = normalizeAutomations(changes.reolitab_automations.newValue);
    if (changes.reolitab_automation_history) automationHistory = Array.isArray(changes.reolitab_automation_history.newValue) ? changes.reolitab_automation_history.newValue : [];
    if (changes.reolitab_automations_enabled) {
      automationsMasterEnabled = changes.reolitab_automations_enabled.newValue !== false;
      updateMasterPresentation();
    }
    if (changes.reolitab_automations || changes.reolitab_automation_history || changes.reolitab_automations_enabled) renderAutomations();
  });
}

async function initAutomationsModule() {
  const values = await ReoliStorage.get(['reolitab_automations', 'reolitab_automation_history', 'reolitab_automations_enabled']);
  reoliAutomations = normalizeAutomations(values.reolitab_automations);
  automationHistory = Array.isArray(values.reolitab_automation_history) ? values.reolitab_automation_history : [];
  automationsMasterEnabled = values.reolitab_automations_enabled !== false;
  if (!['next', 'status', 'name'].includes(automationSort)) automationSort = 'next';
  document.getElementById('automation-sort').value = automationSort;
  updateMasterPresentation();
  applyRecurrencePreset('weekdays');
  renderAutomations();

  document.getElementById('automation-sort').addEventListener('change', event => {
    automationSort = event.target.value;
    localStorage.setItem('reolitab_automation_sort', automationSort);
    renderAutomations();
  });
  document.getElementById('automation-recurrence').addEventListener('change', event => applyRecurrencePreset(event.target.value));
  document.getElementById('cancel-automation-edit-btn').addEventListener('click', resetAutomationForm);
  document.getElementById('automations-master-toggle').addEventListener('change', async event => {
    automationsMasterEnabled = event.target.checked;
    updateMasterPresentation();
    renderAutomations();
    await ReoliStorage.set({ reolitab_automations_enabled: automationsMasterEnabled });
    await syncAutomationSchedules();
    showToast(automationsMasterEnabled ? 'Todas as automações foram retomadas.' : 'Todas as automações foram pausadas.');
  });
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    automationHistory = [];
    await ReoliStorage.set({ reolitab_automation_history: [] });
    renderAutomations();
    showToast('Histórico limpo.');
  });
  document.getElementById('automation-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('automation-id').value;
    const name = document.getElementById('automation-name').value.trim();
    const url = AutomationScheduler.normalizeUrl(document.getElementById('automation-url').value);
    const time = document.getElementById('automation-time').value;
    const recurrence = document.getElementById('automation-recurrence').value;
    const daysOfWeek = recurrence === 'weekdays' ? AutomationScheduler.WEEKDAYS : recurrence === 'daily' || recurrence === 'once' ? AutomationScheduler.EVERY_DAY : automationDaysFromForm();
    const error = document.getElementById('automation-form-error');
    if (!name || !url || !time) { error.textContent = 'Preencha nome, endereço e horário com valores válidos.'; error.hidden = false; return; }
    if (recurrence === 'custom' && !daysOfWeek.length) { error.textContent = 'Escolha pelo menos um dia da semana.'; error.hidden = false; return; }
    const current = reoliAutomations.find(item => item.id === id);
    const value = { id: id || crypto.randomUUID(), name, url, time, recurrence, daysOfWeek, enabled: current?.enabled !== false, openActive: document.getElementById('automation-open-active').checked, lastTriggeredAt: current?.lastTriggeredAt || null };
    if (id) reoliAutomations = reoliAutomations.map(item => item.id === id ? value : item);
    else reoliAutomations.push(value);
    await saveAutomations();
    resetAutomationForm();
    renderAutomations();
    showToast(id ? 'Automação atualizada.' : 'Automação criada.');
  });
  registerAutomationStorageSync();
}
