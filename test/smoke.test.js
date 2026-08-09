/* Pruebas de humo del portal — se ejecutan con jsdom (node test/smoke.test.js)
   Verifican render de las 9 páginas, carrito, cupón, checkout y formularios. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, passes = 0;
const errors = [];

function ok(cond, msg) {
  if (cond) { passes++; console.log('  ✓ ' + msg); }
  else { fails++; console.log('  ✗ ' + msg); }
}

const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), {
  runScripts: 'dangerously',
  resources: undefined,
  url: 'https://ejemplo.com/',
  virtualConsole: vc,
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

// Cargar scripts manualmente (jsdom no resuelve <script src> sin resource loader)
['js/config.js', 'js/ds.js', 'js/app.js'].forEach(f => {
  const s = document.createElement('script');
  s.textContent = fs.readFileSync(path.join(ROOT, f), 'utf8');
  document.body.appendChild(s);
});

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const text = () => document.getElementById('main').textContent;

function go(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
}

console.log('\n1. Estructura base');
ok(!!$('#header-slot .site-header'), 'header renderizado');
ok(!!$('#footer-slot .site-footer'), 'footer renderizado');
ok($$('#header-slot .subnav a').length === 7, 'subnav con las 7 categorías');
ok(/no es el sitio web oficial/.test($('#header-slot').textContent), 'disclaimer de revendedora visible');

console.log('\n2. Home');
ok(!!$('#main .hero'), 'hero presente');
ok($$('#main .card').length >= 5, 'grilla de destacados con productos');
ok(/Conocé a Maricarmen/.test(text()), 'bloque de Maricarmen');
ok(/Quiero sumarme/.test(text()), 'CTA de reclutamiento');

console.log('\n3. Navegación por rutas');
const rutas = [
  ['#/catalogo/fragancias', 'Fragancias'],
  ['#/producto/brescia', 'Brescia Crystalline'],
  ['#/carrito', 'Tu carrito'],
  ['#/quien-soy', 'Maricarmen Vázquez'],
  ['#/emprende', 'Beneficios de unirte'],
  ['#/contacto', 'Contacto'],
  ['#/legales', 'Preguntas frecuentes']
];
rutas.forEach(([h, needle]) => { go(h); ok(text().includes(needle), h + ' → "' + needle + '"'); });

console.log('\n4. Filtros y orden del catálogo');
go('#/catalogo/fragancias');
ok($$('#main .card').length === 3, '3 fragancias listadas');
click($$('[data-action="set-genero"]').find(b => b.dataset.value === 'Hombre'));
ok($$('#main .card').length === 1, 'filtro Género=Hombre deja 1 producto');
click($$('[data-action="set-genero"]').find(b => b.dataset.value === 'Todas'));
const sel = $('#sort');
sel.value = 'precio-asc';
sel.dispatchEvent(new window.Event('change', { bubbles: true }));
const precios = $$('#main .card .price__now').map(e => Number(e.textContent.replace(/[^\d]/g, '')));
ok(precios[0] <= precios[precios.length - 1], 'orden por precio ascendente aplicado');

console.log('\n5. Carrito');
window.localStorage.clear();
go('#/producto/brescia');
click($('[data-action="add-to-cart-pdp"]'));
ok(/1/.test($('.cart-btn__count').textContent), 'contador del carrito en 1');
ok(!!$('.drawer'), 'drawer se abre al agregar');
click($('[data-action="pdp-qty"][data-delta="1"]'));
click($('[data-action="add-to-cart-pdp"]'));
ok($('.cart-btn__count').textContent === '3', 'cantidad acumulada = 3');
ok(JSON.parse(window.localStorage.getItem('bagues-mc-cart-v1')).length === 1, 'carrito persistido en localStorage');

go('#/carrito');
ok(/Brescia Crystalline/.test(text()), 'línea de producto en el carrito');
ok(/137\.997,00/.test(text()), 'total de línea calculado (3 × 45.999)');
ok(/Gratis/.test(text()), 'envío gratis por superar el umbral');

console.log('\n6. Cupón');
const cf = $('form.js-coupon');
cf.querySelector('#coupon').value = 'BAGUES10';
cf.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(/Cupón aplicado/.test(text()), 'cupón BAGUES10 aceptado');
const cf2 = $('form.js-coupon');
cf2.querySelector('#coupon').value = 'NOPE';
cf2.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(/Cupón inválido/.test(text()), 'cupón inexistente rechazado');

console.log('\n7. Quitar y cantidades');
go('#/carrito');
click($('[data-action="line-qty"][data-delta="-1"]'));
ok($('.cart-btn__count').textContent === '2', 'stepper resta unidades');
click($('[data-action="line-remove"]'));
ok(/carrito está vacío/.test(text()), 'eliminar deja el carrito vacío');

console.log('\n8. Checkout');
go('#/producto/mykonos');
click($('[data-action="add-to-cart-pdp"]'));
go('#/checkout');
const form = $('form.js-checkout');
ok(!!form, 'formulario de checkout presente');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(!$('.js-form-error').hidden, 'validación bloquea envío incompleto');
window.open = () => {};
['nombre', 'telefono', 'email', 'direccion', 'ciudad'].forEach((n, i) => {
  form.elements[n].value = n === 'email' ? 'test@test.com' : 'Dato ' + i;
});
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(/Gracias por tu pedido/.test(text()), 'checkout confirma el pedido');
ok(/MC-\d{4}/.test(text()), 'número de orden generado');
ok(!$('.cart-btn__count'), 'carrito vaciado tras confirmar');

console.log('\n9. Formularios de captación');
go('#/emprende');
const ap = $('form.js-apply');
['nombre', 'whatsapp', 'email', 'ciudad'].forEach(n => { ap.elements[n].value = n === 'email' ? 'a@b.com' : 'x'; });
ap.elements.acepta.checked = true;
ap.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(/Recibimos tu postulación/.test(text()), 'postulación de revendedor/a enviada');

go('#/contacto');
const co = $('form.js-contact');
co.elements.nombre.value = 'Ana'; co.elements.email.value = 'a@b.com'; co.elements.mensaje.value = 'Hola';
co.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(/Mensaje enviado/.test(text()), 'formulario de contacto enviado');

console.log('\n10. SEO y accesibilidad');
go('#/producto/zayed');
ok(document.title.includes('Zayed'), 'title dinámico por producto');
ok(!!document.getElementById('ld-product'), 'JSON-LD de producto inyectado');
ok($$('#main img[alt]').length === $$('#main img').length, 'todas las imágenes tienen alt');
ok($$('#main h1').length === 1, 'un único H1 por página');
go('#/legales');
click($('[data-action="faq"]'));
ok($('.faq__a') !== null, 'acordeón de FAQ abre');

console.log('\n11. Enlaces clave');
go('#/quien-soy');
ok(/linkedin\.com\/in\/maricarmen/.test($('#main').innerHTML), 'enlace a LinkedIn de Maricarmen');
ok(/wa\.me\//.test(document.body.innerHTML), 'enlaces de WhatsApp presentes');

console.log('\n— Errores de consola: ' + (errors.length ? errors.join(' | ') : 'ninguno'));
console.log('\nRESULTADO: ' + passes + ' OK, ' + fails + ' fallos\n');
process.exit(fails || errors.length ? 1 : 0);
