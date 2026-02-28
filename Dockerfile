# Use Node 22 as the base image (Satisfies Vite 6.2+ requirements)
FROM node:22-bookworm AS builder

# Set working directory
WORKDIR /app

# Copy package files for the root and workspaces
COPY package.json package-lock.json ./
COPY public-menu/package.json ./public-menu/

# Install dependencies (NPM Workspaces will handle both)
RUN npm ci --include=optional

# Copy the rest of the application code
COPY . .

# Build the application
# This builds both the public-menu (workspace) and the admin panel (root)
RUN npm run build

# Final Stage: Production Environment
FROM node:22-bookworm-slim

WORKDIR /app

# Copy built assets and server code from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public-menu/dist ./public-menu/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the application port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "server/server.js"]
