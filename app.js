/* Zeeben Labs — interacciones
   Menú mobile · reveal on scroll · modales · movimiento de secciones.

   Reglas que respeta todo este archivo:
   1. El contenido ya está completo en el HTML. El JS solo lo anima.
      Si algo de acá falla, la página se sigue leyendo entera.
   2. Con prefers-reduced-motion no arranca ni un timer.
   3. Nada corre fuera del viewport ni con la pestaña oculta (batería).
*/

(() => {
  'use strict';

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = mqReduce.matches;
  const haveIO = 'IntersectionObserver' in window;

  /* ======================================================================
     Menú mobile
  ====================================================================== */
  const burger = document.querySelector('[data-burger]');
  const navLinks = document.getElementById('nav-links');
  if (burger && navLinks) {
    const setMenu = (open) => {
      navLinks.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => {
      const open = navLinks.classList.contains('is-open');
      setMenu(!open);
      if (!open) { const a = navLinks.querySelector('a'); if (a) a.focus(); }
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setMenu(false))
    );
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        setMenu(false); burger.focus();
      }
    });
  }

  /* ======================================================================
     Reveal on scroll
     El estado oculto solo se aplica si acá confirmamos que podemos revertirlo
     (ver el failsafe inline del <head>).
  ====================================================================== */
  const items = document.querySelectorAll('.reveal');
  if (reduce || !haveIO) {
    document.documentElement.classList.remove('js-reveal');
    items.forEach(el => el.classList.add('in'));
  } else {
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ======================================================================
     Modales (trampa de foco y restitución)
  ====================================================================== */
  let modalOpener = null;
  function trapFocus(dialog, e) {
    const f = dialog.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function closeModal(m) {
    if (!m || m.hidden) return;
    m.hidden = true;
    document.body.style.overflow = '';
    if (modalOpener) { modalOpener.focus(); modalOpener = null; }
  }
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = document.getElementById(btn.dataset.openModal + '-modal');
      if (!m) return;
      modalOpener = btn;
      m.hidden = false;
      document.body.style.overflow = 'hidden';
      const c = m.querySelector('.modal__close');
      if (c) c.focus();
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(el =>
    el.addEventListener('click', () => closeModal(el.closest('.modal')))
  );
  document.addEventListener('keydown', e => {
    const open = document.querySelector('.modal:not([hidden])');
    if (!open) return;
    if (e.key === 'Escape') closeModal(open);
    else if (e.key === 'Tab') trapFocus(open.querySelector('.modal__dialog'), e);
  });

  /* ==================================================================== */
  /*  A partir de acá, todo es movimiento: si reduce está activo, nada.    */
  /* ==================================================================== */
  if (reduce || !haveIO) return;

  // Registro central de intervalos, para poder cortarlos todos con la
  // pestaña oculta sin rastrear cada uno por separado.
  const ciclos = new Set();
  function ciclar(fn, ms) {
    const c = { fn, ms, id: null, vivo: false };
    c.arrancar = () => { if (!c.vivo) { c.vivo = true; c.id = setInterval(fn, ms); } };
    c.parar    = () => { if (c.vivo) { c.vivo = false; clearInterval(c.id); c.id = null; } };
    ciclos.add(c);
    return c;
  }
  // Un observer reusable: arranca el ciclo al entrar, lo para al salir.
  function cicloEnViewport(el, ciclo) {
    new IntersectionObserver((es) => {
      es.forEach(e => e.isIntersecting ? ciclo.arrancar() : ciclo.parar());
    }, { threshold: 0.1 }).observe(el);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ciclos.forEach(c => c.vivo && (c.parar(), c.suspendido = true));
    else ciclos.forEach(c => { if (c.suspendido) { c.suspendido = false; c.arrancar(); } });
  });

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  /* ---- Contadores -----------------------------------------------------
     El HTML ya trae el valor final. Acá lo bajamos a `desde` y lo animamos
     de vuelta. Si este bloque no corriera, la cifra correcta ya está puesta.
  --------------------------------------------------------------------- */
  function animarContador(b) {
    if (b.dataset.contado) return;
    b.dataset.contado = '1';
    const hasta  = parseFloat(b.dataset.contador);
    const desde  = parseFloat(b.dataset.desde || 0);
    const sufijo = b.dataset.sufijo || '';
    if (!isFinite(hasta)) return;
    const dur = 1600, t0 = performance.now();
    const paso = (now) => {
      // El timestamp de rAF es el del INICIO del frame actual y puede ser
      // ANTERIOR al performance.now() de arranque. Sin el Math.max(0, …) el
      // progreso sale negativo, easeOutCubic devuelve negativo y el contador
      // muestra "-0+ años en tecnología" en los primeros frames.
      const t = Math.max(0, Math.min(1, (now - t0) / dur));
      const v = Math.round(desde + (hasta - desde) * easeOutCubic(t));
      b.textContent = v.toLocaleString('es') + sufijo;
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  const contadores = document.querySelectorAll('[data-contador]');
  if (contadores.length) {
    const ioNum = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting) { animarContador(e.target); ioNum.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    contadores.forEach(b => ioNum.observe(b));
  }

  /* ---- Texto rotativo (hero y CTA) ------------------------------------
     El contenedor tiene min-height en CSS, así que cambiar el texto no
     mueve el layout.
  --------------------------------------------------------------------- */
  function rotador(el, textos, ms) {
    if (!el || textos.length < 2) return;
    let i = 0;
    const c = ciclar(() => {
      i = (i + 1) % textos.length;
      el.textContent = textos[i];
    }, ms);
    cicloEnViewport(el, c);
  }
  // El primer texto de cada lista tiene que ser IDÉNTICO al que está escrito en
  // page.html: el rotador arranca en el índice 0 y recién en el primer tick pasa
  // al 1. Si no coinciden, la línea salta apenas carga el JS.
  rotador(document.querySelector('[data-hero-log]'), [
    'congelados · consulta resuelta sin intervención',
    'congelados · pedido tomado y derivado a reparto',
    'senderwa · 449 mensajes enviados hoy',
    'northstar · 18 consultas calificadas este mes'
  ], 2600);
  rotador(document.querySelector('[data-cta-chat]'), [
    'Te respondemos en minutos.',
    'Diagnóstico sin compromiso.',
    'Con un audio alcanza.',
    'Respondemos por WhatsApp.'
  ], 2200);


  /* ---- Barra de acción en móvil ---------------------------------------
     Aparece cuando el visitante pasó la sección de proyectos (o sea, ya vio
     la prueba) y se esconde al llegar al CTA final, donde el botón ya está
     en pantalla. El CSS la deja fuera de vista en desktop.
  --------------------------------------------------------------------- */
  const barra = document.querySelector('[data-barra-cta]');
  const secProyectos = document.getElementById('proyectos');
  const secContacto = document.getElementById('contacto');
  if (barra && secProyectos && secContacto) {
    let pasoProyectos = false, enContacto = false;
    const refrescar = () => barra.classList.toggle('is-visible', pasoProyectos && !enContacto);
    new IntersectionObserver(([e]) => {
      // boundingClientRect.bottom < 0 => la sección quedó por encima del viewport
      pasoProyectos = !e.isIntersecting && e.boundingClientRect.bottom < 0;
      refrescar();
    }, { threshold: 0 }).observe(secProyectos);
    new IntersectionObserver(([e]) => {
      enContacto = e.isIntersecting;
      refrescar();
    }, { threshold: 0.15 }).observe(secContacto);
  }

  /* ---- Proyectos: rotación + log por pasos ----------------------------
     Se ejecutan solos en rotación; el puntero o el teclado toman el control
     de la tarjeta apuntada y al salir vuelve la rotación.
  --------------------------------------------------------------------- */
  const grilla = document.querySelector('[data-proyectos]');
  if (grilla) {
    const tarjetas = [...grilla.querySelectorAll('[data-proyecto]')];
    let activo = -1, fijada = null, tLog = [];

    // Las líneas nacen ENCENDIDAS en el CSS: is-off es un estado transitorio.
    // Así, si este bloque no corre, el log se lee completo igual.
    function limpiarLog(card) {
      tLog.forEach(clearTimeout); tLog = [];
      card && card.querySelectorAll('.log-linea').forEach(l => l.classList.remove('is-off', 'is-last'));
    }
    function encender(card) {
      const lineas = [...card.querySelectorAll('.log-linea')];
      lineas.forEach(l => l.classList.add('is-off'));       // apagar para la secuencia
      lineas.forEach((l, i) => {
        tLog.push(setTimeout(() => {
          l.classList.remove('is-off');
          if (i === lineas.length - 1) l.classList.add('is-last');
        }, i * 420));
      });
      const m = card.querySelector('[data-contador]');
      if (m) { delete m.dataset.contado; animarContador(m); }
    }
    function activar(i) {
      if (i === activo) return;
      const previa = tarjetas[activo];
      if (previa) { previa.classList.remove('is-activo'); limpiarLog(previa); }
      activo = i;
      const card = tarjetas[i];
      if (!card) return;
      card.classList.add('is-activo');
      encender(card);
    }

    // En táctil el recorrido completo de las 6 tardaba 29 s; se acorta el ciclo.
    const tactil = matchMedia('(hover: none)').matches;
    const ciclo = ciclar(() => {
      if (fijada !== null) return;              // el usuario tiene el control
      activar((activo + 1) % tarjetas.length);
    }, tactil ? 3200 : 4800);
    cicloEnViewport(grilla, ciclo);

    tarjetas.forEach((card, i) => {
      const tomar = () => { fijada = i; activar(i); };
      const soltar = () => { fijada = null; };
      card.addEventListener('mouseenter', tomar);
      card.addEventListener('mouseleave', soltar);
      // focusin/focusout quedan preparados para cuando una tarjeta contenga algo
      // focusable (un link al caso, por ejemplo). Hoy no disparan: las tarjetas
      // no son focusables a propósito — una parada de tab sin acción molesta más
      // de lo que aporta, y el usuario de teclado no pierde información porque el
      // log es decorativo (aria-hidden) y la rotación automática las muestra todas.
      card.addEventListener('focusin', tomar);
      card.addEventListener('focusout', soltar);
    });
  }
})();
