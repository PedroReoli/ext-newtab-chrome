/* global initShortcutsModule, initAutomationsModule, initThemesModule, initBackupModule, clearShortcutSelection */
function showToast(message) {
  const region = document.getElementById('toast-region');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  region.append(toast);
  setTimeout(() => toast.remove(), 3600);
}

function activateView(targetId, updateHash = true) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const active = tab.dataset.target === targetId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.view-panel').forEach(panel => {
    const active = panel.id === targetId;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  if (updateHash) history.replaceState(null, '', `#${targetId.replace('-view', '')}`);
}

function initNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => activateView(tab.dataset.target)));
  document.querySelector('.main-nav').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...document.querySelectorAll('.nav-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  });
  const hash = location.hash.replace('#', '');
  const target = ['shortcuts', 'automations', 'settings'].includes(hash) ? `${hash}-view` : 'shortcuts-view';
  activateView(target, false);
}

function initKeyboardSupport() {
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && typeof clearShortcutSelection === 'function') clearShortcutSelection();
    if (event.altKey && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      const targets = ['shortcuts-view', 'automations-view', 'settings-view'];
      activateView(targets[Number(event.key) - 1]);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initKeyboardSupport();
  try {
    await initThemesModule();
    await Promise.all([initShortcutsModule(), initAutomationsModule()]);
    initBackupModule();
  } catch (error) {
    console.error(error);
    showToast(`Falha ao iniciar a extensão: ${error.message}`);
  }
});
