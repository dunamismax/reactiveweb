FROM oven/bun:1.3.9 AS deps
WORKDIR /app
COPY package.json tsconfig.base.json biome.json ./
COPY bun.lock bun.lock
COPY apps/web-demo/package.json apps/web-demo/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install

FROM oven/bun:1.3.9 AS build
WORKDIR /app
COPY --from=deps /app/ /app/
COPY . .
RUN bun --cwd apps/web-demo run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web-demo/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
