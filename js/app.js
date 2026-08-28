/**
 * ReoliTab Application Orchestrator, Live Metrics Dashboard & View Switcher
 */

let customIconBase64Full = null;

document.addEventListener('DOMContentLoaded', () => {
  initDigitalClock();
  initNavigation();
  initSettingsView();
  initTagManager();

  // Initialize Sub-Modules
  initShortcutsModule();
  initBookmarksModule();
  initAutomationsModule();
  initNewsModule();
  initLeftSidebarModule();
  initLiveMetricsEngine();
  initThemesModule();
});

function initDigitalClock() {
  const greetingTextEl = document.getElementById('clock-greeting-text');
  const greetingIconEl = document.getElementById('clock-greeting-icon');
  const timeEl = document.getElementById('clock-time-text');
  const dateEl = document.getElementById('clock-date-text');

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();

    let greeting = 'Boa noite';
    let iconSvg = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';

    if (hours >= 5 && hours < 12) {
      greeting = 'Bom dia';
      iconSvg = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else if (hours >= 12 && hours < 18) {
      greeting = 'Boa tarde';
      iconSvg = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>';
    }

    if (greetingTextEl) greetingTextEl.textContent = greeting;
    if (greetingIconEl) greetingIconEl.innerHTML = iconSvg;

    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (dateEl) {
      const options = { weekday: 'short', day: '2-digit', month: 'short' };
      dateEl.textContent = now.toLocaleDateString('pt-BR', options);
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

function initNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      viewPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent-color); flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* -------------------------------------------------------------
 * Real-Time User Weather Geolocation, Currency & Live Metrics Dashboard Engine
 * ------------------------------------------------------------- */
function initLiveMetricsEngine() {
  initWeatherWidget();
  initCurrencyTickerWidget();
  initRingBellHub();
  updateLiveMetricsDisplay();
  setInterval(updateLiveMetricsDisplay, 3000);
}

function initRingBellHub() {
  const bellBtn = document.getElementById('ring-bell-btn');
  const popover = document.getElementById('bell-auth-popover');

  if (bellBtn && popover) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== bellBtn) {
        popover.classList.remove('active');
      }
    });
  }
}

function updateLiveMetricsDisplay() {
  const newsReadEl = document.getElementById('metrics-news-read');
  if (newsReadEl) {
    const readCount = localStorage.getItem('custom_read_news_count') || '0';
    newsReadEl.textContent = `${readCount} lidas`;
  }

  const pomoCountEl = document.getElementById('metrics-pomo-count');
  if (pomoCountEl) {
    const pomoCount = localStorage.getItem('custom_pomo_completed_count') || '0';
    pomoCountEl.textContent = `${pomoCount} ciclos`;
  }

  const checklistPercentEl = document.getElementById('metrics-checklist-percent');
  if (checklistPercentEl) {
    try {
      const itemsJson = localStorage.getItem('custom_newtab_checklist');
      if (itemsJson) {
        const items = JSON.parse(itemsJson);
        if (Array.isArray(items) && items.length > 0) {
          const completed = items.filter(i => i.completed).length;
          const pct = Math.round((completed / items.length) * 100);
          checklistPercentEl.textContent = `${pct}%`;
        } else {
          checklistPercentEl.textContent = '0%';
        }
      }
    } catch(e) {
      checklistPercentEl.textContent = '0%';
    }
  }
}

function initWeatherWidget() {
  const tempEl = document.getElementById('weather-temp-val');
  const descEl = document.getElementById('weather-desc-text');
  if (!tempEl) return;

  const cachedTemp = localStorage.getItem('custom_weather_temp');
  const cachedLoc = localStorage.getItem('custom_weather_loc');
  if (cachedTemp && cachedLoc) {
    tempEl.textContent = cachedTemp;
    if (descEl) descEl.textContent = cachedLoc;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeatherAndCity(lat, lon);
      },
      (err) => {
        fetchWeatherByIP();
      },
      { timeout: 6000, enableHighAccuracy: false }
    );
  } else {
    fetchWeatherByIP();
  }
}

