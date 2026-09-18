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
    // Apps Script replies via a redirect the browser won't let us read
    // cross-origin, so send in no-cors mode and treat a completed request
    // as success. (The script itself still logs any failures.)
    fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
      .then(function () {
        status.textContent = form.getAttribute('data-thanks');
        form.reset();
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
      })
      .finally(function () { button.disabled = false; });
  });
});
