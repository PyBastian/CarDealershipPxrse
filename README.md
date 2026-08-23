# NOVA AUTOS

Premium dark used-car inventory. The public catalog can run from editable JSON files and deploy as a static GitHub Pages site; the optional local admin remains backed by PostgreSQL and Prisma.

## Stack and structure

- Next.js App Router, React, TypeScript and native CSS design tokens
- PostgreSQL 17, Prisma ORM 7 with the `pg` adapter
- Auth.js credentials/JWT sessions and bcrypt password verification
- Zod validation, Sharp image validation/optimization, Lucide icons
- Vitest unit checks and Playwright browser flows

Public routes live in `src/app`; cohesive UI pieces are in `src/components`; filtering, formatting, data access, validation and auth live in `src/lib`. Without `DATABASE_URL`, public pages load every `inventory/*/car.json` file. Admin writes always require PostgreSQL.

## Local setup

Requirements: Node.js 22.12+ and Docker with Compose.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Prisma Studio is available through `npm run db:studio`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random session-signing secret (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Single administrator email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash; never store a plain password |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used by metadata, sitemap and WhatsApp messages |

Create a password hash without placing the password in shell history:

```bash
read -s -p "Nueva contraseña: " NOVA_PASSWORD; echo
ADMIN_PASSWORD="$NOVA_PASSWORD" node --input-type=module -e 'import bcrypt from "bcryptjs"; console.log(await bcrypt.hash(process.env.ADMIN_PASSWORD, 12))'
unset NOVA_PASSWORD
```

Copy the printed hash to `ADMIN_PASSWORD_HASH` in `.env`, set `ADMIN_EMAIL`, then visit `/admin/login`.

## Inventory and images

For the static site, duplicate an existing folder under `inventory`, edit its `car.json`, and place its photos in `public/vehicles`. The first image listed is the catalog cover. Full instructions are in [`inventory/README.md`](inventory/README.md).

The optional local admin can also create drafts and upload photos when PostgreSQL is configured. Uploaded JPG, PNG, WebP and AVIF files are checked, capped at 10 MB and normalized to WebP in `public/uploads/vehicles`.

Demo imagery in `public/vehicles` is original AI-generated content created for this project. Seed records are explicitly demonstrative and must be replaced with real inventory before launch.

Brand, WhatsApp, phone, email, location, social link and sold-vehicle visibility for JSON mode are in `inventory/settings.json`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and publishes the public routes whenever `main` changes. In GitHub, choose **Settings → Pages → Source: GitHub Actions** once; later inventory edits deploy automatically.

## Commands

```bash
npm run dev          # local Next.js server
npm run build        # production build
npm run start        # production server
npm run lint
npm run typecheck
npm test             # Vitest
npm run test:e2e     # Playwright desktop + mobile flows
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Production

Run migrations before starting the app, provide all environment variables, use a managed/persistent PostgreSQL database, and persist `public/uploads/vehicles`. Put the app behind TLS and a reverse proxy/CDN. Generated image derivatives may be cached; admin and API routes must not be cached publicly.

Analytics is deliberately disabled. `src/lib/analytics.ts` is the single integration point for a future consent-aware vendor.
