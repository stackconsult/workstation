FROM node:18-alpine

WORKDIR /app

# Selector MCP - lightweight, no browser needed

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production || npm install --only=production

# Copy source code
COPY src ./src

# Build TypeScript if build script exists
RUN npm run build 2>/dev/null || echo "No build script, skipping"

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=selector-mcp

# Start server
CMD ["node", "dist/index.js"]
