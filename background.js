/**
 * Background Service Worker for Chrome NewTab Extension
 * Handles background tab scheduling using Chrome Alarms API
 */

// Listen for alarms triggered by Chrome Alarms API
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name) {
      try {
        const alarmData = JSON.parse(alarm.name);
        if (alarmData && alarmData.url) {
          chrome.tabs.create({ url: alarmData.url, active: true });
        }
      } catch (e) {
        if (alarm.name.startsWith('http://') || alarm.name.startsWith('https://')) {
          chrome.tabs.create({ url: alarm.name, active: true });
        }
      }
    }
  });
}

// Restore alarms on startup and installation
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onStartup.addListener(restoreAlarms);
  chrome.runtime.onInstalled.addListener(restoreAlarms);
}

function restoreAlarms() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['custom_newtab_alarms'], (result) => {
      const alarms = result.custom_newtab_alarms || [];
      alarms.forEach(alarm => {
        if (alarm.alarmName && alarm.time && alarm.url) {
          const [hours, minutes] = alarm.time.split(':').map(Number);
          const now = new Date();
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);
          if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }
          chrome.alarms.create(alarm.alarmName, {
            when: scheduledTime.getTime(),
            periodInMinutes: 1440
          });
        }
      });
    });
  }
}
