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
    { id: 'zeezee',    chip: 'ZeeZee',            voz: 'ZeeZee: todos tus chats en una ventana. Gratis.' },
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

  /* ---------- tema ----------
     El oscuro es el default (vive en :root del CSS). Este boton solo agrega
     o saca el atributo, lo guarda, y avisa al enjambre para que repinte las
     particulas: sobre fondo oscuro el azul profundo se pierde. */
  var btnTema = document.getElementById('tema');
  if (btnTema) {
    var raiz = document.documentElement;
    var metaColor = document.querySelector('meta[name="theme-color"]');

    function aplicar(tema, guardar) {
      if (tema === 'claro') raiz.setAttribute('data-tema', 'claro');
      else raiz.removeAttribute('data-tema');
      btnTema.setAttribute('aria-label',
        tema === 'claro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
      if (metaColor) metaColor.setAttribute('content', tema === 'claro' ? '#F6F8FC' : '#070E1C');
      if (guardar) { try { localStorage.setItem('zb-tema', tema); } catch (e) {} }
      if (window.Enjambre && window.Enjambre.repintar) window.Enjambre.repintar(tema);
    }

    var inicial = raiz.getAttribute('data-tema') === 'claro' ? 'claro' : 'oscuro';
    aplicar(inicial, false);

    btnTema.addEventListener('click', function () {
      aplicar(raiz.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro', true);
    });

    /* El enjambre carga despues que este script: cuando aparezca, que se pinte
       con el tema que ya esta puesto. */
    window.ZB_TEMA = function () {
      return raiz.getAttribute('data-tema') === 'claro' ? 'claro' : 'oscuro';
    };
  }

  /* ---------- apertura por enlace ----------
     Permite mandar zeebenlabs.com/#descargar y que caiga en ZeeZee. Las
     etiquetas son el menu de este sitio, asi que el hash es el unico modo
     de enlazar un panel puntual desde afuera. */
  var ALIAS = { descargar: 'zeezee', descarga: 'zeezee' };
  var hash = (location.hash || '').replace('#', '');
  var pedido = ALIAS[hash] || hash;
  if (pedido && panel(pedido)) {
    mostrar(pedido);
    var fIni = FORMAS.filter(function (x) { return x.id === pedido; })[0];
    if (fIni) decir(fIni.voz);
    if (pista) pista.classList.add('oculta');
    /* El enjambre carga despues que este script: si todavia no esta, le deja
       la orden anotada y la toma al arrancar. */
    if (window.Enjambre) { window.Enjambre.pausar(); window.Enjambre.irA(pedido); }
    else { window.ZB_INICIAL = pedido; }
  }

  /* ---------- año del pie ---------- */
  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();
})();
