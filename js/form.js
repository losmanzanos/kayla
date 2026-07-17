/* Mariposa Mental Wellness — Contact form handler (EmailJS)
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
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',   // <-- replace
    serviceId:  'YOUR_EMAILJS_SERVICE_ID',   // <-- replace
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID'   // <-- replace
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
    if (honey && honey.value) { setStatus('success', "Thank you — your message is on its way."); form.reset(); return; }

    // Native validation
    if (!form.checkValidity()) { form.reportValidity(); return; }

    // Not configured yet — guard so nothing breaks in preview.
    if (EMAILJS_CONFIG.serviceId.indexOf('YOUR_') === 0) {
      setStatus('error', "The contact form isn't connected to EmailJS yet. Add your EmailJS keys in <code>js/form.js</code> to go live. (Everything else works.)");
      return;
    }

    if (!initEmailJS()) {
      setStatus('error', "Something went wrong loading the mailer. Please call or text (480) 605-0846.");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending&hellip;'; }
    setStatus('', '');

    window.emailjs.sendForm(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, form)
      .then(function () {
        form.reset();
        setStatus('success', "Thank you for reaching out. Your message has been sent &mdash; Kayla will get back to you within one business day. 🦋");
      })
      .catch(function (err) {
        console.error('EmailJS error:', err);
        setStatus('error', "Sorry &mdash; that didn't send. Please try again, or call/text (480) 605-0846.");
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; }
      });
  });
})();
