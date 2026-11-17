/**
 * Contact form handler (Cloudflare Pages Function), POST /api/contact
 *
 * Environment variables (Cloudflare Pages > Settings > Variables and Secrets):
 *   RESEND_API_KEY   secret, Resend API key
 *   TO_EMAIL         where inquiries go (mariposamentalwellness@gmail.com)
 *   FROM_EMAIL       verified Resend sender, e.g. website@notify.mariposamentalwellness.com
 *   HEALTH_TOKEN     secret, lets a health check run without emailing the practice
 *   HEALTH_TO        where health checks go
 */

const PRACTICE = {
  name: 'Mariposa Mental Wellness',
  replyTo: 'mariposamentalwellness@gmail.com',
  phone: '(602) 805-7017',
  tel: '+16028057017',
  site: 'mariposamentalwellness.com',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

const shell = (inner, foot) => `<!doctype html><html><body style="margin:0;padding:0;background:#FAF6F1">
<div style="margin:0;padding:32px 16px;background:#FAF6F1;font-family:Helvetica,Arial,sans-serif;color:#2C2416">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto">
    <tr><td style="padding:0 0 18px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6B5E45">Mariposa Mental Wellness</td></tr>
    <tr><td style="background:#FFFFFF;border-top:3px solid #7C6A0A;padding:32px 32px 28px">${inner}</td></tr>
    <tr><td style="padding:18px 8px 0;font-size:13px;line-height:1.5;color:#6B5E45">${foot}</td></tr>
  </table>
</div></body></html>`;

function notifyHtml(d) {
  const row = (label, value, last) => `<tr><td style="padding:10px 0;border-top:1px solid #EAE3D8;${last ? 'border-bottom:1px solid #EAE3D8;' : ''}width:38%;color:#6B5E45">${label}</td><td style="padding:10px 0;border-top:1px solid #EAE3D8;${last ? 'border-bottom:1px solid #EAE3D8;' : ''}">${value}</td></tr>`;
  const inner = `
      <h1 style="margin:0 0 6px;font:400 28px/1.15 Georgia,'Times New Roman',serif;color:#2C2416">New inquiry from ${esc(d.name)}</h1>
      <p style="margin:0 0 26px;font-size:15px;color:#6B5E45">Sent from the contact form on ${PRACTICE.site}, ${esc(d.when)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:16px;line-height:1.45">
        ${row('What brings them here', esc(d.service) || 'Not given')}
        ${row('Session preference', esc(d.session) || 'No preference')}
        ${row('Email', `<a href="mailto:${esc(d.email)}" style="color:#7C6A0A">${esc(d.email)}</a>`)}
        ${row('Phone', d.phone ? `<a href="tel:${esc(d.phone)}" style="color:#7C6A0A">${esc(d.phone)}</a>` : 'Not given', true)}
      </table>
      <p style="margin:24px 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6B5E45">Message</p>
      <p style="margin:0;font-size:16px;line-height:1.5;white-space:pre-line">${esc(d.message) || '(No message)'}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px"><tr><td style="background:#7C6A0A;border-radius:2px"><a href="mailto:${esc(d.email)}?subject=Re:%20Your%20message%20to%20Mariposa%20Mental%20Wellness" style="display:inline-block;padding:13px 20px;color:#FFFFFF;font-weight:600;font-size:15px;text-decoration:none">Reply to ${esc(d.first)}</a></td></tr></table>`;
  return shell(inner, 'This message came through the website contact form. Hitting reply goes straight back to the person who wrote in.');
}

function autoReplyHtml(d) {
  const inner = `
      <h1 style="margin:0 0 18px;font:400 28px/1.15 Georgia,'Times New Roman',serif;color:#2C2416">Thanks for reaching out, ${esc(d.first)}.</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5">I got your message and will get back to you within one business day. If it&rsquo;s easier to talk, you can also call or text me at <a href="tel:${PRACTICE.tel}" style="color:#7C6A0A">${PRACTICE.phone}</a>.</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5">The first step is a free 15-minute consultation, a chance to talk about what&rsquo;s going on and whether working together feels like a good fit. No pressure either way.</p>
      <p style="margin:0;font-size:16px;line-height:1.5">Warmly,<br>Kayla</p>
      <p style="margin:22px 0 0;font-size:14px;line-height:1.5;color:#6B5E45">Kayla Martinez, MS, LPC<br>${PRACTICE.name}<br>Mesa, Arizona</p>`;
  return shell(inner, 'If this is an emergency, call 911. If you&rsquo;re in crisis, call or text 988. Please don&rsquo;t send private health details by email.');
}

async function send(env, msg) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
  return res.json().catch(() => ({}));
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const ct = request.headers.get('content-type') || '';
    data = ct.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Could not read that submission.' }, 400);
  }

  if (data['bot-field']) return json({ ok: true }); // honeypot

  const first = String(data.first_name || '').trim().slice(0, 80);
  const last = String(data.last_name || '').trim().slice(0, 80);
  const d = {
    first,
    name: [first, last].filter(Boolean).join(' '),
    email: String(data.email || '').trim().slice(0, 200),
    phone: String(data.phone || '').trim().slice(0, 60),
    service: String(data.service || '').slice(0, 120),
    session: String(data.session_type || '').slice(0, 120),
    message: String(data.message || '').trim().slice(0, 5000),
    when: new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix', dateStyle: 'full', timeStyle: 'short' }) + ' Arizona time',
  };

  if (!d.first || !validEmail(d.email)) {
    return json({ ok: false, error: 'Please add your name and a valid email.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const health = env.HEALTH_TOKEN && request.headers.get('x-health-token') === env.HEALTH_TOKEN;
  if (request.headers.get('x-health-token') && !health) return json({ ok: false, error: 'bad_token' }, 403);

  const fromAddr = env.FROM_EMAIL.replace(/^.*</, '').replace(/>$/, '');
  const to = health ? (env.HEALTH_TO || env.TO_EMAIL) : env.TO_EMAIL;
  const tag = health ? '[Health check] ' : '';

  try {
    await send(env, {
      from: `${PRACTICE.name} <${fromAddr}>`, to: [to], reply_to: d.email,
      subject: `${tag}New inquiry from ${d.name} via ${PRACTICE.site}`,
      html: notifyHtml(d),
      text: `New inquiry from ${d.name}\n\nWhat brings them here: ${d.service || 'Not given'}\nSession preference: ${d.session || 'No preference'}\nEmail: ${d.email}\nPhone: ${d.phone || 'Not given'}\n\n${d.message || '(No message)'}\n\nSent ${d.when}`,
    });
  } catch (err) {
    console.error('notify failed', err.message);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  // Auto-reply to the visitor. A failure here never blocks the inquiry.
  try {
    await send(env, {
      from: `Kayla Martinez, ${PRACTICE.name} <${fromAddr}>`,
      to: [health ? to : d.email], reply_to: PRACTICE.replyTo,
      subject: `${tag}Thanks for reaching out, ${d.first}`,
      html: autoReplyHtml(d),
      text: `Thanks for reaching out, ${d.first}.\n\nI got your message and will get back to you within one business day. If it's easier to talk, call or text me at ${PRACTICE.phone}.\n\nWarmly,\nKayla\n\nKayla Martinez, MS, LPC\n${PRACTICE.name}\nMesa, Arizona`,
    });
  } catch (err) {
    console.error('auto-reply failed', err.message);
  }

  return json({ ok: true, health: !!health });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed.' }, 405);
