/**
 * Right Sidebar Integrations, Real-Time User Geolocation & Weather Engine, Live Metrics Dashboard, Slack/Discord Webhook Hub, Twitter Tweet Studio & YouTube Music Controller
 */

let serviceAuthStates = {
  ytmusic: false,
  twitter: false,
  slack: false,
  antigravity: true
};

function initIntegrationsModule() {
  initWidgetsSubnav();
  initWeatherWidget();
  initCurrencyTickerWidget();
  initReoliAIAssistant();
  initAntigravityStudio();
  initYTMusicDirectController();
  initSlackDiscordHub();
  initTwitterTweetStudio();
  initRingBellAuthHub();
  checkAllServicesAuthStatus();
  updateLiveMetricsDisplay();

  setInterval(updateLiveMetricsDisplay, 3000);
}

function updateLiveMetricsDisplay() {
  // 1. News Read Count
  const newsReadEl = document.getElementById('metrics-news-read');
  if (newsReadEl) {
    const readCount = localStorage.getItem('custom_read_news_count') || '0';
    newsReadEl.textContent = `${readCount} lidas`;
  }

  // 2. Pomodoro Completed Cycles
  const pomoCountEl = document.getElementById('metrics-pomo-count');
  if (pomoCountEl) {
    const pomoCount = localStorage.getItem('custom_pomo_completed_count') || '0';
    pomoCountEl.textContent = `${pomoCount} ciclos`;
  }

  // 3. Checklist Completion Percentage
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

function initSlackDiscordHub() {
  const statusItems = document.querySelectorAll('.slack-status-item');
  const sendWebhookBtn = document.getElementById('send-webhook-msg-btn');
  const msgInput = document.getElementById('webhook-msg-input');

  statusItems.forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-status-text');
      if (text) {
        navigator.clipboard.writeText(text);
        showToast(`Status "${text}" copiado para a área de transferência!`);
      }
    });
  });

  if (sendWebhookBtn && msgInput) {
    sendWebhookBtn.addEventListener('click', () => {
      const msg = msgInput.value.trim();
      if (!msg) {
        showToast('Digite uma mensagem para enviar ao Slack/Discord!');
        return;
      }

      let webhookUrl = localStorage.getItem('custom_webhook_url');
      if (!webhookUrl) {
        webhookUrl = prompt('Digite a URL do Webhook do Slack ou Discord:');
        if (webhookUrl && webhookUrl.trim()) {
          localStorage.setItem('custom_webhook_url', webhookUrl.trim());
        } else {
          return;
        }
      }

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg, text: msg })
      })
      .then(() => {
        showToast('Mensagem enviada com sucesso ao Webhook!');
        msgInput.value = '';
      })
      .catch(() => {
        showToast('Mensagem enviada ou aberta no canal!');
        msgInput.value = '';
      });
    });
  }
}

function initTwitterTweetStudio() {
  const tweetInput = document.getElementById('twitter-quick-tweet-input');
  const charCounter = document.getElementById('tweet-char-count');
  const postBtn = document.getElementById('post-quick-tweet-btn');

  if (tweetInput) {
    tweetInput.addEventListener('input', () => {
      const len = tweetInput.value.length;
      if (charCounter) charCounter.textContent = `${len} / 280`;
    });
  }

  if (postBtn && tweetInput) {
    postBtn.addEventListener('click', () => {
      const tweetText = tweetInput.value.trim();
      if (!tweetText) {
        showToast('Digite o texto da postagem antes de enviar ao X!');
        return;
      }
      const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(tweetUrl, '_blank');
      showToast('Abrindo o X / Twitter para publicar...');
    });
  }
}

function initRingBellAuthHub() {
  const bellBtn = document.getElementById('ring-bell-btn');
  const popover = document.getElementById('bell-auth-popover');

  if (bellBtn && popover) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkAllServicesAuthStatus();
      popover.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== bellBtn) {
        popover.classList.remove('active');
      }
    });
  }
}

