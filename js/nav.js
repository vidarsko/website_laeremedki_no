(function () {
  function init() {
    var toggle = document.querySelector('.nav-toggle');
    var target = document.querySelector('.site-header');
    if (!toggle || !target) return;

    toggle.addEventListener('click', function () {
      var isOpen = target.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    target.addEventListener('click', function (event) {
      if (target.classList.contains('menu-open') && event.target.closest('.site-nav a')) {
        target.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // .nav-toggle and .header-right live in the header partial, injected async by
  // partials.js — same partialsloaded pattern as theme.js/i18n.js.
  document.addEventListener('partialsloaded', init);
})();
