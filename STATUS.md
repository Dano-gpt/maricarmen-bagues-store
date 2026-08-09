# Estado del proyecto — Bagués by Maricarmen Vázquez

Este archivo es la memoria del proyecto: qué se hizo, qué falta y cómo seguir
en la próxima sesión de trabajo. Repo: `Dano-gpt/maricarmen-bagues-store` (privado).

## Origen

1. Se creó un prompt detallado para generar el portal (`prompt-portal-bagues-mariacarmen.md`, en `uploads/` del proyecto original de diseño).
2. A partir de ese prompt se generó un prototipo navegable en **Claude Design**
   (`Bagues Maricarmen Portal.dc.html`, proyecto `ccc98f75-d2ee-437f-ae98-4e59f00c4712`)
   usando un design system propio llamado **Bagués Design System**.
3. Se importó ese prototipo (markup + tokens + assets) y se reescribió como
   **sitio estático de producción**: sin React, sin build, sin dependencias
   externas — HTML/CSS/JS plano, listo para cualquier hosting estático.
4. Se subió a GitHub (`Dano-gpt/maricarmen-bagues-store`) el **9 de agosto de 2026**.

## Qué está terminado

- [x] Las 9 páginas: Home, Catálogo, Producto, Carrito, Checkout, Quién soy, Emprendé, Contacto, Legales/FAQ.
- [x] Router por hash (URLs propias por página/producto, funciona "atrás").
- [x] Carrito persistente (`localStorage`), drawer, cupones, envío gratis por umbral.
- [x] Checkout con número de orden y handoff a WhatsApp (sin backend).
- [x] Formularios de contacto y de reclutamiento de revendedores, con validación.
- [x] Componentes del Bagués Design System reimplementados en JS plano (`js/ds.js`), tokens originales sin tocar (`css/tokens.*.css`).
- [x] SEO básico (title/description dinámicos, Open Graph, JSON-LD Store/Product) y accesibilidad (teclado, aria-*, alt, foco visible, `prefers-reduced-motion`).
- [x] Responsive con menú hamburguesa.
- [x] Imágenes optimizadas (16 MB → 7,6 MB).
- [x] 43 pruebas de humo automatizadas (`test/smoke.test.js`, corren con jsdom) — todas en verde.
- [x] Repo creado en GitHub bajo `Dano-gpt`, privado, con este historial documentado.

## Qué falta para producción (bloqueante)

Todo centralizado en `js/config.js`, marcado `[COMPLETAR]`:

- [ ] WhatsApp real de Maricarmen (`reseller.whatsapp`) — hoy es un número de ejemplo.
- [ ] Instagram y email reales (`reseller.instagram`, `reseller.email`).
- [ ] Foto profesional de Maricarmen (`reseller.foto`) — hoy muestra un placeholder.
- [ ] Bio y trayectoria reales (`reseller.bioCorta`, `reseller.bioLarga`). **El contenido de su LinkedIn no se pudo verificar automáticamente** (LinkedIn bloquea scraping sin sesión) — hay que pedírselo directamente a ella.
- [ ] Zona de cobertura / entrega (`reseller.zona`).
- [ ] Catálogo real: reemplazar los 5 productos de muestra en `window.PRODUCTS` (config.js) por el catálogo y precios vigentes de Maricarmen, con fotos propias.
- [ ] Datos bancarios / link de Mercado Pago reales (texto en el checkout, `js/app.js`).
- [ ] Textos legales definitivos (términos, envíos, privacidad) en `viewLegales()` de `js/app.js`.

## Próximos pasos técnicos (no bloqueantes, para "algunos cambios" antes de producción)

- [ ] Decidir hosting: GitHub Pages (gratis, requiere repo público o plan GitHub Pro para Pages privado), Netlify o Vercel (gratis, admiten repos privados e importación directa desde GitHub, dominio propio fácil).
- [ ] Si se elige Netlify/Vercel: conectar el repo desde su dashboard (deploy automático en cada push a `main`), sin necesidad de workflow propio.
- [ ] Si se elige GitHub Pages: pasar el repo a público (o upgrade a Pro) y activar Pages apuntando a la rama `main`, carpeta raíz.
- [ ] Evaluar cobro real: integrar Mercado Pago Checkout Pro (requiere una función serverless mínima para crear la preferencia de pago — Netlify/Vercel Functions sirven para esto sin levantar un backend propio).
- [ ] Conectar el formulario de contacto/postulación a un servicio real si se quiere dejar de depender de WhatsApp como único canal (`js/config.js → forms.modo = 'endpoint'`, con Formspree o Getform).
- [ ] Cargar dominio propio cuando Maricarmen defina uno.
- [ ] Opcional: agregar un workflow de GitHub Actions que corra `test/smoke.test.js` en cada push (CI).

## Cómo retomar

1. Cloná el repo y abrí `index.html` directo, o serví con `python3 -m http.server`.
2. Editá `js/config.js` con los datos reales a medida que Maricarmen los vaya confirmando.
3. Corré `node test/smoke.test.js` (requiere `npm i jsdom` una vez) antes de cada despliegue para confirmar que nada se rompió.
4. Cuando el contenido esté completo, avisar para conectar el hosting definitivo y salir a producción.
