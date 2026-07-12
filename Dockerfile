FROM node:20-alpine

# Install pnpm — match the exact version that generated pnpm-lock.yaml
RUN npm install -g pnpm@10.34.6

WORKDIR /app

# Copy everything in one layer (esbuild bundles workspace deps, so we need full source)
COPY . .

# Install all deps — no frozen lockfile to avoid settings.autoInstallPeers mismatch
RUN pnpm install --no-frozen-lockfile --prod=false

# Build the API server (esbuild bundles all workspace deps into one file)
RUN pnpm --filter @workspace/api-server run build

# Build the admin dashboard with production-safe defaults
RUN BASE_PATH=/ PORT=3000 NODE_ENV=production \
    pnpm --filter @workspace/admin-dashboard run build

# Copy admin dashboard static files into api-server dist so express.static serves them
RUN mkdir -p artifacts/api-server/dist/public && \
    cp -r artifacts/admin-dashboard/dist/public/. artifacts/api-server/dist/public/

EXPOSE 10000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