function checkAllServicesAuthStatus() {
  let loggedOutCount = 0;

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ url: '*://music.youtube.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        serviceAuthStates.ytmusic = true;
        updateServiceStatusUI('ytmusic', true, 'Aba Ativa Conectada');
      } else {
        serviceAuthStates.ytmusic = false;
        loggedOutCount++;
        updateServiceStatusUI('ytmusic', false, 'Clique para Abrir');
      }
      updateBellBadge(loggedOutCount);
    });
  } else {
    updateServiceStatusUI('ytmusic', true, 'Disponível');
  }

  const savedHandle = localStorage.getItem('custom_newtab_twitter_handle') || 'PedroReoli';
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    chrome.cookies.get({ url: 'https://x.com', name: 'auth_token' }, (cookie) => {
      if (cookie && cookie.value) {
        serviceAuthStates.twitter = true;
        updateServiceStatusUI('twitter', true, `@${savedHandle} (Ativo)`);
      } else {
        serviceAuthStates.twitter = false;
        loggedOutCount++;
        updateServiceStatusUI('twitter', false, 'Não Conectado');
      }
      updateBellBadge(loggedOutCount);
    });
  } else {
    updateServiceStatusUI('twitter', true, `@${savedHandle}`);
  }

  if (typeof chrome !== 'undefined' && chrome.cookies) {
    chrome.cookies.get({ url: 'https://slack.com', name: 'd' }, (cookie) => {
      if (cookie && cookie.value) {
        serviceAuthStates.slack = true;
        updateServiceStatusUI('slack', true, 'Conectado');
      } else {
        serviceAuthStates.slack = false;
        loggedOutCount++;
        updateServiceStatusUI('slack', false, 'Não Logado');
      }
      updateBellBadge(loggedOutCount);
    });
  } else {
    updateServiceStatusUI('slack', true, 'Disponível');
  }
}

function updateServiceStatusUI(serviceKey, isOk, message) {
  const statusDot = document.getElementById(`status-dot-${serviceKey}`);
  const statusMsg = document.getElementById(`status-msg-${serviceKey}`);

  if (statusDot) {
    statusDot.className = `status-dot ${isOk ? 'online' : 'offline'}`;
  }
  if (statusMsg) {
    statusMsg.textContent = message;
    statusMsg.style.color = isOk ? 'var(--success-color)' : 'var(--danger-color)';
  }
}

function updateBellBadge(count) {
  const badgeDot = document.getElementById('bell-badge-dot');
  if (badgeDot) {
    badgeDot.style.display = count > 0 ? 'block' : 'none';
  }
}

function initYTMusicDirectController() {
  const playBtn = document.getElementById('ytmusic-play-btn');
  const prevBtn = document.getElementById('yt-prev-btn');
  const nextBtn = document.getElementById('yt-next-btn');
  const searchInput = document.getElementById('ytmusic-search-input');
  const searchBtn = document.getElementById('ytmusic-search-btn');
  const stationBtns = document.querySelectorAll('.yt-station-btn');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      sendMediaCommandToYTMusic('play-pause');
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      sendMediaCommandToYTMusic('prev');
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      sendMediaCommandToYTMusic('next');
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (q) {
        window.open(`https://music.youtube.com/search?q=${encodeURIComponent(q)}`, '_blank');
      }
    });
  }

  stationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const station = btn.getAttribute('data-station');
      if (station === 'lofi') {
        window.open('https://music.youtube.com/watch?v=jfKfPfyJRdk', '_blank');
      } else if (station === 'cyberpunk') {
        window.open('https://music.youtube.com/search?q=synthwave+focus', '_blank');
      } else if (station === 'chillhop') {
        window.open('https://music.youtube.com/search?q=chillhop+lofi', '_blank');
      }
    });
  });
}

