/* ============================================================
   chat.js — Asistente de preventa de Zeeben Labs
   Conectado al Worker de Cloudflare (Workers AI).
   ============================================================ */
(function () {
  'use strict';

  const WORKER_URL = 'https://cv-damian-assistant.damelm.workers.dev';

  const U = {
    open: 'Asistente Zeeben',
    title: 'Asistente Zeeben Labs',
    sub: 'IA · Cloudflare',
    placeholder: 'Contanos qué necesita tu empresa…',
    greeting: '¡Hola! Soy el asistente de Zeeben Labs. Contame qué tarea te come horas y te digo cómo la automatizamos — o escribinos directo por WhatsApp.',
    chips: ['¿Qué hacen?', 'Automatizar WhatsApp', 'Quiero una app a medida', '¿Cómo los contacto?'],
    error: 'No pude conectar. Escribinos por WhatsApp: +595 992 879 800 · fx.damianpea@gmail.com',
  };

  const ICON_SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 2 7.5 6.5 3 8l4.5 1.5L9 14l1.5-4.5L15 8l-4.5-1.5z"/><path d="M18 12l-.9 2.6-2.6.9 2.6.9.9 2.6.9-2.6 2.6-.9-2.6-.9z"/></svg>';
  const ICON_SEND  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const convo = [];
  async function askWorker(question, history) {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history: history || [] }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.answer || U.error;
  }

  let panel, msgsEl, inputEl, sendEl, fab, chatOpener = null, greeted = false;

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

  function build() {
    fab = el('button', 'chat-fab');
    fab.id = 'chatFab';
    fab.innerHTML = ICON_SPARK + '<span class="chat-fab__label">' + U.open + '</span>';
    fab.setAttribute('aria-label', U.open);
    fab.setAttribute('aria-controls', 'chatPanel');
    fab.setAttribute('aria-expanded', 'false');

    panel = el('section', 'chat-panel');
    panel.id = 'chatPanel';
    panel.hidden = true;
    panel.setAttribute('aria-label', U.title);
    panel.innerHTML =
      '<div class="chat-head">' +
        '<span class="chat-head__dot"></span>' +
        '<span class="chat-head__txt"><span class="chat-head__t">' + U.title + '</span>' +
        '<span class="chat-head__s">' + U.sub + '</span></span>' +
        '<button class="chat-close" id="chatClose" aria-label="Cerrar">×</button>' +
      '</div>' +
      '<div class="chat-msgs" id="chatMsgs"></div>' +
      '<div class="chat-chips" id="chatChips">' +
        U.chips.map(q => '<button class="chat-chip">' + q + '</button>').join('') +
      '</div>' +
      '<form class="chat-input" id="chatForm">' +
        '<input type="text" id="chatInput" placeholder="' + U.placeholder + '" autocomplete="off" aria-label="' + U.placeholder + '">' +
        '<button class="chat-send" id="chatSend" type="submit" aria-label="Enviar">' + ICON_SEND + '</button>' +
      '</form>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('#chatMsgs');
    inputEl = panel.querySelector('#chatInput');
    sendEl  = panel.querySelector('#chatSend');

    fab.addEventListener('click', () => setOpen(panel.hidden, fab));
    panel.querySelector('#chatClose').addEventListener('click', () => setOpen(false));
    panel.querySelector('#chatForm').addEventListener('submit', e => { e.preventDefault(); send(inputEl.value); });
    panel.querySelector('#chatChips').addEventListener('click', e => {
      if (e.target.classList.contains('chat-chip')) send(e.target.textContent);
    });

    // Cualquier botón con [data-open-chat] abre el asistente (ej. card "Probalo acá")
    document.querySelectorAll('[data-open-chat]').forEach(b =>
      b.addEventListener('click', () => setOpen(true, b))
    );

    // Teclado: Escape cierra; Tab queda atrapado dentro del panel mientras está abierto
    document.addEventListener('keydown', e => {
      if (panel.hidden) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') {
        const f = panel.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Hook de prueba: abrir con #chatdemo (para verificar el panel; inofensivo en producción)
    if (location.hash === '#chatdemo') setOpen(true);
  }

  function setOpen(open, opener) {
    panel.hidden = !open;
    if (fab) fab.setAttribute('aria-expanded', String(open));
    if (open) {
      if (opener) chatOpener = opener;
      inputEl.focus();
      if (!greeted) { greeted = true; addMsg(U.greeting, 'bot'); }
    } else if (chatOpener) {
      chatOpener.focus();
      chatOpener = null;
    }
  }

  let busy = false;
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    sendEl.disabled = true;
    inputEl.value = '';
    const history = convo.slice(-8);
    addMsg(text, 'user');
    convo.push({ role: 'user', content: text });
    typing(true);

    let reply;
    try {
      reply = await askWorker(text, history);
    } catch (e) {
      console.error('[chat]', e);
      reply = U.error;
    }

    typing(false);
    addMsg(reply, 'bot');
    convo.push({ role: 'assistant', content: reply });
    busy = false;
    sendEl.disabled = false;
    inputEl.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
