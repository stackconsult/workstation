FROM node:18-alpine

WORKDIR /app

# Integration specialist for Slack webhooks - lightweight, no special deps

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
ENV MCP_SERVER_NAME=integration-specialist-slack-webhooks-mcp

# Start server
CMD ["ts-node", "index.ts"]
