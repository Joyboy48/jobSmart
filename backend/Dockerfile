# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built files and necessary assets
COPY --from=builder /app/dist ./dist
COPY public ./public
COPY eng.traineddata ./eng.traineddata

# Copy .env if present (for local dev; override with real secrets in prod)
COPY .env .env

EXPOSE 4000

CMD ["node", "dist/index.js"] 