// Direct email links: the address is stored as "user|domain" in a data
// attribute and only assembled here, so it never appears as a plain
// "name@domain" string in the HTML for scrapers to harvest.
document.querySelectorAll('a[data-email]').forEach(function (a) {
  var parts = a.getAttribute('data-email').split('|');
  var address = parts[0] + String.fromCharCode(64) + parts[1];
  a.href = 'mailto:' + address;
  a.removeAttribute('data-email');
});

// Mobile navigation toggle
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

// Forms: submit in the background and show the thank-you message inline.
// Each form posts to a Google Apps Script web app that appends a row to a
// Google Sheet — see README.md, "Connect the forms to Google Sheets".
document.querySelectorAll('form[data-ajax]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    var status = form.querySelector('.form-status');
    if (form.action.indexOf('YOUR_') !== -1 || form.action.indexOf('script.google.com') === -1) {
      e.preventDefault();
      status.textContent = 'This form is not connected yet. See README.md for setup.';
      return;
    }
    if (!window.fetch) return; // fall back to a normal submit
    e.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Sending…';
    // No custom headers: Apps Script only allows "simple" cross-origin requests.
    fetch(form.action, { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.result === 'ok') {
          status.textContent = form.getAttribute('data-thanks');
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Please try again.';
        }
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
      })
      .finally(function () { button.disabled = false; });
  });
});
