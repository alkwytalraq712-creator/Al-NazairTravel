FROM node:20-alpine AS builder
RUN npm install -g pnpm@9

WORKDIR /app

# Copy everything
COPY . .

# Install ALL dependencies (dev included — needed for build)
RUN pnpm install --frozen-lockfile --prod=false

# Build the API server (esbuild bundles all workspace deps into one file)
RUN pnpm --filter @workspace/api-server run build

# Build the admin dashboard with production defaults
# BASE_PATH=/ so it's served from the root of the API origin
RUN BASE_PATH=/ PORT=3000 NODE_ENV=production \
    pnpm --filter @workspace/admin-dashboard run build

# Copy admin dashboard output into the API server's dist/public folder
# so express.static can serve it from the same origin
RUN mkdir -p artifacts/api-server/dist/public && \
    cp -r artifacts/admin-dashboard/dist/public/. artifacts/api-server/dist/public/

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests for pnpm to resolve the external packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/

# Install only production runtime dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the built API server (includes bundled source + admin dashboard static files)
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# connect-pg-simple reads a .sql file relative to its own __dirname at runtime;
# esbuild externalises it so we must keep its node_modules entry intact.
COPY --from=builder /app/node_modules/connect-pg-simple ./node_modules/connect-pg-simple

EXPOSE 10000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
