FROM node:18-bullseye-slim AS pruner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@element/web --docker
RUN find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Base strategy to have layer caching
FROM node:18-bullseye-slim AS base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
# COPY --from=pruner /app/out/full/ .

FROM base AS dev-deps
WORKDIR /app
RUN corepack enable
RUN pnpm install --ignore-scripts --no-frozen-lockfile

FROM base AS production-deps
WORKDIR /app
RUN corepack enable
ENV NODE_ENV production
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=pruner /app/out/full/packages/database/schema.prisma /app/packages/database/schema.prisma
RUN pnpx prisma generate --schema /app/packages/database/schema.prisma

FROM base AS builder
WORKDIR /app
RUN corepack enable
# ENV NODE_ENV production
COPY --from=pruner /app/out/full/ .
COPY --from=dev-deps /app/ .
COPY turbo.json turbo.json
RUN pnpm run db:generate
RUN pnpm run build --filter=web...

# Runner
FROM node:16-bullseye-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
RUN corepack enable
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remixjs
RUN chown -R remixjs:nodejs /app
USER remixjs

COPY --from=pruner --chown=remixjs:nodejs /app/out/full/ .
COPY --from=production-deps --chown=remixjs:nodejs /app .
COPY --from=builder --chown=remixjs:nodejs /app/apps/web/build/server.js ./apps/web/build/server.js
COPY --from=builder --chown=remixjs:nodejs /app/apps/web/build ./apps/web/build
COPY --from=builder --chown=remixjs:nodejs /app/apps/web/public ./apps/web/public

# release_command = "pnpx prisma migrate deploy --schema packages/database/schema.prisma"
CMD ["pnpm", "--filter", "web", "run", "start"]