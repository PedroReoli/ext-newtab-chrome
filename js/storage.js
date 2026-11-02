/* global chrome */
(function exposeStorage(global) {
  const DEFAULTS = {
    reolitab_shortcuts: null,
    reolitab_shortcut_groups: [],
    reolitab_automations: [],
    reolitab_automation_groups: [],
    reolitab_automation_history: [],
    reolitab_automations_enabled: true,
    reolitab_theme: 'obsidian'
  };

  function hasChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  async function get(keys) {
    const requested = Array.isArray(keys) ? keys : [keys];
    if (hasChromeStorage()) {
      return chrome.storage.local.get(requested);
    }
    return requested.reduce((result, key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        result[key] = DEFAULTS[key];
        return result;
      }
      try {
        result[key] = JSON.parse(raw);
      } catch (_error) {
        result[key] = DEFAULTS[key];
      }
      return result;
    }, {});
  }

  async function set(values) {
    if (hasChromeStorage()) {
      await chrome.storage.local.set(values);
      return;
    }
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }

  async function remove(keys) {
    const requested = Array.isArray(keys) ? keys : [keys];
    if (hasChromeStorage()) {
      await chrome.storage.local.remove(requested);
      return;
    }
    requested.forEach(key => localStorage.removeItem(key));
  }

  global.ReoliStorage = { DEFAULTS, get, set, remove };
})(globalThis);
