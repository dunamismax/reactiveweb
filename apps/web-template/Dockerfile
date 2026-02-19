FROM node:24-alpine AS base
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

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web-template/build/client ./apps/web-template/build/client
EXPOSE 3000
CMD ["node", "-e", "const http=require('node:http');const fs=require('node:fs/promises');const path=require('node:path');const root=path.resolve('apps/web-template/build/client');const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);const relative=pathname==='/'?'index.html':pathname.replace(/^\\/+/, '');let filePath=path.resolve(root, relative);if(!filePath.startsWith(root)){res.statusCode=403;res.end('Forbidden');return;}let body;try{body=await fs.readFile(filePath);}catch{filePath=path.join(root,'index.html');body=await fs.readFile(filePath);}res.setHeader('Content-Type',types[path.extname(filePath)]||'application/octet-stream');res.end(body);}catch{res.statusCode=500;res.end('Internal Server Error');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0');"]
