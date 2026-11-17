// Phone number shown in error messages comes from the footer (kept current by Site Info)
function sitePhone() {
  var a = document.querySelector('footer a[href^="tel:+"]');
  return a ? a.textContent.trim() : 'the number below';
}
/* Mariposa Mental Wellness, contact form handler.
   Primary: /api/contact (Cloudflare Pages Function + Resend, see functions/api/contact.js).
   Backup: EmailJS below, used only if the primary path is down.
   ------------------------------------------------------------------
   SETUP (one-time, in the EmailJS dashboard at https://dashboard.emailjs.com):
     1. Create an Email Service (e.g. connect Kayla's inbox) → copy its SERVICE ID.
     2. Create an Email Template, paste in /emailjs-template.html → copy its TEMPLATE ID.
     3. Account → General → copy your PUBLIC KEY.
     4. Fill the three values in EMAILJS_CONFIG below.
   The template variables must match the form field `name` attributes:
     first_name, last_name, email, phone, service, session_type, message
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var EMAILJS_CONFIG = {
    publicKey:  '9lP4IikwloqJ7CJlp',        // EmailJS account (hellomariposamw)
    serviceId:  'service_mariposa',          // Gmail service
    templateId: 'template_consult'           // "Mariposa consultation request"
  };

  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('contact-submit');
  var submitLabel = submitBtn ? submitBtn.innerHTML : 'Send';

  function setStatus(type, msg) {
    if (!statusEl) return;
    statusEl.className = 'form-status ' + type;
    statusEl.innerHTML = msg;
  }

  // Lazy-init the SDK once it's available
  function initEmailJS() {
    if (window.emailjs && EMAILJS_CONFIG.publicKey.indexOf('YOUR_') !== 0) {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
      return true;
    }
    return false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot: if filled, silently pretend success (it's a bot).
    var honey = form.querySelector('[name="bot-field"]');
    if (honey && honey.value) { setStatus('success', "Thank you, your message is on its way."); form.reset(); return; }

    // Native validation
    if (!form.checkValidity()) { form.reportValidity(); return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending&hellip;'; }
    setStatus('', '');

    function ok() {
      form.reset();
      setStatus('success', "Thank you for reaching out. Your message has been sent, and Kayla will get back to you within one business day.");
    }
    function fail() {
      setStatus('error', "Sorry, that didn't send. Please try again, or call or text " + sitePhone() + ".");
    }
    function reenable() { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; } }
    // Backup path: EmailJS, used only if /api/contact is down.
    function viaEmailJS() {
      if (!initEmailJS()) return Promise.reject(new Error('emailjs unavailable'));
      return window.emailjs.sendForm(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, form);
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    // Primary path: Cloudflare Pages Function + Resend
    fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); },
            function () { return { status: 0, body: {} }; })
      .then(function (res) {
        if (res.status === 200 && res.body.ok) { ok(); return; }
        if (res.status === 400) { setStatus('error', res.body.error || 'Please check the form and try again.'); return; }
        return viaEmailJS().then(ok, function (err) { console.error('Form send failed:', err); fail(); });
      })
      .then(reenable, reenable);
  });
})();
