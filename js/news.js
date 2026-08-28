/**
 * News & Trending Hub Engine with High-Density Feed Loading, Precise Date Formatting & Read Metrics Tracker
 */

let currentNiche = 'tech';
let cachedNewsData = [];
let newsSearchQuery = '';
let isAutoTranslateEnabled = false;

function initNewsModule() {
  const newsSearchInput = document.getElementById('news-search-input');
  const addNicheBtn = document.getElementById('add-custom-niche-btn');
  const translateBtn = document.getElementById('news-translate-btn');

  initNichePills();

  if (translateBtn) {
    translateBtn.addEventListener('click', toggleAutoTranslate);
  }

  if (newsSearchInput) {
    newsSearchInput.addEventListener('input', (e) => {
      newsSearchQuery = e.target.value.trim().toLowerCase();
      renderNewsGrid(cachedNewsData);
    });
  }

  if (addNicheBtn) {
    addNicheBtn.addEventListener('click', createCustomNiche);
  }

  fetchNewsForNiche(currentNiche);
}

function formatNewsDate(dateStr) {
  if (!dateStr) return 'Hoje';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} • ${hours}:${mins}`;
  } catch(e) {
    return 'Hoje';
  }
}

function toggleAutoTranslate() {
  const translateBtn = document.getElementById('news-translate-btn');
  isAutoTranslateEnabled = !isAutoTranslateEnabled;

  if (translateBtn) {
    if (isAutoTranslateEnabled) {
      translateBtn.classList.add('active');
      translateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>
        <span>Traduzindo PT-BR</span>
      `;
      showToast('Traduzindo notícias para Português (PT-BR)...');
    } else {
      translateBtn.classList.remove('active');
      translateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>
        <span>Traduzir PT-BR</span>
      `;
      showToast('Exibindo notícias nos idiomas originais.');
    }
  }

  renderNewsGrid(cachedNewsData);
}

async function translateTextToPT(text) {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (e) {
    return text;
  }
}

function initNichePills() {
  const pills = document.querySelectorAll('.niche-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const niche = pill.getAttribute('data-niche');
      currentNiche = niche;
      fetchNewsForNiche(niche);
    });
  });
}

function createCustomNiche() {
  const topic = prompt('Digite o nome do novo nicho de notícias (ex: Automação n8n, Crypto, Python):');
  if (!topic || !topic.trim()) return;

  const nicheSlug = topic.trim().toLowerCase().replace(/\s+/g, '-');
  const bar = document.getElementById('niche-pills-bar');

  const newPill = document.createElement('button');
  newPill.className = 'niche-pill active';
  newPill.setAttribute('data-niche', nicheSlug);
  newPill.textContent = `🔍 ${topic.trim()}`;

  document.querySelectorAll('.niche-pill').forEach(p => p.classList.remove('active'));
  bar.insertBefore(newPill, document.getElementById('add-custom-niche-btn'));

  newPill.addEventListener('click', () => {
    document.querySelectorAll('.niche-pill').forEach(p => p.classList.remove('active'));
    newPill.classList.add('active');
    currentNiche = nicheSlug;
    fetchGoogleNewsRSS(topic.trim());
  });

  fetchGoogleNewsRSS(topic.trim());
}

async function fetchNewsForNiche(niche) {
  const gridEl = document.getElementById('news-grid');
  if (gridEl) {
    gridEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; grid-column:1/-1;">Carregando notícias em tempo real...</div>';
  }

  try {
    if (niche === 'dev') {
      await fetchDevToArticles();
    } else if (niche === 'hackernews') {
      await fetchHackerNews();
    } else if (niche === 'github') {
      await fetchGitHubTrending();
    } else if (niche === 'ai') {
      await fetchGoogleNewsRSS('Inteligencia Artificial OR ChatGPT OR Gemini OR Claude');
    } else {
      await fetchGoogleNewsRSS('Tecnologia OR Inovacao OR Startups OR Programacao');
    }
  } catch (err) {
    renderNewsGrid(getFallbackNews());
  }
}

async function fetchDevToArticles() {
  try {
    const res = await fetch('https://dev.to/api/articles?tag=tech&per_page=30');
    const data = await res.json();
    cachedNewsData = data.map(item => ({
      title: item.title,
      url: item.url,
      source: 'Dev.to',
      sourceIcon: 'https://dev.to/favicon.ico',
      snippet: item.description || item.readable_publish_date,
      time: formatNewsDate(item.published_at || item.created_at)
    }));
    renderNewsGrid(cachedNewsData);
  } catch (err) {
    renderNewsGrid(getFallbackNews());
  }
}

async function fetchHackerNews() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await res.json();
    const topIds = ids.slice(0, 25);

    const items = await Promise.all(
      topIds.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
    );

    cachedNewsData = items.filter(Boolean).map(item => ({
      title: item.title,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      source: 'Hacker News',
      sourceIcon: 'https://news.ycombinator.com/favicon.ico',
      snippet: `Pontos: ${item.score || 0} • Comentários: ${item.descendants || 0}`,
      time: formatNewsDate(item.time ? item.time * 1000 : null)
    }));
    renderNewsGrid(cachedNewsData);
  } catch (err) {
    renderNewsGrid(getFallbackNews());
  }
}

async function fetchGitHubTrending() {
  try {
    const res = await fetch('https://api.github.com/search/repositories?q=created:>2026-08-01&sort=stars&order=desc&per_page=25');
    const data = await res.json();
    cachedNewsData = (data.items || []).map(repo => ({
      title: `${repo.owner.login} / ${repo.name}`,
      url: repo.html_url,
      source: 'GitHub Trending',
      sourceIcon: 'https://github.githubassets.com/favicons/favicon.png',
      snippet: repo.description || 'Projeto Open Source em destaque no GitHub.',
      time: `⭐ ${repo.stargazers_count} stars`
    }));
    renderNewsGrid(cachedNewsData);
  } catch (err) {
    renderNewsGrid(getFallbackNews());
  }
}

async function fetchGoogleNewsRSS(query) {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=`);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      cachedNewsData = data.items.map(item => ({
        title: item.title,
        url: item.link,
        source: item.author || 'Google News',
        sourceIcon: 'https://news.google.com/favicon.ico',
        snippet: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 140) + '...' : '',
        time: formatNewsDate(item.pubDate)
      }));
      renderNewsGrid(cachedNewsData);
    } else {
      renderNewsGrid(getFallbackNews());
    }
  } catch (err) {
    renderNewsGrid(getFallbackNews());
  }
}

