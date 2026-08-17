/* Zeeben Labs — demo en vivo del hero
   La conversación de la izquierda escribe la agenda de la derecha.

   Reglas que respeta todo el archivo:
   1. El hero se lee entero sin este script. Titular, bajada y botones son HTML
      plano; acá solo se llenan las dos cajas de la demo, que tienen alto
      reservado en CSS. Si esto no carga, no se mueve un píxel.
   2. El guion de arranque NO llama a la IA. Corre con texto preparado: es
      instantáneo, siempre igual y no gasta cuota. El modelo entra recién
      cuando el visitante escribe algo.
   3. Si el Worker falla, está limitado o tarda, hay respuestas locales. La
      demo nunca queda muda: sería peor que no tenerla.
*/
(() => {
  'use strict';

  const raiz = document.querySelector('[data-demo]');
  if (!raiz) return;

  const WORKER = 'https://cv-damian-assistant.tech-fx-dam.workers.dev';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hilo    = raiz.querySelector('[data-demo-hilo]');
  const lista   = raiz.querySelector('[data-demo-lista]');
  const cuenta  = raiz.querySelector('[data-demo-cuenta]');
  const entrada = raiz.querySelector('[data-demo-entrada]');
  const form    = raiz.querySelector('[data-demo-form]');
  if (!hilo || !lista || !form) return;

  /* ── Contenido por rubro ───────────────────────────────────────────────
     Los tres comparten motor; solo cambian los textos. Es exactamente lo
     que pasa con el producto real, y por eso la demo lo puede mostrar. */
  const RUBROS = {
    salud: {
      ini: 'C', quien: 'Consultorio', titulo: 'Agenda de hoy', pedir: 'Pedí un turno…',
      horarios: ['15:00', '16:10', '17:20', '18:40', '09:30', '11:00'],
      previos: [['09:00', 'M. Gauto', '30 min'], ['11:30', 'R. Benítez', '30 min']],
      guion: [
        ['Hola, necesito un turno', 'mia', null],
        ['¡Hola! Tengo hoy 15:00 o 17:20. ¿Cuál te viene mejor?', 'suya', null],
        ['17:20 está perfecto', 'mia', null],
        ['Listo. ¿Me pasás tu nombre?', 'suya', null],
        ['Lucía Ortiz', 'mia', null],
        ['Agendado, Lucía: hoy 17:20. Te aviso dos horas antes 👋', 'suya', ['17:20', 'L. Ortiz', '30 min']],
      ],
      local: [
        [/(precio|cuanto|cuánto|sale|cuesta|vale)/i, 'La consulta sale ₲180.000. ¿Te agendo?', null],
        [/(turno|cita|hora|reserva|agenda)/i, 'Te agendo hoy 18:40. ¿Te sirve?', ['18:40', 'Vos', '30 min']],
        [/(mañana|manana)/i, 'Mañana tengo 09:30 libre. Te lo reservo.', ['09:30', 'Vos', '30 min']],
        [/./, 'Eso se lo paso a la doctora. ¿Querés que te agende igual? Tengo 18:40.', null],
      ],
    },
    gastro: {
      ini: 'R', quien: 'Restaurante', titulo: 'Reservas de hoy', pedir: 'Reservá una mesa…',
      horarios: ['19:30', '20:30', '21:00', '21:30', '22:00'],
      previos: [['20:00', 'Fam. Cáceres', '4 pers.'], ['20:30', 'J. Rolón', '2 pers.']],
      guion: [
        ['Buenas, ¿tienen mesa para hoy?', 'mia', null],
        ['¡Hola! Sí. ¿Para cuántas personas y a qué hora?', 'suya', null],
        ['Somos 6, tipo 21hs', 'mia', null],
        ['Perfecto, 21:00 para 6. ¿A nombre de quién?', 'suya', null],
        ['Duarte', 'mia', null],
        ['Reservado, Duarte: hoy 21:00, mesa para 6 🍽️', 'suya', ['21:00', 'S. Duarte', '6 pers.']],
      ],
      local: [
        [/(precio|cuanto|cuánto|menu|menú|carta)/i, 'El menú del día está ₲65.000. ¿Te reservo mesa?', null],
        [/(mesa|reserva|lugar|hora)/i, 'Te reservo hoy 21:30. ¿Cuántos son?', ['21:30', 'Vos', '2 pers.']],
        [/(delivery|envio|envío|pedido)/i, 'Hacemos delivery hasta las 23. ¿Querés la carta?', null],
        [/./, 'Te reservo mesa igual. Tengo 21:30 libre, ¿te sirve?', null],
      ],
    },
    estudio: {
      ini: 'E', quien: 'Estudio contable', titulo: 'Reuniones de hoy', pedir: 'Pedí una reunión…',
      horarios: ['15:00', '16:00', '17:00', '09:00', '10:30'],
      previos: [['10:00', 'V. Cabral', 'IVA'], ['12:00', 'F. Ovelar', 'Balance']],
      guion: [
        ['Hola, necesito asesoría por el IVA', 'mia', null],
        ['¡Hola! Te agendo con un contador. ¿Hoy 16:00 o mañana 09:00?', 'suya', null],
        ['Hoy 16 me sirve', 'mia', null],
        ['Genial. ¿Nombre y RUC?', 'suya', null],
        ['Paula Riquelme', 'mia', null],
        ['Agendada, Paula: hoy 16:00. Te mando qué traer 📄', 'suya', ['16:00', 'P. Riquelme', 'IVA']],
      ],
      local: [
        [/(precio|cuanto|cuánto|honorario|sale)/i, 'La primera consulta es sin cargo. ¿Te agendo?', null],
        [/(reunion|reunión|turno|cita|hora)/i, 'Te agendo hoy 17:00 con un contador.', ['17:00', 'Vos', 'Consulta']],
        [/(iva|balance|impuesto|renta|factura)/i, 'Eso lo vemos en reunión. Tengo hoy 17:00, ¿te sirve?', ['17:00', 'Vos', 'Consulta']],
        [/./, 'Te agendo una consulta sin cargo. Tengo hoy 17:00.', null],
      ],
    },
  };

  let rubro = 'salud';
  let tomado = false;          // el visitante escribió: se calla el guion
  let tGuion = null;
  let citas = 0;
  let historial = [];

  /* Cada cambio de rubro abre una "generación" nueva. Limpiar el hilo no
     alcanzaba: el guion es una secuencia con pausas, y al cambiar de rubro
     seguía vivo dormido en un await — cuando despertaba escribía sus globos en
     la conversación nueva y se mezclaban las tres. Ahora todo lo que escribe
     verifica primero que su generación siga siendo la vigente. */
  let generacion = 0;
  const vigente = gen => gen === generacion;

  const hora = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const esperar = ms => new Promise(r => setTimeout(r, reduce ? 40 : ms));

  function decir(txt, quien) {
    const p = document.createElement('div');
    p.className = 'glob glob--' + quien;
    p.textContent = txt;                      // textContent: nada de lo que venga
    const t = document.createElement('time');  // del modelo se interpreta como HTML
    t.textContent = hora();
    p.appendChild(t);
    hilo.appendChild(p);
    hilo.scrollTop = hilo.scrollHeight;
  }

  async function pensando(ms, gen) {
    const p = document.createElement('div');
    p.className = 'puntos';
    p.innerHTML = '<i></i><i></i><i></i>';
    hilo.appendChild(p);
    hilo.scrollTop = hilo.scrollHeight;
    await esperar(ms);
    p.remove();
    return gen === undefined || vigente(gen);
  }

  /* ── Horarios ──────────────────────────────────────────────────────────
     La agenda no puede aceptar dos cosas a la misma hora: un sistema que pisa
     turnos no es el que estamos vendiendo. Si el horario pedido está ocupado
     se busca el siguiente libre del rubro y el bot lo dice. */
  const ocupadas = () =>
    new Set([...lista.children].map(c => c.querySelector('time').textContent));

  function estaOcupada(h) { return ocupadas().has(h); }

  function proximaLibre(desde) {
    const usadas = ocupadas();
    const libres = RUBROS[rubro].horarios
      .filter(h => !usadas.has(h) && h !== desde)
      .sort();
    // Se prefiere un horario POSTERIOR al pedido: si alguien pide las 17:20 y
    // se le ofrece las 15:00, suena a que no se entendió. Recién si no queda
    // nada más tarde se propone uno anterior.
    return libres.find(h => h > desde) || libres[0] || null;
  }

  function agendar([h, quien, detalle], nueva) {
    if (estaOcupada(h)) return false;
    const d = document.createElement('div');
    d.className = 'cita' + (nueva ? ' nueva' : '');
    const t = document.createElement('time'); t.textContent = h;
    const s = document.createElement('span'); s.textContent = quien;
    const e = document.createElement('em');   e.textContent = detalle;
    d.append(t, s, e);
    // Insertado por horario: una agenda desordenada no se lee como agenda.
    const posterior = [...lista.children].find(c => c.querySelector('time').textContent > h);
    lista.insertBefore(d, posterior || null);
    cuenta.textContent = ++citas;
    while (lista.children.length > 4) lista.lastChild.remove();

    // En un celular entran dos filas. Si el turno recién agendado cae tercero,
    // el chat dice "agendado 17:20" y el 17:20 no se ve: se corta justo la
    // cadena que la demo existe para mostrar. Por eso se lo trae a la vista.
    if (nueva) {
      const tope = d.offsetTop - (lista.clientHeight - d.offsetHeight);
      if (tope > 0) lista.scrollTo({ top: tope, behavior: reduce ? 'auto' : 'smooth' });
    }
    return true;
  }

  function pintarRubro() {
    const R = RUBROS[rubro];
    raiz.querySelector('[data-demo-ini]').textContent = R.ini;
    raiz.querySelector('[data-demo-quien]').textContent = R.quien;
    raiz.querySelector('[data-demo-titulo]').textContent = R.titulo;
    entrada.placeholder = R.pedir;
    hilo.innerHTML = ''; lista.innerHTML = '';
    citas = 0; cuenta.textContent = '0'; historial = [];
    R.previos.forEach(c => agendar(c, false));
  }

  async function correrGuion(gen) {
    for (const [txt, quien, cita] of RUBROS[rubro].guion) {
      if (tomado || !vigente(gen)) return;
      await esperar(quien === 'mia' ? 950 : 700);
      if (tomado || !vigente(gen)) return;
      if (quien === 'suya') {
        const sigue = await pensando(620, gen);
        if (tomado || !sigue) return;
      }
      decir(txt, quien);
      if (cita) {
        await esperar(340);
        if (!vigente(gen)) return;
        agendar(cita, true);
      }
    }
  }

  /* ── Respuesta del visitante ───────────────────────────────────────────
     Se le pregunta al Worker, que corre el modelo haciendo de recepcionista
     del rubro elegido. Si no contesta a tiempo o falla, responden las reglas
     locales: una demo muda es peor que una demo simple. */
  async function responder(texto, gen) {
    const R = RUBROS[rubro];
    let respuesta = null, turno = null;

    try {
      const corte = new AbortController();
      const reloj = setTimeout(() => corte.abort(), 7000);
      /* La agenda viaja con cada mensaje. Sin esto el Worker recita una lista
         de horarios escrita a mano en su prompt y ofrece turnos que ya están
         tomados, porque el estado real solo existe acá. Una sola fuente de
         verdad: la agenda que el visitante está viendo. */
      const tomados = [...ocupadas()];
      const res = await fetch(WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: texto, modo: 'demo', rubro,
          agenda: {
            ocupados: tomados,
            libres: R.horarios.filter(h => !tomados.includes(h)),
          },
          history: historial.slice(-6),
        }),
        signal: corte.signal,
      });
      clearTimeout(reloj);
      if (res.ok) {
        const d = await res.json();
        // Solo se confía en la respuesta si el Worker se identifica como
        // capaz de atender la demo. Un Worker anterior contestaría igual,
        // pero como asistente de Zeeben — fuera de personaje y confuso.
        if (d && d.modo === 'demo' && typeof d.answer === 'string' && d.answer.trim()) {
          respuesta = d.answer.trim();
          if (d.turno && /^([01]?\d|2[0-3]):[0-5]\d$/.test(d.turno.hora || '')) {
            turno = [d.turno.hora, (d.turno.nombre || 'Vos').slice(0, 22), R.previos[0][2]];
          }
        }
      }
    } catch { /* sin red, cortado por tiempo o Worker caído: seguimos abajo */ }

    if (!respuesta) {
      const [, txt, cita] = R.local.find(([re]) => re.test(texto));
      respuesta = txt; turno = cita;
    }

    if (!vigente(gen)) return;   // cambió de rubro mientras se esperaba al Worker

    /* Choque de horario. Si el turno propuesto pisa uno existente, se corrige
       ANTES de mostrar la respuesta: el bot ofrece el siguiente libre en vez de
       anunciar una hora que no va a poder dar. Antes agendaba encima sin decir
       nada, que es exactamente lo que un sistema de turnos no puede hacer. */
    if (turno && estaOcupada(turno[0])) {
      const alterna = proximaLibre(turno[0]);
      if (alterna) {
        respuesta = `Las ${turno[0]} ya están tomadas. Te puedo dar ${alterna}, ¿te sirve?`;
        turno = [alterna, turno[1], turno[2]];
      } else {
        respuesta = `Hoy ya tengo todo ocupado. ¿Te busco lugar para mañana?`;
        turno = null;
      }
    }

    decir(respuesta, 'suya');
    historial.push({ role: 'user', content: texto }, { role: 'assistant', content: respuesta });
    if (turno) {
      await esperar(340);
      if (vigente(gen)) agendar(turno, true);
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const txt = entrada.value.trim();
    if (!txt) return;
    const gen = generacion;
    tomado = true; clearTimeout(tGuion);
    decir(txt, 'mia');
    entrada.value = '';
    if (!await pensando(500, gen)) return;
    await responder(txt, gen);
  });

  raiz.querySelectorAll('.rubros button').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.rubro === rubro) return;      // ya está elegido
      raiz.querySelectorAll('.rubros button')
        .forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      rubro = b.dataset.rubro;
      // Invalida todo lo que esté en vuelo: guiones dormidos en una pausa y
      // respuestas del Worker que todavía no volvieron.
      generacion++;
      const gen = generacion;
      tomado = false; clearTimeout(tGuion);
      pintarRubro();
      tGuion = setTimeout(() => correrGuion(gen), 420);
    });
  });

  /* Arranca cuando el hero está a la vista. Si el visitante entró y se fue
     sin mirar, no corrió ni un timer. */
  pintarRubro();
  const arrancar = () => {
    if (tomado) return;
    const gen = generacion;
    tGuion = setTimeout(() => correrGuion(gen), 500);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { io.disconnect(); arrancar(); }
    }, { threshold: .25 });
    io.observe(raiz);
  } else {
    arrancar();
  }
})();
