/* ============================================================
   chat.js — "Preguntale a mi CV"
   Asistente IA conectado a Cloudflare Workers AI (Llama 3.1-8B).
   ============================================================ */
(function () {
  'use strict';

  // URL del Worker de Cloudflare. Cambiá esto después de hacer wrangler deploy.
  // Ejemplo: 'https://cv-damian-assistant.TU-USUARIO.workers.dev'
  const WORKER_URL = 'https://cv-damian-assistant.damelm.workers.dev';

  const UI = {
    es: {
      open: 'Asistente Zeeben Labs', title: 'Asistente Zeeben Labs', sub: 'IA · Llama 3.1 · Cloudflare',
      placeholder: 'Contanos qué necesita tu empresa…',
      greeting: '¡Hola! Soy el asistente de Zeeben Labs. Contame qué necesita tu empresa y te digo cómo podemos resolverlo — o escribinos directo por WhatsApp.',
      chips: ['¿Qué hacen?', 'Automatizar WhatsApp', 'Quiero una app a medida', '¿Cómo los contacto?'],
      thinking: 'Pensando…',
      error: 'Error al conectar. Escribinos por WhatsApp: +595 992 879 800 · fx.damianpea@gmail.com',
    },
    en: {
      open: 'Ask Zeeben Labs', title: 'Zeeben Labs assistant', sub: 'AI · Llama 3.1 · Cloudflare',
      placeholder: 'Tell us what your company needs…',
      greeting: "Hi! I'm the Zeeben Labs assistant. Tell me what your company needs and I'll tell you how we can solve it — or reach us directly on WhatsApp.",
      chips: ['What do you do?', 'Automate WhatsApp', 'I need a custom app', 'How to reach you?'],
      thinking: 'Thinking…',
      error: 'Connection error. Reach us on WhatsApp: +595 992 879 800 · fx.damianpea@gmail.com',
    }
  };

  const getLang = () => { try { return localStorage.getItem('cv_lang') || 'es'; } catch { return 'es'; } };

  /* ---------------- API call ---------------- */
  const convo = []; // memoria de la conversación: {role:'user'|'assistant', content}
  async function askWorker(question, history) {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history: history || [] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.answer || UI[getLang()].error;
  }

  /* ---------------- UI helpers ---------------- */
  let panel, msgsEl, inputEl, sendEl, greeted = false;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function addMsg(text, who) {
    const m = el('div', 'msg msg--' + who);
    m.textContent = text;
    msgsEl.appendChild(m);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return m;
  }

  function typing(on) {
    const existing = msgsEl.querySelector('#chatTyping');
    if (on && !existing) {
      const t = el('div', 'msg msg--bot');
      t.id = 'chatTyping';
      t.innerHTML = '<span class="chat-typing"><span></span><span></span><span></span></span>';
      msgsEl.appendChild(t);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } else if (!on && existing) {
      existing.remove();
    }
  }

  /* ---------------- Build UI ---------------- */
  function build() {
    const lang = getLang();
    const u = UI[lang];

    const fab = el('button', 'chat-fab');
    fab.id = 'chatFab';
    fab.innerHTML = `<iconify-icon icon="lucide:sparkles" aria-hidden="true"></iconify-icon><span class="chat-fab__label">${u.open}</span>`;
    fab.setAttribute('aria-label', u.open);

    panel = el('section', 'chat-panel');
    panel.id = 'chatPanel';
    panel.hidden = true;
    panel.setAttribute('aria-label', u.title);
    panel.innerHTML = `
      <div class="chat-head">
        <span class="chat-head__dot"></span>
        <span class="chat-head__txt">
          <span class="chat-head__t">${u.title}</span>
          <span class="chat-head__s">${u.sub}</span>
        </span>
        <button class="chat-close" id="chatClose" aria-label="Cerrar">×</button>
      </div>
      <div class="chat-msgs" id="chatMsgs"></div>
      <div class="chat-chips" id="chatChips">${u.chips.map(q => `<button class="chat-chip">${q}</button>`).join('')}</div>
      <form class="chat-input" id="chatForm">
        <input type="text" id="chatInput" placeholder="${u.placeholder}" autocomplete="off" aria-label="${u.placeholder}">
        <button class="chat-send" id="chatSend" type="submit" aria-label="Enviar">→</button>
      </form>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('#chatMsgs');
    inputEl = panel.querySelector('#chatInput');
    sendEl  = panel.querySelector('#chatSend');

    fab.addEventListener('click', () => setOpen(panel.hidden));
    panel.querySelector('#chatClose').addEventListener('click', () => setOpen(false));
    panel.querySelector('#chatForm').addEventListener('submit', e => { e.preventDefault(); send(inputEl.value); });
    panel.querySelector('#chatChips').addEventListener('click', e => {
      if (e.target.classList.contains('chat-chip')) send(e.target.textContent);
    });
  }

  function setOpen(open) {
    panel.hidden = !open;
    if (open) {
      inputEl.focus();
      if (!greeted) {
        greeted = true;
        addMsg(UI[getLang()].greeting, 'bot');
      }
    }
  }

  /* ---------------- Send ---------------- */
  let busy = false;
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    sendEl.disabled = true;
    inputEl.value = '';
    const history = convo.slice(-8); // turnos previos (sin el actual)
    addMsg(text, 'user');
    convo.push({ role: 'user', content: text });
    typing(true);

    let reply;
    try {
      reply = await askWorker(text, history);
    } catch (e) {
      console.error('[chat]', e);
      reply = UI[getLang()].error;
    }

    typing(false);
    addMsg(reply, 'bot');
    convo.push({ role: 'assistant', content: reply });
    busy = false;
    sendEl.disabled = false;
    inputEl.focus();
  }

  /* ---------------- Init ---------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
