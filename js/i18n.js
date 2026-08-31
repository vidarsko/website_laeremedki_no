(function () {
  var STORAGE_KEY = 'lang';
  var SUPPORTED = ['no', 'en'];
  var DEFAULT_LANG = 'no'; // Norwegian-curriculum blog first, unlike skogvoll.com's 'en' default.

  function detectLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browserLangs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < browserLangs.length; i++) {
      var code = (browserLangs[i] || '').toLowerCase();
      if (code.indexOf('no') === 0 || code.indexOf('nb') === 0 || code.indexOf('nn') === 0) return 'no';
      if (code.indexOf('en') === 0) return 'en';
    }
    return DEFAULT_LANG;
  }

  function loadDict() {
    var el = document.getElementById('i18n-dict');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function apply(lang, dict) {
    document.documentElement.setAttribute('lang', lang === 'no' ? 'nb' : lang);

    if (dict) {
      var nodes = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < nodes.length; i++) {
        var entry = dict[nodes[i].getAttribute('data-i18n')];
        if (entry && entry[lang] != null) nodes[i].textContent = entry[lang];
      }

      var attrNodes = document.querySelectorAll('[data-i18n-attr]');
      for (var j = 0; j < attrNodes.length; j++) {
        var node = attrNodes[j];
        var pairs = node.getAttribute('data-i18n-attr').split(',');
        for (var k = 0; k < pairs.length; k++) {
          var parts = pairs[k].split(':');
          var attrEntry = dict[parts[1]];
          if (attrEntry && attrEntry[lang] != null) node.setAttribute(parts[0], attrEntry[lang]);
        }
      }
    }

    // Full-article dual-language blocks: both <no> and <en> versions of a post body live in the
    // same document at once (see AGENTS.md, "Oversettelse"), toggled by visibility rather than
    // the textContent-swap dict above (which can't carry rich HTML — paragraphs, lists, images).
    // Deliberately a separate attribute from the .lang-btn buttons' own [data-lang] — both used
    // "data-lang" originally, so this selector also matched the buttons themselves and force-hid
    // whichever one didn't match the current language (found 2026-08-29). Inline style (not a CSS
    // class) so this works regardless of the CSS default — see css/style.css, which shows
    // [data-lang-block="en"] by default so there's no flash-of-blank-content before this deferred
    // script runs. Must be an explicit 'block', not '' — clearing the inline style just falls back
    // to that same stylesheet rule, which still says display:none for the en block even once it's
    // the active language, so the switch silently showed nothing at all (found 2026-08-30).
    var langBlocks = document.querySelectorAll('[data-lang-block]');
    for (var b = 0; b < langBlocks.length; b++) {
      langBlocks[b].style.display = langBlocks[b].getAttribute('data-lang-block') === lang ? 'block' : 'none';
    }

    var buttons = document.querySelectorAll('.lang-btn');
    for (var c = 0; c < buttons.length; c++) {
      var isActive = buttons[c].getAttribute('data-lang') === lang;
      buttons[c].classList.toggle('active', isActive);
      buttons[c].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  var dict = loadDict();
  var current = detectLang();
  apply(current, dict); // first pass: body content, present at normal defer-time

  // .lang-switch and the header/footer's own [data-i18n] nodes live in the header/footer
  // partials, injected async by partials.js — bind the switch and re-apply once they exist,
  // reusing the same `current`/`dict` closure so language state carries over cleanly.
  document.addEventListener('partialsloaded', function () {
    apply(current, dict);

    var switchEl = document.querySelector('.lang-switch');
    if (switchEl) {
      switchEl.addEventListener('click', function (event) {
        var btn = event.target.closest('.lang-btn');
        if (!btn) return;
        var lang = btn.getAttribute('data-lang');
        if (!lang || lang === current) return;
        current = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        apply(current, dict);
      });
    }
  });
})();
