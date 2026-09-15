// Mobile navigation toggle
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

// Forms: submit in the background and show the thank-you message inline.
// Works with Formspree (https://formspree.io) — see README for setup.
document.querySelectorAll('form[data-ajax]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    var status = form.querySelector('.form-status');
    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      e.preventDefault();
      status.textContent = 'This form is not connected yet. See README.md for setup.';
      return;
    }
    if (!window.fetch) return; // fall back to a normal submit
    e.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) {
        status.textContent = form.getAttribute('data-thanks');
        form.reset();
      } else {
        status.textContent = 'Something went wrong. Please try again.';
      }
    }).catch(function () {
      status.textContent = 'Something went wrong. Please try again.';
    }).finally(function () {
      button.disabled = false;
    });
  });
});
