FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
RUN TSC_COMPILE_ON_ERROR=true pnpm run build -- --skipLibCheck
EXPOSE 3000
CMD ["pnpm", "start"]
