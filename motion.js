/* Zeeben Labs — movimiento con GSAP
   Entradas de secciones al entrar en viewport: fade-up · stagger · split · línea.

   Reglas que respeta todo este archivo (las mismas que app.js):
   1. El contenido ya está completo en el HTML. GSAP solo lo anima.
      Si este archivo no carga —o la red se cae a mitad—, la página se lee
      entera igual: nada nace oculto por CSS esperando que GSAP llegue.
   2. Con prefers-reduced-motion no se descarga ni un byte de GSAP.
   3. El hero es zona prohibida. No por prolijidad: hero-fx.js mide los glifos
      de [data-hero-fx-texto] con Range+getClientRects() para calcular la
      máscara de contraste del canvas, y ahí están el h1 y el .lead, que además
      son el elemento LCP. Tocar esos nodos —sobre todo partirlos con
      SplitText— corre la máscara y deja el titular ilegible sobre los puntos.
      Ver la exclusión en `prohibido()`.
   4. Un solo dueño por nodo. Los .reveal que animamos acá dejan de ser .reveal
      (ver `adoptar()`): app.js y GSAP escribiendo opacity/transform sobre el
      mismo elemento es jank asegurado.

   Por qué NO está ScrollTrigger
   -----------------------------
   El presupuesto medido del sitio es ~42 KB gzip de JS nuevo y +58 ms de TBT.
   Los tres archivos juntos son 49.9 KB gzip: no entran. ScrollTrigger son
   17.6 KB gzip y ~75 ms de main-thread para darnos una sola cosa que acá
   necesitamos: saber cuándo un elemento entra en pantalla. Eso ya lo hace
   IntersectionObserver a costo ~0, y es el idioma que app.js viene usando.
   ScrollTrigger recién se paga solo cuando hay scrub o pin — y no hay ninguno.
   Queda gsap core + SplitText = 31.9 KB gzip.
   (ScrollTrigger.min.js sigue en assets/vendor/ por si el equipo revierte esta
   decisión, pero este archivo no lo pide nunca.)
*/