async function fetchWeatherAndCity(lat, lon) {
  const tempEl = document.getElementById('weather-temp-val');
  const descEl = document.getElementById('weather-desc-text');

  try {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherRes.json();

    let city = 'Sua Localização';
    try {
      const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
      const geoData = await geoRes.json();
      city = geoData.city || geoData.locality || geoData.principalSubdivision || 'Sua Localização';
    } catch(e) {}

    if (weatherData && weatherData.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const code = weatherData.current_weather.weathercode;
      const cond = getWeatherConditionText(code);

      const tempStr = `${temp}°C`;
      const locStr = `${city} • ${cond}`;

      if (tempEl) tempEl.textContent = tempStr;
      if (descEl) descEl.textContent = locStr;

      localStorage.setItem('custom_weather_temp', tempStr);
      localStorage.setItem('custom_weather_loc', locStr);
    }
  } catch(e) {
    fetchWeatherByIP();
  }
}

async function fetchWeatherByIP() {
  const tempEl = document.getElementById('weather-temp-val');
  const descEl = document.getElementById('weather-desc-text');

  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    const ipData = await ipRes.json();
    const lat = ipData.latitude || -23.5505;
    const lon = ipData.longitude || -46.6333;
    const city = ipData.city || 'São Paulo';

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherRes.json();

    if (weatherData && weatherData.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const code = weatherData.current_weather.weathercode;
      const cond = getWeatherConditionText(code);

      const tempStr = `${temp}°C`;
      const locStr = `${city} • ${cond}`;

      if (tempEl) tempEl.textContent = tempStr;
      if (descEl) descEl.textContent = locStr;

      localStorage.setItem('custom_weather_temp', tempStr);
      localStorage.setItem('custom_weather_loc', locStr);
    }
  } catch(e) {
    if (tempEl) tempEl.textContent = '24°C';
    if (descEl) descEl.textContent = 'São Paulo • Tempo Real';
  }
}

function getWeatherConditionText(code) {
  if (code === 0) return 'Céu Limpo';
  if (code >= 1 && code <= 3) return 'Parcialmente Nublado';
  if (code === 45 || code === 48) return 'Névoa';
  if (code >= 51 && code <= 67) return 'Chuva Fina';
  if (code >= 80 && code <= 82) return 'Chuva';
  if (code >= 95) return 'Tempestade';
  return 'Tempo Real';
}

function initCurrencyTickerWidget() {
  const usdEl = document.getElementById('rate-usd-val');
  const eurEl = document.getElementById('rate-eur-val');
  const btcEl = document.getElementById('rate-btc-val');
  if (!usdEl) return;

  fetch('https://open.er-api.com/v6/latest/USD')
    .then(res => res.json())
    .then(data => {
      if (data && data.rates && data.rates.BRL) {
        usdEl.textContent = `R$ ${data.rates.BRL.toFixed(2)}`;
        if (eurEl && data.rates.EUR) {
          const eurInBrl = (data.rates.BRL / data.rates.EUR).toFixed(2);
          eurEl.textContent = `R$ ${eurInBrl}`;
        }
      }
    })
    .catch(() => {
      if (usdEl) usdEl.textContent = 'R$ 5.42';
      if (eurEl) eurEl.textContent = 'R$ 5.91';
    });

  fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
    .then(res => res.json())
    .then(data => {
      if (data && data.bpi && data.bpi.USD) {
        const rate = Math.round(data.bpi.USD.rate_float);
        if (btcEl) btcEl.textContent = `$${(rate / 1000).toFixed(1)}k`;
      }
    })
    .catch(() => {
      if (btcEl) btcEl.textContent = '$64.2k';
    });
}

/* -------------------------------------------------------------
 * Full Settings View & Sub-Tab Controller
 * ------------------------------------------------------------- */
