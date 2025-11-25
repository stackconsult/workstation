# Workstation System Troubleshooting Guide

**Version**: 1.0  
**Last Updated**: November 24, 2024  
**Status**: ✅ Production Ready

---

## Quick Links

- [Common Issues](#common-issues)
- [Agent Issues](#agent-issues)
- [Task Issues](#task-issues)
- [Database Issues](#database-issues)
- [Docker Issues](#docker-issues)
- [MCP Issues](#mcp-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Diagnostic Tools](#diagnostic-tools)

---

## Common Issues

### System Won't Start

**Symptoms**: Server fails to start, crashes immediately, or exits with error

**Diagnostics**:
```bash
# Check if port is already in use
lsof -i :3000
netstat -tulpn | grep 3000

# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm list --depth=0

# View recent logs
tail -f logs/app.log
```

**Solutions**:

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti :3000 | xargs kill -9
   
   # Or use different port
   PORT=3001 npm start
   ```

2. **Missing Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   systemctl status postgresql
   # or
   docker ps | grep postgres
   
   # Test connection
   psql -h localhost -U workstation -d workstation
   ```

4. **Environment Variables Missing**
   ```bash
   # Copy example and configure
   cp .env.example .env
   
   # Verify required vars
   grep -E 'JWT_SECRET|DATABASE_URL|NODE_ENV' .env
   ```

### Database Connection Errors

**Symptoms**: `ECONNREFUSED`, `Connection timeout`, `Authentication failed`

**Diagnostics**:
```bash
# Test database connection
psql -h localhost -U workstation -d workstation -c "SELECT 1;"

# Check database logs
docker logs workstation-postgres  # If using Docker

# Verify connection string
echo $DATABASE_URL
```

**Solutions**:

1. **PostgreSQL Not Running**
   ```bash
   # Start PostgreSQL service
   systemctl start postgresql
   # or Docker
   docker-compose up -d postgres
   ```

2. **Wrong Credentials**
   ```bash
   # Reset password
   psql -U postgres
   ALTER USER workstation WITH PASSWORD 'new_password';
   
   # Update .env
   DATABASE_URL=postgresql://workstation:new_password@localhost:5432/workstation
   ```

3. **Database Doesn't Exist**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE workstation;
   
   # Run migrations
   npm run migrate
   ```

4. **Connection Pool Exhausted**
   ```bash
   # Check active connections
   psql -U workstation -d workstation
   SELECT count(*) FROM pg_stat_activity;
   
   # Increase pool size in config
   # Edit config/database.ts
   max: 20,  // Increase from default 10
   ```

---

## Agent Issues

### Agent Not Showing in Registry

**Symptoms**: Agent not visible in `GET /api/agents` response

**Diagnostics**:
```bash
# Query database directly
psql -U workstation -d workstation
SELECT id, name, type, status FROM agent_registry;

# Check recent insertions
SELECT * FROM agent_registry ORDER BY created_at DESC LIMIT 10;
```

**Solutions**:

1. **Agent Not Registered**
   ```sql
   -- Register agent manually
   INSERT INTO agent_registry (name, type, container_name, status, capabilities)
   VALUES (
     'my-agent',
     'browser',
     'agent-browser-5',
     'stopped',
     ARRAY['navigate', 'scrape']
   );
   ```

2. **Agent Container Not Started**
   ```bash
   # List running containers
   docker ps | grep agent
   
   # Start agent container
   docker-compose up -d agent-browser-5
   
   # Or use API
   curl -X POST http://localhost:3000/api/agents/5/start \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Database Sync Issue**
   ```bash
   # Restart orchestrator to re-sync
   npm run restart
   
   # Or refresh agent cache
   curl -X POST http://localhost:3000/api/agents/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Agent Status Stuck

**Symptoms**: Agent shows as `starting` or `stopping` indefinitely

**Diagnostics**:
```bash
# Check Docker container state
docker ps -a | grep agent-name

# Check container logs
docker logs agent-name --tail 100

# Query agent status
psql -U workstation -d workstation
SELECT name, status, last_health_check FROM agent_registry WHERE name = 'agent-name';
```

**Solutions**:

1. **Container Crashed**
   ```bash
   # Check exit code
   docker inspect agent-name | grep ExitCode
   
   # View crash logs
   docker logs agent-name --tail 200
   
   # Restart container
   docker restart agent-name
   ```

2. **Health Check Failing**
   ```bash
   # Test health endpoint directly
   docker exec agent-name curl http://localhost:8080/health
   
   # Update status manually
   psql -U workstation -d workstation
   UPDATE agent_registry SET status = 'stopped' WHERE name = 'agent-name';
   ```

3. **Orphaned Process**
   ```bash
   # Force stop container
   docker stop -t 5 agent-name
   docker rm agent-name
   
   # Recreate from compose
   docker-compose up -d agent-name
   ```

### Agent High Failure Rate

**Symptoms**: Many tasks failing for specific agent

**Diagnostics**:
```bash
# Query failure stats
psql -U workstation -d workstation
SELECT 
  a.name,
  COUNT(*) FILTER (WHERE t.status = 'failed') as failures,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE t.status = 'failed')::numeric / COUNT(*) * 100, 2) as failure_rate
FROM agent_tasks t
JOIN agent_registry a ON t.agent_id = a.id
WHERE t.created_at > NOW() - INTERVAL '1 hour'
GROUP BY a.name;

# Check error patterns
SELECT 
  result->>'error' as error_message,
  COUNT(*) as occurrences
FROM agent_tasks
WHERE status = 'failed' AND agent_id = 1
GROUP BY result->>'error'
ORDER BY occurrences DESC
LIMIT 10;
```

**Solutions**:

1. **Resource Exhaustion**
   ```bash
   # Check agent resource usage
   docker stats agent-name
   
   # Increase memory limit
   # Edit docker-compose.yml
   services:
     agent-name:
       mem_limit: 2g  # Increase from 1g
   
   docker-compose up -d agent-name
   ```

2. **Dependency Missing**
   ```bash
   # Check agent logs for missing dependencies
   docker logs agent-name | grep -i "error\|missing\|not found"
   
   # Rebuild agent with dependencies
   docker-compose build agent-name
   docker-compose up -d agent-name
   ```

3. **Invalid Task Payloads**
   ```bash
   # Review recent failed task payloads
   psql -U workstation -d workstation
   SELECT payload, result FROM agent_tasks 
   WHERE status = 'failed' AND agent_id = 1
   ORDER BY created_at DESC LIMIT 5;
   
   # Add payload validation to agent
   ```

---

## Task Issues

### Tasks Stuck in Pending

**Symptoms**: Tasks remain in `pending` status indefinitely

**Diagnostics**:
```bash
# Count pending tasks
psql -U workstation -d workstation
SELECT COUNT(*) FROM agent_tasks WHERE status = 'pending';

# Check oldest pending tasks
SELECT id, agent_id, type, created_at, 
  EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds
FROM agent_tasks
WHERE status = 'pending'
ORDER BY created_at
LIMIT 10;

# Check agent status
SELECT a.name, a.status, COUNT(t.id) as pending_tasks
FROM agent_registry a
LEFT JOIN agent_tasks t ON t.agent_id = a.id AND t.status = 'pending'
GROUP BY a.id, a.name, a.status;
```

**Solutions**:

1. **Agent Stopped**
   ```bash
   # Start the agent
   curl -X POST http://localhost:3000/api/agents/1/start \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Task Queue Processor Not Running**
   ```bash
   # Check orchestrator logs
   tail -f logs/orchestrator.log
   
   # Restart task processor
   npm run restart:orchestrator
   ```

3. **High Task Volume**
   ```bash
   # Increase concurrency
   # Edit config/orchestration.ts
   MAX_CONCURRENT_TASKS=20  # Increase from 10
   
   # Scale agent horizontally
   docker-compose up -d --scale agent-worker=3
   ```

4. **Task Priority Issues**
   ```sql
   -- Increase priority of stuck tasks
   UPDATE agent_tasks
   SET priority = 10
   WHERE status = 'pending' AND created_at < NOW() - INTERVAL '10 minutes';
   ```

### Task Timeout Issues

**Symptoms**: Tasks fail with timeout errors

**Diagnostics**:
```bash
# Check task execution times
psql -U workstation -d workstation
SELECT 
  type,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_duration
FROM agent_tasks
WHERE status = 'completed' AND completed_at IS NOT NULL
GROUP BY type;
```

**Solutions**:

1. **Increase Task Timeout**
   ```typescript
   // When creating task
   await agentOrchestrator.createTask(
     agentId,
     'long-running-task',
     {
       ...payload,
       timeout: 300000  // 5 minutes instead of default 30s
     }
   );
   ```

2. **Break Down Large Tasks**
   ```typescript
   // Split into smaller tasks
   const chunks = splitDataIntoChunks(largeData, 10);
   const tasks = await Promise.all(
     chunks.map(chunk => 
       agentOrchestrator.createTask(agentId, 'process-chunk', chunk)
     )
   );
   ```

3. **Optimize Agent Performance**
   ```bash
   # Profile agent code
   node --prof agent-script.js
   
   # Analyze profile
   node --prof-process isolate-*.log > profile.txt
   ```

### Task Retry Exhausted

**Symptoms**: Tasks fail after max retries

**Diagnostics**:
```sql
-- Check retry patterns
SELECT 
  type,
  AVG(retry_count) as avg_retries,
  COUNT(*) FILTER (WHERE retry_count >= max_retries) as maxed_out
FROM agent_tasks
WHERE status = 'failed'
GROUP BY type;

-- Check failure reasons
SELECT 
  result->>'error' as error,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM agent_tasks
WHERE status = 'failed'
GROUP BY result->>'error'
ORDER BY count DESC;
```

**Solutions**:

1. **Fix Root Cause**
   ```bash
   # Identify most common error
   # Fix issue in agent code
   # Redeploy agent
   docker-compose build agent-name
   docker-compose up -d agent-name
   ```

2. **Increase Retry Limit**
   ```typescript
   // For specific task types
   await agentOrchestrator.createTask(
     agentId,
     'unreliable-task',
     payload,
     'user-123',
     5,  // priority
     5   // max_retries (instead of default 3)
   );
   ```

3. **Add Retry Backoff**
   ```typescript
   // In agent task processor
   const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
   await sleep(retryDelay);
   ```

---

## Database Issues

### Connection Pool Exhausted

**Symptoms**: `too many clients`, `connection pool exhausted`

**Diagnostics**:
```sql
-- Check active connections
SELECT 
  count(*),
  state,
  wait_event_type
FROM pg_stat_activity
GROUP BY state, wait_event_type;

-- Check long-running queries
SELECT 
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

**Solutions**:

1. **Increase Pool Size**
   ```typescript
   // In config/database.ts
   export const poolConfig = {
     max: 30,  // Increase from 20
     min: 5,
     acquire: 30000,
     idle: 10000
   };
   ```

2. **Fix Connection Leaks**
   ```typescript
   // Always release connections
   const client = await pool.connect();
   try {
     await client.query('SELECT * FROM users');
   } finally {
     client.release();  // Important!
   }
   ```

3. **Kill Idle Connections**
   ```sql
   -- Find and terminate idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < NOW() - INTERVAL '30 minutes';
   ```

### Database Performance Slow

**Symptoms**: Slow queries, high latency

**Diagnostics**:
```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
```

**Solutions**:

1. **Add Indexes**
   ```sql
   -- Index frequently queried columns
   CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
   CREATE INDEX idx_agent_tasks_agent_id_status ON agent_tasks(agent_id, status);
   CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);
   
   -- Analyze tables after creating indexes
   ANALYZE agent_tasks;
   ```

2. **Vacuum and Analyze**
   ```bash
   # Run VACUUM ANALYZE
   psql -U workstation -d workstation -c "VACUUM ANALYZE;"
   
   # Set up autovacuum (if not already)
   ALTER TABLE agent_tasks SET (autovacuum_vacuum_scale_factor = 0.1);
   ```

3. **Optimize Queries**
   ```sql
   -- Use EXPLAIN to understand query plans
   EXPLAIN ANALYZE 
   SELECT * FROM agent_tasks WHERE status = 'pending';
   
   -- Add covering indexes for common queries
   CREATE INDEX idx_agent_tasks_covering 
   ON agent_tasks(agent_id, status) 
   INCLUDE (type, priority, created_at);
   ```

---

## Docker Issues

### Container Won't Start

**Symptoms**: Container exits immediately, fails to start

**Diagnostics**:
```bash
# Check container status
docker ps -a | grep container-name

# View container logs
docker logs container-name --tail 100

# Inspect container
docker inspect container-name

# Check events
docker events --since 30m | grep container-name
```

**Solutions**:

1. **Port Conflict**
   ```bash
   # Find process using port
   lsof -i :PORT_NUMBER
   
   # Change port in docker-compose.yml
   ports:
     - "3001:3000"  # Use different host port
   ```

2. **Volume Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R 1000:1000 ./data
   
   # Or run container as root (not recommended)
   user: "0:0"
   ```

3. **Missing Environment Variables**
   ```bash
   # Check required env vars
   docker-compose config
   
   # Add to .env file
   echo "REQUIRED_VAR=value" >> .env
   ```

### Container Running But Not Accessible

**Symptoms**: Container running but endpoints not responding

**Diagnostics**:
```bash
# Test from inside container
docker exec container-name curl http://localhost:3000/health

# Check container networking
docker network inspect workstation_default

# Check port mapping
docker port container-name
```

**Solutions**:

1. **Wrong Network**
   ```bash
   # Connect to correct network
   docker network connect workstation_default container-name
   
   # Or in docker-compose.yml
   networks:
     - workstation_default
   ```

2. **Firewall Blocking**
   ```bash
   # Check firewall rules
   sudo iptables -L -n
   
   # Allow port (Ubuntu/Debian)
   sudo ufw allow 3000/tcp
   ```

3. **Application Not Listening**
   ```bash
   # Check if app is listening on 0.0.0.0 not 127.0.0.1
   docker exec container-name netstat -tulpn
   
   # Update app to listen on 0.0.0.0
   app.listen(3000, '0.0.0.0');
   ```

---

## MCP Issues

### MCP Container Not Connecting

**Symptoms**: MCP client can't connect to server

**Diagnostics**:
```bash
# Check MCP server is running
docker ps | grep mcp

# Test MCP endpoint
curl http://localhost:MCP_PORT/health

# Check MCP logs
docker logs mcp-container-name
```

**Solutions**:

1. **Server Not Running**
   ```bash
   # Start MCP server
   cd mcp-containers/05-workflow-mcp
   npm start
   
   # Or via Docker
   docker-compose up -d workflow-mcp
   ```

2. **Port Configuration**
   ```bash
   # Check MCP_SERVER_URL in .env
   echo $MCP_SERVER_URL
   
   # Update if needed
   MCP_SERVER_URL=http://localhost:3100
   ```

3. **Authentication Issues**
   ```typescript
   // Verify MCP credentials
   const mcpClient = new MCPClient({
     url: process.env.MCP_SERVER_URL,
     apiKey: process.env.MCP_API_KEY  // If required
   });
   ```

### MCP Sync Failures

**Symptoms**: MCP state not syncing between browser and local

**Diagnostics**:
```bash
# Check sync status
./scripts/mcp-sync.sh status

# View sync logs
tail -f logs/mcp-sync.log

# Test sync manually
./scripts/mcp-sync.sh test
```

**Solutions**:

1. **Run Manual Sync**
   ```bash
   # Force sync
   ./scripts/mcp-sync.sh force
   
   # Verify sync
   ./scripts/mcp-sync.sh verify
   ```

2. **Clear Sync Cache**
   ```bash
   # Clear local cache
   rm -rf .mcp-cache/*
   
   # Reinitialize
   ./scripts/mcp-sync.sh init
   ```

---

## Performance Issues

### High CPU Usage

**Diagnostics**:
```bash
# Check process CPU usage
top -p $(pgrep -f workstation)

# Profile application
node --prof src/index.ts
node --prof-process isolate-*.log > cpu-profile.txt

# Check Docker stats
docker stats --no-stream
```

**Solutions**:

1. **Optimize Code**
   ```typescript
   // Add caching for expensive operations
   const cache = new Map();
   
   function expensiveOperation(key) {
     if (cache.has(key)) return cache.get(key);
     const result = doExpensiveWork(key);
     cache.set(key, result);
     return result;
   }
   ```

2. **Limit Concurrency**
   ```typescript
   // Use queue to limit concurrent operations
   const pLimit = require('p-limit');
   const limit = pLimit(5);  // Max 5 concurrent
   
   await Promise.all(
     tasks.map(task => limit(() => processTask(task)))
   );
   ```

### High Memory Usage

**Diagnostics**:
```bash
# Check memory usage
ps aux | grep node

# Heap snapshot
node --heapsnapshot-signal=SIGUSR2 src/index.ts &
kill -USR2 $!

# Analyze with Chrome DevTools
```

**Solutions**:

1. **Fix Memory Leaks**
   ```typescript
   // Remove event listeners
   emitter.removeListener('event', handler);
   
   // Clear intervals
   clearInterval(intervalId);
   
   // Null large objects
   largeData = null;
   ```

2. **Increase Memory Limit**
   ```bash
   # Node.js
   node --max-old-space-size=4096 src/index.ts
   
   # Docker
   # Edit docker-compose.yml
   mem_limit: 4g
   ```

---

## Diagnostic Tools

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Workstation System Health Check ==="
echo ""

# Check services
echo "Services:"
systemctl is-active workstation || echo "  ❌ Workstation service not running"
systemctl is-active postgresql || echo "  ❌ PostgreSQL not running"
echo ""

# Check Docker containers
echo "Docker Containers:"
docker ps --filter "name=workstation" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check database
echo "Database:"
psql -U workstation -d workstation -c "SELECT COUNT(*) FROM agent_registry;" || echo "  ❌ Database query failed"
echo ""

# Check API
echo "API:"
curl -s http://localhost:3000/health | jq . || echo "  ❌ API not responding"
echo ""

# Check disk space
echo "Disk Space:"
df -h | grep -E "Filesystem|/$"
echo ""

# Check memory
echo "Memory:"
free -h
echo ""

echo "=== Health Check Complete ==="
```

### Log Analysis Script

```bash
#!/bin/bash
# analyze-logs.sh

echo "=== Log Analysis ==="

# Error count in last hour
echo "Errors in last hour:"
grep -c "ERROR" logs/app.log
echo ""

# Top errors
echo "Top 10 errors:"
grep "ERROR" logs/app.log | cut -d':' -f4- | sort | uniq -c | sort -rn | head -10
echo ""

# Failed tasks
echo "Failed tasks in last hour:"
psql -U workstation -d workstation -c "
  SELECT COUNT(*) 
  FROM agent_tasks 
  WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '1 hour';
"
```

---

## Getting Help

### Before Opening an Issue

1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Review relevant documentation
4. Gather diagnostic information

### Information to Include

```bash
# System information
uname -a
node --version
npm --version
docker --version

# Application logs
tail -100 logs/app.log

# Docker logs
docker-compose logs --tail=100

# Database info
psql --version
psql -U workstation -d workstation -c "\dt"

# Configuration (redact secrets!)
cat .env | grep -v "SECRET\|PASSWORD\|KEY"
```

### Support Channels

- **GitHub Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: `/docs` directory
- **Source Code**: `src/` directory

---

*This guide is actively maintained. Last updated: November 24, 2024*
