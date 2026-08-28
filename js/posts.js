function currentLang() {
  try {
    var stored = localStorage.getItem('lang');
    if (stored) return stored;
  } catch (e) {}
  return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'no';
}

function i18nText(dict, key, fallback) {
  var entry = dict && dict[key];
  var lang = currentLang();
  return (entry && entry[lang]) || fallback;
}

function postCardHTML(post) {
  const badges = post.categories.map(c =>
    `<a class="badge" href="/alle-innlegg/?kategori=${c.slug}">${c.name}</a>`
  ).join('');
  return `
    <article class="post-card">
      <a href="/${post.slug}/"><img src="${post.image}" alt="${post.title}"></a>
      <div class="post-card-body">
        <div class="post-badges">${badges}</div>
        <h4 class="post-title"><a href="/${post.slug}/">${post.title}</a></h4>
        <p class="post-description">${post.excerpt}</p>
      </div>
    </article>`;
}

function filterGroupHTML(items, activeSlug, allLabel) {
  const allBtn = `<button type="button" data-kategori="" class="filter-btn${activeSlug ? '' : ' is-active'}">${allLabel}</button>`;
  const btns = items
    .map(([slug, name]) => `<button type="button" data-kategori="${slug}" class="filter-btn${slug === activeSlug ? ' is-active' : ''}">${name}</button>`)
    .join('');
  return allBtn + btns;
}

document.addEventListener('DOMContentLoaded', async () => {
  const dictEl = document.getElementById('i18n-dict');
  let dict = null;
  try { dict = dictEl ? JSON.parse(dictEl.textContent) : null; } catch (e) {}

  const grid = document.querySelector('[data-posts-grid]');
  if (!grid) return;

  const response = await fetch('/data/posts.json');
  const posts = await response.json();

  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;
  const PAGE_SIZE = 12;
  const filterBox = document.querySelector('[data-posts-filters]');
  const loadMoreBox = document.querySelector('[data-load-more]');

  const params = new URLSearchParams(location.search);
  let activeKategori = params.get('kategori') || '';
  let visibleCount = PAGE_SIZE;

  const categoryOptions = [...new Map(posts.flatMap(p => p.categories.map(c => [c.slug, c.name]))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'no'));

  function render() {
    const filtered = posts.filter(p => !activeKategori || p.categories.some(c => c.slug === activeKategori));
    const shown = limit ? filtered.slice(0, limit) : filtered.slice(0, visibleCount);
    const emptyMsg = i18nText(dict, 'empty-state', 'Ingen innlegg i denne kategorien ennå.');
    grid.innerHTML = shown.map(postCardHTML).join('') || `<p>${emptyMsg}</p>`;

    if (loadMoreBox) {
      loadMoreBox.innerHTML = filtered.length > shown.length
        ? `<button type="button" class="btn" data-load-more-btn>${i18nText(dict, 'load-more-btn', 'Vis flere')}</button>`
        : '';
    }

    if (filterBox) {
      const allLabel = i18nText(dict, 'filter-all', 'Alle');
      filterBox.innerHTML = filterGroupHTML(categoryOptions, activeKategori, allLabel);
    }
  }

  function updateUrl() {
    const url = new URL(location.href);
    if (activeKategori) url.searchParams.set('kategori', activeKategori); else url.searchParams.delete('kategori');
    history.pushState({}, '', url);
  }

  render();

  if (filterBox) {
    filterBox.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-kategori]');
      if (!btn) return;
      activeKategori = btn.dataset.kategori;
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }
  if (loadMoreBox) {
    loadMoreBox.addEventListener('click', (event) => {
      if (!event.target.closest('[data-load-more-btn]')) return;
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  document.addEventListener('langchange', render);
});
