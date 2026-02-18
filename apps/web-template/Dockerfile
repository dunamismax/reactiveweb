FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json biome.json ./
COPY apps/web-template/package.json apps/web-template/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/ /app/
COPY . .
RUN pnpm --filter @reactiveweb/web-template run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web-template ./apps/web-template
COPY --from=build /app/packages/config ./packages/config
COPY --from=build /app/packages/ui ./packages/ui
EXPOSE 3000
CMD ["node", "./apps/web-template/build/server/index.js"]
