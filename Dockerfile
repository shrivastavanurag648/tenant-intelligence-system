# Multi-stage Docker build for Tenant Intelligence System

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/server/dist ./server/
COPY --from=builder /app/client/dist ./client/
COPY --from=builder /app/shared/dist ./shared/

# Copy necessary files
COPY server/.env.example ./server/
COPY scripts/demo-setup.sh ./scripts/

# Create necessary directories
RUN mkdir -p server/uploads/evidence server/data

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tenant -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R tenant:nodejs /app

# Switch to non-root user
USER tenant

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server/index.js"]