function initSettingsView() {
  const settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
  const settingsSections = document.querySelectorAll('.settings-panel-section');
  const shortcutFormFull = document.getElementById('shortcut-form-full');
  const clearShortcutFormBtn = document.getElementById('clear-shortcut-form-btn');
  const iconFileInputFull = document.getElementById('shortcut-custom-icon-file-full');

  const nameInput = document.getElementById('shortcut-name-full');
  const urlInput = document.getElementById('shortcut-url-full');
  const tagsInput = document.getElementById('shortcut-tags-full');
  const iconUrlInput = document.getElementById('shortcut-custom-icon-url-full');

  settingsNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-settings-tab');

      settingsNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      settingsSections.forEach(sec => {
        if (sec.id === targetTab) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });
    });
  });

  [nameInput, urlInput, tagsInput, iconUrlInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', updateShortcutLivePreview);
    }
  });

  if (iconFileInputFull) {
    iconFileInputFull.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const fileNameSpan = document.getElementById('file-upload-name-text');
      if (file) {
        if (fileNameSpan) fileNameSpan.textContent = `📁 ${file.name}`;
        const reader = new FileReader();
        reader.onload = (event) => {
          customIconBase64Full = event.target.result;
          updateShortcutLivePreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (clearShortcutFormBtn) {
    clearShortcutFormBtn.addEventListener('click', resetShortcutFormFull);
  }

  if (shortcutFormFull) {
    shortcutFormFull.addEventListener('submit', (e) => {
      e.preventDefault();
      const idInput = document.getElementById('shortcut-id-full');
      const id = idInput ? idInput.value : '';

      const name = nameInput.value.trim();
      let url = urlInput.value.trim();
      const tagsStr = tagsInput ? tagsInput.value.trim() : '';
      const customIconUrl = iconUrlInput ? iconUrlInput.value.trim() : '';

      if (!name || !url) return;

      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Geral'];

      if (id) {
        const index = appShortcuts.findIndex(s => s.id === id);
        if (index !== -1) {
          appShortcuts[index] = {
            ...appShortcuts[index],
            name,
            url,
            tags,
            customIconUrl: customIconBase64Full || customIconUrl || null
          };
          showToast('Atalho atualizado com sucesso!');
        }
      } else {
        const newShortcut = {
          id: Date.now().toString(),
          name,
          url,
          tags,
          customIconUrl: customIconBase64Full || customIconUrl || null
        };
        appShortcuts.push(newShortcut);
        showToast('Novo atalho adicionado!');
      }

      saveShortcuts();
      renderTagFilterPills();
      renderShortcutsGrid();
      resetShortcutFormFull();

      const shortcutsTabBtn = document.querySelector('.nav-tab[data-target="shortcuts-view"]');
      if (shortcutsTabBtn) shortcutsTabBtn.click();
    });
  }
}

function updateShortcutLivePreview() {
  const nameInput = document.getElementById('shortcut-name-full');
  const urlInput = document.getElementById('shortcut-url-full');
  const tagsInput = document.getElementById('shortcut-tags-full');
  const iconUrlInput = document.getElementById('shortcut-custom-icon-url-full');

  const previewTitle = document.getElementById('preview-card-title');
  const previewImg = document.getElementById('preview-card-img');
  const previewTag = document.getElementById('preview-card-tag');

  const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Novo Atalho';
  const url = (urlInput && urlInput.value.trim()) ? urlInput.value.trim() : '';
  const tags = (tagsInput && tagsInput.value.trim()) ? tagsInput.value.trim().split(',')[0].trim() : 'Dev';
  const customIcon = (iconUrlInput && iconUrlInput.value.trim()) ? iconUrlInput.value.trim() : null;

  if (previewTitle) previewTitle.textContent = name;
  if (previewTag) previewTag.textContent = tags;

  if (previewImg) {
    if (customIconBase64Full) {
      previewImg.src = customIconBase64Full;
    } else if (customIcon) {
      previewImg.src = customIcon;
    } else if (url) {
      try {
        const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
        previewImg.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch (e) {
        previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%233b82f6\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>';
      }
    } else {
      previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%233b82f6\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>';
    }
  }
}

function resetShortcutFormFull() {
  const formTitle = document.getElementById('shortcut-form-title');
  const idInput = document.getElementById('shortcut-id-full');
  const form = document.getElementById('shortcut-form-full');
  const fileNameSpan = document.getElementById('file-upload-name-text');

  if (formTitle) formTitle.textContent = 'Studio de Criação de Atalhos';
  if (idInput) idInput.value = '';
  if (form) form.reset();
  if (fileNameSpan) fileNameSpan.textContent = 'Escolher Imagem do Computador...';
  customIconBase64Full = null;
  updateShortcutLivePreview();
}

/* -------------------------------------------------------------
 * Dedicated Tag Manager System & Instant Suggestions
 * ------------------------------------------------------------- */
function initTagManager() {
  const createTagForm = document.getElementById('create-tag-form');
  const newTagNameInput = document.getElementById('new-tag-name-input');
  const suggestionPills = document.querySelectorAll('.tag-suggestion-pill');

  renderActiveTagsManager();

  suggestionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const tag = pill.getAttribute('data-suggest-tag');
      if (tag && appShortcuts.length > 0) {
        if (!appShortcuts[0].tags) appShortcuts[0].tags = [];
        if (!appShortcuts[0].tags.includes(tag)) {
          appShortcuts[0].tags.push(tag);
          saveShortcuts();
        }
        showToast(`Tag "${tag}" adicionada às ativas!`);
        renderActiveTagsManager();
        renderTagFilterPills();
      }
    });
  });

  if (createTagForm) {
    createTagForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tagName = newTagNameInput.value.trim();
      if (!tagName) return;

      if (appShortcuts.length > 0) {
        if (!appShortcuts[0].tags) appShortcuts[0].tags = [];
        if (!appShortcuts[0].tags.includes(tagName)) {
          appShortcuts[0].tags.push(tagName);
          saveShortcuts();
        }
      }

      showToast(`Tag "${tagName}" criada com sucesso!`);
      newTagNameInput.value = '';
      renderActiveTagsManager();
      renderTagFilterPills();
    });
  }
}

