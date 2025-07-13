# StackMotive Production Dockerfile
# Multi-stage build for optimal production deployment

# Stage 1: Base Node.js image
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    postgresql-client \
    redis \
    curl \
    bash

# Stage 2: Frontend dependencies
FROM base AS frontend-deps
WORKDIR /app

# Copy package files for frontend
COPY client/package*.json ./client/
COPY client/tsconfig*.json ./client/
COPY client/vite.config.ts ./client/

# Install frontend dependencies
RUN cd client && npm ci --only=production

# Stage 3: Build frontend
FROM frontend-deps AS frontend-builder
WORKDIR /app

# Copy shared dependencies and assets
COPY shared/ ./shared/
COPY attached_assets/ ./attached_assets/

# Copy frontend source code
COPY client/src/ ./client/src/
COPY client/index.html ./client/
COPY client/public/ ./client/public/

# Build frontend
RUN cd client && npm run build

# Stage 4: Python dependencies
FROM python:3.11-alpine AS python-deps
WORKDIR /app

# Install Python system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    libffi-dev

# Copy Python requirements
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt

# Stage 5: Backend dependencies
FROM base AS backend-deps
WORKDIR /app

# Copy root package files for backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Stage 6: Production
FROM node:18-alpine AS production

# Set production environment
ENV NODE_ENV=production
ENV PYTHONPATH=/app/server
ENV PORT=8000

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    postgresql-client \
    redis \
    curl \
    bash \
    tini

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S stackmotive -u 1001

# Set working directory
WORKDIR /app

# Copy Python from python-deps stage
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy Node.js dependencies
COPY --from=backend-deps /app/node_modules ./node_modules

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy application code
COPY server/ ./server/
COPY shared/ ./shared/
COPY prisma/ ./prisma/
COPY config/ ./config/

# Copy configuration files
COPY package*.json ./
COPY *.md ./

# Create necessary directories
RUN mkdir -p logs uploads backups cache tmp && \
    chown -R stackmotive:nodejs /app

# Make scripts executable if they exist
RUN if [ -d "scripts" ]; then chmod +x scripts/*.sh; fi

# Switch to non-root user
USER stackmotive

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE 8000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["npm", "start"] 