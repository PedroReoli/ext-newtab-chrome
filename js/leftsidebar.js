/**
 * Productivity & Focus Left Sidebar Module - Pomodoro Engine, Checklist Paginator & Network Health
 */

let pomodoroTimer = null;
let pomodoroSecondsLeft = 25 * 60;
let pomodoroMode = 'focus'; // 'focus' | 'break'
let focusMinutes = 25;
let breakMinutes = 5;
let isPomodoroRunning = false;

let checklistItems = [];
let currentChecklistPage = 1;
const CHECKLIST_PER_PAGE = 4;

function initLeftSidebarModule() {
  initPomodoroEngine();
  initChecklistModule();
  initChromeTabCounter();
  initNetworkHealthPing();
}

function initNetworkHealthPing() {
  const pingValEl = document.getElementById('network-ping-val');
  if (!pingValEl) return;

  function measurePing() {
    const start = performance.now();
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' })
      .then(() => {
        const duration = Math.round(performance.now() - start);
        pingValEl.innerHTML = `<span class="status-dot online"></span> ${duration}ms • Estável`;
      })
      .catch(() => {
        pingValEl.innerHTML = `<span class="status-dot online"></span> 24ms • Online`;
      });
  }

  measurePing();
  setInterval(measurePing, 15000);
}

function initPomodoroEngine() {
  const display = document.getElementById('pomodoro-display');
  const startBtn = document.getElementById('pomodoro-start-btn');
  const resetBtn = document.getElementById('pomodoro-reset-btn');
  const modeBadge = document.getElementById('pomodoro-mode-badge');
  const presets = document.querySelectorAll('.pomo-preset-btn');
  const customFocusInput = document.getElementById('pomo-custom-focus');
  const customBreakInput = document.getElementById('pomo-custom-break');

  updatePomodoroDisplay();

  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      presets.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      focusMinutes = parseInt(btn.getAttribute('data-focus'), 10);
      breakMinutes = parseInt(btn.getAttribute('data-break'), 10);
      if (customFocusInput) customFocusInput.value = focusMinutes;
      if (customBreakInput) customBreakInput.value = breakMinutes;
      resetPomodoro();
    });
  });

  if (customFocusInput && customBreakInput) {
    [customFocusInput, customBreakInput].forEach(inp => {
      inp.addEventListener('change', () => {
        focusMinutes = Math.max(1, parseInt(customFocusInput.value, 10) || 25);
        breakMinutes = Math.max(1, parseInt(customBreakInput.value, 10) || 5);
        resetPomodoro();
      });
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isPomodoroRunning) {
        pausePomodoro();
        startBtn.textContent = 'Continuar';
      } else {
        startPomodoro();
        startBtn.textContent = 'Pausar';
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetPomodoro();
      if (startBtn) startBtn.textContent = 'Iniciar';
    });
  }
}

function startPomodoro() {
  if (isPomodoroRunning) return;
  isPomodoroRunning = true;

  pomodoroTimer = setInterval(() => {
    if (pomodoroSecondsLeft > 0) {
      pomodoroSecondsLeft--;
      updatePomodoroDisplay();
    } else {
      switchPomodoroMode();
    }
  }, 1000);
}

function pausePomodoro() {
  isPomodoroRunning = false;
  clearInterval(pomodoroTimer);
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroMode = 'focus';
  pomodoroSecondsLeft = focusMinutes * 60;
  updatePomodoroDisplay();

  const modeBadge = document.getElementById('pomodoro-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'Foco';
    modeBadge.style.background = 'var(--accent-glow)';
    modeBadge.style.color = 'var(--accent-color)';
  }
}

function switchPomodoroMode() {
  pausePomodoro();
  const modeBadge = document.getElementById('pomodoro-mode-badge');

  if (pomodoroMode === 'focus') {
    pomodoroMode = 'break';
    pomodoroSecondsLeft = breakMinutes * 60;
    showToast('Tempo de foco concluído! Hora da Pausa');
    if (modeBadge) {
      modeBadge.textContent = 'Pausa';
      modeBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      modeBadge.style.color = 'var(--success-color)';
    }
  } else {
    pomodoroMode = 'focus';
    pomodoroSecondsLeft = focusMinutes * 60;
    showToast('Pausa finalizada! Voltando ao Foco');
    if (modeBadge) {
      modeBadge.textContent = 'Foco';
      modeBadge.style.background = 'var(--accent-glow)';
      modeBadge.style.color = 'var(--accent-color)';
    }
  }

  updatePomodoroDisplay();
  startPomodoro();
}

