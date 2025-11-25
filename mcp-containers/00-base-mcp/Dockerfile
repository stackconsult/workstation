FROM node:18-alpine

WORKDIR /app

# Base MCP - no browser automation needed

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --only=production

# Copy source code if exists
COPY src ./src 2>/dev/null || true

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=base-mcp

# Start server (if index.js exists in root or src)
CMD ["node", "index.js"]
