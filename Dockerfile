FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/api ./apps/api
COPY packages/database ./packages/database

# Generate Prisma client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build API
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/main.js"]
