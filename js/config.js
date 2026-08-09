/* ==========================================================================
   CONFIGURACIÓN DEL SITIO — editar sólo este archivo para poner en producción
   Todo lo marcado con [COMPLETAR] debe reemplazarse con datos reales.
   ========================================================================== */

window.SITE_CONFIG = {

  // --- Datos de la revendedora -------------------------------------------
  reseller: {
    nombre: 'Maricarmen Vázquez',
    rol: 'Revendedora oficial independiente Bagués',
    // Número de WhatsApp en formato internacional SIN + ni espacios. Ej: 5491122334455
    whatsapp: '5491100000000',            // [COMPLETAR]
    instagram: '',                        // [COMPLETAR] ej: 'maricarmen.bagues'
    email: '',                            // [COMPLETAR] ej: 'hola@ejemplo.com'
    zona: '[COMPLETAR: ciudad / zona de cobertura]',
    linkedin: 'https://www.linkedin.com/in/maricarmen-v%C3%A1zquez-851774218/',
    foto: '',                             // [COMPLETAR] ej: 'assets/images/maricarmen.jpg'
    bioCorta: 'Hace [COMPLETAR: años] que acompaño a cada clienta y cliente a encontrar su fragancia y su rutina ideal. “Celebramos la belleza de ser libre” — esa frase de Bagués resume por qué elegí este camino.',
    bioLarga: [
      'Elegí representar a Bagués porque creo en su filosofía: “Celebramos la belleza de ser libre”. Desde entonces me dedico a asesorar a cada clienta y cliente para que encuentre el producto justo para su piel, su estilo y su momento.',
      '[COMPLETAR: trayectoria, años de experiencia y motivación personal de Maricarmen.]'
    ]
  },

  // --- Reglas comerciales -------------------------------------------------
  commerce: {
    envioGratisDesde: 40000,
    costoEnvio: 3500,
    cupones: { BAGUES10: 0.10 },
    moneda: '$',
    promos: [
      '3 cuotas sin interés desde $30.000',
      'Envío gratis desde $40.000',
      'Nueva colección Brescia ya disponible'
    ]
  },

  // --- Legal --------------------------------------------------------------
  legal: {
    mostrarDisclaimer: true,
    disclaimer: 'Revendedora oficial independiente de productos Bagués. Este sitio no es el sitio web oficial de la marca Bagués.'
  },

  // --- Entrega de formularios --------------------------------------------
  // 'whatsapp'  -> abre WhatsApp con el mensaje ya armado (no requiere backend)
  // 'email'     -> abre el cliente de correo (requiere reseller.email)
  // 'endpoint'  -> hace POST JSON a formsEndpoint (Formspree, Getform, API propia)
  forms: {
    modo: 'whatsapp',
    endpoint: ''                          // [COMPLETAR si modo = 'endpoint']
  },

  // --- Analytics (opcional) ----------------------------------------------
  analytics: {
    gaMeasurementId: '',                  // [COMPLETAR] ej: 'G-XXXXXXX'
    metaPixelId: ''                       // [COMPLETAR]
  }
};

/* ==========================================================================
   CATÁLOGO — reemplazar con el catálogo real y sus fotos/precios vigentes
   Categorías tomadas de la estructura oficial de bagues.com.ar
   ========================================================================== */

window.CATEGORIES = [
  { slug: 'fragancias',        name: 'Fragancias',          accent: 'var(--gold-500)', tint: 'var(--gold-100)' },
  { slug: 'cuidado-piel',      name: 'Cuidado de la Piel',  accent: 'var(--teal-500)', tint: 'var(--teal-100)' },
  { slug: 'aromatizantes',     name: 'Aromatizantes',       accent: 'var(--navy-400)', tint: 'var(--gray-100)' },
  { slug: 'maquillaje',        name: 'Maquillaje',          accent: 'var(--pink-500)', tint: 'var(--pink-100)' },
  { slug: 'bienestar',         name: 'Bienestar',           accent: 'var(--navy-400)', tint: 'var(--gray-100)' },
  { slug: 'cuidado-pelo',      name: 'Cuidado del Pelo',    accent: 'var(--gray-700)', tint: 'var(--gray-100)' },
  { slug: 'bebes-ninos',       name: 'Bebés & Niños',       accent: 'var(--teal-500)', tint: 'var(--teal-100)' }
];

