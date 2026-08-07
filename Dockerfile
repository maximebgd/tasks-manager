# syntax=docker/dockerfile:1

# --- deps : installe toutes les dépendances (dev incluses, pour builder) ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci

# --- build : génère le client Prisma puis build Next ---
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner : image d'exécution ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl

# On copie l'app buildée + node_modules (contient le CLI Prisma pour migrate deploy).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# `lib/` est copié pour le seed optionnel (`prisma/seed.ts` importe `lib/mock-data.ts`),
# lançable via `docker compose exec web npm run db:seed`.
COPY --from=build /app/lib ./lib
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Applique les migrations en attente puis démarre le serveur Next.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
