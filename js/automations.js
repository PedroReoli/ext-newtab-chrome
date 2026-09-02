/**
 * Automations Scheduler & Scratchpad Notes Module - Dual-Layered Guaranteed Alarm Engine
 */

let activeAlarms = [];
let openedTabLogs = {};

function initAutomationsModule() {
  initScheduler();
  initScratchpad();
  initSchedulerTicker();
}

function initScheduler() {
  const form = document.getElementById('automation-form');
  const urlInput = document.getElementById('auto-url');
  const timeInput = document.getElementById('auto-time');

  loadActiveAlarms();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      const time = timeInput.value.trim();

      if (!url || !time) return;

      createScheduledTabAlarm(url, time);
      urlInput.value = '';
      timeInput.value = '';
      if (typeof showToast === 'function') {
        showToast(`Guia agendada para às ${time}!`);
      }
    });
  }
}

function initSchedulerTicker() {
  setInterval(checkAndTriggerAlarms, 4000);
  checkAndTriggerAlarms();
}

function checkAndTriggerAlarms() {
  if (!activeAlarms || activeAlarms.length === 0) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;
  const todayDateStr = now.toISOString().split('T')[0];

  activeAlarms.forEach(alarm => {
    if (alarm.time === currentTimeStr) {
      const logKey = `${alarm.id}_${todayDateStr}_${currentTimeStr}`;
      if (!openedTabLogs[logKey]) {
        openedTabLogs[logKey] = true;

        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: alarm.url, active: true });
        } else {
          window.open(alarm.url, '_blank');
        }

        if (typeof showToast === 'function') {
          showToast(`🔔 Automação Disparada: ${alarm.url}`);
        }
      }
    }
  });
}

function createScheduledTabAlarm(url, timeStr) {
  let finalUrl = url;
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const alarmName = JSON.stringify({ url: finalUrl, time: timeStr, id: Date.now() });

  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create(alarmName, {
      when: scheduledTime.getTime(),
      periodInMinutes: 1440
    });
  }

  activeAlarms.push({
    id: Date.now().toString(),
    alarmName,
    url: finalUrl,
    time: timeStr
  });

  saveActiveAlarms();
  renderAlarmsList();
}

function loadActiveAlarms() {
  const saved = localStorage.getItem('custom_newtab_alarms');
  if (saved) {
    try {
      activeAlarms = JSON.parse(saved);
    } catch (e) {
      activeAlarms = [];
    }
  }
  renderAlarmsList();
}

function saveActiveAlarms() {
  localStorage.setItem('custom_newtab_alarms', JSON.stringify(activeAlarms));
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ custom_newtab_alarms: activeAlarms });
  }
}

function renderAlarmsList() {
  const listEl = document.getElementById('alarms-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (activeAlarms.length === 0) {
    listEl.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem 0;">Nenhuma automação de guia agendada.</div>';
    return;
  }

  activeAlarms.forEach(alarm => {
    const item = document.createElement('div');
    item.className = 'alarm-item-compact';
    item.innerHTML = `
      <span class="alarm-badge-time">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        ${alarm.time}
      </span>
      <span class="alarm-url-text" title="${alarm.url}">${alarm.url}</span>
      <div class="alarm-item-actions">
        <button class="alarm-test-btn test-act" title="Abrir Guia Agora">Testar</button>
        <button class="alarm-delete-btn del-act" title="Excluir Agendamento">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    const testBtn = item.querySelector('.test-act');
    const deleteBtn = item.querySelector('.del-act');

    testBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: alarm.url, active: true });
      } else {
        window.open(alarm.url, '_blank');
      }
    });

    deleteBtn.addEventListener('click', () => {
      deleteAlarm(alarm.id, alarm.alarmName);
    });

    listEl.appendChild(item);
  });
}

function deleteAlarm(id, alarmName) {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.clear(alarmName);
  }
  activeAlarms = activeAlarms.filter(a => a.id !== id);
  saveActiveAlarms();
  renderAlarmsList();
  if (typeof showToast === 'function') {
    showToast('Agendamento removido.');
  }
}

/**
 * Scratchpad Notes Module
 */
function initScratchpad() {
  const scratchpad = document.getElementById('scratchpad');
  const statusEl = document.getElementById('notes-status');

  if (!scratchpad) return;

  const savedText = localStorage.getItem('custom_newtab_notes') || '';
  scratchpad.value = savedText;
  updateCharCounter(savedText.length);

  scratchpad.addEventListener('input', () => {
    const val = scratchpad.value;
    localStorage.setItem('custom_newtab_notes', val);
    updateCharCounter(val.length);
    if (statusEl) {
      statusEl.textContent = 'Salvando...';
      setTimeout(() => {
        statusEl.textContent = 'Salvo automaticamente';
      }, 400);
    }
  });
}

function updateCharCounter(length) {
  const counterEl = document.getElementById('notes-char-counter');
  if (counterEl) {
    counterEl.textContent = `${length} caracteres`;
  }
}
