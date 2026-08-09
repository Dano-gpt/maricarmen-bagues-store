/* ==========================================================================
   Bagués by Maricarmen Vázquez — aplicación de tienda (JS plano, sin build)
   Router por hash, carrito persistente, filtros, cupones, checkout y formularios.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG;
  var CATS = window.CATEGORIES;
  var PRODUCTS = window.PRODUCTS;
  var HERO = window.HERO_SLIDES;
  var FAQS = window.FAQS;
  var TESTIMONIALS = window.TESTIMONIALS;
  var esc = DS.esc, money = DS.money, icon = DS.icon;

  /* ------------------------------------------------------------- Estado ---- */
  var STORE_KEY = 'bagues-mc-cart-v1';

  var state = {
    route: { page: 'home', param: null },
    cart: loadCart(),
    cartOpen: false,
    genero: 'Todas',
    sortBy: 'destacados',
    heroSlide: 0,
    pdpQty: 1,
    pdpVariant: null,
    coupon: { code: '', applied: false, msg: '', rate: 0 },
    paymentMethod: 'transferencia',
    order: null,
    faqOpen: null,
    navOpen: false,
    flash: null
  };

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return raw.filter(function (l) { return findProduct(l.id); });
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.cart)); } catch (e) { /* modo privado */ }
  }

  /* ------------------------------------------------------------ Utilidades - */
  function findProduct(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function findCategory(slug) { return CATS.filter(function (c) { return c.slug === slug; })[0]; }
  function catName(slug) { var c = findCategory(slug); return c ? c.name : slug; }

  function waLink(text) {
    return 'https://wa.me/' + CFG.reseller.whatsapp + '?text=' + encodeURIComponent(text);
  }

  function variantsFor(p) {
    return p.family === 'Fragancia' ? ['50 ml', '100 ml'] : ['Único'];
  }

  function cartLines() {
    return state.cart.map(function (l) {
      var p = findProduct(l.id);
      return { key: l.id + '|' + l.variant, id: l.id, variant: l.variant, qty: l.qty, product: p, lineTotal: p.price * l.qty };
    });
  }
  function cartCount() {
    return state.cart.reduce(function (a, l) { return a + l.qty; }, 0);
  }
  function totals() {
    var subtotal = cartLines().reduce(function (a, l) { return a + l.lineTotal; }, 0);
    var shipping = subtotal === 0 ? 0 : (subtotal >= CFG.commerce.envioGratisDesde ? 0 : CFG.commerce.costoEnvio);
    var discount = state.coupon.applied ? Math.round(subtotal * state.coupon.rate) : 0;
    return { subtotal: subtotal, shipping: shipping, discount: discount, total: subtotal + shipping - discount };
  }

  /* --------------------------------------------------------------- Carrito - */
  function addToCart(id, qty, variant) {
    var p = findProduct(id);
    if (!p) return;
    qty = qty || 1;
    variant = variant || variantsFor(p)[0];
    var line = state.cart.filter(function (l) { return l.id === id && l.variant === variant; })[0];
    if (line) line.qty += qty; else state.cart.push({ id: id, qty: qty, variant: variant });
    saveCart();
    state.cartOpen = true;
    announce(p.name + ' agregado al carrito');
    render();
  }
  function setQty(key, delta) {
    var line = state.cart.filter(function (l) { return l.id + '|' + l.variant === key; })[0];
    if (!line) return;
    line.qty = Math.max(1, line.qty + delta);
    saveCart(); render();
  }
  function removeLine(key) {
    state.cart = state.cart.filter(function (l) { return l.id + '|' + l.variant !== key; });
    saveCart(); render();
  }

  /* ------------------------------------------------------------- Anuncios -- */
  function announce(msg) {
    var el = document.getElementById('live-region');
    if (el) el.textContent = msg;
  }

  /* ---------------------------------------------------------------- Router - */
  function parseHash() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { page: 'home', param: null };
    return { page: parts[0], param: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  var TITLES = {
    home: 'Bagués by Maricarmen Vázquez — Perfumería, skincare y maquillaje',
    catalogo: 'Catálogo',
    producto: 'Producto',
    carrito: 'Tu carrito',
    checkout: 'Checkout',
    'quien-soy': 'Conocé a Maricarmen Vázquez',
    emprende: 'Emprendé con Maricarmen — Sumate como revendedor/a',
    contacto: 'Contacto',
    legales: 'Legales y preguntas frecuentes'
  };

  function onRouteChange() {
    var r = parseHash();
    if (r.page === 'producto' && r.param) {
      var p = findProduct(r.param);
      state.pdpQty = 1;
      state.pdpVariant = p ? variantsFor(p)[0] : null;
    }
    if (r.page === 'catalogo') state.genero = 'Todas';
    state.route = r;
    state.cartOpen = false;
    state.navOpen = false;
    setMeta(r);
    render();
    window.scrollTo(0, 0);
  }

  function setMeta(r) {
    var t = TITLES[r.page] || TITLES.home;
    if (r.page === 'producto') {
      var p = findProduct(r.param);
      t = (p ? p.name : 'Producto') + ' — Bagués by Maricarmen Vázquez';
    } else if (r.page === 'catalogo') {
      t = catName(r.param || 'fragancias') + ' — Bagués by Maricarmen Vázquez';
    } else if (r.page !== 'home') {
      t = t + ' — Bagués by Maricarmen Vázquez';
    }
    document.title = t;
    var d = document.querySelector('meta[name="description"]');
    if (d && r.page === 'producto') {
      var pp = findProduct(r.param);
      if (pp) d.setAttribute('content', pp.desc);
    }
    // JSON-LD de producto para SEO
    var old = document.getElementById('ld-product');
    if (old) old.remove();
    if (r.page === 'producto') {
      var prod = findProduct(r.param);
      if (prod) {
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'ld-product';
        s.textContent = JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Product',
          name: prod.name, description: prod.desc, image: location.href.split('#')[0] + prod.image,
          brand: { '@type': 'Brand', name: 'Bagués' },
          offers: { '@type': 'Offer', priceCurrency: 'ARS', price: prod.price, availability: 'https://schema.org/InStock' }
        });
        document.head.appendChild(s);
      }
    }
  }

  /* ============================== VISTAS ==================================== */

  function viewHome() {
    var slide = HERO[state.heroSlide];
    var featured = PRODUCTS.filter(function (p) {
      return state.genero === 'Todas' || p.genero === state.genero;
    });

    return '' +
      '<section class="hero" aria-label="Campañas destacadas">' +
        '<div class="hero__img" style="background-image:url(\'' + esc(slide.image) + '\')" role="img" aria-label="' + esc(slide.title) + '"></div>' +
        '<div class="hero__scrim"></div>' +
        '<div class="hero__content">' +
          '<h1 class="display display-lg" style="color:#fff;margin:0 0 12px">' + esc(slide.title) + '</h1>' +
          '<p style="font-size:var(--fs-body-lg);margin:0 0 22px">' + esc(slide.subtitle) + '</p>' +
          DS.Button({ variant: 'primary', size: 'lg', label: 'Comprar', href: slide.link }) +
        '</div>' +
        '<div class="hero__arrows">' +
          '<button type="button" data-action="hero-prev" aria-label="Campaña anterior">&lsaquo;</button>' +
          '<button type="button" data-action="hero-next" aria-label="Campaña siguiente">&rsaquo;</button>' +
        '</div>' +
        '<div class="hero__dots">' + HERO.map(function (h, i) {
          return '<button type="button" class="' + (i === state.heroSlide ? 'is-active' : '') + '" ' +
            'data-action="hero-go" data-value="' + i + '" aria-label="Ir a la campaña ' + (i + 1) + '"></button>';
        }).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
        '<h2 class="display display-md" style="margin:0 0 28px">Categorías</h2>' +
        '<div class="cat-grid">' + CATS.map(function (c) {
          return '<a class="cat-card" href="#/catalogo/' + esc(c.slug) + '" style="background:' + c.tint + '">' +
            '<span class="cat-card__rule" style="background:' + c.accent + '"></span>' +
            '<span class="cat-card__name">' + esc(c.name) + '</span></a>';
        }).join('') + '</div>' +
      '</section>' +

      '<section class="section" style="padding-top:0">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">' +
          '<h2 class="display display-md" style="margin:0">Destacados</h2>' +
          DS.CategoryPills(['Todas', 'Mujer', 'Hombre', 'Unisex'], state.genero, 'set-genero') +
        '</div>' +
        '<div class="grid-products">' + featured.map(DS.ProductCard).join('') + '</div>' +
      '</section>' +

      '<section class="section--tint">' +
        '<div class="container" style="display:flex;gap:48px;flex-wrap:wrap;align-items:center;padding:0 32px">' +
          resellerPhoto(220) +
          '<div style="flex:1;min-width:280px">' +
            '<p class="eyebrow" style="margin:0 0 8px">' + esc(CFG.reseller.rol) + '</p>' +
            '<h2 class="display display-md" style="margin:0 0 16px">Conocé a Maricarmen</h2>' +
            '<p style="font-size:var(--fs-body-lg);line-height:var(--lh-normal);max-width:640px;margin:0 0 20px">' + esc(CFG.reseller.bioCorta) + '</p>' +
            '<div style="display:flex;gap:14px;flex-wrap:wrap">' +
              DS.Button({ variant: 'primary', label: 'Conocer su historia', href: '#/quien-soy' }) +
              DS.Button({ variant: 'outline', label: 'Ver LinkedIn', href: CFG.reseller.linkedin, external: true }) +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<h2 class="display display-md" style="margin:0 0 28px">Lo que dicen mis clientas y clientes</h2>' +
        '<div class="testimonials">' + TESTIMONIALS.map(function (t) {
          return '<figure class="testimonial" style="margin:0">' +
            '<img src="' + esc(t.img) + '" alt="" loading="lazy" width="56" height="56">' +
            '<figcaption><p style="margin:0 0 8px;font-size:var(--fs-body-md);line-height:var(--lh-normal)">' + esc(t.text) + '</p>' +
            '<span class="faint" style="font-size:12px">' + esc(t.author) + '</span></figcaption></figure>';
        }).join('') + '</div>' +
      '</section>' +

      '<section class="band">' +
        '<img class="band__bg" src="assets/images/banner-gptw.jpg" alt="" loading="lazy">' +
        '<div class="band__inner">' +
          '<h2 class="display display-md" style="color:#fff;margin:0 0 14px">¿Querés generar tus propios ingresos vendiendo productos que amás?</h2>' +
          '<p style="font-size:var(--fs-body-lg);margin:0 0 24px">Sumate a mi equipo de revendedoras y revendedores Bagués.</p>' +
          DS.Button({ variant: 'primary', size: 'lg', label: 'Quiero sumarme', href: '#/emprende' }) +
        '</div>' +
      '</section>' +

      '<section class="newsletter">' +
        '<img class="newsletter__bg" src="assets/images/newsletter-bg.jpg" alt="" loading="lazy">' +
        '<div class="newsletter__scrim"></div>' +
        '<div class="newsletter__inner">' +
          '<h2 class="display h-lg" style="margin:0 0 6px">Enterate primero</h2>' +
          '<p class="muted" style="font-size:var(--fs-body-md);margin:0 0 18px">Promos, lanzamientos y novedades directo en tu correo.</p>' +
          '<div style="display:flex;justify-content:center">' + DS.NewsletterField() + '</div>' +
        '</div>' +
      '</section>';
  }

  function resellerPhoto(size) {
    if (CFG.reseller.foto) {
      return '<img class="avatar-round" style="width:' + size + 'px;height:' + size + 'px" src="' + esc(CFG.reseller.foto) +
        '" alt="Foto de ' + esc(CFG.reseller.nombre) + '" loading="lazy">';
    }
    return '<div class="avatar-round" style="width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;' +
      'justify-content:center;border:1px dashed var(--border-default);color:var(--text-faint);font-size:13px;text-align:center;padding:16px">' +
      'Foto de Maricarmen<br>[COMPLETAR]</div>';
  }

  function viewCatalogo(slug) {
    slug = slug || 'fragancias';
    var list = PRODUCTS.filter(function (p) {
      return p.category === slug && (state.genero === 'Todas' || p.genero === state.genero);
    });
    if (state.sortBy === 'precio-asc') list = list.slice().sort(function (a, b) { return a.price - b.price; });
    if (state.sortBy === 'precio-desc') list = list.slice().sort(function (a, b) { return b.price - a.price; });

    return '<div class="section">' +
      DS.Breadcrumb([{ label: 'Inicio', href: '#/' }, catName(slug)]) +
      '<h1 class="display display-md" style="margin:20px 0">' + esc(catName(slug)) + '</h1>' +
      '<div class="catalog">' +
        '<aside class="catalog__aside">' +
          '<div><p class="filter-title">Categoría</p><div class="filter-links">' +
            CATS.map(function (c) {
              return '<a href="#/catalogo/' + esc(c.slug) + '" class="' + (c.slug === slug ? 'is-active' : '') + '">' + esc(c.name) + '</a>';
            }).join('') + '</div></div>' +
          '<div><p class="filter-title">Género</p>' + DS.CategoryPills(['Todas', 'Mujer', 'Hombre', 'Unisex'], state.genero, 'set-genero') + '</div>' +
        '</aside>' +
        '<div class="catalog__main">' +
          '<div class="toolbar">' +
            '<p class="muted" style="margin:0;font-size:var(--fs-body-sm)">' + list.length + ' producto' + (list.length === 1 ? '' : 's') + '</p>' +
            '<label class="sr-only" for="sort">Ordenar por</label>' +
            '<select id="sort" class="field" style="width:auto" data-action="set-sort">' +
              ['destacados|Más vendidos', 'precio-asc|Precio: menor a mayor', 'precio-desc|Precio: mayor a menor']
                .map(function (o) {
                  var v = o.split('|');
                  return '<option value="' + v[0] + '"' + (state.sortBy === v[0] ? ' selected' : '') + '>' + v[1] + '</option>';
                }).join('') +
            '</select>' +
          '</div>' +
          (list.length
            ? '<div class="grid-products">' + list.map(DS.ProductCard).join('') + '</div>'
            : '<p style="padding:48px 0;text-align:center;color:var(--text-faint)">Todavía no hay productos cargados en esta categoría.</p>') +
        '</div>' +
      '</div></div>';
  }

  function viewProducto(id) {
    var p = findProduct(id);
    if (!p) return '<div class="section"><p>Producto no encontrado. <a href="#/catalogo/fragancias">Ver catálogo</a></p></div>';
    var variants = variantsFor(p);
    if (!state.pdpVariant || variants.indexOf(state.pdpVariant) === -1) state.pdpVariant = variants[0];
    var related = PRODUCTS.filter(function (x) { return x.id !== p.id; }).slice(0, 4);

    return '<div class="section">' +
      DS.Breadcrumb([{ label: 'Inicio', href: '#/' }, { label: catName(p.category), href: '#/catalogo/' + p.category }, p.name]) +
      '<div class="pdp" style="margin-top:24px">' +
        '<div class="pdp__media"><div class="pdp__frame">' +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="440" height="440"></div></div>' +
        '<div class="pdp__info">' +
          '<p class="faint" style="font-size:12px;text-transform:uppercase;letter-spacing:var(--tracking-wide);margin:0 0 8px">' + esc(p.family) + '</p>' +
          '<h1 class="display display-md" style="margin:0 0 14px">' + esc(p.name) + '</h1>' +
          '<div style="margin-bottom:20px">' + DS.PriceTag(p.price, p.compareAt) + '</div>' +
          '<p style="font-size:var(--fs-body-md);line-height:var(--lh-normal);margin:0 0 20px">' + esc(p.desc) + '</p>' +
          '<div style="margin-bottom:20px">' +
            '<p style="font-size:13px;font-weight:600;color:var(--text-heading);margin:0 0 6px">' +
              (p.family === 'Fragancia' ? 'Notas olfativas' : 'Modo de uso') + '</p>' +
            '<p class="muted" style="font-size:var(--fs-body-sm);margin:0">' + esc(p.notes) + '</p>' +
          '</div>' +
          (variants.length > 1
            ? '<div style="margin-bottom:20px"><p style="font-size:13px;font-weight:600;margin:0 0 8px">Tamaño</p>' +
              '<div style="display:flex;gap:10px">' + variants.map(function (v) {
                return '<button type="button" class="tag' + (state.pdpVariant === v ? ' is-active' : '') + '" ' +
                  'data-action="set-variant" data-value="' + esc(v) + '">' + esc(v) + '</button>';
              }).join('') + '</div></div>'
            : '') +
          '<div class="pdp__actions">' +
            DS.QuantityStepper(state.pdpQty, 'pdp-qty') +
            DS.Button({ variant: 'primary', size: 'lg', label: 'Agregar al carrito', action: 'add-to-cart-pdp', data: { 'data-id': p.id } }) +
            DS.Button({ variant: 'outline', size: 'lg', label: 'Comprar ahora', action: 'buy-now', data: { 'data-id': p.id } }) +
          '</div>' +
          '<p class="muted" style="font-size:var(--fs-body-sm);border-top:1px solid var(--border-subtle);padding-top:16px">' +
            '3 cuotas sin interés · Precio final · Envío gratis a partir de $' + money(CFG.commerce.envioGratisDesde) + '</p>' +
        '</div>' +
      '</div>' +

      '<div style="margin-top:64px">' +
        '<h2 class="display h-lg" style="margin:0 0 20px">También te puede interesar</h2>' +
        '<div class="grid-products">' + related.map(DS.ProductCard).join('') + '</div>' +
      '</div>' +

      '<div style="margin-top:64px;max-width:640px">' +
        '<h2 class="display h-lg" style="margin:0 0 20px">Reseñas</h2>' +
        '<div style="display:flex;flex-direction:column;gap:16px">' +
          '<article class="review"><p class="stars" aria-label="5 de 5 estrellas">★★★★★</p>' +
            '<p style="margin:0 0 6px;font-size:var(--fs-body-sm)">“Huele increíble y dura todo el día.”</p>' +
            '<p class="faint" style="margin:0;font-size:12px">Romina G.</p></article>' +
          '<article class="review"><p class="stars" aria-label="4 de 5 estrellas">★★★★☆</p>' +
            '<p style="margin:0 0 6px;font-size:var(--fs-body-sm)">“Llegó rápido y Maricarmen me asesoró antes de comprar.”</p>' +
            '<p class="faint" style="margin:0;font-size:12px">Julián P.</p></article>' +
        '</div>' +
      '</div></div>';
  }

  function lineRow(l, compact) {
    var t = totals();
    if (compact) {
      return '<div style="display:flex;gap:12px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px">' +
        '<img class="cart-line__img" style="width:56px;height:56px" src="' + esc(l.product.image) + '" alt="" loading="lazy">' +
        '<div style="flex:1">' +
          '<p style="margin:0;font-size:13px;font-weight:600;color:var(--text-heading)">' + esc(l.product.name) + '</p>' +
          '<p class="faint" style="margin:0 0 6px;font-size:12px">$' + money(l.product.price) + ' · ' + esc(l.variant) + '</p>' +
          DS.QuantityStepper(l.qty, 'line-qty', { 'data-key': l.key }) +
        '</div>' +
        '<button class="icon-btn" data-action="line-remove" data-key="' + esc(l.key) + '" aria-label="Quitar ' + esc(l.product.name) + '">×</button>' +
        '</div>';
    }
    return '<div class="cart-line">' +
      '<img class="cart-line__img" src="' + esc(l.product.image) + '" alt="" loading="lazy">' +
      '<div style="flex:1">' +
        '<p style="margin:0;font-size:var(--fs-body-md);font-weight:600;color:var(--text-heading)">' + esc(l.product.name) + '</p>' +
        '<p class="faint" style="margin:0;font-size:12px">Variante: ' + esc(l.variant) + '</p>' +
        '<p style="margin:4px 0 0;font-size:var(--fs-body-sm)">$' + money(l.product.price) + '</p>' +
      '</div>' +
      DS.QuantityStepper(l.qty, 'line-qty', { 'data-key': l.key }) +
      '<div style="width:90px;text-align:right;font-weight:600;color:var(--text-heading)">$' + money(l.lineTotal) + '</div>' +
      '<button class="icon-btn" data-action="line-remove" data-key="' + esc(l.key) + '" aria-label="Quitar ' + esc(l.product.name) + '">×</button>' +
      '</div>';
  }

  function summaryBlock(withCoupon) {
    var t = totals();
    return '<div class="summary">' +
      (withCoupon
        ? '<form class="js-coupon" style="display:flex;gap:8px">' +
            '<label class="sr-only" for="coupon">Cupón de descuento</label>' +
            '<input id="coupon" name="coupon" class="field" placeholder="Cupón de descuento" value="' + esc(state.coupon.code) + '">' +
            DS.Button({ variant: 'outline', size: 'sm', label: 'Aplicar', type: 'submit' }) +
          '</form>' +
          (state.coupon.msg
            ? '<p style="margin:0;font-size:12px;color:' + (state.coupon.applied ? 'var(--color-primary)' : 'var(--pink-700)') + '">' + esc(state.coupon.msg) + '</p>'
            : '')
        : '') +
      '<div class="summary__row"><span>Subtotal</span><span>$' + money(t.subtotal) + '</span></div>' +
      (t.discount ? '<div class="summary__row" style="color:var(--color-primary)"><span>Descuento</span><span>-$' + money(t.discount) + '</span></div>' : '') +
      '<div class="summary__row"><span>Envío</span><span>' + (t.shipping === 0 ? 'Gratis' : '$' + money(t.shipping)) + '</span></div>' +
      '<p class="faint" style="margin:0;font-size:12px">' + (t.shipping === 0 && t.subtotal > 0
        ? 'Envío gratis aplicado'
        : 'Envío gratis a partir de $' + money(CFG.commerce.envioGratisDesde)) + '</p>' +
      '<div class="summary__total"><span>Total</span><span>$' + money(t.total) + '</span></div>' +
      (withCoupon ? DS.Button({ variant: 'primary', size: 'lg', label: 'Continuar a checkout', href: '#/checkout', block: true }) : '') +
      '</div>';
  }

  function viewCarrito() {
    var lines = cartLines();
    if (!lines.length) {
      return '<div class="section" style="max-width:1000px">' +
        '<h1 class="display display-md" style="margin:0 0 32px">Tu carrito</h1>' +
        '<div style="text-align:center;padding:64px 0">' +
          '<p class="muted" style="margin-bottom:20px">Tu carrito está vacío.</p>' +
          DS.Button({ variant: 'primary', label: 'Ir al catálogo', href: '#/catalogo/fragancias' }) +
        '</div></div>';
    }
    return '<div class="section" style="max-width:1000px">' +
      '<h1 class="display display-md" style="margin:0 0 32px">Tu carrito</h1>' +
      '<div style="display:flex;gap:40px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:320px;display:flex;flex-direction:column;gap:18px">' +
          lines.map(function (l) { return lineRow(l, false); }).join('') +
        '</div>' +
        summaryBlock(true) +
      '</div></div>';
  }

  function viewCheckout() {
    if (state.order) {
      var o = state.order;
      return '<div class="section" style="max-width:1000px">' +
        '<div style="text-align:center;padding:48px 0;max-width:560px;margin:0 auto">' +
          '<h1 class="display display-md" style="margin:0 0 12px">¡Gracias por tu pedido!</h1>' +
          '<p class="muted" style="margin:0 0 6px">Número de orden</p>' +
          '<p style="font-size:var(--fs-heading-lg);font-weight:600;color:var(--color-primary);margin:0 0 20px">' + esc(o.number) + '</p>' +
          '<p style="line-height:var(--lh-normal);margin:0 0 24px">Maricarmen va a contactarte para coordinar el pago y la entrega. ' +
            'Podés adelantarle el pedido ahora:</p>' +
          '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
            DS.Button({ variant: 'primary', size: 'lg', label: 'Enviar pedido por WhatsApp', href: waLink(o.text), external: true }) +
            DS.Button({ variant: 'outline', size: 'lg', label: 'Volver al inicio', href: '#/' }) +
          '</div>' +
        '</div></div>';
    }

    var lines = cartLines();
    if (!lines.length) {
      return '<div class="section" style="max-width:1000px;text-align:center">' +
        '<h1 class="display display-md">Checkout</h1>' +
        '<p class="muted">No hay productos en tu carrito.</p>' +
        DS.Button({ variant: 'primary', label: 'Ir al catálogo', href: '#/catalogo/fragancias' }) + '</div>';
    }
    var t = totals();
    var pm = [['transferencia', 'Transferencia bancaria'], ['mercadopago', 'Link de Mercado Pago (cuotas sin interés)'], ['efectivo', 'Efectivo contra entrega']];

    return '<div class="section" style="max-width:1000px">' +
      '<h1 class="display display-md" style="margin:0 0 32px">Checkout</h1>' +
      '<div style="display:flex;gap:40px;flex-wrap:wrap">' +
        '<form class="js-checkout form-stack" style="flex:1;min-width:320px" novalidate>' +
          '<p style="font-size:13px;font-weight:600;color:var(--text-heading);margin:0">Datos de contacto y envío</p>' +
          '<label class="sr-only" for="ck-nombre">Nombre y apellido</label>' +
          '<input id="ck-nombre" name="nombre" class="field" placeholder="Nombre y apellido" required autocomplete="name">' +
          '<label class="sr-only" for="ck-tel">WhatsApp</label>' +
          '<input id="ck-tel" name="telefono" class="field" placeholder="WhatsApp" required inputmode="tel" autocomplete="tel">' +
          '<label class="sr-only" for="ck-email">Email</label>' +
          '<input id="ck-email" name="email" type="email" class="field" placeholder="Email" required autocomplete="email">' +
          '<label class="sr-only" for="ck-dir">Dirección de envío</label>' +
          '<input id="ck-dir" name="direccion" class="field" placeholder="Dirección de envío" required autocomplete="street-address">' +
          '<label class="sr-only" for="ck-ciudad">Ciudad o localidad</label>' +
          '<input id="ck-ciudad" name="ciudad" class="field" placeholder="Ciudad / Localidad" required autocomplete="address-level2">' +
          '<p style="font-size:13px;font-weight:600;color:var(--text-heading);margin:8px 0 0">Método de pago</p>' +
          '<div style="display:flex;flex-direction:column;gap:10px">' +
            pm.map(function (m) {
              return '<button type="button" class="option-row' + (state.paymentMethod === m[0] ? ' is-active' : '') + '" ' +
                'data-action="set-pm" data-value="' + m[0] + '" aria-pressed="' + (state.paymentMethod === m[0]) + '">' + esc(m[1]) + '</button>';
            }).join('') +
          '</div>' +
          '<p class="faint" style="font-size:12px;margin:0">[COMPLETAR: datos bancarios / link de Mercado Pago reales]</p>' +
          '<p class="form-error js-form-error" hidden></p>' +
          DS.Button({ variant: 'primary', size: 'lg', label: 'Confirmar pedido', type: 'submit' }) +
        '</form>' +
        '<div class="summary">' +
          '<p style="font-size:13px;font-weight:600;margin:0">Resumen</p>' +
          lines.map(function (l) {
            return '<div class="summary__row"><span>' + esc(l.product.name) + ' × ' + l.qty + '</span><span>$' + money(l.lineTotal) + '</span></div>';
          }).join('') +
          '<div class="summary__row" style="border-top:1px solid var(--border-subtle);padding-top:10px"><span>Envío</span><span>' +
            (t.shipping === 0 ? 'Gratis' : '$' + money(t.shipping)) + '</span></div>' +
          (t.discount ? '<div class="summary__row" style="color:var(--color-primary)"><span>Descuento</span><span>-$' + money(t.discount) + '</span></div>' : '') +
          '<div class="summary__total"><span>Total</span><span>$' + money(t.total) + '</span></div>' +
        '</div>' +
      '</div></div>';
  }

  function viewQuienSoy() {
    return '<div>' +
      '<div class="section" style="display:flex;gap:48px;flex-wrap:wrap;align-items:center">' +
        resellerPhoto(260) +
        '<div style="flex:1;min-width:300px">' +
          '<p class="eyebrow" style="margin:0 0 10px">' + esc(CFG.reseller.rol) + '</p>' +
          '<h1 class="display display-lg" style="margin:0 0 18px">' + esc(CFG.reseller.nombre) + '</h1>' +
          CFG.reseller.bioLarga.map(function (t, i) {
            return '<p style="font-size:' + (i === 0 ? 'var(--fs-body-lg)' : 'var(--fs-body-md)') + ';line-height:var(--lh-normal);' +
              (i > 0 ? 'color:var(--text-muted);' : '') + 'margin:0 0 16px">' + esc(t) + '</p>';
          }).join('') +
          '<p class="muted" style="font-size:var(--fs-body-md);margin:0 0 24px">Zona de entrega y atención: ' + esc(CFG.reseller.zona) + '</p>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap">' +
            DS.Button({ variant: 'primary', label: 'Ver perfil de LinkedIn', href: CFG.reseller.linkedin, external: true }) +
            DS.Button({ variant: 'outline', label: 'Escribirle por WhatsApp', href: waLink('Hola Maricarmen! Tengo una consulta sobre tus productos Bagués.'), external: true }) +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="disclaimer" style="margin:0">' + esc(CFG.legal.disclaimer) + '</p>' +
      '<section class="section">' +
        '<h2 class="display h-lg" style="margin:0 0 24px">Testimonios</h2>' +
        '<div class="testimonials">' + TESTIMONIALS.map(function (t) {
          return '<figure class="testimonial" style="margin:0">' +
            '<img src="' + esc(t.img) + '" alt="" loading="lazy" width="56" height="56">' +
            '<figcaption><p style="margin:0 0 8px;font-size:var(--fs-body-md);line-height:var(--lh-normal)">' + esc(t.text) + '</p>' +
            '<span class="faint" style="font-size:12px">' + esc(t.author) + '</span></figcaption></figure>';
        }).join('') + '</div>' +
      '</section></div>';
  }

  function viewEmprende() {
    var benefits = [
      ['users', 'Acompañamiento personal', 'Capacitación y seguimiento cercano de Maricarmen en cada paso.'],
      ['tag', 'Precios preferenciales', 'Acceso al catálogo completo con condiciones especiales.'],
      ['image', 'Material de venta', 'Fotos, descripciones y promos listas para usar.'],
      ['clock', 'Flexibilidad de horarios', 'Vendé presencial u online, a tu ritmo.']
    ];
    var steps = [
      'Completás el formulario de interés',
      'Maricarmen te contacta para una charla inicial',
      'Recibís el kit de bienvenida y acceso al catálogo',
      'Empezás a vender con su acompañamiento'
    ];

    return '<div>' +
      '<div style="background:var(--navy-900);color:#fff;padding:72px 32px;text-align:center">' +
        '<h1 class="display display-lg" style="color:#fff;max-width:760px;margin:0 auto 16px">¿Querés generar tus propios ingresos vendiendo productos que amás?</h1>' +
        '<p style="font-size:var(--fs-body-lg);max-width:620px;margin:0 auto 28px">Sumate a mi equipo de revendedoras y revendedores Bagués y empezá a construir tu propio negocio con mi acompañamiento.</p>' +
        DS.Button({ variant: 'primary', size: 'lg', label: 'Quiero sumarme por WhatsApp', href: waLink('Hola Maricarmen, quiero sumarme como revendedora/or de Bagués'), external: true }) +
      '</div>' +

      '<section class="section">' +
        '<h2 class="display h-lg" style="margin:0 0 28px">Beneficios de unirte</h2>' +
        '<div class="cat-grid">' + benefits.map(function (b) {
          return '<div class="benefit">' + icon(b[0], 24) +
            '<p style="font-weight:600;color:var(--text-heading);margin:0 0 6px">' + esc(b[1]) + '</p>' +
            '<p class="muted" style="font-size:var(--fs-body-sm);margin:0">' + esc(b[2]) + '</p></div>';
        }).join('') + '</div>' +
      '</section>' +

      '<section class="section--tint"><div class="container">' +
        '<h2 class="display h-lg" style="margin:0 0 28px">Cómo funciona</h2>' +
        '<div class="steps">' + steps.map(function (s, i) {
          return '<div><p class="step__n">' + (i + 1) + '</p><p style="margin:0;font-size:var(--fs-body-md)">' + esc(s) + '</p></div>';
        }).join('') + '</div>' +
      '</div></section>' +

      '<section class="section" style="max-width:660px">' +
        (state.flash === 'apply'
          ? '<div style="text-align:center">' +
              '<h2 class="display h-lg" style="margin:0 0 10px">¡Recibimos tu postulación!</h2>' +
              '<p class="muted">Maricarmen se va a poner en contacto a la brevedad.</p></div>'
          : '<h2 class="display h-lg" style="margin:0 0 20px">Quiero postularme</h2>' +
            '<form class="js-apply form-stack" novalidate>' +
              '<label class="sr-only" for="ap-nombre">Nombre y apellido</label>' +
              '<input id="ap-nombre" name="nombre" class="field" placeholder="Nombre y apellido" required autocomplete="name">' +
              '<label class="sr-only" for="ap-wa">WhatsApp</label>' +
              '<input id="ap-wa" name="whatsapp" class="field" placeholder="WhatsApp" required inputmode="tel" autocomplete="tel">' +
              '<label class="sr-only" for="ap-email">Email</label>' +
              '<input id="ap-email" name="email" type="email" class="field" placeholder="Email" required autocomplete="email">' +
              '<label class="sr-only" for="ap-ciudad">Ciudad o zona</label>' +
              '<input id="ap-ciudad" name="ciudad" class="field" placeholder="Ciudad / zona" required>' +
              '<label class="sr-only" for="ap-com">Contanos por qué querés sumarte</label>' +
              '<textarea id="ap-com" name="comentario" class="field" rows="3" placeholder="Contanos por qué querés sumarte"></textarea>' +
              '<label class="check"><input type="checkbox" name="acepta" required> Acepto ser contactada/o para conocer la propuesta</label>' +
              '<p class="form-error js-form-error" hidden></p>' +
              DS.Button({ variant: 'primary', size: 'lg', label: 'Enviar postulación', type: 'submit' }) +
            '</form>') +
      '</section></div>';
  }

  function viewContacto() {
    var r = CFG.reseller;
    var rows = [
      ['message', 'WhatsApp: ' + (r.whatsapp ? '+' + r.whatsapp : '[COMPLETAR]')],
      ['instagram', 'Instagram: ' + (r.instagram ? '@' + r.instagram : '[COMPLETAR]')],
      ['mail', 'Email: ' + (r.email || '[COMPLETAR]')],
      ['pin', 'Zona de entrega: ' + r.zona]
    ];
    return '<div class="section" style="max-width:1100px">' +
      '<h1 class="display display-md" style="margin:0 0 32px">Contacto</h1>' +
      '<div style="display:flex;gap:48px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:280px">' +
          '<div style="display:flex;flex-direction:column;gap:16px;margin-bottom:32px">' +
            rows.map(function (x) {
              return '<p style="display:flex;gap:12px;align-items:center;margin:0;font-size:var(--fs-body-md)">' +
                icon(x[0], 20) + '<span>' + esc(x[1]) + '</span></p>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
            DS.Button({ variant: 'primary', label: 'Escribir por WhatsApp', href: waLink('Hola Maricarmen! Tengo una consulta sobre tus productos Bagués.'), external: true }) +
            DS.Button({ variant: 'outline', label: 'Ver LinkedIn', href: r.linkedin, external: true }) +
          '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:280px">' +
          (state.flash === 'contact'
            ? '<div style="text-align:center;padding:32px 0">' +
                '<h2 class="display h-lg" style="margin:0 0 10px">¡Mensaje enviado!</h2>' +
                '<p class="muted">Maricarmen te va a responder a la brevedad.</p></div>'
            : '<form class="js-contact form-stack" novalidate>' +
                '<label class="sr-only" for="co-nombre">Nombre</label>' +
                '<input id="co-nombre" name="nombre" class="field" placeholder="Nombre" required autocomplete="name">' +
                '<label class="sr-only" for="co-email">Email</label>' +
                '<input id="co-email" name="email" type="email" class="field" placeholder="Email" required autocomplete="email">' +
                '<label class="sr-only" for="co-msg">Tu mensaje</label>' +
                '<textarea id="co-msg" name="mensaje" class="field" rows="4" placeholder="Tu mensaje" required></textarea>' +
                '<p class="form-error js-form-error" hidden></p>' +
                DS.Button({ variant: 'primary', size: 'lg', label: 'Enviar mensaje', type: 'submit' }) +
              '</form>') +
        '</div>' +
      '</div></div>';
  }

  function viewLegales() {
    return '<div class="section" style="max-width:780px">' +
      '<h1 class="display display-md" style="margin:0 0 32px">Legales y preguntas frecuentes</h1>' +
      '<section style="margin-bottom:32px"><h2 style="font-size:var(--fs-body-md);font-weight:600;color:var(--text-heading);margin:0 0 8px">Términos y condiciones</h2>' +
        '<p class="muted" style="font-size:var(--fs-body-sm);line-height:var(--lh-normal);margin:0">Este sitio es operado por ' + esc(CFG.reseller.nombre) +
        ', revendedora oficial independiente de productos Bagués. No representa a Bagués S.A. [COMPLETAR: términos legales completos].</p></section>' +
      '<section style="margin-bottom:32px"><h2 style="font-size:var(--fs-body-md);font-weight:600;color:var(--text-heading);margin:0 0 8px">Política de envíos y cambios</h2>' +
        '<p class="muted" style="font-size:var(--fs-body-sm);line-height:var(--lh-normal);margin:0">Envío gratis a partir de $' + money(CFG.commerce.envioGratisDesde) +
        '. Contás con 10 días desde la recepción para gestionar un cambio, siempre que el producto esté sin uso y en su empaque original. [COMPLETAR: zonas y costos exactos].</p></section>' +
      '<section style="margin-bottom:40px"><h2 style="font-size:var(--fs-body-md);font-weight:600;color:var(--text-heading);margin:0 0 8px">Política de privacidad</h2>' +
        '<p class="muted" style="font-size:var(--fs-body-sm);line-height:var(--lh-normal);margin:0">Tus datos se usan únicamente para procesar pedidos y coordinar la entrega. No se comparten con terceros. [COMPLETAR: texto legal completo].</p></section>' +
      '<h2 style="font-size:var(--fs-body-md);font-weight:600;color:var(--text-heading);margin:0 0 16px">Preguntas frecuentes</h2>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' + FAQS.map(function (f, i) {
        var open = state.faqOpen === i;
        return '<div class="faq">' +
          '<button type="button" class="faq__q" data-action="faq" data-value="' + i + '" aria-expanded="' + open + '">' +
            '<span>' + esc(f.q) + '</span><span aria-hidden="true">' + (open ? '–' : '+') + '</span></button>' +
          (open ? '<p class="faq__a">' + esc(f.a) + '</p>' : '') +
          '</div>';
      }).join('') + '</div></div>';
  }

  /* ---------------------------------------------------------- Chrome (UI) -- */
  function header() {
    var page = state.route.page;
    var nav = [['#/', 'Home', 'home'], ['#/catalogo/fragancias', 'Catálogo', 'catalogo'],
      ['#/quien-soy', 'Quién soy', 'quien-soy'], ['#/emprende', 'Emprendé', 'emprende'],
      ['#/contacto', 'Contacto', 'contacto']];
    var count = cartCount();

    return '<p class="promo">' + esc(CFG.commerce.promos[state.heroSlide % CFG.commerce.promos.length]) + '</p>' +
      (CFG.legal.mostrarDisclaimer ? '<p class="disclaimer" style="margin:0">' + esc(CFG.legal.disclaimer) + '</p>' : '') +
      '<header class="site-header"><div class="site-header__bar">' +
        '<a class="brand" href="#/">' +
          '<img src="assets/logos/bagues-logo-positivo.png" alt="Bagués" width="120" height="28">' +
          '<span class="brand__by">by ' + esc(CFG.reseller.nombre) + '</span></a>' +
        '<button class="btn btn--ghost btn--sm nav-toggle" data-action="toggle-nav" aria-expanded="' + state.navOpen + '" aria-controls="mainnav" aria-label="Abrir menú">' + icon('menu', 20) + '</button>' +
        '<nav id="mainnav" class="mainnav' + (state.navOpen ? ' is-open' : '') + '" aria-label="Navegación principal">' +
          nav.map(function (n) {
            return '<a href="' + n[0] + '" class="' + (page === n[2] ? 'is-active' : '') + '">' + n[1] + '</a>';
          }).join('') + '</nav>' +
        '<div class="header-actions">' +
          DS.Button({ variant: 'outline', size: 'sm', label: 'Emprendé conmigo', href: '#/emprende' }) +
          '<button class="cart-btn" data-action="toggle-cart" aria-label="Abrir carrito (' + count + ' productos)">' +
            icon('bag', 22) +
            (count ? '<span class="cart-btn__count">' + count + '</span>' : '') +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="subnav"><div class="subnav__inner">' +
        CATS.map(function (c) {
          return '<a href="#/catalogo/' + esc(c.slug) + '" class="' + (state.route.param === c.slug ? 'is-active' : '') + '">' + esc(c.name) + '</a>';
        }).join('') +
      '</div></div></header>';
  }

  function footer() {
    var r = CFG.reseller;
    return '<footer class="site-footer"><div class="site-footer__cols">' +
      '<div class="site-footer__col" style="min-width:220px">' +
        '<img src="assets/logos/bagues-logo-positivo.png" alt="Bagués" style="height:24px;filter:brightness(0) invert(1);margin-bottom:12px" width="120" height="24">' +
        '<p style="font-family:var(--font-display);font-style:italic;font-size:14px;color:var(--navy-400);margin:0 0 16px">by ' + esc(r.nombre) + '</p>' +
        '<p style="font-size:12px;color:var(--navy-400);line-height:var(--lh-normal);max-width:260px;margin:0">' + esc(CFG.legal.disclaimer) + '</p>' +
      '</div>' +
      '<div class="site-footer__col"><p class="site-footer__title">Categorías</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          CATS.map(function (c) { return '<a href="#/catalogo/' + esc(c.slug) + '">' + esc(c.name) + '</a>'; }).join('') +
        '</div></div>' +
      '<div class="site-footer__col"><p class="site-footer__title">Contacto</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;font-size:13px">' +
          '<a href="' + waLink('Hola Maricarmen!') + '" target="_blank" rel="noopener noreferrer">WhatsApp' + (r.whatsapp ? ': +' + esc(r.whatsapp) : ': [COMPLETAR]') + '</a>' +
          (r.instagram ? '<a href="https://instagram.com/' + esc(r.instagram) + '" target="_blank" rel="noopener noreferrer">Instagram: @' + esc(r.instagram) + '</a>' : '<span style="color:#fff;font-size:13px">Instagram: [COMPLETAR]</span>') +
          (r.email ? '<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : '<span style="color:#fff;font-size:13px">Email: [COMPLETAR]</span>') +
          '<a href="' + esc(r.linkedin) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        '</div></div>' +
      '<div class="site-footer__col"><p class="site-footer__title">Legal</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          '<a href="#/legales">Términos y condiciones</a><a href="#/legales">Envíos y cambios</a>' +
          '<a href="#/legales">Privacidad</a><a href="#/legales">Preguntas frecuentes</a></div>' +
        '<img src="assets/logos/payment-badges.png" alt="Medios de pago aceptados" style="height:22px;margin-top:16px;filter:brightness(0) invert(1);opacity:.8" loading="lazy">' +
      '</div></div>' +
      '<p class="site-footer__legal">© ' + new Date().getFullYear() + ' ' + esc(r.nombre) + ' — Bagués by ' + esc(r.nombre) + '. Todos los precios en pesos argentinos.</p>' +
      '</footer>';
  }

  function drawer() {
    if (!state.cartOpen) return '';
    var lines = cartLines();
    var t = totals();
    return '<button class="drawer-scrim" data-action="close-cart" aria-label="Cerrar carrito"></button>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras">' +
        '<div class="drawer__head">' +
          '<p class="display h-lg" style="margin:0">Tu carrito</p>' +
          '<button class="icon-btn" style="font-size:22px" data-action="close-cart" aria-label="Cerrar">×</button></div>' +
        (lines.length
          ? '<div class="drawer__body">' + lines.map(function (l) { return lineRow(l, true); }).join('') + '</div>' +
            '<div class="drawer__foot">' +
              '<div style="display:flex;justify-content:space-between;font-weight:600;color:var(--text-heading);margin-bottom:14px">' +
                '<span>Subtotal</span><span>$' + money(t.subtotal) + '</span></div>' +
              '<div style="display:flex;flex-direction:column;gap:10px">' +
                DS.Button({ variant: 'primary', size: 'lg', label: 'Finalizar compra', href: '#/checkout', block: true }) +
                DS.Button({ variant: 'outline', label: 'Ver carrito', href: '#/carrito', block: true }) +
              '</div></div>'
          : '<p style="text-align:center;padding:48px 0;color:var(--text-faint)">Tu carrito está vacío.</p>') +
      '</aside>';
  }

  function waFloat() {
    return '<a class="wa-float" href="' + waLink('Hola Maricarmen! Tengo una consulta sobre tus productos Bagués.') +
      '" target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp">' + icon('message', 26) + '</a>';
  }

  /* ---------------------------------------------------------------- Render - */
  function currentView() {
    switch (state.route.page) {
      case 'catalogo': return viewCatalogo(state.route.param);
      case 'producto': return viewProducto(state.route.param);
      case 'carrito': return viewCarrito();
      case 'checkout': return viewCheckout();
      case 'quien-soy': return viewQuienSoy();
      case 'emprende': return viewEmprende();
      case 'contacto': return viewContacto();
      case 'legales': return viewLegales();
      default: return viewHome();
    }
  }

  function render() {
    document.getElementById('header-slot').innerHTML = header();
    document.getElementById('main').innerHTML = currentView();
    document.getElementById('footer-slot').innerHTML = footer();
    document.getElementById('overlay-slot').innerHTML = drawer() + waFloat();
  }

  /* ------------------------------------------------------------- Eventos --- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    var a = el.getAttribute('data-action');
    var v = el.getAttribute('data-value');

    switch (a) {
      case 'toggle-nav': state.navOpen = !state.navOpen; render(); break;
      case 'toggle-cart': state.cartOpen = !state.cartOpen; render(); break;
      case 'close-cart': state.cartOpen = false; render(); break;
      case 'hero-prev': state.heroSlide = (state.heroSlide + HERO.length - 1) % HERO.length; render(); break;
      case 'hero-next': state.heroSlide = (state.heroSlide + 1) % HERO.length; render(); break;
      case 'hero-go': state.heroSlide = Number(v); render(); break;
      case 'set-genero': state.genero = v; render(); break;
      case 'set-variant': state.pdpVariant = v; render(); break;
      case 'set-pm': state.paymentMethod = v; render(); break;
      case 'faq': state.faqOpen = state.faqOpen === Number(v) ? null : Number(v); render(); break;
      case 'add-to-cart': addToCart(el.getAttribute('data-id'), 1); break;
      case 'add-to-cart-pdp': addToCart(el.getAttribute('data-id'), state.pdpQty, state.pdpVariant); break;
      case 'buy-now':
        addToCart(el.getAttribute('data-id'), state.pdpQty, state.pdpVariant);
        state.cartOpen = false; location.hash = '#/checkout'; break;
      case 'pdp-qty':
        state.pdpQty = Math.max(1, state.pdpQty + Number(el.getAttribute('data-delta'))); render(); break;
      case 'line-qty': setQty(el.getAttribute('data-key'), Number(el.getAttribute('data-delta'))); break;
      case 'line-remove': removeLine(el.getAttribute('data-key')); break;
    }
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.getAttribute && el.getAttribute('data-action') === 'set-sort') {
      state.sortBy = el.value; render();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && state.cartOpen) { state.cartOpen = false; render(); }
  });

  /* ------------------------------------------------------------ Formularios */
  function formData(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });
    return out;
  }

  function showError(form, msg) {
    var p = form.querySelector('.js-form-error');
    if (!p) return;
    p.textContent = msg; p.hidden = !msg;
  }

  function validate(form) {
    var missing = Array.prototype.filter.call(form.elements, function (el) {
      if (!el.required) return false;
      return el.type === 'checkbox' ? !el.checked : !el.value.trim();
    });
    if (missing.length) {
      showError(form, 'Por favor completá los campos obligatorios.');
      missing[0].focus();
      return false;
    }
    var email = form.querySelector('input[type=email]');
    if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
      showError(form, 'Revisá el formato del email.'); email.focus(); return false;
    }
    showError(form, '');
    return true;
  }

  /** Entrega el formulario según CFG.forms.modo. Devuelve una promesa. */
  function deliver(kind, data, waText) {
    var mode = CFG.forms.modo;
    if (mode === 'endpoint' && CFG.forms.endpoint) {
      return fetch(CFG.forms.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: kind, datos: data })
      }).catch(function () { /* silencioso: igual mostramos confirmación */ });
    }
    if (mode === 'email' && CFG.reseller.email) {
      window.location.href = 'mailto:' + CFG.reseller.email +
        '?subject=' + encodeURIComponent('[Web] ' + kind) + '&body=' + encodeURIComponent(waText);
      return Promise.resolve();
    }
    window.open(waLink(waText), '_blank', 'noopener');
    return Promise.resolve();
  }

  document.addEventListener('submit', function (ev) {
    var form = ev.target;

    if (form.classList.contains('js-coupon')) {
      ev.preventDefault();
      var code = formData(form).coupon.toUpperCase();
      var rate = CFG.commerce.cupones[code];
      state.coupon = rate
        ? { code: code, applied: true, rate: rate, msg: 'Cupón aplicado: ' + Math.round(rate * 100) + '% off' }
        : { code: code, applied: false, rate: 0, msg: 'Cupón inválido' };
      render();
      return;
    }

    if (form.classList.contains('js-newsletter')) {
      ev.preventDefault();
      var email = formData(form).email;
      deliver('Newsletter', { email: email }, 'Hola Maricarmen! Quiero suscribirme a las novedades. Mi email: ' + email);
      form.reset();
      announce('¡Gracias! Te vamos a escribir a ' + email);
      alert('¡Gracias por suscribirte!');
      return;
    }

    if (form.classList.contains('js-checkout')) {
      ev.preventDefault();
      if (!validate(form)) return;
      var d = formData(form);
      var t = totals();
      var lines = cartLines();
      var number = 'MC-' + Math.floor(1000 + Math.random() * 9000);
      var text = 'Hola Maricarmen! Quiero confirmar mi pedido ' + number + '.\n' +
        lines.map(function (l) { return '• ' + l.product.name + ' (' + l.variant + ') x' + l.qty + ' — $' + money(l.lineTotal); }).join('\n') +
        '\nEnvío: ' + (t.shipping === 0 ? 'Gratis' : '$' + money(t.shipping)) +
        (t.discount ? '\nDescuento: -$' + money(t.discount) : '') +
        '\nTotal: $' + money(t.total) +
        '\nPago: ' + state.paymentMethod +
        '\nNombre: ' + d.nombre + '\nTel: ' + d.telefono + '\nEmail: ' + d.email +
        '\nEnvío a: ' + d.direccion + ', ' + d.ciudad;
      deliver('Pedido ' + number, d, text);
      state.order = { number: number, text: text };
      state.cart = []; saveCart();
      state.coupon = { code: '', applied: false, msg: '', rate: 0 };
      render(); window.scrollTo(0, 0);
      return;
    }

    if (form.classList.contains('js-apply')) {
      ev.preventDefault();
      if (!validate(form)) return;
      var ap = formData(form);
      deliver('Postulación revendedor/a', ap,
        'Hola Maricarmen, quiero sumarme como revendedora/or de Bagués.\nNombre: ' + ap.nombre +
        '\nWhatsApp: ' + ap.whatsapp + '\nEmail: ' + ap.email + '\nCiudad: ' + ap.ciudad +
        (ap.comentario ? '\nComentario: ' + ap.comentario : ''));
      state.flash = 'apply'; render(); window.scrollTo(0, 0);
      return;
    }

    if (form.classList.contains('js-contact')) {
      ev.preventDefault();
      if (!validate(form)) return;
      var co = formData(form);
      deliver('Consulta web', co,
        'Hola Maricarmen! Soy ' + co.nombre + ' (' + co.email + ').\n' + co.mensaje);
      state.flash = 'contact'; render(); window.scrollTo(0, 0);
      return;
    }
  });

  /* ----------------------------------------------------------------- Init -- */
  window.addEventListener('hashchange', function () { state.flash = null; state.order = null; onRouteChange(); });

  // Rotación automática del hero sólo cuando estamos en Home.
  setInterval(function () {
    if (state.route.page !== 'home' || document.hidden) return;
    state.heroSlide = (state.heroSlide + 1) % HERO.length;
    render();
  }, 6000);

  onRouteChange();
})();
