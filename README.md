# Bagués by Maricarmen Vázquez — portal de venta

Sitio estático de producción generado a partir del prototipo de Claude Design
(`Bagues Maricarmen Portal.dc.html`) y del **Bagués Design System**.

Sin frameworks, sin paso de build, sin dependencias externas: se puede publicar
tal cual en cualquier hosting estático (Netlify, Vercel, GitHub Pages, Hostinger,
Cloudflare Pages o un FTP común).

---

## 1. Cómo verlo

- **Rápido:** doble clic en `index.html` (funciona desde el disco, sin servidor).
- **Recomendado (igual que en producción):**
  ```bash
  cd bagues-web
  python3 -m http.server 8000
  # abrir http://localhost:8000
  ```

También hay una versión de **un solo archivo** para mandar por mail o WhatsApp:
`bagues-portal-standalone.html` (todo embebido, ~12 MB).

---

## 2. Estructura

```
bagues-web/
├── index.html                    Cáscara del sitio + SEO + datos estructurados
├── css/
│   ├── styles.css                Componentes y layout del Design System
│   ├── tokens.colors.css         Tokens de color (del DS original, sin cambios)
│   ├── tokens.typography.css     Tipografía
│   └── tokens.spacing.css        Espaciado, radios, sombras, curvas de animación
├── fonts/                        Cormorant Garamond + Jost (self-hosted)
├── js/
│   ├── config.js                 ⚙️ ÚNICO archivo a editar para salir a producción
│   ├── ds.js                     Componentes del DS en JS plano
│   └── app.js                    Router, carrito, checkout, formularios
├── assets/                       Imágenes de producto, campañas, logos
├── test/smoke.test.js            43 pruebas automaticas (jsdom)
└── build-singlefile.py           Genera la versión de un solo archivo
```

---

## 3. Qué hay que completar antes de publicar

Todo lo pendiente está en **`js/config.js`** y marcado como `[COMPLETAR]`:

| Dato | Dónde | Por qué es crítico |
|---|---|---|
| Número de WhatsApp | `reseller.whatsapp` | De él dependen el botón flotante, el checkout y el formulario de revendedores |
| Instagram / email | `reseller.instagram`, `reseller.email` | Footer y página de contacto |
| Foto de Maricarmen | `reseller.foto` | Hoy muestra un marcador de posición |
| Bio y trayectoria reales | `reseller.bioCorta`, `reseller.bioLarga` | El contenido de LinkedIn **no se pudo verificar automáticamente** — pedírselo a ella |
| Zona de cobertura | `reseller.zona` | Contacto, FAQ y política de envíos |
| Catálogo real | `window.PRODUCTS` | Hoy hay 5 productos de muestra con precios de referencia |
| Datos bancarios / link de Mercado Pago | Texto del checkout en `js/app.js` | Cierre del pedido |
| Textos legales | `viewLegales()` en `js/app.js` | Términos, envíos y privacidad |

> El aviso *“Revendedora oficial independiente… este sitio no es el sitio web
> oficial de la marca Bagués”* aparece en la franja superior, en “Quién soy” y en
> el footer. Conviene mantenerlo: evita conflictos de uso de marca.

---

## 4. Cómo se procesan los pedidos y formularios

`config.js → forms.modo` admite tres estrategias:

| Modo | Qué hace | Requiere backend |
|---|---|---|
| `whatsapp` *(por defecto)* | Abre WhatsApp con el pedido/consulta ya redactado | No |
| `email` | Abre el cliente de correo hacia `reseller.email` | No |
| `endpoint` | `POST` JSON a `forms.endpoint` (Formspree, Getform, API propia) | Sí |

El checkout genera número de orden (`MC-####`), vacía el carrito y ofrece enviar
el detalle por WhatsApp. Para cobrar online, el paso siguiente natural es
Mercado Pago Checkout Pro (requiere un pequeño backend para crear la preferencia).

---

## 5. Funcionalidad incluida

- 9 páginas: Home, Catálogo, Producto, Carrito, Checkout, Quién soy, Emprendé, Contacto, Legales/FAQ.
- Ruteo por hash → cada página tiene URL propia, funciona el botón "atrás" y se puede compartir un producto.
- Carrito persistente en `localStorage`, drawer lateral, contador en el header.
- Filtros por categoría y género, orden por precio, badges de % OFF, precio tachado.
- Cupones (`BAGUES10` = 10%), envío gratis configurable por monto.
- Formulario de reclutamiento de revendedores + contacto + newsletter, con validación.
- SEO: títulos y descripción por página, Open Graph, JSON-LD de `Store` y de `Product`.
- Accesibilidad: navegación por teclado, `aria-*` en carrito y acordeones, foco visible, textos alternativos, respeto por `prefers-reduced-motion`.
- Responsive mobile-first con menú hamburguesa.

---

## 6. Pruebas

```bash
npm i jsdom
node test/smoke.test.js
```

Cubren render de las 9 páginas, filtros, orden, alta/baja/cantidades del carrito,
persistencia, cupones válidos e inválidos, validación y confirmación del checkout,
formularios de captación, y chequeos de SEO/accesibilidad. Última corrida: **43/43**.

---

## 7. Origen del diseño

Importado desde el proyecto de Claude Design
`ccc98f75-d2ee-437f-ae98-4e59f00c4712` (`Bagues Maricarmen Portal.dc.html`).
Los tokens de color, tipografía y espaciado son los del *Bagués Design System*
sin modificar; los componentes (Button, ProductCard, PriceTag, DiscountBadge,
QuantityStepper, CategoryPills, Breadcrumb, Input, NewsletterField) se
reimplementaron en JS plano respetando exactamente los mismos estilos.

Las copias originales del proyecto quedaron en la carpeta `bagues-portal/`.
