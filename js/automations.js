/**
 * Automations Scheduler & Scratchpad Notes Module
 */

let activeAlarms = [];

function initAutomationsModule() {
  initScheduler();
  initScratchpad();
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
    });
  }
}

function createScheduledTabAlarm(url, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const alarmName = JSON.stringify({ url, time: timeStr, id: Date.now() });

  // Chrome Alarms API
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create(alarmName, {
      when: scheduledTime.getTime(),
      periodInMinutes: 1440 // Daily repeat (24h)
    });
  }

  // Save to local state
  activeAlarms.push({
    id: Date.now().toString(),
    alarmName,
    url,
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
}

function renderAlarmsList() {
  const listEl = document.getElementById('alarms-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (activeAlarms.length === 0) {
    listEl.innerHTML = '<div style="font-size:0.82rem; color:var(--text-muted); padding:0.5rem 0;">Nenhuma automação agendada.</div>';
    return;
  }

  activeAlarms.forEach(alarm => {
    const item = document.createElement('div');
    item.className = 'alarm-item';
    item.innerHTML = `
      <div class="alarm-info">
        <span class="alarm-time">${alarm.time}</span>
        <span class="alarm-url">${alarm.url}</span>
      </div>
      <button class="action-btn delete-btn" title="Excluir Agendamento">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const deleteBtn = item.querySelector('.delete-btn');
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
}

/* -------------------------------------------------------------
 * Scratchpad Notes Module
 * ------------------------------------------------------------- */
function initScratchpad() {
  const scratchpad = document.getElementById('scratchpad');
  const statusEl = document.getElementById('notes-status');

  if (!scratchpad) return;

  // Load saved notes
  scratchpad.value = localStorage.getItem('custom_newtab_notes') || '';

  // Auto-save on typing
  scratchpad.addEventListener('input', () => {
    localStorage.setItem('custom_newtab_notes', scratchpad.value);
    if (statusEl) {
      statusEl.textContent = 'Salvando...';
      setTimeout(() => {
        statusEl.textContent = 'Salvo automaticamente';
      }, 500);
    }
  });
}
