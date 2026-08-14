/* =============================================================================
   Zeeben Labs · hero-fx — "Retícula elástica" (variante 07 del catálogo)
   -----------------------------------------------------------------------------
   WebGL crudo. Sin dependencias, sin build, sin import/export.
   Cargalo con <script src="hero-fx/hero-fx.js" defer></script>.

   Qué hace: pinta un campo de puntos que respira despacio y que se DESPLAZA
   (no sólo se enciende) alrededor del cursor, sobre el canvas del hero.

   Qué NO hace nunca:
     · No arranca si no encuentra el canvas  -> no rompe ninguna otra página.
     · No arranca sin WebGL o en gama baja   -> queda el fondo CSS de fallback.
     · No anima con prefers-reduced-motion   -> un solo frame estático.
     · No anima fuera del viewport ni con la pestaña oculta.
     · No tapa el titular: la zona de los glifos se atenúa al 15% del brillo.

   Documentación de integración: USO.md (mismo directorio).
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     1. CONFIGURACIÓN
     --------------------------------------------------------------------------- */

  var SEL_CANVAS = '[data-hero-fx]';        // el canvas a animar
  var SEL_HOST   = '[data-hero-fx-host]';   // contenedor que define el tamaño (opcional)
  var SEL_TEXTO  = '[data-hero-fx-texto]';  // elementos que definen la zona protegida
  var ATTR_ESTADO = 'data-hero-fx-estado';  // 'listo' | 'fallback'  (lo lee el CSS)

  var DPR_MAX  = 2;    // tope de devicePixelRatio (el que tenía la variante 07)
  var MS_LENTO = 40;   // ms/frame por encima de los cuales el device "no da" (~25 fps)
  var STRIKES  = 3;    // mediciones lentas seguidas antes de congelar el efecto

  // Registro de instancias vivas. Evita montar dos veces sobre el mismo canvas
  // y permite destruir todo de una (ver ZeebenHeroFX.destruir).
  var instancias = [];

  /* ---------------------------------------------------------------------------
     2. ENTORNO — capacidades y preferencias del usuario
     --------------------------------------------------------------------------- */

  function leerEntorno() {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var memoria = navigator.deviceMemory || 0;
    var nucleos = navigator.hardwareConcurrency || 0;
    return {
      mq: mq,
      reduce: mq.matches,
      // Heurística conservadora de gama baja: si el device declara 2 GB o menos,
      // o 2 núcleos o menos, ni lo intentamos. Si no declara nada, seguimos.
      gamaBaja: (memoria > 0 && memoria <= 2) || (nucleos > 0 && nucleos <= 2),
      dpr: Math.min(window.devicePixelRatio || 1, DPR_MAX)
    };
  }

  /* ---------------------------------------------------------------------------
     3. WEBGL — contexto y programa
     --------------------------------------------------------------------------- */

  function crearContexto(cv) {
    var opts = {
      antialias: false, alpha: false, depth: false, stencil: false,
      powerPreference: 'low-power'
    };
    try {
      return cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts);
    } catch (e) {
      return null;   // algunos navegadores tiran en vez de devolver null
    }
  }

  // Un triángulo que cubre la pantalla; todo el dibujo pasa en el fragment shader.
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

  /* Fragment shader de la variante 07, tal cual quedó en 04-hero-final.html.
     Lectura rápida, de arriba hacia abajo:
       · p        = coordenada del píxel, ya deformada
       · sin/cos  = respiración lenta y global de todo el campo
       · f        = lente gaussiana del cursor (radio 240 px lógicos)
       · d/rad    = distancia al centro de la celda -> dibuja el punto
       · mask     = superelipse (n=4) sobre el rectángulo del texto: dentro baja
                    el brillo al 15%, fuera lo deja en 100%. Es lo que sostiene
                    el contraste del titular. u_tr = (centroX, centroY, radioX, radioY). */
  var FS = [
    'precision mediump float;',
    'uniform vec2 u_res; uniform float u_t; uniform vec2 u_m; uniform float u_act;',
    'uniform float u_dpr; uniform vec4 u_tr;',
    'void main(){',
    '  vec2 fc = gl_FragCoord.xy;',
    '  vec2 p = fc;',
    '  p.x += sin(fc.y * 0.0072 / u_dpr + u_t * 0.28) * 3.5 * u_dpr;',
    '  p.y += cos(fc.x * 0.0058 / u_dpr - u_t * 0.22) * 3.5 * u_dpr;',
    '  vec2 dv = fc - u_m;',
    '  float r = 240.0 * u_dpr;',
    '  float f = exp(-dot(dv, dv) / (r * r)) * u_act;',
    '  p += normalize(dv + vec2(0.001)) * f * 34.0 * u_dpr;',
    '  float cell = 34.0 * u_dpr;',
    '  float d = length((fract(p / cell) - 0.5) * cell);',
    '  float w = sin(fc.x * 0.0042 / u_dpr + fc.y * 0.0065 / u_dpr + u_t * 0.45) * 0.5 + 0.5;',
    '  float rad = (0.55 + 0.40 * w + 1.7 * f) * u_dpr;',
    '  float dot = 1.0 - smoothstep(rad, rad + 1.15 * u_dpr, d);',
    '  vec2 q = (fc - u_tr.xy) / u_tr.zw; q *= q; q *= q;',
    '  float mask = mix(0.15, 1.0, smoothstep(0.85, 1.30, sqrt(sqrt(q.x + q.y))));',
    '  vec2 uv = fc / u_res;',
    '  vec3 col = mix(vec3(0.0667,0.1020,0.1686), vec3(0.0471,0.0784,0.1333), uv.y);',
    '  vec3 dc = mix(vec3(0.706,0.776,0.886), vec3(0.239,0.545,1.0), min(1.0, f * 2.4));',
    '  col = mix(col, dc, dot * (0.10 + 0.13 * w + 0.55 * f) * mask);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // Compila y linkea. Devuelve el programa o null (nunca tira hacia afuera).
  function compilarPrograma(gl) {
    function shader(tipo, src) {
      var s = gl.createShader(tipo);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VS);
    var fs = vs ? shader(gl.FRAGMENT_SHADER, FS) : null;
    if (!vs || !fs) return null;

    var pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { gl.deleteProgram(pr); return null; }
    gl.useProgram(pr);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return pr;
  }

  // Efecto listo para usar, o null si este device no puede.
  function crearEfecto(cv) {
    var gl = crearContexto(cv);
    if (!gl) return null;
    var pr = compilarPrograma(gl);
    if (!pr) return null;

    var uRes = gl.getUniformLocation(pr, 'u_res'),
        uT   = gl.getUniformLocation(pr, 'u_t'),
        uM   = gl.getUniformLocation(pr, 'u_m'),
        uAct = gl.getUniformLocation(pr, 'u_act'),
        uDpr = gl.getUniformLocation(pr, 'u_dpr'),
        uTr  = gl.getUniformLocation(pr, 'u_tr');
    var alto = 0;

    return {
      gl: gl,
      // Tamaño del buffer + dpr. `rect` es el rectángulo del texto en píxeles
      // de dispositivo, con el origen arriba a la izquierda.
      redimensionar: function (w, h, dpr, rect) {
        alto = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uDpr, dpr);
        this.mascara(rect);
      },
      // Sólo la máscara. Se puede llamar sola cuando cambia el texto sin que
      // cambie el tamaño del hero (cargó la webfont, cambió el font-size…).
      mascara: function (rect) {
        // WebGL tiene el eje Y al revés que el DOM: por eso `alto - centroY`.
        gl.uniform4f(uTr,
          rect.x + rect.w * 0.5,
          alto - (rect.y + rect.h * 0.5),
          rect.w * 0.725,
          rect.h * 0.725);
      },
      frame: function (t, mx, my, act) {
        gl.uniform1f(uT, t);
        gl.uniform2f(uM, mx, alto - my);
        gl.uniform1f(uAct, act);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      liberar: function () {
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }

  /* ---------------------------------------------------------------------------
     4. LA MÁSCARA DE LEGIBILIDAD
     ---------------------------------------------------------------------------
     Esto es lo que garantiza que el titular se lea. NO tocar sin volver a medir
     el contraste sobre los píxeles del canvas.

     Medimos el rectángulo REAL DE LOS GLIFOS, no el del contenedor: el wrapper
     del hero ocupa todo el ancho aunque el texto esté alineado a la izquierda,
     así que medir el contenedor agrandaba la zona protegida hacia la derecha y,
     peor, dejaba el borde del titular fuera del núcleo de la máscara.
     Range.getClientRects() devuelve las cajas de cada renglón tal como se
     pintaron, con la webfont que efectivamente cargó.

     Elementos marcados con data-hero-fx-texto="caja" (botones, chips: cosas con
     padding y fondo propio) se miden por su caja, no por sus glifos.
     --------------------------------------------------------------------------- */

  function elementosDeTexto(host) {
    var els = host.querySelectorAll(SEL_TEXTO);
    if (els.length) return els;
    return host.querySelectorAll('h1');   // convención mínima si nadie marcó nada
  }

  // Si no hay texto medible, atenuamos un bloque por defecto en el tercio
  // izquierdo-centro del hero: es donde va el titular en este diseño. Degradado,
  // no roto.
  function rectPorDefecto(caja, dpr) {
    return {
      x: caja.width * 0.05 * dpr,
      y: caja.height * 0.20 * dpr,
      w: caja.width * 0.62 * dpr,
      h: caja.height * 0.56 * dpr
    };
  }

  function medirTexto(host, dpr) {
    var caja = host.getBoundingClientRect();
    var els = elementosDeTexto(host);
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    var rango = document.createRange();

    for (var e = 0; e < els.length; e++) {
      var el = els[e];
      var rects;
      if (el.getAttribute('data-hero-fx-texto') === 'caja') {
        rects = [el.getBoundingClientRect()];
      } else {
        try {
          rango.selectNodeContents(el);
          rects = rango.getClientRects();
        } catch (err) {
          rects = [el.getBoundingClientRect()];
        }
        if (!rects.length) rects = [el.getBoundingClientRect()];
      }
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (!r.width || !r.height) continue;   // renglones vacíos y elementos ocultos
        if (r.left < x0) x0 = r.left;
        if (r.top < y0) y0 = r.top;
        if (r.right > x1) x1 = r.right;
        if (r.bottom > y1) y1 = r.bottom;
      }
    }
    rango.detach && rango.detach();

    var w = x1 - x0, h = y1 - y0;
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return rectPorDefecto(caja, dpr);
    return { x: (x0 - caja.left) * dpr, y: (y0 - caja.top) * dpr, w: w * dpr, h: h * dpr };
  }

  /* ---------------------------------------------------------------------------
     5. MONTAJE
     --------------------------------------------------------------------------- */

  function montarUno(cv) {
    if (cv.__heroFx) return cv.__heroFx;   // idempotente: no duplica listeners

    // El host define el tamaño del canvas y recibe el puntero. Por defecto es el
    // padre directo; se puede forzar otro con data-hero-fx-host.
    var host = (cv.closest && cv.closest(SEL_HOST)) || cv.parentElement;
    if (!host) return null;

    // El canvas es decorativo: fuera del árbol de accesibilidad y del tab order,
    // y transparente al puntero para no comerse los clicks de los botones.
    cv.setAttribute('aria-hidden', 'true');
    cv.setAttribute('role', 'presentation');
    cv.style.pointerEvents = 'none';

    var env = leerEntorno();

    // Fallback: dejamos el canvas invisible (el CSS lo mantiene en opacity:0
    // mientras no diga 'listo') y a la vista queda el fondo CSS del hero.
    function fallback() {
      cv.setAttribute(ATTR_ESTADO, 'fallback');
      return null;
    }

    if (env.gamaBaja) return fallback();

    var fx = null;
    try { fx = crearEfecto(cv); } catch (err) { fx = null; }
    if (!fx) return fallback();

    var dpr = Math.min(env.dpr, DPR_MAX);
    var W = 0, H = 0;
    var raf = 0, visible = false, t0 = 0, muerto = false;
    // mx/my: posición suavizada del cursor. tx/ty: destino. act: 0..1, cuánto
    // "peso" tiene el cursor (entra y sale con rampa, no de golpe).
    var mx = -9999, my = -9999, tx = -9999, ty = -9999, act = 0;
    var acumulado = 0, cuadros = 0, ultimo = 0, lentos = 0;

    var abortar = new AbortController();
    var sig = { signal: abortar.signal };
    var sigPasivo = { signal: abortar.signal, passive: true };
    var roHost = null, roTexto = null, io = null;

    function redimensionar() {
      if (muerto) return;
      var r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W; cv.height = H;
      fx.redimensionar(W, H, dpr, medirTexto(host, dpr));
      if (env.reduce) frameEstatico();
      else if (!raf) dibujar(performance.now());
    }

    // Recalcula SÓLO la máscara. La llamamos cuando cambia el texto sin que
    // cambie el hero: carga de webfont, cambio de font-size, texto editado.
    function refrescarMascara() {
      if (muerto || !W) return;
      fx.mascara(medirTexto(host, dpr));
      if (env.reduce) frameEstatico();
    }

    // Un frame quieto, sin cursor: el estado que ve quien pidió reduced-motion.
    function frameEstatico() {
      fx.frame(4, -9999, -9999, 0);
      cv.setAttribute(ATTR_ESTADO, 'listo');
    }

    function dibujar(ahora) {
      raf = 0;
      if (muerto) return;
      if (!t0) t0 = ahora;
      var t = (ahora - t0) / 1000 % 3600;   // el módulo evita perder precisión

      // Auto-degradado: si el promedio de 60 frames se va por encima de MS_LENTO
      // tres veces seguidas, congelamos el último frame. Sin salto visual.
      if (ultimo) {
        acumulado += ahora - ultimo; cuadros++;
        if (cuadros >= 60) {
          var promedio = acumulado / cuadros;
          acumulado = 0; cuadros = 0;
          if (promedio > MS_LENTO) {
            lentos++;
            if (lentos >= STRIKES) { detener(); muerto = true; return; }
          } else { lentos = 0; }
        }
      }
      ultimo = ahora;

      mx += (tx - mx) * 0.09;
      my += (ty - my) * 0.09;
      act += ((tx > -9000 ? 1 : 0) - act) * 0.06;
      fx.frame(t, mx, my, act);
      cv.setAttribute(ATTR_ESTADO, 'listo');

      if (visible && !env.reduce && !document.hidden) raf = requestAnimationFrame(dibujar);
    }

    function arrancar() {
      if (raf || env.reduce || !visible || document.hidden || muerto) return;
      ultimo = 0;   // el primer frame tras una pausa no cuenta para los FPS
      raf = requestAnimationFrame(dibujar);
    }
    function detener() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    /* --- Observadores y listeners ------------------------------------------ */

    if (window.ResizeObserver) {
      roHost = new ResizeObserver(redimensionar);
      roHost.observe(host);
      // Un cambio de tamaño del titular (sin cambio de tamaño del hero) también
      // invalida la máscara.
      roTexto = new ResizeObserver(refrescarMascara);
      var textos = elementosDeTexto(host);
      for (var i = 0; i < textos.length; i++) roTexto.observe(textos[i]);
    } else {
      window.addEventListener('resize', redimensionar, sigPasivo);
    }

    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (entradas) {
        visible = entradas[0].isIntersecting;
        if (visible) arrancar(); else detener();
      }, { threshold: 0 });
      io.observe(host);
    } else {
      visible = true;   // sin IO asumimos visible: peor rendimiento, nunca error
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) detener(); else arrancar();
    }, sig);

    // Cambio de preferencia en caliente, sin recargar.
    function cambioReduce(ev) {
      env.reduce = ev.matches;
      if (env.reduce) { detener(); frameEstatico(); }
      else { t0 = 0; arrancar(); }
    }
    if (env.mq.addEventListener) env.mq.addEventListener('change', cambioReduce, sig);
    else if (env.mq.addListener) env.mq.addListener(cambioReduce);   // Safari viejo

    host.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;   // en touch no hay cursor que seguir
      var r = host.getBoundingClientRect();
      tx = (ev.clientX - r.left) * dpr;
      ty = (ev.clientY - r.top) * dpr;
    }, sigPasivo);
    host.addEventListener('pointerleave', function () {
      tx = -9999; ty = -9999;
    }, sigPasivo);

    // La GPU nos puede sacar el contexto (suspensión, cambio de placa, driver).
    // Si pasa, apagamos todo y volvemos al fondo CSS en vez de dejar un canvas
    // negro tapando el hero.
    cv.addEventListener('webglcontextlost', function (ev) {
      ev.preventDefault();
      detener();
      muerto = true;
      cv.setAttribute(ATTR_ESTADO, 'fallback');
    }, sig);

    // Las webfonts cambian el ancho de los glifos: hay que volver a medir.
    if (document.fonts) {
      document.fonts.ready.then(refrescarMascara).catch(function () {});
      if (document.fonts.addEventListener) {
        document.fonts.addEventListener('loadingdone', refrescarMascara, sig);
      }
    }

    redimensionar();

    var inst = {
      canvas: cv,
      host: host,
      // Ganchos para medir contraste / depurar desde fuera. No los usa el módulo.
      rectTexto: function () { return medirTexto(host, dpr); },
      frame: function (t, x, y, a) { fx.frame(t, x, y, a); },
      destruir: function () {
        detener();
        muerto = true;
        abortar.abort();
        if (roHost) roHost.disconnect();
        if (roTexto) roTexto.disconnect();
        if (io) io.disconnect();
        if (env.mq.removeListener) { try { env.mq.removeListener(cambioReduce); } catch (e) {} }
        fx.liberar();
        delete cv.__heroFx;

        // Un canvas al que le soltamos el contexto ya no sirve: getContext()
        // devolvería el mismo contexto perdido y un montar() posterior fallaría
        // en silencio. Lo reemplazamos por uno virgen con los mismos atributos,
        // para que el hero quede en su fondo CSS y se pueda volver a montar.
        var limpio = cv.cloneNode(false);
        limpio.removeAttribute(ATTR_ESTADO);
        limpio.removeAttribute('width');
        limpio.removeAttribute('height');
        if (cv.parentNode) cv.parentNode.replaceChild(limpio, cv);

        var k = instancias.indexOf(inst);
        if (k >= 0) instancias.splice(k, 1);
      }
    };
    cv.__heroFx = inst;
    instancias.push(inst);
    return inst;
  }

  function montar(raiz) {
    var nodos = (raiz || document).querySelectorAll(SEL_CANVAS);
    for (var i = 0; i < nodos.length; i++) {
      if (nodos[i].tagName === 'CANVAS') {
        try { montarUno(nodos[i]); } catch (err) { nodos[i].setAttribute(ATTR_ESTADO, 'fallback'); }
      }
    }
    return instancias.slice();
  }

  function destruir() {
    while (instancias.length) instancias[0].destruir();
  }

  // API mínima para el mantenimiento: volver a montar tras un render dinámico,
  // o apagar todo. Llamar montar() dos veces NO duplica nada.
  window.ZeebenHeroFX = {
    montar: montar,
    destruir: destruir,
    instancias: function () { return instancias.slice(); }
  };

  // Con `defer` esto corre con el DOM ya parseado; el `if` cubre el caso de que
  // alguien lo cargue de otra forma.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { montar(); }, { once: true });
  } else {
    montar();
  }
})();
