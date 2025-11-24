FROM node:18-alpine

WORKDIR /app

# Install Playwright browsers if needed
# No browser needed

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=code-quality-mcp

# Start server
CMD ["node", "dist/index.js"]