window.PRODUCTS = [
  { id: 'brescia', name: 'Brescia Crystalline', family: 'Fragancia', category: 'fragancias', genero: 'Mujer',
    price: 45999, compareAt: 52999, percent: 13, image: 'assets/products/brescia.png',
    notes: 'Bergamota, jazmín, ámbar',
    desc: 'Eau de parfum floral-amaderado de la línea premium Brescia, para quien busca elegancia atemporal.' },

  { id: 'zayed', name: 'Zayed', family: 'Fragancia', category: 'fragancias', genero: 'Hombre',
    price: 38999, compareAt: null, percent: 0, image: 'assets/products/zayed.png',
    notes: 'Oud, azafrán, cuero',
    desc: 'Fragancia árabe intensa y especiada, ideal para el día a día y ocasiones especiales.' },

  { id: 'mykonos', name: 'Mykonos', family: 'Fragancia', category: 'fragancias', genero: 'Unisex',
    price: 32999, compareAt: 39999, percent: 18, image: 'assets/products/mykonos.png',
    notes: 'Cítricos, sal marina, almizcle',
    desc: 'Fresca y luminosa, inspirada en el verano mediterráneo.' },

  { id: 'skincare-kit', name: 'Kit Rutina Facial', family: 'Skincare', category: 'cuidado-piel', genero: 'Unisex',
    price: 28999, compareAt: null, percent: 0, image: 'assets/products/skincare-kit.png',
    notes: 'Aplicar limpiador, sérum y crema en tu rutina diaria AM/PM.',
    desc: 'Set de 3 pasos para una rutina facial completa: limpieza, tratamiento e hidratación.' },

  { id: 'labial', name: 'Labial Semplice', family: 'Maquillaje', category: 'maquillaje', genero: 'Mujer',
    price: 8999, compareAt: 10999, percent: 18, image: 'assets/products/labial.png',
    notes: 'Aplicar directo sobre el labio, retocar durante el día.',
    desc: 'Color intenso de larga duración con acabado satinado.' }
];

window.HERO_SLIDES = [
  { image: 'assets/images/hero-brescia.png', title: 'Brescia Crystalline',
    subtitle: 'La nueva fragancia premium ya está disponible.', link: '#/producto/brescia' },
  { image: 'assets/images/hero-avalon-atlantida.png', title: 'Avalon & Atlántida',
    subtitle: 'Colección infantil, aromas suaves para los más chicos.', link: '#/catalogo/bebes-ninos' },
  { image: 'assets/images/hero-rutina-skincare.png', title: 'Rutina Skincare',
    subtitle: 'Armá tu rutina de cuidado facial paso a paso.', link: '#/catalogo/cuidado-piel' }
];

window.FAQS = [
  { q: '¿Los productos son originales?',
    a: 'Sí, todos los productos son 100% originales Bagués, adquiridos a través de la red oficial de distribución de la marca.' },
  { q: '¿Cuáles son los medios de pago?',
    a: 'Transferencia bancaria, link de Mercado Pago (con cuotas sin interés) y efectivo contra entrega en zonas de cobertura.' },
  { q: '¿Hacen envíos a todo el país?',
    a: '[COMPLETAR: zonas de envío y costos exactos.]' },
  { q: '¿Puedo cambiar un producto?',
    a: 'Sí, contás con 10 días desde la recepción para gestionar un cambio, siempre que el producto esté sin uso y en su empaque original.' }
];

window.TESTIMONIALS = [
  { img: 'assets/testimonials/t1.jpg', text: '“Maricarmen me ayudó a elegir el perfume perfecto para mi boda, un asesoramiento súper personalizado.”', author: '@valedelrio' },
  { img: 'assets/testimonials/t2.jpg', text: '“Pedí por WhatsApp y en dos días ya tenía mi kit de skincare en la puerta. Recomendadísima.”', author: '@nachogimenez' }
];
