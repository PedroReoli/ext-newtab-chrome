/* global ReoliStorage, showToast, renderShortcuts, renderAutomations, syncAutomationSchedules */
const BACKUP_KEYS = ['reolitab_shortcuts', 'reolitab_shortcut_groups', 'reolitab_automations', 'reolitab_automation_history', 'reolitab_automations_enabled', 'reolitab_theme'];

function validateBackup(data) {
  if (!data || typeof data !== 'object' || data.schemaVersion !== 1 || typeof data.values !== 'object') return false;
  if (data.values.reolitab_shortcuts && !Array.isArray(data.values.reolitab_shortcuts)) return false;
  if (data.values.reolitab_shortcut_groups && !Array.isArray(data.values.reolitab_shortcut_groups)) return false;
  if (data.values.reolitab_automations && !Array.isArray(data.values.reolitab_automations)) return false;
  if (data.values.reolitab_automation_history && !Array.isArray(data.values.reolitab_automation_history)) return false;
  return Object.keys(data.values).every(key => BACKUP_KEYS.includes(key));
}

async function exportExtensionBackup() {
  const values = await ReoliStorage.get(BACKUP_KEYS);
  const payload = { product: 'ReoliTab', schemaVersion: 1, extensionVersion: '58.0.0', exportedAt: new Date().toISOString(), values };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `ReoliTab-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Backup exportado.');
}

async function importExtensionBackup(file) {
  if (!file || file.size > 2 * 1024 * 1024) { showToast('Escolha um backup JSON de até 2 MB.'); return; }
  try {
    const data = JSON.parse(await file.text());
    if (!validateBackup(data)) throw new Error('Estrutura de backup incompatível');
    await ReoliStorage.set(data.values);
    await syncAutomationSchedules();
    showToast('Backup importado. Recarregando…');
    setTimeout(() => location.reload(), 500);
  } catch (error) {
    showToast(`Não foi possível importar: ${error.message}`);
  }
}

async function resetExtensionData() {
  if (!confirm('Restaurar atalhos, grupos, automações, histórico e tema?')) return;
  await ReoliStorage.remove(BACKUP_KEYS);
  localStorage.removeItem('custom_newtab_shortcuts');
  localStorage.removeItem('custom_newtab_shortcuts_view_mode');
  localStorage.removeItem('custom_newtab_tag_order');
  localStorage.removeItem('reolitab_shortcuts_recovered_v58');
  localStorage.removeItem('reolitab_automation_sort');
  await syncAutomationSchedules();
  location.reload();
}

function initBackupModule() {
  document.getElementById('export-backup-btn').addEventListener('click', exportExtensionBackup);
  document.getElementById('import-backup-file').addEventListener('change', event => { importExtensionBackup(event.target.files[0]); event.target.value = ''; });
  document.getElementById('reset-extension-btn').addEventListener('click', resetExtensionData);
}
