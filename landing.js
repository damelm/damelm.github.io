/* ============================================================
   Zeeben Labs — landing v2
   Menú móvil, revelado al scroll, contadores y barra de CTA.
   Sin dependencias. Reemplaza a app.js para la landing corta.
   ============================================================ */
(function () {
  "use strict";

  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menú móvil ---------- */
  var burger = document.querySelector('[data-burger]');
  var links = document.getElementById('nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var abierto = links.classList.toggle('abierto');
      burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('abierto');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- revelado al entrar en pantalla ---------- */
  var aRevelar = document.querySelectorAll('.reveal');
  if (calmo || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(aRevelar, function (el) { el.classList.add('visible'); });
  } else {
    var obsRev = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('visible');
        obsRev.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(aRevelar, function (el) { obsRev.observe(el); });
  }

  /* ---------- contadores ----------
     El valor final vive en el HTML: si el JS falla, la cifra correcta ya está.
     Acá se reinicia y se anima hasta ese mismo número. */
  var contadores = document.querySelectorAll('[data-contador]');
  if (!calmo && 'IntersectionObserver' in window) {
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        obsNum.unobserve(el);
        var fin = parseFloat(el.dataset.contador);
        var desde = parseFloat(el.dataset.desde || '0');
        var sufijo = el.dataset.sufijo || '';
        var t0 = null, dur = 900;
        function paso(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur);
          k = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(desde + (fin - desde) * k) + sufijo;
          if (k < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(contadores, function (el) { obsNum.observe(el); });
  }

  /* ---------- barra de acción en móvil ----------
     Aparece recién pasado el hero: antes de eso el visitante todavía no vio
     nada que justifique pedirle algo. */
  var barra = document.querySelector('[data-barra-cta]');
  var hero = document.querySelector('.hero');
  if (barra && hero && 'IntersectionObserver' in window) {
    var obsBarra = new IntersectionObserver(function (entradas) {
      barra.classList.toggle('visible', !entradas[0].isIntersecting);
    }, { threshold: 0, rootMargin: '-60% 0px 0px 0px' });
    obsBarra.observe(hero);
  }

  /* ---------- año del pie ---------- */
  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();
})();
