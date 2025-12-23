FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copy Prisma schema from root if exists, otherwise create it
RUN mkdir -p prisma
COPY prisma/ prisma/ 2>/dev/null || true

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma || echo "Prisma generate skipped"

# Build API
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/main.js"]
