/**
 * Connection Pool for Playwright Execution
 * Manages browser context lifecycle and resource pooling
 */

class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 5;
    this.connectionTimeout = options.connectionTimeout || 30000;
    this.idleTimeout = options.idleTimeout || 60000;
    this.connections = new Map();
    this.availableConnections = [];
    this.waitingQueue = [];
    this.stats = {
      created: 0,
      reused: 0,
      destroyed: 0,
      timeouts: 0,
      errors: 0
    };
  }

  /**
   * Get a connection from the pool
   */
  async acquire(tabId) {
    // Check if we have an available connection
    if (this.availableConnections.length > 0) {
      const connectionId = this.availableConnections.shift();
      const connection = this.connections.get(connectionId);
      
      if (connection && this.isConnectionValid(connection)) {
        connection.lastUsed = Date.now();
        connection.inUse = true;
        this.stats.reused++;
        return connection;
      } else {
        // Connection invalid, destroy it
        this.destroy(connectionId);
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.maxConnections) {
      return await this.createConnection(tabId);
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        this.stats.timeouts++;
        reject(new Error('Connection pool timeout'));
      }, this.connectionTimeout);

      this.waitingQueue.push({ resolve, reject, timeout, tabId });
    });
  }

  /**
   * Create a new connection
   */
  async createConnection(tabId) {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connection = {
      id: connectionId,
      tabId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      inUse: true,
      executionCount: 0,
      errors: 0,
      valid: true
    };

    this.connections.set(connectionId, connection);
    this.stats.created++;
    
    console.log(`[ConnectionPool] Created connection ${connectionId} for tab ${tabId}`);
    
    return connection;
  }

  /**
   * Release a connection back to the pool
   */
  release(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      console.warn(`[ConnectionPool] Connection ${connectionId} not found`);
      return;
    }

    connection.inUse = false;
    connection.lastUsed = Date.now();

    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      clearTimeout(waiter.timeout);
      connection.inUse = true;
      waiter.resolve(connection);
    } else {
      // Add to available connections
      this.availableConnections.push(connectionId);
    }

    // Schedule idle timeout
    this.scheduleIdleTimeout(connectionId);
  }

  /**
   * Destroy a connection
   */
  destroy(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return;
    }

    console.log(`[ConnectionPool] Destroying connection ${connectionId}`);
    
    this.connections.delete(connectionId);
    
    // Remove from available connections
    const index = this.availableConnections.indexOf(connectionId);
    if (index !== -1) {
      this.availableConnections.splice(index, 1);
    }

    this.stats.destroyed++;
  }

  /**
   * Check if connection is still valid
   */
  isConnectionValid(connection) {
    if (!connection.valid) {
      return false;
    }

    // Check if too many errors
    if (connection.errors > 3) {
      return false;
    }

    return true;
  }

  /**
   * Schedule idle timeout for connection
   */
  scheduleIdleTimeout(connectionId) {
    setTimeout(() => {
      const connection = this.connections.get(connectionId);
      
      if (!connection || connection.inUse) {
        return;
      }

      const idleTime = Date.now() - connection.lastUsed;
      
      if (idleTime >= this.idleTimeout) {
        console.log(`[ConnectionPool] Connection ${connectionId} idle timeout`);
        this.destroy(connectionId);
      }
    }, this.idleTimeout);
  }

  /**
   * Mark connection as having an error
   */
  recordError(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.errors++;
      this.stats.errors++;
      
      if (connection.errors > 3) {
        connection.valid = false;
        this.destroy(connectionId);
      }
    }
  }

  /**
   * Mark successful execution
   */
  recordSuccess(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.executionCount++;
      connection.errors = 0; // Reset error count on success
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalConnections: this.connections.size,
      availableConnections: this.availableConnections.length,
      inUseConnections: this.connections.size - this.availableConnections.length,
      waitingRequests: this.waitingQueue.length,
      utilizationRate: Math.round(
        ((this.connections.size - this.availableConnections.length) / this.maxConnections) * 100
      )
    };
  }

  /**
   * Get connection info
   */
  getConnectionInfo(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return null;
    }

    return {
      ...connection,
      age: Date.now() - connection.createdAt,
      idleTime: Date.now() - connection.lastUsed
    };
  }

  /**
   * Cleanup all connections
   */
  cleanup() {
    console.log('[ConnectionPool] Cleaning up all connections');
    
    // Clear waiting queue
    this.waitingQueue.forEach(waiter => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool cleanup'));
    });
    this.waitingQueue = [];

    // Destroy all connections
    for (const connectionId of this.connections.keys()) {
      this.destroy(connectionId);
    }

    this.availableConnections = [];
  }

  /**
   * Health check
   */
  healthCheck() {
    const stats = this.getStats();
    const healthScore = Math.max(0, 100 - (stats.errors * 10) - (stats.timeouts * 20));
    
    return {
      healthy: healthScore > 50,
      score: healthScore,
      stats
    };
  }
}

// Create singleton instance
const connectionPool = new ConnectionPool({
  maxConnections: 5,
  connectionTimeout: 30000,
  idleTimeout: 60000
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConnectionPool, connectionPool };
}
