# LO PRADO AUTOS

Catálogo de autos usados con diseño oscuro, información detallada y contacto directo por WhatsApp. El inventario público se administra con archivos JSON y se publica automáticamente en GitHub Pages.

**Sitio público:** [pybastian.github.io/CarDealershipPxrse](https://pybastian.github.io/CarDealershipPxrse/)

## The Last Palomin — editor del catálogo

**Editor:** [pybastian.github.io/CarDealershipPxrse/TheLastPalomin/](https://pybastian.github.io/CarDealershipPxrse/TheLastPalomin/)

`/TheLastPalomin` es la misma página del concesionario con controles de edición. No necesita servidor ni base de datos: **el repositorio de GitHub es la base de datos**. Cada guardado crea un commit en `main` (por ejemplo `admin: update Toyota RAV4 Limited AWD`) y el flujo existente de GitHub Actions reconstruye y publica el sitio en unos minutos.

Incluye:

- Catálogo editable con acciones rápidas por vehículo: editar precio, destacar, duplicar, eliminar y cambiar estado (Disponible / Reservado / Vendido / Borrador).
- Inventario con KPIs, búsqueda y filtros por estado.
- Editor completo de vehículos agrupado en secciones (información principal, precio, uso, exterior/interior, venta, descripción).
- Gestor de fotos: sube varias imágenes desde el teléfono, se comprimen a WebP (máximo 1800 px) en el navegador antes de subirlas; reordenar, elegir portada y borrar.
- Configuración del concesionario (`inventory/settings.json`): nombre, WhatsApp, teléfono, correo, Instagram, ubicación y visibilidad de vendidos.

### Crear el token de GitHub

La autenticación es un *fine-grained Personal Access Token* con permisos mínimos:

```text
Repository:
PyBastian/CarDealershipPxrse

Contents:
Read and write
```

1. GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate new token.
2. En "Repository access" selecciona **Only select repositories** y elige `PyBastian/CarDealershipPxrse`.
3. En "Permissions → Repository permissions" marca **Contents: Read and write**.
4. Genera el token y pégalo en `/TheLastPalomin`.

El token se valida contra el repositorio antes de guardarse y se almacena **solo en el localStorage de tu navegador**: no se envía a ningún servicio distinto de la API de GitHub, no se registra en logs y desaparece al pulsar "Desconectar". Si el token se revoca o expira, simplemente genera otro y reconecta.

### Cómo funciona

```text
/TheLastPalomin  →  GitHub Contents API  →  commit en main  →  pages.yml  →  GitHub Pages
```

Los datos viven en `inventory/*/car.json` e `inventory/settings.json`; el sitio público y el editor leen exactamente las mismas fuentes. Las fotos nuevas se guardan en `public/vehicles/{slug}/`. Las rutas del editor se generan estáticamente para el inventario actual; los vehículos recién creados se pueden editar de inmediato porque el editor también resuelve rutas desconocidas en el cliente.

## Administrar vehículos manualmente

Cada vehículo tiene su propia carpeta dentro de `inventory` y un archivo llamado `car.json`.

### Agregar un vehículo

1. Duplica una carpeta existente dentro de `inventory`.
2. Renombra la carpeta con una URL clara, por ejemplo: `toyota-yaris-sport-2021`.
3. Edita su archivo `car.json` con la información real del vehículo.
4. Guarda las fotografías en `public/vehicles`.
5. Agrega las rutas de las fotografías en `images`. La primera imagen será la portada.
6. Envía los cambios a la rama `main`; GitHub Pages publicará la nueva versión automáticamente.

Ejemplo de fotografías:

```json
"images": [
  { "path": "/vehicles/toyota-yaris-frontal.jpg", "alt": "Toyota Yaris, vista frontal" },
  { "path": "/vehicles/toyota-yaris-lateral.jpg", "alt": "Toyota Yaris, vista lateral" }
]
```

Usa [`inventory/toyota-rav4-limited-awd-2022/car.json`](inventory/toyota-rav4-limited-awd-2022/car.json) como plantilla completa.

### Editar, ocultar o eliminar

- **Editar:** modifica el archivo `car.json` correspondiente.
- **Ocultar temporalmente:** usa `"status": "DRAFT"`.
- **Reservar:** usa `"status": "RESERVED"`.
- **Marcar como vendido:** usa `"status": "SOLD"`.
- **Volver a publicar:** usa `"status": "AVAILABLE"`.
- **Eliminar permanentemente:** borra la carpeta completa del vehículo.

Los valores permitidos están documentados en [`inventory/README.md`](inventory/README.md).

### Información mostrada

La ficha pública muestra fotografías, marca, modelo, versión, año, precio, precio anterior, kilometraje, transmisión, combustible, motor, tracción, carrocería, color, capacidad, ubicación, descripción, destacados y equipamiento.

La información general del negocio —nombre, WhatsApp, teléfono, ubicación, Instagram y visibilidad de vehículos vendidos— se configura en [`inventory/settings.json`](inventory/settings.json).

## Tecnología y estructura

- Next.js App Router, React, TypeScript y CSS nativo
- Exportación estática para GitHub Pages (`GITHUB_PAGES=true npm run build`)
- Editor `/TheLastPalomin` basado en la API de GitHub (`src/lib/github-admin`), sin backend
- Zod para validar los esquemas compartidos (`src/lib/car-json.ts`)
- Panel local opcional con PostgreSQL 17, Prisma ORM 7, Auth.js y Sharp (legado; no se publica en GitHub Pages)
- Vitest y Playwright para pruebas

Las páginas están en `src/app`, los componentes en `src/components` y la lógica compartida en `src/lib`. Sin `DATABASE_URL`, el sitio carga automáticamente todos los archivos `inventory/*/car.json`.

## Instalación local

Requisitos: Node.js 22.12 o superior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y visita [`/TheLastPalomin`](http://localhost:3000/TheLastPalomin) para probar el editor con tu token. El panel antiguo en `/admin` requiere además Docker, PostgreSQL y las variables de autenticación descritas abajo.

### Panel local opcional (legado)

```bash
cp .env.example .env
docker compose up -d
npm run db:migrate -- --name init
npm run db:seed
```

Prisma Studio está disponible con `npm run db:studio`. Este panel depende de un servidor Node y no funciona en GitHub Pages; el reemplazo publicado es `/TheLastPalomin`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL (solo panel local legado) |
| `AUTH_SECRET` | Secreto para firmar sesiones del panel legado |
| `ADMIN_EMAIL` | Correo del administrador del panel legado |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt; nunca guardes la contraseña sin cifrar |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública usada en metadatos, sitemap y mensajes de WhatsApp |
| `NEXT_PUBLIC_BASE_PATH` | Base path de GitHub Pages (`/CarDealershipPxrse`); lo define el workflow |
| `GITHUB_PAGES` | Activa exportación estática (`true` en el workflow) |

## GitHub Pages

El flujo `.github/workflows/pages.yml` construye y publica el sitio cada vez que cambia la rama `main`. Antes de compilar elimina el panel dependiente de servidor (`src/app/(admin)`, `src/app/(auth)`, `src/app/api`) y exporta con `output: "export"` incluyendo `/TheLastPalomin`. La fuente configurada en GitHub es **Settings → Pages → GitHub Actions**.

## Comandos

```bash
npm run dev          # servidor local
npm run build        # compilación de producción
npm run start        # servidor de producción
npm run lint
npm run typecheck
npm test             # pruebas unitarias
npm run test:e2e     # pruebas de escritorio y móvil
npm run db:migrate   # solo panel legado
npm run db:seed      # solo panel legado
npm run db:studio    # solo panel legado
```

Las imágenes actuales son demostrativas y deben reemplazarse con fotografías reales antes del lanzamiento comercial.
