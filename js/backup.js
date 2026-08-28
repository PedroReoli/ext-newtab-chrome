/**
 * Backup & Data Import/Export Module
 */

function initBackupModule() {
  const exportBtn = document.getElementById('export-json-btn') || document.getElementById('export-json-btn-full');
  const importInput = document.getElementById('import-json-file') || document.getElementById('import-json-file-full');
  const resetBtn = document.getElementById('reset-all-btn') || document.getElementById('reset-all-btn-full');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportConfiguration);
  }

  if (importInput) {
    importInput.addEventListener('change', importConfiguration);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllConfiguration);
  }
}

function exportConfiguration() {
  const backupData = {
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    shortcuts: JSON.parse(localStorage.getItem('custom_newtab_shortcuts') || '[]'),
    theme: localStorage.getItem('custom_newtab_theme') || 'zinc',
    searchEngine: localStorage.getItem('custom_newtab_engine') || 'google',
    notes: localStorage.getItem('custom_newtab_notes') || ''
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `ReoliTab-Backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

function importConfiguration(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.shortcuts && Array.isArray(data.shortcuts)) {
        localStorage.setItem('custom_newtab_shortcuts', JSON.stringify(data.shortcuts));
      }
      if (data.theme) {
        localStorage.setItem('custom_newtab_theme', data.theme);
      }
      if (data.searchEngine) {
        localStorage.setItem('custom_newtab_engine', data.searchEngine);
      }
      if (data.notes) {
        localStorage.setItem('custom_newtab_notes', data.notes);
      }

      alert('Configurações importadas com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (err) {
      alert('Erro ao importar arquivo JSON: Formato inválido.');
    }
  };
  reader.readAsText(file);
}

function resetAllConfiguration() {
  if (confirm('Tem certeza de que deseja restaurar as configurações padrão? Todos os seus atalhos personalizados serão substituídos.')) {
    localStorage.removeItem('custom_newtab_shortcuts');
    localStorage.removeItem('custom_newtab_theme');
    localStorage.removeItem('custom_newtab_engine');
    window.location.reload();
  }
}
