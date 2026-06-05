# CLAUDE.md — citrineos-core (fork enexflow)

> **Fork enexflow de CitrineOS** (CSMS OCPP 2.0.1). Garde les changements **upstream-friendly** et documente toute divergence. Cette gouvernance Claude est **propre à enexflow**.

## Stack

- **TypeScript**, **npm workspaces** (pas pnpm) : `00_Base`, `01_Data`, `02_Util`, `03_Modules/*` (Certificates, Configuration, EVDriver, Monitoring, OcppRouter, Reporting, SmartCharging, Tenant, Transactions), `Server`.
- **OCPP 2.0.1** (CSMS). Migrations + `sync-db`. Renovate gère les deps.

## Règles

- **Discipline de fork** : préfère des changements rebasables sur l'upstream ; isole les specifics enexflow ; évite les refactos massives qui compliquent le sync.
- **Gate avant PR** : `npm run lint` + `npm run test` (+ `npm run prettier`). Build : `npm run build`. (`npm run install-all` / `fresh` pour bootstrap.)
- **Branches/PR** : base `env/staging`, conventional commits **ASCII**, ne pas merger soi-même.
- Testable via le multiplexeur OCPP + le simulateur `mont_blanc` (profil docker `citrine`, côté sizopt).

## Cross-repo

Souvent travaillé depuis **sizopt** via `--add-dir` (voir sizopt `docs/ai/CROSS_REPO.md`). Le support OCPI vit dans le repo voisin `citrineos-ocpi`.
