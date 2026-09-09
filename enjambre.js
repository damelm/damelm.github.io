/* ============================================================
   Zeeben Labs — el enjambre del hero
   ~5.000 partículas que toman la forma de cada servicio y cierran
   en el sello Z. Un solo draw call; el morphing lo hace la GPU
   (cada partícula lleva dos posiciones y una mezcla escalonada).

   Las formas se muestrean de dibujos en <canvas>: agregar una es
   dibujar líneas, no modelar en 3D.

   Depende de three.js (three.min.js, r147) cargado antes.
   Si no hay WebGL o no cargó three, la escena se oculta y el hero
   queda como texto: la landing no depende de esto para venderse.
   ============================================================ */
(function () {
  "use strict";

  var escenaDiv = document.getElementById('escena');
  if (!escenaDiv || !window.THREE || !window.WebGLRenderingContext) {
    if (escenaDiv) escenaDiv.style.display = 'none';
    return;
  }

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    escenaDiv.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  escenaDiv.insertBefore(renderer.domElement, escenaDiv.firstChild);
  renderer.domElement.setAttribute('aria-label',
    'Animación: una nube de partículas toma la forma de cada servicio de Zeeben Labs');

  var escena = new THREE.Scene();
  var camara = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camara.position.set(0, 0, 6.4);

  /* ---------- muestreo de formas ---------- */
  var N = (matchMedia('(pointer: coarse)').matches ? 3600 : 5200);
  var DUST = Math.floor(N * 0.06);   /* partículas sueltas: aire alrededor */
  var LADO = 512;

  function muestrear(dibujar) {
    var c = document.createElement('canvas'); c.width = c.height = LADO;
    var x = c.getContext('2d');
    x.clearRect(0, 0, LADO, LADO);
    x.strokeStyle = x.fillStyle = '#000';
    x.lineCap = x.lineJoin = 'round';
    dibujar(x);
    var img = x.getImageData(0, 0, LADO, LADO).data;
    var candidatos = [];
    for (var i = 0; i < LADO * LADO; i++) {
      if (img[i * 4 + 3] > 100) candidatos.push(i);
    }
    var pos = new Float32Array(N * 3);
    for (var p = 0; p < N; p++) {
      if (p >= N - DUST || !candidatos.length) {
        var r = 1.7 + Math.random() * 0.5;
        var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        pos[p * 3]     = r * Math.sin(ph) * Math.cos(th);
        pos[p * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
        pos[p * 3 + 2] = r * Math.cos(ph) * 0.5;
        continue;
      }
      var idx = candidatos[(Math.random() * candidatos.length) | 0];
      var px = idx % LADO, py = (idx / LADO) | 0;
      pos[p * 3]     = ((px + Math.random()) / LADO * 2 - 1) * 1.45;
      pos[p * 3 + 1] = -(((py + Math.random()) / LADO) * 2 - 1) * 1.45;
      pos[p * 3 + 2] = (Math.random() * 2 - 1) * 0.14;
    }
    return pos;
  }

  function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }

  /* ancla: id de la tarjeta de servicio a la que salta el chip */
  var formas = [
    {
      id: 'whatsapp', chip: 'WhatsApp y bots', ancla: 'srv-whatsapp',
      voz: '¿Un bot que atiende y agenda solo? Lo construimos.',
      dibujar: function (x) {
        x.lineWidth = 26;
        rr(x, 96, 130, 320, 226, 60); x.stroke();
        x.beginPath(); x.moveTo(150, 340); x.lineTo(128, 410); x.lineTo(216, 352); x.closePath(); x.fill();
        [176, 256, 336].forEach(function (cx) { x.beginPath(); x.arc(cx, 243, 17, 0, 7); x.fill(); });
      }
    },
    {
      id: 'webs', chip: 'Webs completas', ancla: 'srv-webs',
      voz: '¿Tu sitio completo, que traiga consultas? Lo construimos.',
      dibujar: function (x) {
        x.lineWidth = 24;
        rr(x, 70, 112, 372, 296, 30); x.stroke();
        x.lineWidth = 18; x.beginPath(); x.moveTo(76, 186); x.lineTo(436, 186); x.stroke();
        [116, 158, 200].forEach(function (cx) { x.beginPath(); x.arc(cx, 150, 11, 0, 7); x.fill(); });
        x.lineWidth = 17;
        x.beginPath(); x.moveTo(128, 252); x.lineTo(384, 252); x.stroke();
        x.beginPath(); x.moveTo(128, 306); x.lineTo(300, 306); x.stroke();
        x.beginPath(); x.moveTo(128, 356); x.lineTo(348, 356); x.stroke();
      }
    },
    {
      id: 'apps', chip: 'Apps y paneles a medida', ancla: 'srv-apps',
      voz: '¿El panel de toda tu operación? Lo construimos.',
      dibujar: function (x) {
        x.lineWidth = 24;
        rr(x, 70, 112, 372, 296, 30); x.stroke();
        rr(x, 122, 300, 52, 66, 8); x.fill();
        rr(x, 204, 252, 52, 114, 8); x.fill();
        rr(x, 286, 204, 52, 162, 8); x.fill();
        x.lineWidth = 15;
        x.beginPath(); x.moveTo(120, 214); x.lineTo(206, 176); x.lineTo(288, 192); x.lineTo(380, 146); x.stroke();
        x.beginPath(); x.arc(380, 146, 13, 0, 7); x.fill();
      }
    },
    {
      id: 'dominios', chip: 'Dominios y hosting', ancla: 'srv-dominios',
      voz: '¿Dominio, correo y hosting andando? Lo administramos.',
      dibujar: function (x) {
        x.lineWidth = 22;
        x.beginPath(); x.arc(256, 260, 168, 0, 7); x.stroke();
        x.lineWidth = 14;
        x.beginPath(); x.ellipse(256, 260, 66, 168, 0, 0, 7); x.stroke();
        x.beginPath(); x.ellipse(256, 260, 168, 60, 0, 0, 7); x.stroke();
        x.beginPath(); x.moveTo(100, 196); x.lineTo(412, 196); x.stroke();
        x.beginPath(); x.moveTo(100, 324); x.lineTo(412, 324); x.stroke();
      }
    },
    {
      id: 'infra', chip: 'Infraestructura', ancla: 'srv-infra',
      voz: '¿Los servidores de abajo, seguros y tuyos? Los configuramos.',
      dibujar: function (x) {
        x.lineWidth = 24;
        rr(x, 158, 84, 196, 352, 26); x.stroke();
        x.lineWidth = 15;
        [152, 216, 280].forEach(function (y) {
          x.beginPath(); x.moveTo(192, y); x.lineTo(320, y); x.stroke();
        });
        x.beginPath(); x.arc(206, 376, 12, 0, 7); x.fill();
        x.beginPath(); x.arc(250, 376, 12, 0, 7); x.fill();
      }
    },
    {
      id: 'z', chip: null, ancla: null,
      voz: 'La misma ingeniería. La forma que tu negocio necesite.',
      dibujar: null   /* se completa cuando carga el isotipo */
    }
  ];

  /* ---------- geometría + shader ---------- */
  var geo = new THREE.BufferGeometry();
  var posInicial = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r0 = 1.4 * Math.cbrt(Math.random());
    var th0 = Math.random() * Math.PI * 2, ph0 = Math.acos(2 * Math.random() - 1);
    posInicial[i * 3]     = r0 * Math.sin(ph0) * Math.cos(th0);
    posInicial[i * 3 + 1] = r0 * Math.sin(ph0) * Math.sin(th0);
    posInicial[i * 3 + 2] = r0 * Math.cos(ph0) * 0.4;
  }
  var rands = new Float32Array(N);
  for (var i2 = 0; i2 < N; i2++) rands[i2] = Math.random();

  geo.setAttribute('position', new THREE.BufferAttribute(posInicial, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(posInicial.slice(), 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));

  var uniforms = {
    uMix:  { value: 1 },
    uTime: { value: 0 },
    uSize: { value: 30 * Math.min(window.devicePixelRatio || 1, 2) }
  };
  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: [
      'attribute vec3 aTarget;',
      'attribute float aRand;',
      'uniform float uMix; uniform float uTime; uniform float uSize;',
      'varying float vRand;',
      'void main(){',
      /* el desfase por aRand hace que la nube "fluya" en vez de moverse en bloque */
      '  float m = smoothstep(0.0, 1.0, clamp(uMix*1.35 - aRand*0.35, 0.0, 1.0));',
      '  vec3 p = mix(position, aTarget, m);',
      '  p += 0.022*vec3(sin(uTime*1.3+aRand*40.0), cos(uTime*1.1+aRand*31.0), sin(uTime*0.9+aRand*53.0));',
      '  vec4 mv = modelViewMatrix*vec4(p,1.0);',
      '  gl_PointSize = uSize*(1.9/-mv.z)*(0.6+aRand*0.8);',
      '  gl_Position = projectionMatrix*mv;',
      '  vRand = aRand;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vRand;',
      'void main(){',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.28, d)*(0.55+vRand*0.4);',
      '  vec3 oscuro = vec3(0.039, 0.365, 0.510);',
      '  vec3 claro  = vec3(0.204, 0.824, 0.984);',
      '  gl_FragColor = vec4(mix(oscuro, claro, vRand*vRand), a);',
      '}'
    ].join('\n')
  });
  var nube = new THREE.Points(geo, material);
  escena.add(nube);

  var objetivos = {};
  formas.forEach(function (f) { if (f.dibujar) objetivos[f.id] = muestrear(f.dibujar); });

  var pendienteZ = false;
  var imgZ = new Image();
  imgZ.onload = function () {
    objetivos.z = muestrear(function (x) {
      var w = 380, h = w * imgZ.height / imgZ.width;
      x.drawImage(imgZ, (LADO - w) / 2, (LADO - h) / 2, w, h);
    });
    if (pendienteZ) { irA('z'); pendienteZ = false; }
  };
  imgZ.src = 'assets/isotype-z.webp';

  /* ---------- transiciones ---------- */
  var vozEl = document.getElementById('voz');
  var destinoEl = document.getElementById('destino');
  var actual = null;

  function irA(id) {
    var destino3 = objetivos[id];
    if (!destino3) { if (id === 'z') pendienteZ = true; return; }

    /* hornear la posición visible actual (misma fórmula que el shader)
       para que la transición arranque desde donde se ve, no desde el origen */
    var pos = geo.attributes.position.array;
    var tgt = geo.attributes.aTarget.array;
    var mixU = uniforms.uMix.value;
    for (var i = 0; i < N; i++) {
      var m = Math.min(1, Math.max(0, mixU * 1.35 - rands[i] * 0.35));
      m = m * m * (3 - 2 * m);
      pos[i * 3]     += (tgt[i * 3]     - pos[i * 3])     * m;
      pos[i * 3 + 1] += (tgt[i * 3 + 1] - pos[i * 3 + 1]) * m;
      pos[i * 3 + 2] += (tgt[i * 3 + 2] - pos[i * 3 + 2]) * m;
    }
    tgt.set(destino3);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aTarget.needsUpdate = true;
    uniforms.uMix.value = reducido ? 1 : 0;
    actual = id;

    var f = formas.filter(function (x) { return x.id === id; })[0];
    if (vozEl) {
      vozEl.classList.add('saliendo');
      setTimeout(function () { vozEl.textContent = f.voz; vozEl.classList.remove('saliendo'); }, 250);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.formas button'), function (b) {
      b.classList.toggle('activa', b.dataset.forma === id);
    });
    if (destinoEl) {
      destinoEl.innerHTML = f.ancla
        ? '<a href="#' + f.ancla + '">Ver ' + f.chip.toLowerCase() + ' &rarr;</a>'
        : '&nbsp;';
    }
    pedirFrame();
  }

  /* chips: cambian la forma; si ya estaba en esa forma, bajan a la tarjeta */
  var contFormas = document.getElementById('formas');
  if (contFormas) {
    formas.forEach(function (f) {
      if (!f.chip) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = f.chip;
      b.dataset.forma = f.id;
      b.addEventListener('click', function () {
        manual = reloj.elapsedTime;
        if (actual === f.id && f.ancla) {
          var destino = document.getElementById(f.ancla);
          if (destino) destino.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'center' });
        } else {
          irA(f.id);
        }
      });
      contFormas.appendChild(b);
    });
  }

  /* ---------- ciclo automático ---------- */
  var orden = ['whatsapp', 'webs', 'apps', 'dominios', 'infra', 'z'];
  var cicloI = 0, ultimoCambio = 0, manual = -99;

  /* ---------- arrastre ---------- */
  var rotY = 0, rotX = 0, rotYObj = 0, rotXObj = 0;
  var arrastrando = false, px = 0, py = 0;
  var dom = renderer.domElement;
  dom.addEventListener('pointerdown', function (e) {
    arrastrando = true; px = e.clientX; py = e.clientY;
    dom.setPointerCapture(e.pointerId);
  });
  dom.addEventListener('pointermove', function (e) {
    if (!arrastrando) return;
    rotYObj = Math.max(-0.7, Math.min(0.7, rotYObj + (e.clientX - px) * 0.004));
    rotXObj = Math.max(-0.4, Math.min(0.4, rotXObj + (e.clientY - py) * 0.003));
    px = e.clientX; py = e.clientY;
    pedirFrame();
  });
  window.addEventListener('pointerup', function () {
    arrastrando = false; rotYObj *= 0.4; rotXObj *= 0.4;
  });

  /* ---------- tamaño ---------- */
  function redimensionar() {
    /* Se mide el canvas y no el contenedor: en móvil los chips salen del
       absoluto y viven debajo, así que .escena crece y ya no representa el
       alto del lienzo. setSize(...,false) no toca el CSS. */
    var w = dom.clientWidth, h = dom.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.position.z = (camara.aspect < 0.95) ? 7.8 : 6.4;
    camara.updateProjectionMatrix();
    pedirFrame();
  }
  window.addEventListener('resize', redimensionar);

  /* ---------- bucle: solo corre cuando se ve ---------- */
  var reloj = new THREE.Clock();
  var visible = true, pestanaActiva = !document.hidden, rafId = null, framePedido = false;

  function pedirFrame() {
    if (reducido && !rafId) { framePedido = true; arrancar(); }
  }
  function animar() {
    rafId = requestAnimationFrame(animar);
    var dt = Math.min(reloj.getDelta(), 0.05);
    var t = reloj.elapsedTime;
    uniforms.uTime.value = t;

    if (!reducido) {
      if (uniforms.uMix.value < 1) uniforms.uMix.value = Math.min(1, uniforms.uMix.value + dt * 0.9);
      /* el sello Z se queda un poco más; un click manual pausa el ciclo 7s */
      var espera = (actual === 'z') ? 4.6 : 3.4;
      if (t - ultimoCambio > espera && t - manual > 7) {
        cicloI = (cicloI + 1) % orden.length;
        ultimoCambio = t;
        irA(orden[cicloI]);
      }
      rotY += ((rotYObj + Math.sin(t * 0.16) * 0.14) - rotY) * 0.05;
      rotX += (rotXObj - rotX) * 0.05;
    } else {
      rotY += (rotYObj - rotY) * 0.1;
      rotX += (rotXObj - rotX) * 0.1;
    }
    nube.rotation.y = rotY;
    nube.rotation.x = rotX;

    renderer.render(escena, camara);

    if (reducido) {
      if (!arrastrando && !framePedido) detener();
      framePedido = false;
    } else if (!visible || !pestanaActiva) {
      detener();
    }
  }
  function arrancar() { if (!rafId) { reloj.getDelta(); animar(); } }
  function detener() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  var observador = new IntersectionObserver(function (entradas) {
    visible = entradas[0].isIntersecting;
    if (visible && pestanaActiva) arrancar();
  }, { threshold: 0.12 });
  observador.observe(escenaDiv);

  document.addEventListener('visibilitychange', function () {
    pestanaActiva = !document.hidden;
    if (pestanaActiva && visible) arrancar();
  });

  redimensionar();
  if (reducido) {
    irA('z');              /* quieto en el sello; los chips igual cambian la forma */
    arrancar();
  } else {
    ultimoCambio = 0.6;    /* el primer morphing arranca enseguida */
    irA('whatsapp');
    arrancar();
  }
})();
