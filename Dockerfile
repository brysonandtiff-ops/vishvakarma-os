# Build stage
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install serve to run the static site
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
