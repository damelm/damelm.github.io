/* ============================================================
   data.js — Contenido del CV (bilingüe ES/EN). Única fuente de verdad.
   Portado del artifact original (dc-runtime) a JS vanilla.
   ============================================================ */

const STACK = [
  { name: 'Python',     icon: 'simple-icons:python' },
  { name: 'Django',     icon: 'simple-icons:django' },
  { name: 'JavaScript', icon: 'simple-icons:javascript' },
  { name: 'TypeScript', icon: 'simple-icons:typescript' },
  { name: 'Docker',     icon: 'simple-icons:docker' },
  { name: 'Linux',      icon: 'simple-icons:linux' },
  { name: 'PostgreSQL', icon: 'simple-icons:postgresql' },
  { name: 'Redis',      icon: 'simple-icons:redis' },
  { name: 'Nginx',      icon: 'simple-icons:nginx' },
  { name: 'Cloudflare', icon: 'simple-icons:cloudflare' },
  { name: 'Git',        icon: 'simple-icons:git' },
  { name: 'Arduino',    icon: 'simple-icons:arduino' }
];

const DATA = {
  stats: [
    { target: 15, suffix: '+', label: { es: 'Años de experiencia', en: 'Years of experience' } },
    { target: 6,  suffix: '',  label: { es: 'Países conectados', en: 'Countries connected' } },
    { target: 250, suffix: '+', label: { es: 'Equipos gestionados', en: 'Devices managed' } },
    { target: 6,  suffix: '',  label: { es: 'Herramientas en producción', en: 'Tools in production' } }
  ],
  services: [
    { icon: 'lucide:sparkles',     lead: true, title: { es: 'Software y automatización con IA', en: 'AI software & automation' }, desc: { es: 'Te saco de encima el trabajo repetitivo: apps a medida, automatizaciones y agentes que tu equipo usa todos los días.', en: 'I take repetitive work off your plate: custom apps, automations and agents your team uses every day.' } },
    { icon: 'lucide:network',      title: { es: 'Infraestructura y redes', en: 'Infrastructure & networks' }, desc: { es: 'Redes, servidores y conectividad multi-sede que andan sin sorpresas. Menos incendios, más tiempo para lo importante.', en: 'Networks, servers and multi-site connectivity that just work. Fewer fires, more time for what matters.' } },
    { icon: 'lucide:shield-check', title: { es: 'Seguridad', en: 'Security' },                            desc: { es: 'Protejo tus equipos y datos: monitoreo, control de accesos y backups, con buenas prácticas y sin licencias carísimas.', en: 'I protect your devices and data: monitoring, access control and backups, best practices without pricey licenses.' } },
    { icon: 'lucide:zap',          title: { es: 'Rápido y a bajo costo', en: 'Fast & low-cost' },          desc: { es: 'Soluciones self-hosted que bajan licencias y costos, y dejan el control en tu empresa.', en: 'Self-hosted solutions that cut licenses and costs, keeping control inside your company.' } }
  ],
  cases: [
    { num: '01', title: { es: 'Sistema de tickets', en: 'Ticketing system' }, desc: { es: 'Centralicé el soporte IT de 3 sedes en una sola plataforma con SLA y tableros.', en: 'Centralized IT support across 3 sites into one platform with SLA and dashboards.' }, result: { es: '~14.400 tickets/año procesados con métricas claras.', en: '~14,400 tickets/year handled with clear metrics.' }, tags: ['Docker', 'Apps Script', 'JS'] },
    { num: '02', title: { es: 'Monitoreo de equipos', en: 'Device monitoring' }, desc: { es: 'Agente propio para tener visibilidad y seguridad sobre 250 equipos de la empresa.', en: 'In-house agent for visibility and security over 250 company devices.' }, result: { es: 'Auditoría de seguridad activa, sin licencias caras.', en: 'Active security auditing, without expensive licenses.' }, tags: ['Python', 'Sysmon', 'HTML'] },
    { num: '03', title: { es: 'Evaluación 360° de RRHH', en: '360° HR evaluation' }, desc: { es: 'Digitalicé las evaluaciones de personal, antes manuales y lentas.', en: 'Digitized staff evaluations that used to be manual and slow.' }, result: { es: 'Resultados consolidados automáticamente.', en: 'Results consolidated automatically.' }, tags: ['Apps Script', 'Docker', 'zrok'] },
    { num: '04', title: { es: 'Conectividad multi-país', en: 'Multi-country connectivity' }, desc: { es: 'Conecté de forma segura a empleados en 6 países con una VPN self-hosted.', en: 'Securely connected employees across 6 countries with a self-hosted VPN.' }, result: { es: 'Acceso confiable sin licencias por usuario.', en: 'Reliable access with no per-user licenses.' }, tags: ['NetBird', 'WireGuard', 'Linux'] },
    { num: '05', title: { es: 'Control de estacionamiento', en: 'Parking management' }, desc: { es: 'Sistema completo de parking: acceso por ticket/QR, caja con arqueo y abonados, integrado con la barrera vía hardware propio.', en: 'Complete parking system: ticket/QR access, cash reconciliation and monthly members, integrated with the barrier via custom hardware.' }, result: { es: 'En producción, gestionando el acceso de un estacionamiento real.', en: 'In production, managing access at a real parking lot.' }, tags: ['Django', 'Arduino', 'QR'] }
  ],
  jobs: [
    { period: { es: '2024 — Hoy', en: '2024 — Now' }, current: true, title: { es: 'Vibe Coder', en: 'Vibe Coder' }, company: 'Grupo7', desc: { es: 'Lidero proyectos de desarrollo basados en IA e incorporo inteligencia artificial a la empresa: herramientas internas, automatizaciones y agentes a medida que potencian cada área.', en: 'I lead AI-based development projects and bring artificial intelligence into the company: internal tools, automations, and custom agents that boost every area.' } },
    { period: { es: '2020 — 2024', en: '2020 — 2024' }, current: false, title: { es: 'Consultor IT & Desarrollo', en: 'IT Consultant & Development' }, company: { es: 'Independiente', en: 'Independent' }, desc: { es: 'Consultoría en redes, soporte y primeros desarrollos a medida para usuarios y pymes.', en: 'Networking consulting, support, and first custom developments for users and SMBs.' } },
    { period: { es: '2014 — 2019', en: '2014 — 2019' }, current: false, title: { es: 'Encargado de Helpdesk', en: 'Helpdesk Lead' }, company: 'ISS', desc: { es: 'Soporte técnico y de redes para grandes cuentas: Telefe, Lenovo, Tetra Pak y Molinos Cañuelas. Gestión de tickets, usuarios y servidores.', en: 'Tech and network support for major accounts: Telefe, Lenovo, Tetra Pak, and Molinos Cañuelas. Ticket, user, and server management.' } },
    { period: { es: '2006 — 2014', en: '2006 — 2014' }, current: false, title: { es: 'Roles técnicos', en: 'Technical roles' }, company: { es: 'Telecom · IT · automatización', en: 'Telecom · IT · automation' }, desc: { es: 'Soporte y redes para grandes clientes, instalación de redes 3G/4G y mis primeros pasos programando.', en: 'Support and networking for large clients, 3G/4G network installation, and my first steps coding.' } }
  ],
  certs: [
    { title: 'AI Fluency: Framework & Foundations',  issuer: 'Anthropic', date: 'Jun 2026', url: 'https://verify.skilljar.com/c/dpwxovnnxhdj' },
    { title: 'Claude Platform 101',                  issuer: 'Anthropic', date: 'Jun 2026', url: 'https://verify.skilljar.com/c/7ssuqbwuk9ag' },
    { title: 'Claude Code 101',                      issuer: 'Anthropic', date: 'Jun 2026', url: 'https://verify.skilljar.com/c/xkttye4xp3tf' },
    { title: 'Claude Code in Action',                issuer: 'Anthropic', date: 'Jun 2026', url: 'https://verify.skilljar.com/c/huqbqc4kqm7n' },
    { title: 'Introduction to Claude Cowork',        issuer: 'Anthropic', date: 'Jun 2026', url: 'https://verify.skilljar.com/c/4w52xtow2sd5' },
    { title: 'Introduction to Modern AI',            issuer: 'Cisco',     date: 'Jun 2026', url: 'https://www.credly.com/badges/f6e3f30c-fddf-426a-a41a-90c2f2a24cb3' },
    { title: 'Introduction to Cybersecurity',        issuer: 'Cisco',     date: '2023',     url: 'https://www.credly.com/badges/bb359963-a527-4514-8306-002c16ef265d' },
    { title: 'Ciberseguridad y Seguridad de la Información', issuer: 'Edutin Academy', date: 'Nov 2024', hours: '180hs', url: 'https://app.edutin.com/verify/12752600' },
    { title: 'Curso de IA: De 0 a Agentes',              issuer: 'BIG school',      date: 'Jun 2026', hours: '6hs', image: 'assets/cert-ia-agentes.png' },
    { title: 'Ciberseguridad y Hacking Ético',            issuer: 'BIG school',      date: 'Jun 2026', hours: '6hs', image: 'assets/cert-hacking-etico.png' },
    { title: 'Introducción a Full Stack',                 issuer: 'Egg Academia',    date: '2020',      hours: '47hs' },
    { title: 'Introducción a Python',                     issuer: 'Egg Academia',    date: '2020',      hours: '24hs' },
  ],
  openwaFeatures: {
    es: ['Multi-sesión: varias cuentas a la vez', 'Webhooks en tiempo real con firma segura', 'Panel de gestión web', 'Listo para Docker, sin vendor lock-in'],
    en: ['Multi-session: several accounts at once', 'Real-time webhooks with secure signing', 'Web management dashboard', 'Docker-ready, no vendor lock-in']
  },
  openwaStack: ['NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'S3 / MinIO']
};

const COPY = {
  es: {
    navCta: 'Hablemos',
    heroTag: 'Disponible para nuevos proyectos',
    heroA: 'Tecnología que', heroEm: 'trabaja para tu empresa',
    heroSub: 'En Zeeben Labs construimos el software, la automatización y la infraestructura que tu empresa necesita —potenciados con IA— de la idea al producto funcionando. Rápido, a medida y a bajo costo.',
    heroCta1: 'Hablemos', heroCta2: 'Ver proyectos', heroCtaAI: 'Preguntá a nuestro asistente IA',
    svcLabel: 'Servicios', svcTitle: 'Lo que resolvemos',
    casesLabel: 'Casos', casesTitle: 'Proyectos reales, en producción',
    osLabel: 'Open source', osTitle: 'Código abierto que podés ver', osIntro: 'No solo lo digo: parte de lo que construyo es público y cualquiera puede revisarlo.',
    openwaTag: 'Gateway de la API de WhatsApp', openwaDesc: 'Una plataforma self-hosted para conectar WhatsApp con tus sistemas: notificaciones, atención automatizada e integraciones, sin pagar por mensaje a terceros.',
    mundialTag: 'Proyecto en vivo', mundialDesc: 'Fixture del Mundial 2026 en tiempo real, temático por país. Se actualiza solo, automáticamente.', reposLine: 'proyectos públicos en GitHub, de webapps a automatizaciones.',
    aboutLabel: 'Fundador', aboutTitle: 'Quién está detrás de Zeeben Labs',
    aboutP1: 'Zeeben Labs nace de la experiencia de Damian Peña: más de 15 años en redes, infraestructura y soporte IT, resolviendo problemas reales en empresas. Sabemos lo que pasa cuando la tecnología no acompaña — y cómo arreglarlo.',
    aboutP2: 'Hoy combinamos esa experiencia con IA para construir software a medida: lo que antes necesitaba un equipo entero, lo prototipamos, aseguramos y dejamos en producción — rápido, a medida y a bajo costo.',
    expLabel: 'Trayectoria', expTitle: 'Más de 15 años en tecnología',
    techLabel: 'Trabajo con',
    certLabel: 'Formación', certTitle: 'Formación certificada', certIntro: 'Certificaciones verificables de Anthropic, Cisco y Edutin Academy — en IA, ciberseguridad y redes.', certVerify: 'Verificar →',
    contactHead: 'Pongamos tu tecnología a trabajar para vos.', contactSub: 'Contanos qué necesitás y vemos cómo resolverlo. Te respondemos rápido y sin compromiso.', contactBtn: 'Hablemos por WhatsApp', contactDownload: 'CV en PDF', location: 'Argentinos, operando desde Asunción para todo el mundo.',
    footerNote: 'Tecnología de punta a punta · de la A a la Z',
    now: 'NOW'
  },
  en: {
    navCta: "Let's talk",
    heroTag: 'Available for new projects',
    heroA: 'Technology that', heroEm: 'works for your business',
    heroSub: 'I build the tools and infrastructure your company needs, powered by AI to do it fast, custom and low-cost.',
    heroCta1: "Let's talk", heroCta2: 'See work', heroCtaAI: 'Ask my AI assistant',
    svcLabel: 'Services', svcTitle: 'What I can solve',
    casesLabel: 'Work', casesTitle: 'Real projects, in production',
    osLabel: 'Open source', osTitle: 'Open code you can inspect', osIntro: "I don't just say it: part of what I build is public and anyone can review it.",
    openwaTag: 'WhatsApp API gateway', openwaDesc: 'A self-hosted platform to connect WhatsApp with your systems: notifications, automated support, and integrations — without paying per message to third parties.',
    mundialTag: 'Live project', mundialDesc: 'Real-time 2026 World Cup fixture, themed per country. Updates itself, automatically.', reposLine: 'public projects on GitHub, from webapps to automations.',
    aboutLabel: 'About', aboutTitle: 'From infrastructure to software',
    aboutP1: 'I come from networking, infrastructure, and IT support, with 15+ years solving real problems in companies. I know what happens when technology gets in the way — and how to fix it.',
    aboutP2: 'In recent years I leaned heavily on AI to build custom software: what once needed a whole team, I now prototype, secure, and ship to production myself — fast and low-cost.',
    expLabel: 'Experience', expTitle: '15+ years in technology',
    techLabel: 'I work with',
    certLabel: 'Education', certTitle: 'Certified training', certIntro: 'Verifiable certifications from Anthropic, Cisco and Edutin Academy — in AI, cybersecurity and networking.', certVerify: 'Verify →',
    contactHead: "Let's put your tech to work for you.", contactSub: "Tell me what you need and we'll figure it out. I reply fast, no strings attached.", contactBtn: "Let's talk", contactDownload: 'CV as PDF', location: 'Made in Argentina, operating from Asunción, no borders.',
    footerNote: 'Handcrafted, AI-powered',
    now: 'NOW'
  }
};
