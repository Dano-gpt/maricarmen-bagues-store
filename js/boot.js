/* ==========================================================================
   BOOT — carga el contenido editable (content/*.json, administrado por el CMS),
   arma las variables globales que usa la app y luego inicia el sitio.
   Si el contenido no se puede cargar, cae al fallback js/config.js.
   NO editar a mano: el contenido se edita desde el panel /admin.
   ========================================================================== */
(function () {
  'use strict';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('No se pudo cargar ' + src)); };
      document.body.appendChild(s);
    });
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' en ' + url);
      return r.json();
    });
  }

  // Convierte [{codigo, descuento}] -> { CODIGO: descuento } (formato que espera la app)
  function cuponesToMap(list) {
    var map = {};
    (list || []).forEach(function (c) {
      if (c && c.codigo) map[String(c.codigo).toUpperCase()] = Number(c.descuento) || 0;
    });
    return map;
  }

  function injectAnalytics(cfg) {
    try {
      var a = (cfg && cfg.analytics) || {};
      if (a.gaMeasurementId) {
        var g = document.createElement('script');
        g.async = true;
        g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.gaMeasurementId);
        document.head.appendChild(g);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', a.gaMeasurementId);
      }
      if (a.metaPixelId) {
        !function (f, b, e, v, n, t, s) {
          if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
          t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', a.metaPixelId);
        window.fbq('track', 'PageView');
      }
    } catch (e) { /* analytics es opcional, nunca debe romper el sitio */ }
  }

  function startApp() {
    // ds.js define los componentes, app.js el ruteo/carrito. Orden importa.
    return loadScript('js/ds.js').then(function () { return loadScript('js/app.js'); });
  }

  Promise.all([
    getJSON('content/settings.json'),
    getJSON('content/catalog.json'),
    getJSON('content/home.json'),
    getJSON('content/faqs.json')
  ]).then(function (res) {
    var settings = res[0], catalog = res[1], home = res[2], faqs = res[3];

    // commerce.cupones puede venir como lista (editable en el CMS) -> mapa
    if (settings && settings.commerce && Array.isArray(settings.commerce.cupones)) {
      settings.commerce.cupones = cuponesToMap(settings.commerce.cupones);
    }

    window.SITE_CONFIG = settings;
    window.CATEGORIES = (catalog && catalog.categories) || [];
    window.PRODUCTS = (catalog && catalog.products) || [];
    window.HERO_SLIDES = (home && home.hero) || [];
    window.TESTIMONIALS = (home && home.testimonials) || [];
    window.FAQS = (faqs && faqs.faqs) || [];

    injectAnalytics(settings);
    return startApp();
  }).catch(function (err) {
    // Fallback: usar el archivo de configuración embebido y arrancar igual.
    console.warn('[boot] Usando configuración de respaldo (config.js):', err && err.message);
    loadScript('js/config.js').then(startApp).catch(function (e) {
      console.error('[boot] No se pudo iniciar el sitio:', e);
    });
  });
})();
