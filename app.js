/* Zeeben Labs — interacciones base (F1)
   Menú mobile · reveal on scroll · año dinámico (si hiciera falta) */

(() => {
  'use strict';

  // ---- Menú mobile ----
  const nav = document.getElementById('nav');
  const burger = document.querySelector('[data-burger]');
  if (nav && burger) {
    burger.addEventListener('click', () => {
      const open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      burger.setAttribute('aria-expanded', String(!open));
    });
    // Cerrar al navegar
    nav.querySelectorAll('.nav__links a').forEach(a =>
      a.addEventListener('click', () => {
        nav.setAttribute('data-open', 'false');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // ---- Reveal on scroll ----
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }
})();