async function renderNewsGrid(newsList) {
  const gridEl = document.getElementById('news-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  const filtered = newsList.filter(item => {
    if (!newsSearchQuery) return true;
    return item.title.toLowerCase().includes(newsSearchQuery) || item.snippet.toLowerCase().includes(newsSearchQuery);
  });

  const totalMetricsEl = document.getElementById('metrics-news-total');
  if (totalMetricsEl) {
    totalMetricsEl.textContent = `${filtered.length} itens`;
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; grid-column:1/-1;">Nenhuma notícia encontrada com este filtro.</div>';
    return;
  }

  for (let index = 0; index < filtered.length; index++) {
    const item = filtered[index];
    let displayTitle = item.title;
    let displaySnippet = item.snippet;

    if (isAutoTranslateEnabled) {
      displayTitle = await translateTextToPT(item.title);
      displaySnippet = await translateTextToPT(item.snippet);
    }

    const card = document.createElement('a');
    card.className = 'news-card animate-entrance';
    card.style.setProperty('--index', index);
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    card.addEventListener('click', () => {
      let count = parseInt(localStorage.getItem('custom_read_news_count') || '0', 10);
      count++;
      localStorage.setItem('custom_read_news_count', count.toString());
      if (typeof updateLiveMetricsDisplay === 'function') {
        updateLiveMetricsDisplay();
      }
    });

    card.innerHTML = `
      <div>
        <div class="news-card-header">
          <div class="news-source-badge">
            <img class="news-source-icon" src="${item.sourceIcon}">
            <span>${item.source}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${isAutoTranslateEnabled ? `<span class="news-translated-badge">🌐 PT-BR</span>` : ''}
            <span class="news-time-text">${item.time}</span>
          </div>
        </div>
        <div class="news-title-text" style="margin-top:0.45rem;">${displayTitle}</div>
        <div class="news-snippet-text">${displaySnippet}</div>
      </div>

      <div class="news-card-footer">
        <span class="news-read-more">
          Ler Notícia 
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        </span>
      </div>
    `;

    const iconImg = card.querySelector('.news-source-icon');
    if (iconImg) {
      iconImg.addEventListener('error', () => {
        iconImg.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%233b82f6\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>';
      });
    }

    gridEl.appendChild(card);
  }
}

function getFallbackNews() {
  return [
    {
      title: 'Avanços em Inteligência Artificial e Modelos Autônomos de Código',
      url: 'https://news.google.com',
      source: 'Tech News',
      sourceIcon: 'https://news.google.com/favicon.ico',
      snippet: 'Desenvolvimentos recentes em agentes de código e grandes modelos de linguagem revolucionam o fluxo de trabalho de devs.',
      time: '27/08 • 19:22'
    },
    {
      title: 'Top Ferramentas de Produtividade para Desenvolvedores em 2026',
      url: 'https://dev.to',
      source: 'Dev.to',
      sourceIcon: 'https://dev.to/favicon.ico',
      snippet: 'Descubra extensões, utilitários CLI e automações que economizam horas no desenvolvimento diário.',
      time: '27/08 • 18:45'
    }
  ];
}
