/**
 * Background Service Worker for Chrome NewTab Extension
 * Handles background tab scheduling using Chrome Alarms API
 */

// Listen for alarms triggered by the user's scheduled automations
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name) {
      try {
        const alarmData = JSON.parse(alarm.name);
        if (alarmData && alarmData.url) {
          // Open the scheduled URL in a new tab
          chrome.tabs.create({ url: alarmData.url, active: true });
        }
      } catch (e) {
        // Fallback if alarm name is directly a URL string
        if (alarm.name.startsWith('http://') || alarm.name.startsWith('https://')) {
          chrome.tabs.create({ url: alarm.name, active: true });
        }
      }
    }
  });
}
