(function () {
  var headerEl = document.getElementById('site-header');
  var footerEl = document.getElementById('site-footer');
  if (!headerEl && !footerEl) return;

  function fetchPartial(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
      return r.text();
    });
  }

  Promise.all([
    // .part, not .html — VS Code Live Server injects its reload <script> into every response it
    // thinks is a full HTML document, including these fetched fragments, and its injector
    // corrupts markup that contains multiple <svg> elements (see CLAUDE.md, "Live Server — kjente
    // fallgruver"). A non-.html extension isn't recognized as text/html, so it's skipped.
    headerEl ? fetchPartial('/partials/header.part') : Promise.resolve(''),
    footerEl ? fetchPartial('/partials/footer.part') : Promise.resolve('')
  ]).then(function (parts) {
    if (headerEl) headerEl.outerHTML = parts[0];
    if (footerEl) footerEl.outerHTML = parts[1];
    document.dispatchEvent(new CustomEvent('partialsloaded'));
  }).catch(function (err) {
    // Fails silently otherwise — nav/theme-toggle/lang-switch just never appear, with no clue
    // why. If this fires, check the actual fetch response first (network tab), not the dev
    // server's root — see umbrella CLAUDE.md, "Live Server — kjente fallgruver" for the one
    // real cause found here so far (Live Server's own HTML injection corrupting the partial).
    console.error('partials.js: failed to load header/footer —', err.message);
  });
})();
