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

function formatPostDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const lang = currentLang();
  return new Intl.DateTimeFormat(lang === 'no' ? 'nb-NO' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(d);
}

function postCardHTML(post) {
  const catBadges = post.categories.map(c =>
    `<a class="badge" href="/alle-innlegg/?kategori=${c.slug}">${c.name}</a>`
  );
  const subBadges = (post.subcategories || []).map(s =>
    `<a class="badge" href="/alle-innlegg/?under=${s.slug}">${s.name}</a>`
  );
  const badges = catBadges.concat(subBadges).join('');
  return `
    <article class="post-card">
      <a href="/${post.slug}/"><img src="${post.image}" alt="${post.title}"></a>
      <div class="post-card-body">
        <div class="post-badges">${badges}</div>
        <h4 class="post-title"><a href="/${post.slug}/">${post.title}</a></h4>
        <p class="post-date">${formatPostDate(post.date)}</p>
        <p class="post-description">${post.excerpt}</p>
      </div>
    </article>`;
}

function filterGroupHTML(items, activeSlug, allLabel, paramName) {
  const allBtn = `<button type="button" data-${paramName}="" class="filter-btn${activeSlug ? '' : ' is-active'}">${allLabel}</button>`;
  const btns = items
    .map(([slug, name]) => `<button type="button" data-${paramName}="${slug}" class="filter-btn${slug === activeSlug ? ' is-active' : ''}">${name}</button>`)
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
  const allPosts = await response.json();
  // "Ikke oppført" posts (listed: false) are real, deployed pages — reachable by direct link —
  // just never surfaced in any grid/filter here. See CLAUDE.md, "Ikke oppført".
  const posts = allPosts.filter(p => p.listed !== false);

  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;
  const PAGE_SIZE = 12;
  const filterBox = document.querySelector('[data-posts-filters]');
  const subfilterBox = document.querySelector('[data-posts-subfilters]');
  const subfilterWrap = document.querySelector('[data-posts-subfilter-box]');
  const subfilterLabel = document.querySelector('[data-posts-sublabel]');
  const loadMoreBox = document.querySelector('[data-load-more]');
  const searchInput = document.querySelector('[data-posts-search]');

  const params = new URLSearchParams(location.search);
  let activeKategori = params.get('kategori') || '';
  let activeUnder = params.get('under') || '';
  let activeSearch = params.get('s') || '';
  let visibleCount = PAGE_SIZE;

  if (searchInput) searchInput.value = activeSearch;

  const categoryOptions = [...new Map(posts.flatMap(p => p.categories.map(c => [c.slug, c.name]))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'no'));

  // Which underkategori values make sense depends on which hovedkategori is selected (Fag under
  // Undervisningsaktiviteter, Format under Andre ressurser, etc.) — see CLAUDE.md, "Kategorier".
  function subcategoryOptionsFor(kategoriSlug) {
    if (!kategoriSlug) return [];
    const relevant = posts.filter(p => p.categories.some(c => c.slug === kategoriSlug));
    return [...new Map(relevant.flatMap(p => (p.subcategories || []).map(s => [s.slug, s.name]))).entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'no'));
  }

  function render() {
    const q = activeSearch.trim().toLowerCase();
    const filtered = posts.filter(p =>
      (!activeKategori || p.categories.some(c => c.slug === activeKategori)) &&
      (!activeUnder || (p.subcategories || []).some(s => s.slug === activeUnder)) &&
      (!q || p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q))
    );
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
      filterBox.innerHTML = filterGroupHTML(categoryOptions, activeKategori, allLabel, 'kategori');
    }

    if (subfilterBox && subfilterWrap) {
      const subOptions = subcategoryOptionsFor(activeKategori);
      const hasSub = activeKategori && subOptions.length > 0;
      subfilterWrap.hidden = !hasSub;
      if (subfilterLabel) subfilterLabel.hidden = !hasSub;
      if (hasSub) {
        const allLabel = i18nText(dict, 'filter-all', 'Alle');
        subfilterBox.innerHTML = filterGroupHTML(subOptions, activeUnder, allLabel, 'under');
      } else {
        subfilterBox.innerHTML = '';
      }
    }
  }

  function updateUrl() {
    const url = new URL(location.href);
    if (activeKategori) url.searchParams.set('kategori', activeKategori); else url.searchParams.delete('kategori');
    if (activeUnder) url.searchParams.set('under', activeUnder); else url.searchParams.delete('under');
    if (activeSearch) url.searchParams.set('s', activeSearch); else url.searchParams.delete('s');
    history.pushState({}, '', url);
  }

  render();

  if (filterBox) {
    filterBox.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-kategori]');
      if (!btn) return;
      activeKategori = btn.dataset.kategori;
      activeUnder = ''; // underkategori options depend on kategori — a stale value can't stay selected
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }
  if (subfilterBox) {
    subfilterBox.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-under]');
      if (!btn) return;
      activeUnder = btn.dataset.under;
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
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeSearch = searchInput.value;
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }

  document.addEventListener('langchange', render);
});
