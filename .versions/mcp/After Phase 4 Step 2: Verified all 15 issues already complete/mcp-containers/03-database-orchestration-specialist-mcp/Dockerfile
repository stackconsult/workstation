FROM node:18-alpine

WORKDIR /app

# Database orchestration specialist - needs database client libraries
RUN apk add --no-cache \
    postgresql-client \
    mysql-client

# Copy package files
COPY package.json ./
COPY index.ts ./

# Install dependencies
RUN npm install --only=production

# Install TypeScript for runtime
RUN npm install -g ts-node typescript

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=database-orchestration-specialist-mcp

# Start server
CMD ["ts-node", "index.ts"]
