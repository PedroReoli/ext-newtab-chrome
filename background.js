/* global chrome, AutomationScheduler */
importScripts('js/automation-scheduler.js');

const ALARM_PREFIX = 'reolitab:automation:';
const EXECUTION_GUARD_MS = 30 * 60 * 1000;
const activeExecutions = new Set();
let scheduleQueue = Promise.resolve();
const STORAGE_KEYS = {
  automations: 'reolitab_automations',
  history: 'reolitab_automation_history',
  master: 'reolitab_automations_enabled'
};

function alarmName(id) {
  return `${ALARM_PREFIX}${id}`;
}

async function clearManagedAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(alarms.filter(alarm => alarm.name.startsWith(ALARM_PREFIX)).map(alarm => chrome.alarms.clear(alarm.name)));
}

async function scheduleAutomation(automation) {
  await chrome.alarms.clear(alarmName(automation.id));
  if (!automation.enabled) return null;
  const next = AutomationScheduler.computeNextOccurrence(automation);
  if (!next) return null;
  await chrome.alarms.create(alarmName(automation.id), { when: next.getTime() });
  return next;
}

async function syncSchedules() {
  const values = await chrome.storage.local.get([STORAGE_KEYS.automations, STORAGE_KEYS.master]);
  const automations = Array.isArray(values[STORAGE_KEYS.automations]) ? values[STORAGE_KEYS.automations] : [];
  const masterEnabled = values[STORAGE_KEYS.master] !== false;
  await clearManagedAlarms();
  if (!masterEnabled) return;
  await Promise.all(automations.map(scheduleAutomation));
}

function queueScheduleSync() {
  scheduleQueue = scheduleQueue.then(syncSchedules, syncSchedules);
  return scheduleQueue;
}

async function recordExecution(automation, status, detail = '') {
  const values = await chrome.storage.local.get(STORAGE_KEYS.history);
  const history = Array.isArray(values[STORAGE_KEYS.history]) ? values[STORAGE_KEYS.history] : [];
  history.unshift({ id: crypto.randomUUID(), automationId: automation.id, name: automation.name, url: automation.url, status, detail, executedAt: new Date().toISOString() });
  await chrome.storage.local.set({ [STORAGE_KEYS.history]: history.slice(0, 50) });
}

async function handleAutomationAlarm(alarm) {
  const id = alarm.name.slice(ALARM_PREFIX.length);
  if (activeExecutions.has(id)) return;
  activeExecutions.add(id);
  try {
    const values = await chrome.storage.local.get([STORAGE_KEYS.automations, STORAGE_KEYS.master]);
    const automations = Array.isArray(values[STORAGE_KEYS.automations]) ? values[STORAGE_KEYS.automations] : [];
    const automation = automations.find(item => item.id === id);
    if (!automation || !automation.enabled || values[STORAGE_KEYS.master] === false) return;

    const now = Date.now();
    const lastTriggered = Date.parse(automation.lastTriggeredAt || '');
    if (Number.isFinite(lastTriggered) && now - lastTriggered < EXECUTION_GUARD_MS) {
      await scheduleAutomation(automation);
      return;
    }

    automation.lastTriggeredAt = new Date(now).toISOString();
    if (automation.recurrence === 'once') automation.enabled = false;
    await chrome.storage.local.set({ [STORAGE_KEYS.automations]: automations });
    await queueScheduleSync();
    try {
      await chrome.tabs.create({ url: automation.url, active: automation.openActive !== false });
      await recordExecution(automation, 'success');
    } catch (error) {
      await recordExecution(automation, 'error', error instanceof Error ? error.message : String(error));
    }
  } catch (error) {
    console.error('Falha ao executar automação:', error);
  } finally {
    activeExecutions.delete(id);
  }
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith(ALARM_PREFIX)) handleAutomationAlarm(alarm).catch(console.error);
});

chrome.runtime.onInstalled.addListener(queueScheduleSync);
chrome.runtime.onStartup.addListener(queueScheduleSync);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes[STORAGE_KEYS.automations] || changes[STORAGE_KEYS.master])) queueScheduleSync();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SYNC_AUTOMATIONS') {
    queueScheduleSync().then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (message?.type === 'TEST_AUTOMATION' && message.automation) {
    chrome.tabs.create({ url: message.automation.url, active: message.automation.openActive !== false })
      .then(() => sendResponse({ ok: true }))
      .catch(error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  return false;
});
