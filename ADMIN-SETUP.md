# Panel de administración (CMS) — puesta en marcha

El sitio ahora tiene un **panel de administración** en `/admin` (Decap CMS) que permite
editar **todo el contenido** sin tocar código: textos, imágenes, productos, precios,
categorías, links, datos de contacto, promos, cupones, testimonios, hero y FAQs.
Cada cambio que se guarda desde el panel se **commitea solo al repositorio** y el sitio
se **re-publica automáticamente** en GitHub Pages.

- URL del panel (una vez terminado el paso 3): **https://dano-gpt.github.io/maricarmen-bagues-store/admin/**
- El contenido vive en `content/*.json` y las imágenes subidas en `assets/uploads/`.

---

## Importante sobre el login ("usuario Gestor")

Decap CMS con GitHub **no usa un usuario y contraseña propios**: el ingreso es con una
**cuenta de GitHub que tenga permiso de escritura** sobre el repositorio. Es más seguro
(usa el login real de GitHub, con 2FA si lo activás) que una contraseña embebida en el
sitio, que sería visible por ser el repo público.

Para tener un acceso dedicado tipo **"Gestor"** hay dos opciones:

1. **Usar tu cuenta actual (`Dano-gpt`)** — ya sos dueño del repo, entrás directo.
2. **Crear una cuenta de GitHub dedicada** (por ejemplo usuario `gestor-maricarmen`) con la
   contraseña que elijas (podés usar `@_@Gestor@_@`), y agregarla como colaboradora:
   repo → **Settings → Collaborators → Add people** → permiso *Write*.
   Esa cuenta será el "Gestor". *(La cuenta y su contraseña las tenés que crear vos;
   por seguridad yo no ingreso ni guardo contraseñas.)*

---

## Paso 1 — Crear una GitHub OAuth App (2 min)

1. Entrá a **https://github.com/settings/developers → OAuth Apps → New OAuth App**.
2. Completá:
   - **Application name:** `Panel Bagués Maricarmen`
   - **Homepage URL:** `https://dano-gpt.github.io/maricarmen-bagues-store/`
   - **Authorization callback URL:** `https://bagues-auth.TU-SUBDOMINIO.workers.dev/callback`
     *(lo ajustás en el paso 2 con la URL real de tu worker)*
3. **Register application.** Guardá el **Client ID** y generá un **Client Secret**
   (*Generate a new client secret*). Vas a necesitarlos en el paso 2.

## Paso 2 — Desplegar el relay OAuth (Cloudflare Worker, gratis, 5 min)

Decap necesita un pequeño intermediario para el login con GitHub. El más simple es
**sveltia-cms-auth** (sirve para Decap):

1. Creá una cuenta gratis en **https://dash.cloudflare.com** → **Workers & Pages → Create → Worker**.
2. Nombralo `bagues-auth`, **Deploy**, luego **Edit code** y pegá el contenido de
   `worker.js` de **https://github.com/sveltia/sveltia-cms-auth** (botón *Deploy* del README
   o copiar el archivo). Guardá y desplegá.
3. En el worker → **Settings → Variables and Secrets**, agregá:
   - `GITHUB_CLIENT_ID` = el Client ID del paso 1
   - `GITHUB_CLIENT_SECRET` = el Client Secret del paso 1
   *(marcalos como *Secret*)*.
4. Copiá la URL del worker (ej: `https://bagues-auth.tu-subdominio.workers.dev`) y volvé al
   paso 1.2 a poner el **callback URL** real: `<esa-url>/callback`.

## Paso 3 — Enlazar el panel con el relay

1. Editá `admin/config.yml` (se puede desde el propio GitHub) y reemplazá:
   ```yaml
   base_url: https://REEMPLAZAR-CON-TU-RELAY-OAUTH
   ```
   por la URL real del worker, por ejemplo:
   ```yaml
   base_url: https://bagues-auth.tu-subdominio.workers.dev
   ```
2. Guardá (commit). Esperá ~1 minuto a que GitHub Pages re-publique.

## Paso 4 — Entrar al panel

1. Abrí **https://dano-gpt.github.io/maricarmen-bagues-store/admin/**
2. **Login with GitHub** → autorizá → ya podés editar todo.
   Cada "Guardar/Publicar" hace un commit y el sitio se actualiza en ~1 minuto.

---

## Qué se puede editar desde el panel

- **Configuración general:** nombre, rol, WhatsApp, Instagram, email, zona, LinkedIn,
  foto, bio corta y larga; envío gratis, costo de envío, moneda, **cupones**, **promos**
  de la barra superior; aviso legal; modo de formularios (WhatsApp/email/endpoint);
  Google Analytics y Meta Pixel.
- **Inicio:** slides del hero (imagen, título, subtítulo, link) y testimonios.
- **Catálogo:** categorías y **productos** (nombre, precio, precio anterior, % OFF,
  imagen, género, categoría, descripción, notas).
- **Preguntas frecuentes.**

> Nota sobre imágenes: las que subís desde el panel se guardan en `assets/uploads/`.
> Si alguna imagen no se ve, revisá que la ruta guardada sea relativa (empiece con
> `assets/…`, sin barra inicial), porque el sitio vive bajo `/maricarmen-bagues-store/`.

---

## ¿Preferís que lo dejemos andando juntos?

Los pasos 1 y 2 requieren tus cuentas (GitHub y Cloudflare) y un *client secret*, que por
seguridad tenés que ingresar vos. Si querés, te voy guiando en vivo pantalla por pantalla;
yo hago todo lo que no sea escribir contraseñas o secretos.
