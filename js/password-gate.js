(function () {
  function toHex(buf) {
    var bytes = new Uint8Array(buf);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.querySelector('[data-gate-key]');
    if (!box) return;

    var storageKey = 'gate-unlocked-' + box.getAttribute('data-gate-key');
    var expectedHash = box.getAttribute('data-gate-hash');
    var content = document.getElementById('gated-content');
    var form = document.getElementById('gate-form');
    var input = document.getElementById('gate-input');
    var error = document.getElementById('gate-error');

    function unlock() {
      box.hidden = true;
      content.hidden = false;
      try { localStorage.setItem(storageKey, '1'); } catch (e) {}
    }

    try {
      if (localStorage.getItem(storageKey) === '1') { unlock(); return; }
    } catch (e) {}

    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value)).then(function (buf) {
        if (toHex(buf) === expectedHash) {
          error.hidden = true;
          unlock();
        } else {
          error.hidden = false;
        }
      });
    });
  });
})();
