/* ============================================================
   Zeeben Labs — landing v3
   Dueño de la interfaz: arma las etiquetas, cambia el panel y le
   pide al enjambre que se arme en la forma correspondiente.

   Vive aparte de enjambre.js a propósito: si three.js no carga o
   el equipo no tiene WebGL, las etiquetas y los paneles siguen
   funcionando igual. La animación es el envoltorio, no el sitio.
   ============================================================ */
(function () {
  "use strict";

  /* Fuente de verdad de la navegación. `voz` es la línea que aparece
     sobre el enjambre mientras cicla solo. */
  var FORMAS = [
    { id: 'apps',      chip: 'Apps y paneles',     voz: '¿El panel de toda tu operación? Lo construimos.' },
    { id: 'webs',      chip: 'Webs completas',     voz: '¿Tu sitio completo, que traiga consultas? Lo construimos.' },
    { id: 'whatsapp',  chip: 'WhatsApp y bots',    voz: '¿Un bot que atiende y agenda solo? Lo construimos.' },
    { id: 'dominios',  chip: 'Dominios y hosting', voz: '¿Dominio, correo y hosting andando? Lo administramos.' },
    { id: 'infra',     chip: 'Infraestructura',    voz: '¿Los servidores de abajo, seguros y tuyos? Los configuramos.' },
    { id: 'proyectos', chip: 'Proyectos',          voz: 'Seis clientes con sistemas corriendo hoy.' },
    { id: 'contacto',  chip: 'Contacto',           voz: 'Contanos qué te consume tiempo. Respondemos en minutos.' }
  ];

  var contFormas = document.getElementById('formas');
  var vozEl = document.getElementById('voz');
  var paneles = document.getElementById('paneles');
  var pista = document.getElementById('pista');
  if (!contFormas || !paneles) return;

  var actual = null;

  function panel(id) { return document.getElementById('pnl-' + id); }

  /* Muestra el panel de `id`. Sin argumento vuelve al de inicio. */
  /* El resaltado del ciclo se limpia apenas la persona elige: a partir de ahi
     el unico estado que importa es el que eligio ella. */
  function limpiarCiclo() {
    Array.prototype.forEach.call(contFormas.children, function (b) {
      b.classList.remove('en-ciclo');
    });
  }

  function mostrar(id) {
    var destino = panel(id) || panel('inicio');
    Array.prototype.forEach.call(paneles.children, function (p) {
      p.hidden = (p !== destino);
    });
    /* reinicia la animación de entrada */
    destino.style.animation = 'none';
    void destino.offsetWidth;
    destino.style.animation = '';

    Array.prototype.forEach.call(contFormas.children, function (b) {
      var esta = b.dataset.forma === id;
      b.classList.toggle('activa', esta);
      b.setAttribute('aria-pressed', esta ? 'true' : 'false');
    });
    actual = id;
  }

  function decir(texto) {
    if (!vozEl) return;
    vozEl.classList.add('saliendo');
    setTimeout(function () {
      vozEl.textContent = texto;
      vozEl.classList.remove('saliendo');
    }, 220);
  }

  /* ---------- etiquetas ---------- */
  FORMAS.forEach(function (f, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = f.chip;
    b.dataset.forma = f.id;
    b.setAttribute('aria-pressed', 'false');
    b.style.animationDelay = (0.25 + i * 0.06) + 's';   /* entrada escalonada */
    b.addEventListener('click', function () {
      if (pista) pista.classList.add('oculta');   /* ya cumplio su trabajo */
      limpiarCiclo();
      if (actual === f.id) {          /* segundo toque: vuelve al inicio */
        mostrar('inicio');
        decir('La misma ingeniería. La forma que tu negocio necesite.');
        if (window.Enjambre) window.Enjambre.irA('z');
        return;
      }
      mostrar(f.id);
      decir(f.voz);
      if (window.Enjambre) {
        window.Enjambre.pausar();     /* el ciclo automático se detiene: mandás vos */
        window.Enjambre.irA(f.id);
      }
    });
    contFormas.appendChild(b);
  });

  /* ---------- interfaz para enjambre.js ---------- */
  window.ZB = {
    ORDEN: FORMAS.map(function (f) { return f.id; }),
    /* El ciclo automático cambia la forma y la línea de arriba, pero NO el
       panel: la información aparece cuando la persona la pide, no sola. */
    cicla: function (id) {
      var f = FORMAS.filter(function (x) { return x.id === id; })[0];
      decir(f ? f.voz : 'La misma ingeniería. La forma que tu negocio necesite.');
      /* Enciende la etiqueta de la forma que se esta armando. Esto es lo que
         hace evidente que las etiquetas y la nube son la misma cosa. */
      Array.prototype.forEach.call(contFormas.children, function (b) {
        b.classList.toggle('en-ciclo', b.dataset.forma === id);
      });
    }
  };

  /* ---------- año del pie ---------- */
  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();
})();
