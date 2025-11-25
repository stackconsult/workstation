FROM node:18-alpine

WORKDIR /app

# Install Playwright dependencies for browser automation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use installed chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package.json ./
COPY index.ts ./

# Install dependencies (including Playwright)
RUN npm install --only=production

# Install TypeScript for runtime if needed
RUN npm install -g ts-node typescript

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=go-backend-browser-automation-engineer-mcp

# Start server
CMD ["ts-node", "index.ts"]