function renderActiveTagsManager() {
  const container = document.getElementById('active-tags-grid');
  if (!container) return;

  container.innerHTML = '';

  if (typeof loadTagOrder === 'function') loadTagOrder();

  const existingTagsSet = new Set();
  appShortcuts.forEach(s => {
    if (s.tags && Array.isArray(s.tags)) {
      s.tags.forEach(t => existingTagsSet.add(t.trim()));
    } else if (typeof s.tags === 'string' && s.tags.trim()) {
      s.tags.split(',').forEach(t => existingTagsSet.add(t.trim()));
    }
  });

  const orderedTags = [];
  appTagOrder.forEach(t => {
    if (existingTagsSet.has(t) && !orderedTags.includes(t)) {
      orderedTags.push(t);
    }
  });

  existingTagsSet.forEach(t => {
    if (!orderedTags.includes(t)) {
      orderedTags.push(t);
    }
  });

  appTagOrder = orderedTags;
  if (typeof saveTagOrder === 'function') saveTagOrder();

  orderedTags.forEach((tag, idx) => {
    const pill = document.createElement('div');
    pill.className = 'tag-management-pill';
    pill.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.2rem;">
        <button class="tag-reorder-btn move-left-btn" title="Mover para Esquerda" ${idx === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>←</button>
        <button class="tag-reorder-btn move-right-btn" title="Mover para Direita" ${idx === orderedTags.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>→</button>
      </div>
      <span>${tag}</span>
      <button class="tag-delete-btn" title="Remover Tag" data-tag="${tag}">&times;</button>
    `;

    const leftBtn = pill.querySelector('.move-left-btn');
    const rightBtn = pill.querySelector('.move-right-btn');
    const delBtn = pill.querySelector('.tag-delete-btn');

    if (leftBtn && idx > 0) {
      leftBtn.addEventListener('click', () => {
        const temp = appTagOrder[idx];
        appTagOrder[idx] = appTagOrder[idx - 1];
        appTagOrder[idx - 1] = temp;
        if (typeof saveTagOrder === 'function') saveTagOrder();
        renderActiveTagsManager();
        if (typeof renderTagFilterPills === 'function') renderTagFilterPills();
        showToast(`Tag "${tag}" movida para a esquerda!`);
      });
    }

    if (rightBtn && idx < orderedTags.length - 1) {
      rightBtn.addEventListener('click', () => {
        const temp = appTagOrder[idx];
        appTagOrder[idx] = appTagOrder[idx + 1];
        appTagOrder[idx + 1] = temp;
        if (typeof saveTagOrder === 'function') saveTagOrder();
        renderActiveTagsManager();
        if (typeof renderTagFilterPills === 'function') renderTagFilterPills();
        showToast(`Tag "${tag}" movida para a direita!`);
      });
    }

    if (delBtn) {
      delBtn.addEventListener('click', () => {
        appShortcuts.forEach(s => {
          if (s.tags && Array.isArray(s.tags)) s.tags = s.tags.filter(t => t !== tag);
        });
        appTagOrder = appTagOrder.filter(t => t !== tag);
        saveShortcuts();
        if (typeof saveTagOrder === 'function') saveTagOrder();
        showToast(`Tag "${tag}" removida.`);
        renderActiveTagsManager();
        if (typeof renderTagFilterPills === 'function') renderTagFilterPills();
      });
    }

    container.appendChild(pill);
  });
}