(() => {
  'use strict';

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Salida temprana #1: quien pidió menos movimiento no paga los 31.9 KB.
  // El chequeo va antes de cualquier fetch, no después.
  if (mqReduce.matches) return;

  // Salida temprana #2: sin un solo hook en el HTML no hay nada que animar.
  if (!document.querySelector('[data-m]')) return;

  /* ======================================================================
     De dónde salen los archivos
     Se resuelve contra la URL de este mismo script en vez de hardcodear una
     ruta relativa: así sigue funcionando si el sitio pasa a servirse desde
     un subdirectorio.
  ====================================================================== */
  const yo = document.currentScript;
  const VENDOR = new URL('assets/vendor/', yo ? yo.src : location.href).href;

  let cancelado = false;   // se enciende si el visitante activa reduce-motion
  let mm = null;           // gsap.matchMedia() — dueño de todo lo que creamos
  const splits = new Set();

  /* ======================================================================
     Carga diferida — dos compuertas en cadena

     El primer intento fue 'load' + requestIdleCallback a secas y se pagó caro.
     La razón es estructural y conviene dejarla escrita para que nadie la
     reintente: la ventana de TBT termina en TTI, y TTI espera a que el hilo
     principal se aquiete. Diferir por tiempo no saca el trabajo de la
     ventana — la estira hasta cubrirlo. Medido por el teammate de
     rendimiento: post-load+idle dio TBT 650 ms contra 315 ms de un `defer`
     plano. Diferir empeora el TBT; lo único que preserva es el LCP.

     Lo que sí baja el TBT es no cargar. Y acá se puede no cargar, porque
     ningún data-m está en el primer pantallazo:

       1. 'load'  — el primer pintado, las fuentes y el canvas del hero ya
                    ocurrieron.
       2. IntersectionObserver sobre el PRIMER hook, con 900 px de anticipo —
                    hasta que el visitante no se acerca scrolleando, GSAP no
                    hace falta. Quien lee el hero y se va no descarga nada.
                    Los 900 px son el margen para que llegue antes que el ojo.

     Consecuencia honesta, que hay que decir en voz alta: Lighthouse no
     scrollea, así que en el laboratorio GSAP no se descarga y el puntaje no
     se mueve. El costo real existe y lo paga el que scrollea — fuera del
     camino crítico, después del hero, sin tocar LCP ni CLS.
  ====================================================================== */
  const enOcio = window.requestIdleCallback
    ? (fn) => requestIdleCallback(fn, { timeout: 2000 })
    : (fn) => setTimeout(fn, 200);

  const alCambiarReduce = () => { if (mqReduce.matches) destruir(); };
  mqReduce.addEventListener('change', alCambiarReduce);

  let vigia = null;

  function alCargar() {
    if (cancelado) return;
    const primero = document.querySelector('[data-m]');
    if (!primero || !('IntersectionObserver' in window)) { enOcio(arrancar); return; }
    vigia = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      vigia.disconnect(); vigia = null;
      enOcio(arrancar);
    }, { rootMargin: '900px 0px' });
    vigia.observe(primero);
  }

  if (document.readyState === 'complete') alCargar();
  else window.addEventListener('load', alCargar, { once: true });

  function cargar(archivo) {
    return new Promise((ok, fallo) => {
      const s = document.createElement('script');
      s.src = VENDOR + archivo;
      // Los scripts inyectados son async por defecto; async=false conserva el
      // orden de ejecución, que acá importa (SplitText necesita el core).
      s.async = false;
      s.onload = ok;
      s.onerror = () => fallo(new Error(archivo));
      document.head.appendChild(s);
    });
  }

  async function arrancar() {
    // Entre el load y este idle pudieron pasar segundos: revalidamos.
    if (cancelado || mqReduce.matches) return;
    try {
      await cargar('gsap.min.js');
      await cargar('SplitText.min.js');
    } catch (e) {
      return;  // sin GSAP la página queda estática y completa: es un estado válido
    }
    if (cancelado || mqReduce.matches) return;
    // Si el armado explota a mitad (navegador viejo, DOM inesperado), se
    // desarma todo y la página vuelve a su estado natural en vez de quedar
    // a medio animar.
    // El catch NO puede ser silencioso: si el armado explota, la pagina queda
    // estatica (que es un estado valido) pero nadie se entera de que las
    // animaciones no existen. Paso exactamente eso durante dias.
    try { iniciar(); } catch (e) { console.error('[motion] fallo el armado:', e); destruir(); }
  }

  /* ======================================================================
     Armado de las animaciones
  ====================================================================== */
  function iniciar() {
    const { gsap, SplitText } = window;
    if (!gsap) return;
    if (SplitText) gsap.registerPlugin(SplitText);

    /* ---- Zona prohibida: el hero ---------------------------------------
       Doble candado. El de arriba (`bajoElFold`) es de rendimiento y evita
       el flash en lo ya leído; este es de correctitud y no depende de dónde
       esté el scroll cuando GSAP llegue.
    ------------------------------------------------------------------- */
    const prohibido = (el) =>
      el.closest('#inicio, .hero, [data-hero-fx-texto]') !== null ||
      el.querySelector('[data-hero-fx-texto]') !== null;

    // Nada del primer pantallazo: lo de arriba no se toca nunca. El margen
    // del 90 % deja fuera también lo que asoma a medias.
    const bajoElFold = (el) =>
      el.getBoundingClientRect().top > window.innerHeight * 0.9;

    const hooks = (valor) => Array.prototype.filter.call(
      document.querySelectorAll('[data-m="' + valor + '"]'),
      (el) => !prohibido(el) && bajoElFold(el)
    );

    /* ---- Un solo dueño por nodo ----------------------------------------
       app.js observa todos los .reveal y el CSS los anima con
       `transition: opacity, transform 700ms`. Si GSAP escribe inline sobre
       el mismo nodo gana por especificidad, pero la transición CSS sigue
       viva y arranca de nuevo con cada set del ticker: eso es el "resbalón"
       clásico. Le sacamos la clase al nodo que adoptamos.

       Es seguro hacerlo acá: el elemento está bajo el fold, así que perder
       el estado oculto del CSS no se ve. El observer de app.js le va a
       seguir poniendo `.in`, que sin `.reveal` no matchea ninguna regla.
    ------------------------------------------------------------------- */
    const adoptar = (el) => { el.classList.remove('reveal', 'in'); return el; };

    mm = gsap.matchMedia();

    // Dos condiciones y no una: con una sola, el handler no corre cuando la
    // query NO matchea, y nos quedaríamos sin animaciones en escritorio.
    mm.add({
      movil: '(max-width: 767px)',
      escritorio: '(min-width: 768px)'
    }, (ctx) => {
      const movil = ctx.conditions.movil;

      // En móvil todo es más corto y más chico: menos tiempo de compositing,
      // menos distancia recorrida y menos posibilidad de que la entrada
      // termine después de que el visitante ya siguió scrolleando.
      const dur  = movil ? 0.40 : 0.70;
      const desp = movil ? 16   : 32;
      const paso = movil ? { amount: 0.30 } : 0.09;
      const propios = [];   // splits creados en esta pasada de matchMedia
      const calcos  = [];   // spans de línea inyectados en esta pasada

      /* ---- Disparo por IntersectionObserver ----------------------------
         Dos observers en vez de registrar todo de una:

         · ioPrep  (900 px de anticipo) prepara lo que necesita tocar el DOM
           antes de ser visible — hoy, partir los titulares con SplitText.
           Partir reflowea el titular; hecho bajo el fold no mueve nada
           visible y el CLS sigue en 0.
         · ioEntra dispara la entrada y suelta el elemento.

         La ventaja sobre registrar N triggers en el init es de TBT: el
         trabajo no es una sola tarea grande al arrancar, sino un tween chico
         por elemento, repartido a lo largo del scroll. Ninguna tarea se
         acerca a los 50 ms que Lighthouse empieza a contar.

         `ctx.add()` hace que los tweens creados dentro del callback queden
         registrados en el contexto de matchMedia, aunque nazcan mucho
         después del handler. Sin eso, mm.revert() no los conocería.
      ------------------------------------------------------------------ */
      const entradas = new Map();   // el -> función que arma su animación

      /* ---- Red de seguridad -------------------------------------------
         El estado oculto (opacity:0) lo pone `gsap.from()`, o sea que solo
         existe DESPUÉS de que GSAP cargó y ya está animando: si la descarga
         falla, nunca se aplica y la página queda intacta. Pero queda una
         ventana finita: entre que el from() pone el 0 y termina la entrada,
         algo podría matar el ticker (una excepción en un frame, un bug de
         plugin, el tab congelado en un estado raro) y el nodo quedaría
         invisible para siempre — con los precios adentro.

         Mismo criterio que el failsafe inline del <head> de page.html: un
         temporizador que devuelve el nodo a su estado natural si la entrada
         no terminó a tiempo. Se cancela solo cuando el tween completa.
      ------------------------------------------------------------------ */
      const RED_MS = 2500;
      const temporizadores = new Set();
      const conRed = (tw) => {
        if (!tw || typeof tw.then !== 'function') return tw;
        const objetivos = tw.targets();
        const t = setTimeout(() => {
          temporizadores.delete(t);
          gsap.killTweensOf(objetivos);
          gsap.set(objetivos, { clearProps: 'opacity,transform,visibility' });
        }, RED_MS);
        temporizadores.add(t);
        tw.then(() => { clearTimeout(t); temporizadores.delete(t); }, () => {});
        return tw;
      };

      const ioEntra = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          ioEntra.unobserve(e.target);
          const fn = entradas.get(e.target);
          entradas.delete(e.target);
          if (fn) ctx.add(() => conRed(fn()));
        });
      }, { rootMargin: '0px 0px -10% 0px' });

      const alEntrar = (el, fn) => { entradas.set(el, fn); ioEntra.observe(el); };

      /* ---- data-m="fade-up" ----------------------------------------------
         Se anima con opacity y no con autoAlpha a propósito: autoAlpha mete
         visibility:hidden y eso saca el texto del árbol de accesibilidad y
         del buscador del navegador mientras espera su turno.
      ------------------------------------------------------------------- */
      hooks('fade-up').forEach((el) => {
        adoptar(el);
        alEntrar(el, () => gsap.from(el, {
          y: desp, opacity: 0, duration: dur, ease: 'power2.out'
        }));
      });

      /* ---- data-m="stagger" ----------------------------------------------
         El hook va en el contenedor; entran sus hijos directos. En móvil el
         stagger se define por `amount` (total repartido) en vez de `each`,
         para que una grilla de 8 tarjetas no tarde 1,5 s en completarse.
      ------------------------------------------------------------------- */
      hooks('stagger').forEach((cont) => {
        const hijos = Array.prototype.slice.call(cont.children);
        if (!hijos.length) return;
        adoptar(cont);
        hijos.forEach(adoptar);
        alEntrar(cont, () => gsap.from(hijos, {
          y: desp, opacity: 0, duration: dur, ease: 'power2.out', stagger: paso
        }));
      });

      /* ---- data-m="split" ------------------------------------------------
         Titular que entra por palabras. Nunca en el hero (ver `prohibido`).

         `type: 'words'` y no 'lines': envolver renglones cambia el alto del
         bloque si el line-height del wrapper no calca al original, y eso es
         un shift. Palabras no tocan el alto.
         El corte se hace en la fase de preparación, bajo el fold, no al
         entrar: partir un titular que ya está en pantalla sí es CLS visible.
         Al terminar la entrada se revierte y el <h*> vuelve a ser texto limpio.

         En móvil ni se divide: un fade del titular entero rinde igual y
         ahorra decenas de nodos en el dispositivo que menos margen tiene.
      ------------------------------------------------------------------- */
      const paraPartir = [];
      const partidos = new Map();
      // Memoizado: el elemento puede llegar acá por la fase de preparación o
      // directo por la de entrada (scroll muy rápido). Partir dos veces
      // duplicaría los nodos.
      const splitDe = (el) => {
        if (partidos.has(el)) return partidos.get(el);
        const sp = SplitText.create(el, { type: 'words', aria: 'auto' });
        splits.add(sp); propios.push(sp); partidos.set(el, sp);
        return sp;
      };

      hooks('split').forEach((el) => {
        adoptar(el);
        if (movil || !SplitText) {
          alEntrar(el, () => gsap.from(el, {
            y: desp, opacity: 0, duration: dur, ease: 'power2.out'
          }));
          return;
        }
        paraPartir.push(el);
        alEntrar(el, () => {
          const sp = splitDe(el);
          if (!sp) {
            return gsap.from(el, { y: desp, opacity: 0, duration: dur, ease: 'power2.out' });
          }
          return gsap.from(sp.words, {
            yPercent: 40, opacity: 0, duration: 0.6, stagger: 0.05,
            ease: 'power3.out',
            onComplete: () => { sp.revert(); splits.delete(sp); }
          });
        });
      });

      let ioPrep = null;
      if (paraPartir.length) {
        ioPrep = new IntersectionObserver((es) => {
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            ioPrep.unobserve(e.target);
            // Partir mueve nodos: fuera del callback del observer para no
            // encadenar layout dentro de la misma tarea.
            enOcio(() => { if (!cancelado) splitDe(e.target); });
          });
        }, { rootMargin: '900px 0px' });
        paraPartir.forEach((el) => ioPrep.observe(el));
      }

      /* ---- data-m="linea" ------------------------------------------------
         Dos casos, porque en este sitio "línea" significa dos cosas:

         a) El elemento ES la línea (un <hr> o un <div> vacío): se dibuja con
            scaleX desde la izquierda. Transformación pura, no toca layout.

         b) El elemento tiene texto y la línea es su border-top / border-bottom
            —el caso de .otro__prueba—. Ahí scaleX sería un desastre:
            aplastaría el titular. Se apaga el borde real y se dibuja un calco
            absoluto encima, que se retira al terminar. Al ser absolute no
            mueve layout, así que no suma CLS.

         Si no hay ni línea ni borde, cae a un fade-up: mejor una entrada
         sobria que un efecto roto.
      ------------------------------------------------------------------- */
      const durLinea = movil ? 0.5 : 0.9;
      hooks('linea').forEach((el) => {
        adoptar(el);
        const cs = getComputedStyle(el);
        const lado = parseFloat(cs.borderTopWidth) > 0 ? 'Top'
                   : parseFloat(cs.borderBottomWidth) > 0 ? 'Bottom' : null;

        if (!el.textContent.trim()) {
          alEntrar(el, () => gsap.from(el, {
            scaleX: 0, transformOrigin: 'left center',
            duration: durLinea, ease: 'power2.inOut'
          }));
          return;
        }
        if (!lado) {
          alEntrar(el, () => gsap.from(el, {
            y: desp, opacity: 0, duration: dur, ease: 'power2.out'
          }));
          return;
        }

        const grosor = cs['border' + lado + 'Width'];
        const color = cs['border' + lado + 'Color'];
        alEntrar(el, () => {
          const calco = document.createElement('span');
          calco.setAttribute('aria-hidden', 'true');
          if (getComputedStyle(el).position === 'static') gsap.set(el, { position: 'relative' });
          gsap.set(el, { ['border' + lado + 'Color']: 'transparent' });
          gsap.set(calco, {
            position: 'absolute', left: 0, right: 0,
            [lado.toLowerCase()]: 0, height: grosor,
            backgroundColor: color, transformOrigin: 'left center',
            pointerEvents: 'none'
          });
          el.appendChild(calco);
          calcos.push(calco);
          return gsap.from(calco, {
            scaleX: 0, duration: durLinea, ease: 'power2.inOut',
            onComplete: () => {
              calco.remove();
              gsap.set(el, { clearProps: 'border' + lado + 'Color,position' });
            }
          });
        });
      });

      /* ---- data-m="count" ------------------------------------------------
         No-op deliberado. Los contadores ya los maneja app.js con
         [data-contador] y su propio IntersectionObserver. Animar el mismo
         nodo desde dos lados es garantía de números pisándose.
      ------------------------------------------------------------------- */

      // Cleanup de la pasada: si se cruza el breakpoint, gsap revierte tweens
      // y sets creados en el contexto. Los observers y lo que metimos a mano
      // en el DOM —splits y calcos— hay que deshacerlo acá.
      return () => {
        ioEntra.disconnect();
        if (ioPrep) ioPrep.disconnect();
        entradas.clear();
        temporizadores.forEach(clearTimeout);
        temporizadores.clear();
        propios.forEach((sp) => { sp.revert(); splits.delete(sp); });
        calcos.forEach((c) => c.remove());
      };
    });
  }

  /* ======================================================================
     Apagado
     Se usa si el visitante activa reduce-motion con la página abierta, y
     queda expuesto por si otro script del sitio necesita frenar todo.
     mm.revert() corre los cleanups de arriba (que desconectan los observers)
     y revierte tweens y sets creados en el contexto.
  ====================================================================== */
  function destruir() {
    cancelado = true;
    mqReduce.removeEventListener('change', alCambiarReduce);
    window.removeEventListener('load', alCargar);
    if (vigia) { vigia.disconnect(); vigia = null; }
    splits.forEach((sp) => sp.revert());
    splits.clear();
    if (mm) { mm.revert(); mm = null; }
  }

  window.zeebenMotion = { destruir };
})();