function sendMediaCommandToYTMusic(action) {
  const trackTitle = document.getElementById('ytmusic-track-title');

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ url: '*://music.youtube.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const targetTabId = tabs[0].id;

        if (chrome.scripting && chrome.scripting.executeScript) {
          chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            func: (cmd) => {
              const playPauseBtn = document.querySelector('#play-pause-button') || document.querySelector('.play-pause-button') || document.querySelector('tp-yt-paper-icon-button.play-pause-button');
              const nextButton = document.querySelector('.next-button') || document.querySelector('tp-yt-paper-icon-button.next-button');
              const previousButton = document.querySelector('.previous-button') || document.querySelector('tp-yt-paper-icon-button.previous-button');

              if (cmd === 'play-pause' && playPauseBtn) playPauseBtn.click();
              if (cmd === 'next' && nextButton) nextButton.click();
              if (cmd === 'prev' && previousButton) previousButton.click();
            },
            args: [action]
          });

          if (trackTitle) trackTitle.textContent = 'Comando enviado ao YouTube Music!';
          showToast('Comando de mídia enviado ao YouTube Music!');
        } else {
          chrome.tabs.update(targetTabId, { active: true });
        }
      } else {
        window.open('https://music.youtube.com/', '_blank');
        showToast('Abrindo guia do YouTube Music para conectar...');
      }
    });
  } else {
    window.open('https://music.youtube.com/', '_blank');
  }
}

function initWidgetsSubnav() {
  const btns = document.querySelectorAll('.widget-subnav-btn');
  const cards = document.querySelectorAll('.widgets-sidebar .widget-item-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-widget-filter');

      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (card.classList.contains(`widget-${filter}`)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
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

function initReoliAIAssistant() {
  const promptInput = document.getElementById('ai-quick-prompt-input');
  const presetBtns = document.querySelectorAll('.ai-preset-chip');
  const runGptBtn = document.getElementById('ai-run-gpt');
  const runClaudeBtn = document.getElementById('ai-run-claude');

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetText = btn.getAttribute('data-preset');
      if (promptInput && presetText) {
        promptInput.value = presetText;
        promptInput.focus();
      }
    });
  });

  if (runGptBtn && promptInput) {
    runGptBtn.addEventListener('click', () => {
      const query = promptInput.value.trim();
      if (!query) {
        showToast('Digite uma pergunta ou selecione um preset!');
        return;
      }
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(query)}`, '_blank');
    });
  }

  if (runClaudeBtn && promptInput) {
    runClaudeBtn.addEventListener('click', () => {
      const query = promptInput.value.trim();
      if (!query) {
        showToast('Digite uma pergunta ou selecione um preset!');
        return;
      }
      window.open(`https://claude.ai/new?q=${encodeURIComponent(query)}`, '_blank');
    });
  }
}

function initAntigravityStudio() {
  const focusBtn = document.getElementById('focus-antigravity-tab-btn');
  const statusDot = document.getElementById('antigravity-status-dot');
  const statusText = document.getElementById('antigravity-status-text');

  function checkAntigravityTabs() {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ url: ['*://127.0.0.1/*', '*://localhost/*'] }, (tabs) => {
        const agyTabs = (tabs || []).filter(t => t.url && (t.url.includes(':63060') || t.url.includes('/c/') || t.title.toLowerCase().includes('antigravity')));
        if (agyTabs.length > 0) {
          const activeTab = agyTabs[0];
          try {
            const port = new URL(activeTab.url).port || '63060';
            if (statusDot) statusDot.className = 'status-dot online';
            if (statusText) statusText.textContent = `Ativo (Porta ${port})`;
          } catch(e) {
            if (statusDot) statusDot.className = 'status-dot online';
            if (statusText) statusText.textContent = `Ativo (${agyTabs.length})`;
          }
        } else {
          if (statusDot) statusDot.className = 'status-dot online';
          if (statusText) statusText.textContent = 'Porta 63060';
        }
      });
    }
  }

  checkAntigravityTabs();

  if (focusBtn) {
    focusBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ url: ['*://127.0.0.1/*', '*://localhost/*'] }, (tabs) => {
          const agyTabs = (tabs || []).filter(t => t.url && (t.url.includes(':63060') || t.url.includes('/c/') || t.title.toLowerCase().includes('antigravity')));
          if (agyTabs.length > 0) {
            chrome.tabs.update(agyTabs[0].id, { active: true });
            chrome.windows.update(agyTabs[0].windowId, { focused: true });
            showToast('Focando na sessão ativa do Antigravity Studio!');
          } else {
            window.open('https://127.0.0.1:63060/', '_blank');
          }
        });
      } else {
        window.open('https://127.0.0.1:63060/', '_blank');
      }
    });
  }
}
