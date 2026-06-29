/* Zeeben Labs — interacciones base (F1)
   Menú mobile · reveal on scroll · año dinámico (si hiciera falta) */

(() => {
  'use strict';

  // ---- Menú mobile ----
  const nav = document.getElementById('nav');
  const burger = document.querySelector('[data-burger]');
  if (nav && burger) {
    const setMenu = (open) => {
      nav.setAttribute('data-open', String(open));
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => {
      const open = nav.getAttribute('data-open') === 'true';
      setMenu(!open);
      if (!open) { const a = nav.querySelector('.nav__links a'); if (a) a.focus(); }
    });
    nav.querySelectorAll('.nav__links a').forEach(a =>
      a.addEventListener('click', () => setMenu(false))
    );
    nav.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') { setMenu(false); burger.focus(); }
    });
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

  // ---- Modales (con trampa y restitución de foco) ----
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
})();
