## ---------- deps+build stage (includes dev deps) ----------
FROM node:20-alpine AS build

WORKDIR /app

ENV CI=true

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate && npm run build

## ---------- production deps only ----------
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

## ---------- runtime image ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules and built artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Optional: if you run prisma migrate in container, keep schema
COPY prisma ./prisma

EXPOSE 3000

# Run compiled server
CMD ["node", "dist/server.js"]


