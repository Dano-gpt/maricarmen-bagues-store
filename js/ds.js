/* ==========================================================================
   Bagués Design System — componentes en JS plano (sin React, sin build)
   Equivalencia 1:1 con los componentes del DS: DiscountBadge, PriceTag,
   ProductCard, QuantityStepper, Badge, Tag, Button, Input, NewsletterField,
   Breadcrumb, CategoryPills.
   Cada función devuelve un string de HTML.
   ========================================================================== */
(function (global) {
  'use strict';

  /** Escapa texto para insertar de forma segura en HTML. */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Serializa un objeto de atributos data-*: {action:'x', id:'y'} */
  function attrs(o) {
    return Object.keys(o || {})
      .filter(function (k) { return o[k] !== undefined && o[k] !== null && o[k] !== false; })
      .map(function (k) { return ' ' + k + '="' + esc(o[k]) + '"'; })
      .join('');
  }

  /* ---------------------------------------------------------------- Iconos */
  var ICONS = {
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>'
  };

  function icon(name, size, cls) {
    var body = ICONS[name] || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (size || 24) + '" height="' + (size || 24) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      body + '</svg>';
  }

  /* ------------------------------------------------------------ Componentes */

  /** Botón. o = {variant, size, label, action, data, tag, href, disabled, block, type} */
  function Button(o) {
    o = o || {};
    var cls = 'btn btn--' + (o.variant || 'primary') +
      (o.size === 'sm' ? ' btn--sm' : o.size === 'lg' ? ' btn--lg' : '') +
      (o.block ? ' btn--block' : '') + (o.className ? ' ' + o.className : '');
    var data = attrs(Object.assign({ 'data-action': o.action }, o.data || {}));
    if (o.href) {
      return '<a class="' + cls + '" href="' + esc(o.href) + '"' +
        (o.external ? ' target="_blank" rel="noopener noreferrer"' : '') + data + '>' + esc(o.label) + '</a>';
    }
    return '<button type="' + (o.type || 'button') + '" class="' + cls + '"' +
      (o.disabled ? ' disabled' : '') + data + '>' + esc(o.label) + '</button>';
  }

  /** Badge de descuento. */
  function DiscountBadge(percent) {
    if (!percent) return '';
    return '<span class="badge-sale">' + esc(percent) + '% OFF</span>';
  }

  /** Precio con precio tachado opcional. */
  function PriceTag(price, compareAt, currency) {
    var c = currency || '$';
    var onSale = compareAt && compareAt > price;
    return '<div class="price">' +
      '<span class="price__now' + (onSale ? ' is-sale' : '') + '">' + c + esc(money(price)) + '</span>' +
      (onSale ? '<span class="price__was">' + c + esc(money(compareAt)) + '</span>' : '') +
      '</div>';
  }

  /** Selector de cantidad. */
  function QuantityStepper(value, action, data) {
    var d = data || {};
    return '<div class="stepper">' +
      '<button type="button" aria-label="Reducir cantidad"' +
      attrs(Object.assign({ 'data-action': action, 'data-delta': -1 }, d)) + '>&ndash;</button>' +
      '<span aria-live="polite">' + esc(value) + '</span>' +
      '<button type="button" aria-label="Aumentar cantidad"' +
      attrs(Object.assign({ 'data-action': action, 'data-delta': 1 }, d)) + '>+</button>' +
      '</div>';
  }

  /** Tarjeta de producto (con enlace real a la PDP + botón agregar). */
  function ProductCard(p) {
    return '<article class="card">' +
      '<a class="card__media" href="#/producto/' + esc(p.id) + '" aria-label="Ver ' + esc(p.name) + '">' +
      (p.percent ? '<span class="card__badge">' + DiscountBadge(p.percent) + '</span>' : '') +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" width="220" height="220">' +
      '</a>' +
      '<div class="card__body">' +
      '<a class="card__name" href="#/producto/' + esc(p.id) + '">' + esc(p.name) + '</a>' +
      PriceTag(p.price, p.compareAt) +
      Button({ variant: 'primary', size: 'sm', label: 'Agregar al carrito', action: 'add-to-cart', data: { 'data-id': p.id } }) +
      '</div></article>';
  }

  /** Píldoras de categoría/filtro. */
  function CategoryPills(options, active, action) {
    return '<div class="pills" role="group">' + options.map(function (o) {
      return '<button type="button" class="pill' + (o === active ? ' is-active' : '') + '"' +
        attrs({ 'data-action': action, 'data-value': o }) +
        (o === active ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(o) + '</button>';
    }).join('') + '</div>';
  }

  /** Breadcrumb. items = [{label, href}] o strings. */
  function Breadcrumb(items) {
    return '<nav class="breadcrumb" aria-label="Ruta de navegación">' + items.map(function (it, i) {
      var label = typeof it === 'string' ? it : it.label;
      var href = typeof it === 'string' ? null : it.href;
      var last = i === items.length - 1;
      var node = href && !last
        ? '<a href="' + esc(href) + '">' + esc(label) + '</a>'
        : '<span class="' + (last ? 'is-current' : '') + '"' + (last ? ' aria-current="page"' : '') + '>' + esc(label) + '</span>';
      return (i > 0 ? '<span aria-hidden="true">/</span>' : '') + node;
    }).join('') + '</nav>';
  }

  /** Campo de newsletter. */
  function NewsletterField() {
    return '<form class="js-newsletter" style="display:flex;gap:8px;max-width:420px;width:100%">' +
      '<label class="sr-only" for="nl-email">Correo electrónico</label>' +
      '<input id="nl-email" class="field" type="email" name="email" required placeholder="Correo electrónico">' +
      Button({ variant: 'secondary', size: 'md', label: 'Suscribirme', type: 'submit' }) +
      '</form>';
  }

  /** Formatea números al formato monetario argentino usado por Bagués. */
  function money(n) {
    return Number(n || 0).toLocaleString('es-AR') + ',00';
  }

  global.DS = {
    esc: esc, attrs: attrs, icon: icon, money: money,
    Button: Button, DiscountBadge: DiscountBadge, PriceTag: PriceTag,
    QuantityStepper: QuantityStepper, ProductCard: ProductCard,
    CategoryPills: CategoryPills, Breadcrumb: Breadcrumb, NewsletterField: NewsletterField
  };
})(window);
