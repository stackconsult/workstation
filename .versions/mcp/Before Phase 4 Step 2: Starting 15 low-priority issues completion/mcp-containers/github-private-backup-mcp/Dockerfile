# GitHub Private Repository Immutable Backup Container
# This container provides a secure, immutable storage space for the .github-private repository
# with daily backup capabilities

FROM alpine:3.19

# Install required tools
RUN apk add --no-cache \
    git \
    bash \
    curl \
    jq \
    openssh-client \
    rsync \
    tar \
    gzip

# Create non-root user for security
RUN addgroup -g 1001 backup && \
    adduser -D -u 1001 -G backup backup

# Set up directory structure
RUN mkdir -p /backup/immutable \
    /backup/snapshots \
    /backup/logs \
    /backup/config \
    && chown -R backup:backup /backup

# Create backup script
COPY backup-manager.sh /usr/local/bin/backup-manager
RUN chmod +x /usr/local/bin/backup-manager

# Switch to non-root user
USER backup
WORKDIR /backup

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
    CMD [ -d "/backup/immutable/.git" ] && echo "healthy" || exit 1

# Keep container running
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
