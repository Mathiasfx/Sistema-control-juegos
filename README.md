# Sistema de gestión de pedidos de juegos

Panel interno (**Next.js + Firebase Auth/Firestore**) para catálogo de juegos, pedidos, panel mensual y roles **admin** / **operativo**. El detalle funcional está en [PRD.md](./PRD.md).

---

## Requisitos previos

| Herramienta | Notas |
|-------------|--------|
| **Node.js** | LTS recomendado (v20 o v22). |
| **npm** | Incluido con Node. |
| **Proyecto Firebase** | Con **Authentication** y **Cloud Firestore** habilitados. |
| **Firebase CLI** *(opcional pero útil)* | Para publicar reglas: `npm i -g firebase-tools` y `firebase login`. |

---

## 1. Configurar Firebase (consola)

### 1.1 Crear proyecto y habilitar servicios

1. [Firebase Console](https://console.firebase.google.com) → **Agregar proyecto**.
2. Menú **Compilación** → **Authentication** → **Comenzar** → método **Correo electrónico / contraseña** (habilitar).
3. Menú **Compilación** → **Firestore Database** → **Crear base de datos** (modo producción o de prueba según tu política; las reglas del repo asumen reglas explícitas tras el despliegue).

### 1.2 Credenciales para la app web (variables de entorno)

1. ⚙️ **Configuración del proyecto** → tu app **Web** (`</>`).
2. Copiá los valores a un archivo **`.env.local`** en la raíz del repo (no lo subas a git; ya está en `.gitignore`).

Usá [`.env.example`](./.env.example) como plantilla:

```bash
cp .env.example .env.local
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Completá todas las `NEXT_PUBLIC_FIREBASE_*`. Son **públicas por diseño** en el cliente Firebase; la seguridad está en **Firestore Security Rules** y en **custom claims**, no en ocultar estas claves.

### 1.3 Dominios autorizados (producción)

En **Authentication** → **Configuración** → **Dominios autorizados**, agregá el dominio donde esté alojada la app (ej. `tu-app.vercel.app`). Sin esto, el login puede fallar en producción.

---

## 2. Reglas e índices de Firestore

El repo incluye [`firestore.rules`](./firestore.rules), [`firestore.indexes.json`](./firestore.indexes.json) y [`firebase.json`](./firebase.json).

### Opción A: Firebase CLI

```bash
firebase login
firebase use --add   # elegí tu projectId
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Opción B: Consola manual

Copiá el contenido de `firestore.rules` en **Firestore** → **Reglas** → Publicar.

Resumen de reglas:

- **`games`**: lectura si hay sesión; escritura solo **`admin`** (claim `role: "admin"`).
- **`gamePricing`**: solo **`admin`** (precios).
- **`orders`**: lectura con sesión; altas/ediciones acordes al PRD; el no-admin no puede cambiar **`paymentStatus`** ni **`createdAt`**; subcolección **`billing`** solo **`admin`**.

Si el token no trae `role: "admin"`, Firestore tratará al usuario como no administrador en esas rutas.

---

## 3. Cuenta de servicio y roles (admin / operativo)

### 3.1 Obtener JSON de servicio (solo para gestión, no para el front)

1. Consola → ⚙️ **Configuración del proyecto** → **Cuentas de servicio**.
2. **Generar nueva clave privada** → guardá el JSON en un lugar **fuera del repo** y con permisos restrictivos en tu máquina.

### 3.2 Asignar rol a un usuario de Auth

Los roles van en **custom claims** (`role: "admin"` | `"operativo"`). El script usa **firebase-admin** localmente.

**Windows (PowerShell):**

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\fuera-del-repo\serviceAccount.json"
npm run set-role -- <UID_DE_AUTH> admin
```

**Linux / macOS:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/fuera-del-repo/serviceAccount.json"
npm run set-role -- <UID_DE_AUTH> admin
```

El **UID** aparece en Firebase → **Authentication** → usuario → columna UID.

Importante: después de cambiar claims, el usuario debe **cerrar sesión y volver a entrar** para que la app lea el rol nuevo.

---

## 4. Desarrollo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Sin `.env.local` correcto, la app fallará al inicializar Firebase en el navegador.

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build localmente (`next start`). |
| `npm run lint` | ESLint. |
| `npm run set-role` | Asignar custom claim (ver sección 3). |

---

## 5. Puesta en marcha productiva (servidor propio o VM)

1. Variables de entorno: mismas **`NEXT_PUBLIC_FIREBASE_*`** que en desarrollo (en el hosting: panel de variables o entorno del proceso).
2. Build y arranque:

```bash
npm ci          # opcional en CI: instalación reproducible
npm run build
npm run start   # puerto por defecto 3000; en muchos hosts se usa la variable `PORT`
```

3. HTTPS y dominio: reverse proxy (Nginx, Caddy, etc.) o la plataforma que elijas.
4. No subas **`GOOGLE_APPLICATION_CREDENTIALS`** ni el JSON de servicio al servidor del **frontend**; solo los necesitás en tu máquina (o en un backend de administración si lo agregás más adelante).

---

## 6. Despliegue en Vercel (referencia)

1. Conectá el repo a [Vercel](https://vercel.com).
2. En **Settings → Environment Variables**, definí todas las `NEXT_PUBLIC_FIREBASE_*` para **Production** (y **Preview** si usás previews).
3. **Build command:** `npm run build` (por defecto en proyectos Next).
4. Agregá el dominio de Vercel en Firebase **Dominios autorizados**.

---

## 7. Despliegue en Netlify y secret scanning (`AIza`, `NEXT_PUBLIC_*`)

Las variables **`NEXT_PUBLIC_FIREBASE_*`** van al **bundle del cliente** por diseño. Netlify aplica **dos cosas**: detección inteligente (patrones tipo `AIza…`) y escaneo de variables que vos marcaste como **Contains secret values**.

### Regla de oro

- **`NEXT_PUBLIC_FIREBASE_*`**: creálas **sin** *Contains secret values*.
- Variables de **configuración del escaneo** de Netlify (`SECRETS_SCAN_*`): **tampoco** las marques como secreto. Si las marcaste, **borrá y recreá** la variable igual pero **sin** el flag (Netlify no deja quitar el flag sin borrar).

### Si el log dice `Secret env var "NEXT_PUBLIC_FIREBASE_…"'s value detected`

Esa variable está como secreta pero su valor **ya está** en el JS público → el build falla. Solución: **borrar y recrear** cada `NEXT_PUBLIC_FIREBASE_*` **sin** “Contains secret values”, o definir **`SECRETS_SCAN_OMIT_KEYS`** con los **nombres** (no los valores) de esas claves, por ejemplo:

`NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

([docs](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning)).

### Si el log dice `Secret env var "SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES"'s value detected`

Pasó algo típico: esa variable **quedó marcada como secreta** y su valor incluye fragmentos iguales a lo que ya va en el bundle (por ejemplo la misma API key que `NEXT_PUBLIC_FIREBASE_API_KEY`). El escaneo ve el mismo texto en `.next`/`.netlify` y lo reporta como filtración **de esa variable de Netlify**.

**Qué hacer:** borrá **`SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`** y volvé a crearla con el mismo contenido (**sin** *Contains secret values*).  
**Menos lío:** eliminá `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` y usá solo **`SECRETS_SCAN_OMIT_KEYS`** (arriba) + **`SECRETS_SCAN_SMART_DETECTION_ENABLED`** = `false` para no depender de listar valores en un safelist ([apagar smart detection](https://docs.netlify.com/manage/security/secret-scanning/#turn-off-smart-detection)).

### Smart detection sólo (`AIza…`)

Si sólo molesta el patrón `AIza` y tus `NEXT_PUBLIC_*` **no** son secretas en Netlify, podés usar **`SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`** **como variable normal (no secreta)** con los literales permitidos por comas, tal como indica Netlify ([falsos positivos](https://docs.netlify.com/manage/security/secret-scanning/#manage-false-positives)).

---

Conviene registrar el dominio en Firebase **Dominios autorizados** y, si querés, restringir la API key por **HTTP referrer** en Google Cloud.

---

## 8. Modelo de datos (Firestore)

| Colección / ruta | Contenido |
|------------------|-----------|
| `games/{id}` | Nombre, descripción, categoría, timestamps (**sin precio**). |
| `gamePricing/{id}` | `price` (mismo `id` que el juego). Solo **admin** en reglas. |
| `orders/{id}` | Pedido operativo + `paymentStatus` visible en UI. |
| `orders/{id}/billing/summary` | Montos, `paymentDate`. Solo **admin**. |

---

## 9. Checklist antes de producción

- [ ] Firestore **reglas** desplegadas (no reglas de prueba abiertas).
- [ ] **Authentication** con email/contraseña y dominios autorizados correctos.
- [ ] Al menos un usuario con claim **`admin`** para precios y facturación.
- [ ] Variables `NEXT_PUBLIC_FIREBASE_*` en el entorno de producción.
- [ ] `npm run build` sin errores en CI o local.
- [ ] JSON de cuenta de servicio **no** en el repositorio ni en artefactos del frontend.

---

## 10. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| Error al iniciar Firebase en el cliente | `.env.local` incompleto; reiniciá `npm run dev`. |
| `Missing or insufficient permissions` | Reglas no desplegadas o usuario sin `admin` donde hace falta. |
| No ve precios / no guarda billing | Falta claim `role: admin`; cerrar sesión y entrar de nuevo. |
| Login falla solo en producción | Dominio no está en **Dominios autorizados**. |
| Deploy en Netlify / secret scanning | **Nunca** *Contains secret values* en `NEXT_PUBLIC_FIREBASE_*` ni en `SECRETS_SCAN_*`. Usá `SECRETS_SCAN_OMIT_KEYS`; si falla por `AIza`, opcionalmente `SMART_DETECTION_ENABLED=false` o `SMART_DETECTION_OMIT_VALUES` solo como variable **no** secreta (ver sección 7). |

---

## 11. Enlaces útiles

- [Next.js — Despliegue](https://nextjs.org/docs/app/building-your-application/deploying)
- [Firebase — Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
