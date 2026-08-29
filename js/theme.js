(function () {
  var STORAGE_KEY = 'theme';

  function init() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    function apply(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }

    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    apply(current);

    toggle.addEventListener('click', function () {
      current = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
      apply(current);
    });
  }

  // .theme-toggle lives inside the header partial, injected async by partials.js — this can't
  // run at normal defer-time like before, it has to wait for that injection to land.
  document.addEventListener('partialsloaded', init);
})();
