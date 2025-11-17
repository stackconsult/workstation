FROM nginx:alpine

LABEL org.opencontainers.image.source="https://github.com/creditXcredit/workstation"
LABEL org.opencontainers.image.description="Nginx reverse proxy for 20 MCP containers"
LABEL org.opencontainers.image.version="1.0.0"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
