(function () {
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ';
  var COPIED_TEXT = { no: 'Kopiert!', en: 'Copied!' };

  // The language of the block the button sits in (the "Copy" buttons live inside
  // data-lang-block="en"), else the page's current language as set by i18n.js.
  function langFor(btn) {
    var block = btn.closest('[data-lang-block]');
    var lang = block ? block.getAttribute('data-lang-block') : document.documentElement.getAttribute('lang');
    return (lang || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'no';
  }
  var RESET_DELAY = 1500;

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.copy-btn');
    if (!btn) return;

    var block = btn.closest('.copy-block');
    var content = block && block.querySelector('.copy-block-content');
    if (!content) return;

    navigator.clipboard.writeText(content.textContent.trim()).then(function () {
      var original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = CHECK_ICON + COPIED_TEXT[langFor(btn)];
      setTimeout(function () {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, RESET_DELAY);
    });
  });
})();
