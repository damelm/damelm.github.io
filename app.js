/* ============================================================
   app.js — Render + interactividad (vanilla, sin frameworks).
   Reemplaza al runtime de artifacts: toggle ES/EN + tema,
   reveals on-scroll, count-up de stats y spotlight de cards.
   ============================================================ */
(function () {
  'use strict';

  const $app = document.getElementById('app');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const state = {
    lang: read('cv_lang', 'es'),
    theme: read('cv_theme', 'dark')
  };

  function read(k, def) { try { return localStorage.getItem(k) || def; } catch (e) { return def; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  const L = (o, lang) => (o && typeof o === 'object' && 'es' in o) ? o[lang] : o;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- theme ---------------- */
  function applyTheme(t) {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  }
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    write('cv_theme', state.theme);
    applyTheme(state.theme);
    const tb = document.getElementById('themeBtn');
    if (tb) tb.textContent = state.theme === 'dark' ? '◐' : '◑';
  }

  /* ---------------- lang ---------------- */
  function setLang(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    write('cv_lang', lang);
    render(true); // re-render inmediato, sin re-animar
  }

  /* ---------------- view ---------------- */
  function view(lang) {
    const c = COPY[lang];

    const stats = DATA.stats.map((s) =>
      `<div><div class="stat__num" data-target="${s.target}" data-suffix="${s.suffix}">0</div><div class="stat__label">${esc(L(s.label, lang))}</div></div>`
    ).join('');

    const services = DATA.services.map((s) =>
      `<div class="card svc reveal"><div class="svc__icon"><iconify-icon icon="${s.icon}" aria-hidden="true"></iconify-icon></div><div class="svc__title">${esc(L(s.title, lang))}</div><div class="svc__desc">${esc(L(s.desc, lang))}</div></div>`
    ).join('');

    const featuredCase = DATA.cases.find((x) => x.num === '05') || DATA.cases[DATA.cases.length - 1];
    const caseCard = (x) =>
      `<div class="card card--spot case reveal"><div class="card__in">
        <div class="case__head"><h3 class="case__title">${esc(L(x.title, lang))}</h3><span class="case__num">${esc(x.num)}</span></div>
        <p class="case__desc">${esc(L(x.desc, lang))}</p>
        <div class="case__result"><span>↗</span><span>${esc(L(x.result, lang))}</span></div>
        <div class="tags">${x.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div></div>`;
    const cases = DATA.cases.filter((x) => x !== featuredCase).map(caseCard).join('');
    const featuredHtml = `<div class="card card--spot case-feat reveal"><div class="card__in case-feat__grid">
        <div>
          <div class="case-feat__badge">${lang === 'es' ? 'Caso destacado' : 'Featured project'}</div>
          <h3 class="case-feat__title">${esc(L(featuredCase.title, lang))}</h3>
          <p class="case-feat__desc">${esc(L(featuredCase.desc, lang))}</p>
          <div class="case__result"><span>↗</span><span>${esc(L(featuredCase.result, lang))}</span></div>
        </div>
        <div class="case-feat__side">
          <div class="case-feat__num">${esc(featuredCase.num)}</div>
          <div class="tags">${featuredCase.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
      </div></div>`;

    const osFeats = L(DATA.openwaFeatures, lang).map((f) => `<div class="os-feat"><span>→</span>${esc(f)}</div>`).join('');
    const osStack = DATA.openwaStack.map((t) => `<span class="tag">${esc(t)}</span>`).join('');

    const jobs = DATA.jobs.map((j) =>
      `<div class="job reveal"><div class="job__period">${esc(L(j.period, lang))}${j.current ? `<span class="job__now">${esc(c.now)}</span>` : ''}</div><div class="job__body"><h3 class="job__title">${esc(L(j.title, lang))}</h3><div class="job__company">${esc(L(j.company, lang))}</div><p class="job__desc">${esc(L(j.desc, lang))}</p></div></div>`
    ).join('');

    const tech = STACK.map((t) =>
      `<div class="tech reveal"><iconify-icon class="tech__icon" icon="${t.icon}" aria-hidden="true"></iconify-icon><span class="tech__name">${esc(t.name)}</span></div>`
    ).join('');

    const certs = DATA.certs.map((ct) => {
      const verifyLabel = ct.url ? `<span>${esc(c.certVerify)}</span>` : ct.image ? `<span>Ver certificado →</span>` : '';
      const foot = `<span>${esc(ct.date || '')}${ct.hours ? ' · ' + esc(ct.hours) : ''}</span>${verifyLabel}`;
      const inner = `<div class="cert__eyebrow">${esc(ct.issuer || 'Certificación')}</div><div class="cert__title">${esc(ct.title)}</div><div class="cert__foot">${foot}</div>`;
      if (ct.url) return `<a class="cert reveal" href="${esc(ct.url)}" target="_blank" rel="noopener">${inner}</a>`;
      if (ct.image) return `<div class="cert reveal cert--img" data-img="${esc(ct.image)}">${inner}</div>`;
      return `<div class="cert reveal">${inner}</div>`;
    }).join('');

    return `
    <nav class="nav">
      <div class="nav__brand"><img class="nav__logo" src="assets/favicon.svg?v=20260624b" alt="" width="26" height="26">Damian Peña</div>
      <div class="nav__actions">
        <div class="seg" role="group" aria-label="Idioma / Language">
          <button class="seg__btn ${lang === 'es' ? 'is-active' : ''}" data-lang="es" aria-pressed="${lang === 'es'}">ES</button>
          <button class="seg__btn ${lang === 'en' ? 'is-active' : ''}" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
        </div>
        <button class="icon-btn" id="themeBtn" aria-label="Cambiar tema / Toggle theme">${state.theme === 'dark' ? '◐' : '◑'}</button>
        <a class="btn btn--sm" href="mailto:fx.damianpea@gmail.com">${esc(c.navCta)}</a>
      </div>
    </nav>

    <div class="wrap">
      <!-- HERO -->
      <section class="hero">
        <div class="hero__deco" aria-hidden="true">
          <svg viewBox="0 0 360 360" fill="none" stroke="currentColor" stroke-linecap="round">
            <g stroke-width="2" opacity="0.5">
              <path d="M150 96 V44 H64"/><path d="M210 96 V54 H300"/>
              <path d="M96 150 H34"/><path d="M264 210 H326 V300"/>
              <path d="M150 264 V322 H66"/><path d="M210 264 V312"/>
            </g>
            <rect x="120" y="120" width="120" height="120" rx="22" stroke-width="2.5"/>
            <rect x="152" y="152" width="56" height="56" rx="10" stroke-width="1.5" opacity="0.55"/>
            <g stroke-width="2.5">
              <line x1="150" y1="108" x2="150" y2="120"/><line x1="180" y1="108" x2="180" y2="120"/><line x1="210" y1="108" x2="210" y2="120"/>
              <line x1="150" y1="240" x2="150" y2="252"/><line x1="180" y1="240" x2="180" y2="252"/><line x1="210" y1="240" x2="210" y2="252"/>
              <line x1="108" y1="150" x2="120" y2="150"/><line x1="108" y1="180" x2="120" y2="180"/><line x1="108" y1="210" x2="120" y2="210"/>
              <line x1="240" y1="150" x2="252" y2="150"/><line x1="240" y1="180" x2="252" y2="180"/><line x1="240" y1="210" x2="252" y2="210"/>
            </g>
            <g fill="currentColor" stroke="none">
              <circle class="hn" cx="64" cy="44" r="5"/><circle class="hn" cx="300" cy="54" r="5"/>
              <circle class="hn" cx="34" cy="150" r="5"/><circle class="hn" cx="326" cy="300" r="5"/>
              <circle class="hn" cx="66" cy="322" r="5"/><circle class="hn" cx="210" cy="312" r="5"/>
            </g>
          </svg>
        </div>
        <div class="badge"><span class="badge__dot"></span>${esc(c.heroTag)}</div>
        <h1 class="hero__title">${esc(c.heroA)} <span class="hero__em">${esc(c.heroEm)}</span></h1>
        <p class="hero__sub">${esc(c.heroSub)}</p>
        <div class="cta-row">
          <a class="btn btn--primary btn--lg" href="mailto:fx.damianpea@gmail.com">${esc(c.heroCta1)} <span class="btn__arrow">→</span></a>
          <button class="btn btn--ghost btn--lg btn--ai" id="heroAskBtn" type="button"><span class="ai-dot"></span>${esc(c.heroCtaAI)}</button>
        </div>
        <div class="stats reveal" data-stats>${stats}</div>
      </section>

      <!-- SERVICES -->
      <section class="section">
        <div class="head reveal"><h2 class="h2">${esc(c.svcTitle)}</h2></div>
        <div class="grid grid--svc">${services}</div>
      </section>

      <!-- CASES -->
      <section class="section" id="casos">
        <div class="head reveal"><h2 class="h2">${esc(c.casesTitle)}</h2></div>
        ${featuredHtml}
        <div class="grid grid--cases" style="margin-top:1.1rem">${cases}</div>
      </section>

      <!-- OPEN SOURCE -->
      <section class="section">
        <div class="head reveal"><h2 class="h2">${esc(c.osTitle)}</h2><p class="lead">${esc(c.osIntro)}</p></div>
        <div class="grid grid--os">
          <div class="card card--spot os-feature reveal">
            <div class="os-feature__grid">
              <div>
                <div class="os-logo-row"><div class="os-logo">◇</div><div><div class="os-name">Sender WA</div><div class="os-tag">${esc(c.openwaTag)}</div></div></div>
                <p class="os-desc">${esc(c.openwaDesc)}</p>
                <div class="os-feats">${osFeats}</div>
                <div class="tags">${osStack}</div>
              </div>
              <div class="term">
                <div class="term__bar"><span class="term__dot" style="background:#ff5f57"></span><span class="term__dot" style="background:#febc2e"></span><span class="term__dot" style="background:#28c840"></span></div>
                <pre>POST /sessions/{id}/send-text
{
  "chatId": "595...@c.us",
  "text": "<span style="color:var(--g3)">Hola desde Sender WA</span>"
}
<span style="color:#28c840">→ 200 OK · message queued</span></pre>
              </div>
            </div>
          </div>
          <div class="card card--spot os-side reveal"><div class="card__in">
            <div class="os-side__title">mundial-2026</div>
            <div class="os-side__tag">${esc(c.mundialTag)}</div>
            <p class="os-side__desc">${esc(c.mundialDesc)}</p>
            <div class="tags"><span class="tag">JavaScript</span><span class="tag">GitHub Actions</span><span class="tag">API</span></div>
          </div></div>
          <div class="card stat-card reveal">
            <div class="stat-card__big">8+</div>
            <div class="stat-card__txt">${esc(c.reposLine)}</div>
          </div>
        </div>
      </section>

      <!-- ABOUT -->
      <section class="section">
        <div class="about__grid">
          <div class="reveal"><h2 class="h2">${esc(c.aboutTitle)}</h2></div>
          <div class="reveal"><p class="about__p1">${esc(c.aboutP1)}</p><p class="about__p2">${esc(c.aboutP2)}</p></div>
        </div>
      </section>

      <!-- EXPERIENCE -->
      <section class="section">
        <div class="head reveal"><h2 class="h2">${esc(c.expTitle)}</h2></div>
        <div>${jobs}</div>
      </section>

      <!-- STACK -->
      <section class="section" style="padding:4rem 0">
        <div class="marquee-label reveal">${esc(c.techLabel)}</div>
        <div class="grid grid--tech">${tech}</div>
      </section>

      <!-- CERTS -->
      <section class="section">
        <div class="head reveal"><h2 class="h2">${esc(c.certTitle)}</h2><p class="lead">${esc(c.certIntro)}</p></div>
        <div class="grid grid--certs">${certs}</div>
      </section>

      <!-- CONTACT -->
      <section class="section" style="padding:6rem 0 7rem">
        <div class="contact-card reveal">
          <div class="contact-card__glow"></div>
          <div class="contact-card__in">
            <h2 class="contact__head">${esc(c.contactHead)}</h2>
            <p class="contact__sub">${esc(c.contactSub)}</p>
            <div class="contact__cta"><a class="btn btn--primary btn--lg" href="mailto:fx.damianpea@gmail.com">${esc(c.contactBtn)} <span class="btn__arrow">→</span></a></div>
            <div class="contact__meta">
              <a class="meta-link" href="mailto:fx.damianpea@gmail.com"><iconify-icon icon="lucide:mail" aria-hidden="true"></iconify-icon>fx.damianpea@gmail.com</a>
              <a class="meta-link" href="https://wa.me/595992879800" target="_blank" rel="noopener"><iconify-icon icon="simple-icons:whatsapp" aria-hidden="true"></iconify-icon>+595 992 879 800</a>
              <span><iconify-icon icon="lucide:map-pin" aria-hidden="true"></iconify-icon>${esc(c.location)}</span>
            </div>
          </div>
        </div>
      </section>

      <footer class="footer"><span>© 2026 Damian Marcos Peña</span><span>${esc(c.footerNote)}</span></footer>
    </div>`;
  }

  /* ---------------- interactividad ---------------- */
  function bindNav() {
    $app.querySelectorAll('.seg__btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', toggleTheme);
    const ask = document.getElementById('heroAskBtn');
    if (ask) ask.addEventListener('click', () => { const f = document.getElementById('chatFab'); if (f) f.click(); });
  }

  function countUp(container, animate) {
    container.querySelectorAll('.stat__num').forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (!animate) { el.textContent = target + suffix; return; }
      const start = performance.now(), dur = 1200;
      const tick = (now) => {
        const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * e) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function initReveals(immediate) {
    const nodes = $app.querySelectorAll('.reveal');
    if (immediate || prefersReduced || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      $app.querySelectorAll('[data-stats]').forEach((s) => countUp(s, false));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        try {
          const sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll(':scope > .reveal'));
          el.style.transitionDelay = (Math.min(Math.max(0, sibs.indexOf(el)), 6) * 60) + 'ms';
        } catch (_) {}
        el.classList.add('is-visible');
        if (el.hasAttribute('data-stats')) countUp(el, true);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach((n) => io.observe(n));
  }

  function initSpotlight() {
    if (isTouch) return;
    $app.querySelectorAll('.card--spot').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------- lightbox ---------------- */
  function initLightbox() {
    let lb = document.getElementById('certLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'certLightbox';
      lb.className = 'cert-lb';
      lb.innerHTML = '<div class="cert-lb__inner"><button class="cert-lb__close" aria-label="Cerrar">×</button><img class="cert-lb__img" src="" alt="Certificado"></div>';
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('cert-lb__close')) lb.removeAttribute('open'); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.removeAttribute('open'); });
    }
    $app.querySelectorAll('.cert--img').forEach((card) => {
      card.addEventListener('click', () => {
        lb.querySelector('.cert-lb__img').src = card.dataset.img;
        lb.setAttribute('open', '');
      });
    });
  }

  /* ---------------- scroll: barra de progreso + nav consciente ---------------- */
  let scrollBar = null, scrollTicking = false;
  function updateScrollState() {
    const y = window.scrollY || window.pageYOffset || 0;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollBar) scrollBar.style.transform = 'scaleX(' + (h > 0 ? (y / h) : 0) + ')';
    const nav = $app.querySelector('.nav');
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
  }
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { updateScrollState(); scrollTicking = false; });
  }
  function initScroll() {
    if (!scrollBar) {
      scrollBar = document.createElement('div');
      scrollBar.className = 'scroll-progress';
      scrollBar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(scrollBar);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
    updateScrollState();
  }

  /* ---------------- render ---------------- */
  function render(immediate) {
    document.documentElement.lang = state.lang;
    $app.innerHTML = view(state.lang);
    bindNav();
    initReveals(immediate);
    initSpotlight();
    initLightbox();
    updateScrollState();
  }

  /* ---------------- init ---------------- */
  applyTheme(state.theme);
  render(false);
  initScroll();
})();