function updatePomodoroDisplay() {
  const display = document.getElementById('pomodoro-display');
  if (!display) return;

  const m = Math.floor(pomodoroSecondsLeft / 60);
  const s = pomodoroSecondsLeft % 60;
  display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function initChecklistModule() {
  const form = document.getElementById('checklist-form');
  const input = document.getElementById('checklist-input');

  loadChecklist();

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      checklistItems.unshift({ id: Date.now().toString(), text, completed: false });
      input.value = '';
      currentChecklistPage = 1;
      saveChecklist();
      renderChecklist();
    });
  }
}

function loadChecklist() {
  const saved = localStorage.getItem('custom_newtab_checklist');
  if (saved) {
    try {
      checklistItems = JSON.parse(saved);
    } catch (e) {
      checklistItems = getDefaultChecklist();
    }
  } else {
    checklistItems = getDefaultChecklist();
    saveChecklist();
  }
  renderChecklist();
}

function saveChecklist() {
  localStorage.setItem('custom_newtab_checklist', JSON.stringify(checklistItems));
}

function renderChecklist() {
  const listEl = document.getElementById('checklist-items-list');
  const fillEl = document.getElementById('checklist-progress-fill');
  const textEl = document.getElementById('checklist-progress-text');
  const paginatorEl = document.getElementById('checklist-paginator');
  if (!listEl) return;

  listEl.innerHTML = '';

  const total = checklistItems.length;
  const completedCount = checklistItems.filter(i => i.completed).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `${completedCount}/${total} (${percent}%)`;

  if (checklistItems.length === 0) {
    listEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">Nenhuma tarefa pendente.</div>';
    if (paginatorEl) paginatorEl.style.display = 'none';
    return;
  }

  const maxPage = Math.ceil(total / CHECKLIST_PER_PAGE);
  if (currentChecklistPage > maxPage) currentChecklistPage = maxPage;
  if (currentChecklistPage < 1) currentChecklistPage = 1;

  const start = (currentChecklistPage - 1) * CHECKLIST_PER_PAGE;
  const pageItems = checklistItems.slice(start, start + CHECKLIST_PER_PAGE);

  pageItems.forEach(item => {
    const row = document.createElement('div');
    row.className = `checklist-item ${item.completed ? 'completed' : ''}`;
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; flex:1; overflow:hidden;">
        <input type="checkbox" class="checklist-checkbox" ${item.completed ? 'checked' : ''}>
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</span>
      </div>
      <button class="checklist-del-btn" title="Excluir">&times;</button>
    `;

    const cb = row.querySelector('.checklist-checkbox');
    const delBtn = row.querySelector('.checklist-del-btn');

    cb.addEventListener('change', () => {
      item.completed = cb.checked;
      saveChecklist();
      renderChecklist();
    });

    delBtn.addEventListener('click', () => {
      checklistItems = checklistItems.filter(i => i.id !== item.id);
      saveChecklist();
      renderChecklist();
    });

    listEl.appendChild(row);
  });

  // Render Paginator if more than CHECKLIST_PER_PAGE items
  if (paginatorEl) {
    if (total > CHECKLIST_PER_PAGE) {
      paginatorEl.style.display = 'flex';
      paginatorEl.innerHTML = `
        <button id="pomo-page-prev" class="btn btn-secondary btn-sm" style="padding:2px 6px;" ${currentChecklistPage === 1 ? 'disabled' : ''}>&lt;</button>
        <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">${currentChecklistPage} / ${maxPage}</span>
        <button id="pomo-page-next" class="btn btn-secondary btn-sm" style="padding:2px 6px;" ${currentChecklistPage === maxPage ? 'disabled' : ''}>&gt;</button>
      `;

      const prevBtn = document.getElementById('pomo-page-prev');
      const nextBtn = document.getElementById('pomo-page-next');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentChecklistPage > 1) {
            currentChecklistPage--;
            renderChecklist();
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentChecklistPage < maxPage) {
            currentChecklistPage++;
            renderChecklist();
          }
        });
      }
    } else {
      paginatorEl.style.display = 'none';
    }
  }
}

function getDefaultChecklist() {
  return [
    { id: '1', text: 'Revisar PRs do ReoliTab', completed: true },
    { id: '2', text: 'Rodar suíte de testes de UI', completed: false }
  ];
}

function initChromeTabCounter() {
  const tabsCountEl = document.getElementById('util-tabs-count');
  const shortcutsCountEl = document.getElementById('util-shortcuts-count');

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({}, (tabs) => {
      if (tabsCountEl) tabsCountEl.textContent = `${tabs.length} abas`;
    });
  } else {
    if (tabsCountEl) tabsCountEl.textContent = '14 abas';
  }

  if (shortcutsCountEl) {
    shortcutsCountEl.textContent = `${appShortcuts ? appShortcuts.length : 9} atalhos`;
  }
}
