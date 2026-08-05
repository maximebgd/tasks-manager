This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Déploiement Docker

L'app tourne en **2 conteneurs** : `web` (Next, fullstack — front + Server Actions) et `db` (Postgres 16). Postgres est toujours l'image officielle **pullée** ; seul `web` a un `Dockerfile`. Les migrations Prisma sont appliquées au démarrage de `web` (`prisma migrate deploy`).

Trois modes selon le contexte :

### 1. Dev — front local + BDD dans Docker

Front en hot-reload sur la machine, seule la BDD tourne dans Docker.

```bash
npm run db:up   # = docker compose up -d db  (lance UNIQUEMENT le service db)
npm run dev     # front en local, se connecte à la BDD via localhost:5432
```

### 2. Prod (build) — compose qui *build* le front + *pull* la BDD

Sur une machine qui a le code source. Build l'image `web` en local, pull Postgres.

```bash
docker compose up --build -d
```

App sur http://localhost:3000, Postgres exposé sur `5432` (outillage local).

### 3. Prod (pull) — compose qui *pull* le front + *pull* la BDD

Sur un serveur **sans le code source** : les deux images viennent des registres (GHCR + Docker Hub). Fichier dédié `docker-compose.prod.yml` (aucun `build:`).

```bash
docker login ghcr.io                                   # 1re fois (package GHCR privé par défaut)
docker compose -f docker-compose.prod.yml pull         # pull web (GHCR) + db (Docker Hub)
docker compose -f docker-compose.prod.yml up -d
```

`TAG` épingle une version (défaut : `latest`) :

```bash
TAG=1.2.3 docker compose -f docker-compose.prod.yml up -d
```

### Publication de l'image (CI)

Le workflow `.github/workflows/docker-publish.yml` build et pousse l'image `web` sur GHCR à chaque push sur `main` et sur chaque tag `v*` :

- `ghcr.io/maximebgd/tasks-manager:latest` (dernier `main`)
- `ghcr.io/maximebgd/tasks-manager:1.2.3` (tag git `v1.2.3`)

| Mode | Front | BDD | Fichier |
|---|---|---|---|
| Dev | local (`npm run dev`) | Docker (pull) | `docker-compose.yml` (db seul) |
| Prod (build) | Docker (**build**) | Docker (pull) | `docker-compose.yml` |
| Prod (pull) | Docker (**pull** GHCR) | Docker (pull) | `docker-compose.prod.yml` |
