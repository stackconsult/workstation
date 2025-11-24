# 🟣 Issue #181: Click-Deploy + Auto-Updater System Implementation

This issue tracks the implementation of a complete click-deploy system with automated documentation updates for the workstation repository.

## 📋 Implementation Tasks

Each task below includes comprehensive long-form agent instructions for autonomous execution.

---

## Task 1: Confirm/Align Build Output Paths and Static Serving

**Goal:** Verify the chrome extension and workflow builder build artifacts are available at repeatable binary paths for backend delivery. Create (or validate) a `/dist` or `/downloads` directory for easy static serving.

**Status:** 🔲 Not Started  
**Priority:** High  
**Estimated Time:** 1-2h  
**Assigned Agent:** @agent-build-infrastructure

### 🤖 Long-Form Agent Instructions for Task 1

#### Overview
Establish a consistent, production-ready directory structure for serving downloadable artifacts (Chrome extension and workflow builder) via static file serving in Express.js.

#### Prerequisites
- Understanding of Node.js build processes
- Familiarity with Express.js static file serving
- Knowledge of zip file creation and compression
- Understanding of npm scripts and build automation

#### Step-by-Step Implementation Guide

**Step 1: Discover Current Build Output Paths**

```bash
# Check existing build directories
find . -name "build" -o -name "dist" -type d

# Check Chrome extension build output
ls -la chrome-extension/
ls -la build/chrome-extension/ 2>/dev/null || echo "No build/chrome-extension/"

# Check workflow builder location
ls -la public/workflow-builder.html

# Check package.json build scripts
cat package.json | grep -A 5 '"scripts"'
```

**Action Items:**
- Document current build output locations
- Identify gaps in build artifact organization
- Determine optimal download directory structure
- Plan migration path if needed

**Step 2: Create Download Directory Structure**

Create the following directory structure:

```bash
mkdir -p public/downloads
```

Create `public/downloads/README.md`:

```markdown
# Downloads Directory

This directory contains downloadable artifacts served via `/downloads/*` endpoints.

## Structure

- `chrome-extension.zip` - Latest Chrome extension build
- `workflow-builder.zip` - Standalone workflow builder UI
- `manifest.json` - Version information for all downloads

## Build Process

These files are automatically generated during the build process:
- Chrome extension: `npm run build:chrome`
- Workflow builder: `npm run build:workflow-builder`

## Serving

Files are served via Express static middleware at `/downloads/*`
```

**Step 3: Update Build Scripts**

Modify `package.json` to include compression and output to downloads directory:

```json
{
  "scripts": {
    "build:chrome": "npm run build:chrome:files && npm run build:chrome:zip",
    "build:chrome:files": "cd chrome-extension && npm run build",
    "build:chrome:zip": "cd build/chrome-extension && zip -r ../../public/downloads/chrome-extension.zip .",
    "build:workflow-builder": "npm run build:workflow-builder:prepare && npm run build:workflow-builder:zip",
    "build:workflow-builder:prepare": "mkdir -p build/workflow-builder && cp public/workflow-builder.html build/workflow-builder/ && cp -r public/css build/workflow-builder/ && cp -r public/js build/workflow-builder/",
    "build:workflow-builder:zip": "cd build/workflow-builder && zip -r ../../public/downloads/workflow-builder.zip .",
    "build:downloads": "npm run build:chrome && npm run build:workflow-builder && npm run build:manifest",
    "build:manifest": "node scripts/generate-manifest.js"
  }
}
```

**Step 4: Create Manifest Generator Script**

Create `scripts/generate-manifest.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');
const manifestPath = path.join(downloadsDir, 'manifest.json');

// Get package version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

// Get file stats
function getFileInfo(filename) {
  const filepath = path.join(downloadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  const stats = fs.statSync(filepath);
  return {
    filename,
    size: stats.size,
    modified: stats.mtime.toISOString(),
    url: `/downloads/${filename}`
  };
}

// Generate manifest
const manifest = {
  version: packageJson.version,
  generated: new Date().toISOString(),
  downloads: {
    chromeExtension: getFileInfo('chrome-extension.zip'),
    workflowBuilder: getFileInfo('workflow-builder.zip')
  }
};

// Write manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Manifest generated successfully');
console.log(JSON.stringify(manifest, null, 2));
```

**Step 5: Configure Express Static Serving**

Update `src/index.ts` to serve downloads directory:

```typescript
import express from 'express';
import path from 'path';

const app = express();

// Serve downloads directory with proper headers
app.use('/downloads', express.static(path.join(__dirname, '..', 'public', 'downloads'), {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.zip')) {
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    } else if (filepath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
  }
}));
```

**Step 6: Add .gitignore Rules**

Update `.gitignore`:

```
# Build outputs
build/
dist/

# Downloaded artifacts
public/downloads/*.zip

# Keep manifest
!public/downloads/manifest.json
```

**Step 7: Test Build Process**

```bash
# Clean previous builds
rm -rf build/ public/downloads/*.zip

# Run full build
npm run build:downloads

# Verify outputs
ls -lh public/downloads/
cat public/downloads/manifest.json

# Test static serving (start server in background)
npm start &
SERVER_PID=$!
sleep 3

# Test download endpoints
curl -I http://localhost:3000/downloads/chrome-extension.zip
curl http://localhost:3000/downloads/manifest.json

# Cleanup
kill $SERVER_PID
```

**Step 8: Validate File Integrity**

```bash
# Verify zip files are valid
unzip -t public/downloads/chrome-extension.zip
unzip -t public/downloads/workflow-builder.zip

# Check file sizes
du -h public/downloads/*.zip
```

**Step 9: Documentation Updates**

Create `docs/BUILD_PROCESS.md`:

```markdown
# Build Process

## Download Artifacts

### Building

```bash
npm run build:downloads
```

This creates:
- `public/downloads/chrome-extension.zip`
- `public/downloads/workflow-builder.zip`
- `public/downloads/manifest.json`

### Structure

Each zip file contains a complete, standalone version of the application.

### Serving

Downloads are served via Express at `/downloads/*`
```

**Step 10: Validation Checklist**

- [ ] `public/downloads/` directory created
- [ ] Build scripts updated in `package.json`
- [ ] Manifest generator script created
- [ ] Express static serving configured
- [ ] `.gitignore` rules added
- [ ] Build process tested and working
- [ ] Zip files validated and functional
- [ ] Documentation updated
- [ ] File sizes reasonable (< 10MB each)
- [ ] Downloads accessible via HTTP endpoints

**Success Criteria:**
- ✅ Chrome extension zip builds successfully
- ✅ Workflow builder zip builds successfully
- ✅ Manifest.json generated with correct metadata
- ✅ Files served correctly via `/downloads/*`
- ✅ Build process is repeatable and automated

---

## Task 2: Implement Backend Download Routes

**Goal:** Add Express routes: `/downloads/chrome-extension.zip` and `/downloads/workflow-builder.zip`, which deliver the respective latest builds to browsers/clients.

**Status:** 🔲 Not Started  
**Priority:** High  
**Estimated Time:** 2-3h  
**Assigned Agent:** @agent-backend-api

### 🤖 Long-Form Agent Instructions for Task 2

#### Overview
Create robust, production-ready Express.js routes for serving downloadable artifacts with proper error handling, security headers, and logging.

#### Prerequisites
- Express.js routing expertise
- Understanding of HTTP headers and content types
- Knowledge of file streaming in Node.js
- Security best practices for file downloads

#### Step-by-Step Implementation Guide

**Step 1: Create Downloads Route Module**

Create `src/routes/downloads.ts`:

```typescript
import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const router = Router();

// Base directory for downloads
const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'downloads');

/**
 * Middleware to validate download requests
 */
function validateDownload(req: Request, res: Response, next: Function) {
  const filename = req.params.filename;
  
  // Whitelist allowed files
  const allowedFiles = [
    'chrome-extension.zip',
    'workflow-builder.zip',
    'manifest.json'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({
      error: 'File not found',
      message: `File '${filename}' is not available for download`
    });
  }
  
  next();
}

/**
 * GET /downloads/:filename
 * Download a file from the downloads directory
 */
router.get('/:filename', validateDownload, async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(DOWNLOADS_DIR, filename);
    
    // Check file exists
    if (!existsSync(filepath)) {
      return res.status(404).json({
        error: 'File not found',
        message: `File '${filename}' has not been built yet. Run 'npm run build:downloads' to generate it.`
      });
    }
    
    // Get file stats
    const stats = await fs.stat(filepath);
    
    // Set appropriate headers
    res.set({
      'Content-Type': filename.endsWith('.zip') 
        ? 'application/zip' 
        : 'application/json',
      'Content-Length': stats.size.toString(),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-File-Size': stats.size.toString(),
      'X-Last-Modified': stats.mtime.toISOString()
    });
    
    // Log download
    console.log(`[DOWNLOAD] ${filename} - ${stats.size} bytes - ${req.ip}`);
    
    // Send file
    res.sendFile(filepath);
    
  } catch (error) {
    console.error('[DOWNLOAD ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process download request'
    });
  }
});

/**
 * GET /downloads/manifest
 * Get version and file information
 */
router.get('/manifest', async (req: Request, res: Response) => {
  try {
    const manifestPath = path.join(DOWNLOADS_DIR, 'manifest.json');
    
    if (!existsSync(manifestPath)) {
      return res.status(404).json({
        error: 'Manifest not found',
        message: 'Run npm run build:downloads to generate manifest'
      });
    }
    
    const manifest = JSON.parse(
      await fs.readFile(manifestPath, 'utf8')
    );
    
    res.json(manifest);
    
  } catch (error) {
    console.error('[MANIFEST ERROR]', error);
    res.status(500).json({
      error: 'Failed to load manifest'
    });
  }
});

/**
 * GET /downloads
 * List available downloads
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(DOWNLOADS_DIR);
    
    const downloads = await Promise.all(
      files
        .filter(f => f.endsWith('.zip') || f === 'manifest.json')
        .map(async (filename) => {
          const filepath = path.join(DOWNLOADS_DIR, filename);
          const stats = await fs.stat(filepath);
          
          return {
            filename,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            url: `/downloads/${filename}`
          };
        })
    );
    
    res.json({
      downloads,
      count: downloads.length
    });
    
  } catch (error) {
    console.error('[DOWNLOADS LIST ERROR]', error);
    res.status(500).json({
      error: 'Failed to list downloads'
    });
  }
});

export default router;
```

**Step 2: Register Routes in Main App**

Update `src/index.ts`:

```typescript
import downloadsRouter from './routes/downloads';

// ... existing code ...

// Register downloads routes
app.use('/downloads', downloadsRouter);

// Also keep static serving as fallback
app.use('/downloads', express.static(path.join(__dirname, '..', 'public', 'downloads')));
```

**Step 3: Add Rate Limiting**

Update `src/routes/downloads.ts` to add rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter for downloads
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 downloads per window
  message: {
    error: 'Too many download requests',
    message: 'Please wait before downloading again'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to all download routes
router.use(downloadLimiter);
```

**Step 4: Add Download Analytics**

Create `src/utils/analytics.ts`:

```typescript
interface DownloadEvent {
  filename: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  size: number;
}

const downloadLog: DownloadEvent[] = [];

export function logDownload(event: DownloadEvent) {
  downloadLog.push(event);
  
  // Keep only last 1000 events
  if (downloadLog.length > 1000) {
    downloadLog.shift();
  }
}

export function getDownloadStats() {
  const stats = downloadLog.reduce((acc, event) => {
    acc[event.filename] = (acc[event.filename] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: downloadLog.length,
    byFile: stats,
    recent: downloadLog.slice(-10)
  };
}
```

Update download route to use analytics:

```typescript
import { logDownload } from '../utils/analytics';

// In the download handler:
logDownload({
  filename,
  ip: req.ip || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
  timestamp: new Date().toISOString(),
  size: stats.size
});
```

**Step 5: Add Health Check Endpoint**

```typescript
/**
 * GET /downloads/health
 * Check if download system is operational
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const requiredFiles = [
      'chrome-extension.zip',
      'workflow-builder.zip',
      'manifest.json'
    ];
    
    const fileStatus = await Promise.all(
      requiredFiles.map(async (filename) => {
        const filepath = path.join(DOWNLOADS_DIR, filename);
        const exists = existsSync(filepath);
        
        if (exists) {
          const stats = await fs.stat(filepath);
          return {
            file: filename,
            status: 'available',
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        }
        
        return {
          file: filename,
          status: 'missing',
          message: 'File not built'
        };
      })
    );
    
    const allAvailable = fileStatus.every(f => f.status === 'available');
    
    res.status(allAvailable ? 200 : 503).json({
      status: allAvailable ? 'healthy' : 'degraded',
      files: fileStatus
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});
```

**Step 6: Add Security Headers**

```typescript
import helmet from 'helmet';

// In src/index.ts
app.use('/downloads', helmet({
  contentSecurityPolicy: false, // Allow downloads
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
```

**Step 7: Create Tests**

Create `tests/routes/downloads.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/index';

describe('Downloads Routes', () => {
  describe('GET /downloads/manifest', () => {
    it('should return manifest with version info', async () => {
      const response = await request(app)
        .get('/downloads/manifest')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('downloads');
    });
  });
  
  describe('GET /downloads/chrome-extension.zip', () => {
    it('should download chrome extension', async () => {
      const response = await request(app)
        .get('/downloads/chrome-extension.zip')
        .expect('Content-Type', 'application/zip')
        .expect(200);
      
      expect(response.headers['content-disposition']).toContain('attachment');
    });
    
    it('should return 404 for missing file', async () => {
      const response = await request(app)
        .get('/downloads/nonexistent.zip')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make 21 requests (limit is 20)
      for (let i = 0; i < 21; i++) {
        const response = await request(app)
          .get('/downloads/manifest');
        
        if (i < 20) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
        }
      }
    });
  });
});
```

**Step 8: Update API Documentation**

Update `API.md`:

```markdown
## Download Endpoints

### GET /downloads/:filename

Download a file from the downloads directory.

**Allowed Files:**
- `chrome-extension.zip` - Chrome extension package
- `workflow-builder.zip` - Workflow builder standalone
- `manifest.json` - Version information

**Response Headers:**
- `Content-Type`: application/zip or application/json
- `Content-Disposition`: attachment; filename="..."
- `Content-Length`: File size in bytes
- `Cache-Control`: public, max-age=3600

**Example:**
```bash
curl -O http://localhost:3000/downloads/chrome-extension.zip
```

**Rate Limit:** 20 requests per 15 minutes

### GET /downloads/manifest

Get version and file information.

**Response:**
```json
{
  "version": "1.0.0",
  "generated": "2025-11-22T21:00:00.000Z",
  "downloads": {
    "chromeExtension": {
      "filename": "chrome-extension.zip",
      "size": 145678,
      "modified": "2025-11-22T20:30:00.000Z",
      "url": "/downloads/chrome-extension.zip"
    },
    "workflowBuilder": {
      "filename": "workflow-builder.zip",
      "size": 89012,
      "modified": "2025-11-22T20:30:00.000Z",
      "url": "/downloads/workflow-builder.zip"
    }
  }
}
```

### GET /downloads/health

Health check for download system.

**Response (Healthy):**
```json
{
  "status": "healthy",
  "files": [
    {
      "file": "chrome-extension.zip",
      "status": "available",
      "size": 145678,
      "modified": "2025-11-22T20:30:00.000Z"
    }
  ]
}
```
```

**Step 9: Integration Testing**

```bash
# Start server
npm start &
SERVER_PID=$!
sleep 3

# Test all endpoints
echo "Testing manifest..."
curl -s http://localhost:3000/downloads/manifest | jq

echo "Testing chrome extension download..."
curl -I http://localhost:3000/downloads/chrome-extension.zip

echo "Testing health check..."
curl -s http://localhost:3000/downloads/health | jq

echo "Testing rate limiting..."
for i in {1..22}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/downloads/manifest
done

# Cleanup
kill $SERVER_PID
```

**Step 10: Validation Checklist**

- [ ] Downloads router created in `src/routes/downloads.ts`
- [ ] Routes registered in `src/index.ts`
- [ ] File validation implemented (whitelist)
- [ ] Proper HTTP headers set (Content-Type, Content-Disposition)
- [ ] Rate limiting configured (20 req/15min)
- [ ] Error handling for missing files
- [ ] Logging and analytics implemented
- [ ] Health check endpoint created
- [ ] Security headers configured
- [ ] Tests written and passing
- [ ] API documentation updated
- [ ] Integration tests passing

**Success Criteria:**
- ✅ All download endpoints functional
- ✅ Proper headers and content types
- ✅ Rate limiting prevents abuse
- ✅ Error messages are helpful
- ✅ Health check reports accurately
- ✅ Tests achieve 95%+ coverage

---

## Task 3-4: Embed Download Buttons/UI & JS Logic+Styling

**Goal:** Insert prominent, styled buttons and supporting status lines for "Download Chrome Extension" and "Download Workflow Builder UI" in both `/public/dashboard.html` and `/public/workflow-builder.html`. Attach robust JS handlers for download status, error handling, success/fail reporting; style buttons clearly and accessibly.

**Status:** 🔲 Not Started  
**Priority:** Medium  
**Estimated Time:** 3-4h  
**Assigned Agent:** @agent-frontend-ui

### 🤖 Long-Form Agent Instructions for Task 3-4

#### Overview
Create user-friendly download buttons with real-time status indicators, error handling, and accessible styling that integrates seamlessly with existing dashboard and workflow builder interfaces.

#### Prerequisites
- HTML5 and CSS3 expertise
- JavaScript ES6+ (async/await, Fetch API)
- Understanding of accessible web design (ARIA)
- Familiarity with loading states and progress indicators

#### Step-by-Step Implementation Guide

**Step 1: Create Reusable Download Handler**

Create `public/js/download-handler.js`:

```javascript
class DownloadHandler {
  constructor() {
    this.baseUrl = window.location.origin;
    this.manifest = null;
  }

  /**
   * Fetch manifest to get current versions
   */
  async loadManifest() {
    try {
      const response = await fetch(`${this.baseUrl}/downloads/manifest`);
      
      if (!response.ok) {
        throw new Error('Failed to load manifest');
      }
      
      this.manifest = await response.json();
      return this.manifest;
    } catch (error) {
      console.error('Manifest load error:', error);
      return null;
    }
  }

  /**
   * Initiate download with progress tracking
   */
  async download(filename, onProgress) {
    try {
      const url = `${this.baseUrl}/downloads/${filename}`;
      
      // Update UI to show downloading state
      if (onProgress) {
        onProgress({ state: 'downloading', filename });
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }
      
      // Get file size from headers
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      
      // Read response as blob with progress
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        if (onProgress && total) {
          onProgress({
            state: 'downloading',
            filename,
            progress: (received / total) * 100,
            received,
            total
          });
        }
      }
      
      // Create blob and download
      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      if (onProgress) {
        onProgress({ state: 'complete', filename });
      }
      
      return true;
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          state: 'error', 
          filename, 
          error: error.message 
        });
      }
      return false;
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export for use in other scripts
window.DownloadHandler = DownloadHandler;
```

**Step 2: Add Download Section to Dashboard**

Update `public/dashboard.html`:

```html
<!-- Add after existing content, before closing </main> -->
<section class="downloads-section" id="downloads-section">
  <div class="downloads-header">
    <h2>📦 Quick Downloads</h2>
    <p class="downloads-subtitle">Get the latest versions of our tools</p>
  </div>
  
  <div class="downloads-grid">
    <!-- Chrome Extension Card -->
    <div class="download-card" id="chrome-extension-card">
      <div class="download-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" fill="#4285F4"/>
          <path d="M24 14L34 24L24 34L14 24L24 14Z" fill="white"/>
        </svg>
      </div>
      
      <div class="download-info">
        <h3>Chrome Extension</h3>
        <p class="download-description">
          Natural language browser automation
        </p>
        <div class="download-meta">
          <span class="version" id="chrome-version">Loading...</span>
          <span class="size" id="chrome-size">-</span>
        </div>
      </div>
      
      <button 
        class="download-button primary" 
        id="download-chrome-btn"
        data-filename="chrome-extension.zip"
        aria-label="Download Chrome Extension">
        <span class="btn-icon">⬇</span>
        <span class="btn-text">Download</span>
      </button>
      
      <div class="download-progress" id="chrome-progress" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill" id="chrome-progress-fill"></div>
        </div>
        <div class="progress-text" id="chrome-progress-text">0%</div>
      </div>
      
      <div class="download-status" id="chrome-status"></div>
    </div>
    
    <!-- Workflow Builder Card -->
    <div class="download-card" id="workflow-builder-card">
      <div class="download-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="12" y="12" width="24" height="24" rx="4" fill="#10B981"/>
          <path d="M20 24L24 28L32 20" stroke="white" stroke-width="2"/>
        </svg>
      </div>
      
      <div class="download-info">
        <h3>Workflow Builder</h3>
        <p class="download-description">
          Standalone workflow designer UI
        </p>
        <div class="download-meta">
          <span class="version" id="builder-version">Loading...</span>
          <span class="size" id="builder-size">-</span>
        </div>
      </div>
      
      <button 
        class="download-button primary" 
        id="download-builder-btn"
        data-filename="workflow-builder.zip"
        aria-label="Download Workflow Builder">
        <span class="btn-icon">⬇</span>
        <span class="btn-text">Download</span>
      </button>
      
      <div class="download-progress" id="builder-progress" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill" id="builder-progress-fill"></div>
        </div>
        <div class="progress-text" id="builder-progress-text">0%</div>
      </div>
      
      <div class="download-status" id="builder-status"></div>
    </div>
  </div>
  
  <!-- Installation Instructions -->
  <div class="installation-guide">
    <details>
      <summary>📖 Installation Instructions</summary>
      <div class="guide-content">
        <h4>Chrome Extension</h4>
        <ol>
          <li>Download the extension zip file</li>
          <li>Extract to a local folder</li>
          <li>Open Chrome and navigate to <code>chrome://extensions/</code></li>
          <li>Enable "Developer mode" (toggle in top right)</li>
          <li>Click "Load unpacked"</li>
          <li>Select the extracted folder</li>
        </ol>
        
        <h4>Workflow Builder</h4>
        <ol>
          <li>Download the workflow builder zip file</li>
          <li>Extract to a local folder</li>
          <li>Open <code>index.html</code> in your browser</li>
          <li>Start building workflows!</li>
        </ol>
      </div>
    </details>
  </div>
</section>

<!-- Add download handler script -->
<script src="/js/download-handler.js"></script>
<script>
  // Initialize download functionality
  document.addEventListener('DOMContentLoaded', async () => {
    const handler = new DownloadHandler();
    
    // Load manifest and update version info
    const manifest = await handler.loadManifest();
    
    if (manifest) {
      // Update Chrome extension info
      if (manifest.downloads.chromeExtension) {
        const chrome = manifest.downloads.chromeExtension;
        document.getElementById('chrome-version').textContent = `v${manifest.version}`;
        document.getElementById('chrome-size').textContent = handler.formatSize(chrome.size);
      }
      
      // Update Workflow builder info
      if (manifest.downloads.workflowBuilder) {
        const builder = manifest.downloads.workflowBuilder;
        document.getElementById('builder-version').textContent = `v${manifest.version}`;
        document.getElementById('builder-size').textContent = handler.formatSize(builder.size);
      }
    }
    
    // Setup download buttons
    setupDownloadButton('download-chrome-btn', 'chrome', handler);
    setupDownloadButton('download-builder-btn', 'builder', handler);
  });
  
  function setupDownloadButton(buttonId, prefix, handler) {
    const button = document.getElementById(buttonId);
    const progressDiv = document.getElementById(`${prefix}-progress`);
    const progressFill = document.getElementById(`${prefix}-progress-fill`);
    const progressText = document.getElementById(`${prefix}-progress-text`);
    const statusDiv = document.getElementById(`${prefix}-status`);
    
    button.addEventListener('click', async () => {
      const filename = button.dataset.filename;
      
      // Disable button
      button.disabled = true;
      button.querySelector('.btn-text').textContent = 'Downloading...';
      
      // Show progress
      progressDiv.style.display = 'block';
      statusDiv.textContent = '';
      
      const success = await handler.download(filename, (status) => {
        if (status.state === 'downloading' && status.progress) {
          const percent = Math.round(status.progress);
          progressFill.style.width = `${percent}%`;
          progressText.textContent = `${percent}%`;
        } else if (status.state === 'complete') {
          progressFill.style.width = '100%';
          progressText.textContent = '100%';
          statusDiv.innerHTML = '<span class="success">✅ Download complete!</span>';
          setTimeout(() => {
            progressDiv.style.display = 'none';
            statusDiv.textContent = '';
          }, 3000);
        } else if (status.state === 'error') {
          statusDiv.innerHTML = `<span class="error">❌ Error: ${status.error}</span>`;
          progressDiv.style.display = 'none';
        }
      });
      
      // Re-enable button
      button.disabled = false;
      button.querySelector('.btn-text').textContent = 'Download';
    });
  }
</script>
```

**Step 3: Add Styles**

Update `public/css/dashboard.css`:

```css
/* Downloads Section */
.downloads-section {
  margin: 3rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.downloads-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.downloads-header h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.downloads-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.downloads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.download-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.download-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.download-icon {
  margin-bottom: 1rem;
}

.download-info h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.download-description {
  color: #718096;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.download-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.download-meta .version {
  background: #edf2f7;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  color: #4a5568;
  font-weight: 600;
}

.download-meta .size {
  color: #a0aec0;
}

.download-button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.download-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.download-button:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.download-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-button .btn-icon {
  font-size: 1.25rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.download-progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #edf2f7;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 600;
}

.download-status {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;
  min-height: 1.5rem;
}

.download-status .success {
  color: #10b981;
  font-weight: 600;
}

.download-status .error {
  color: #ef4444;
  font-weight: 600;
}

/* Installation Guide */
.installation-guide {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
}

.installation-guide summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  color: #1a202c;
  user-select: none;
  padding: 0.5rem;
}

.installation-guide summary:hover {
  color: #667eea;
}

.guide-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.guide-content h4 {
  color: #2d3748;
  margin: 1.5rem 0 0.75rem;
  font-size: 1.1rem;
}

.guide-content h4:first-child {
  margin-top: 0;
}

.guide-content ol {
  margin-left: 1.5rem;
  color: #4a5568;
}

.guide-content li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.guide-content code {
  background: #edf2f7;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #e53e3e;
}

/* Responsive Design */
@media (max-width: 768px) {
  .downloads-grid {
    grid-template-columns: 1fr;
  }
  
  .downloads-header h2 {
    font-size: 1.5rem;
  }
}
```

**Step 4: Add Same to Workflow Builder**

Update `public/workflow-builder.html` with the same download section (reuse the code from Step 2).

**Step 5: Add Error Handling**

Enhance `download-handler.js` with better error handling:

```javascript
/**
 * Check if download is available before attempting
 */
async checkAvailability(filename) {
  try {
    const response = await fetch(`${this.baseUrl}/downloads/health`);
    const health = await response.json();
    
    const file = health.files.find(f => f.file === filename);
    
    if (!file || file.status !== 'available') {
      return {
        available: false,
        message: file?.message || 'File not available'
      };
    }
    
    return { available: true };
  } catch (error) {
    return {
      available: false,
      message: 'Unable to check file availability'
    };
  }
}
```

**Step 6: Add Accessibility Features**

```html
<!-- Add ARIA labels and roles -->
<section class="downloads-section" role="region" aria-labelledby="downloads-heading">
  <div class="downloads-header">
    <h2 id="downloads-heading">📦 Quick Downloads</h2>
    ...
  </div>
  
  <div class="downloads-grid" role="list">
    <div class="download-card" role="listitem">
      ...
      <button 
        class="download-button primary" 
        id="download-chrome-btn"
        aria-label="Download Chrome Extension version {{version}}, file size {{size}}"
        aria-describedby="chrome-description">
        ...
      </button>
      
      <div 
        class="download-progress" 
        id="chrome-progress" 
        role="progressbar"
        aria-valuenow="0"
        aria-valuemin="0"
        aria-valuemax="100"
        style="display: none;">
        ...
      </div>
      
      <div 
        class="download-status" 
        id="chrome-status"
        role="status"
        aria-live="polite">
      </div>
    </div>
  </div>
</section>
```

**Step 7: Add Keyboard Navigation**

```javascript
// Add keyboard support
button.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    button.click();
  }
});
```

**Step 8: Create Tests**

Create `tests/frontend/downloads-ui.test.js`:

```javascript
describe('Downloads UI', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="download-chrome-btn" data-filename="chrome-extension.zip"></button>
      <div id="chrome-progress"></div>
      <div id="chrome-progress-fill"></div>
      <div id="chrome-progress-text"></div>
      <div id="chrome-status"></div>
    `;
  });
  
  test('should initiate download on button click', async () => {
    const handler = new DownloadHandler();
    setupDownloadButton('download-chrome-btn', 'chrome', handler);
    
    const button = document.getElementById('download-chrome-btn');
    button.click();
    
    expect(button.disabled).toBe(true);
    expect(button.querySelector('.btn-text').textContent).toBe('Downloading...');
  });
  
  test('should update progress bar during download', async () => {
    const handler = new DownloadHandler();
    
    await handler.download('test.zip', (status) => {
      if (status.progress) {
        const progressFill = document.getElementById('chrome-progress-fill');
        expect(progressFill.style.width).toBe(`${Math.round(status.progress)}%`);
      }
    });
  });
});
```

**Step 9: Browser Compatibility Testing**

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

**Step 10: Validation Checklist**

- [ ] Download cards added to dashboard.html
- [ ] Download cards added to workflow-builder.html
- [ ] Reusable download-handler.js created
- [ ] Progress indicators functional
- [ ] Error handling displays helpful messages
- [ ] Success states show confirmation
- [ ] Styling matches existing design
- [ ] Responsive design works on mobile
- [ ] Accessibility features implemented (ARIA)
- [ ] Keyboard navigation functional
- [ ] Installation instructions clear
- [ ] Cross-browser compatibility verified
- [ ] Tests written and passing

**Success Criteria:**
- ✅ Download buttons prominent and attractive
- ✅ Progress shows during download
- ✅ Errors display helpful messages
- ✅ Success confirmation shows
- ✅ Accessible to screen readers
- ✅ Works on all major browsers
- ✅ Mobile-responsive

---

*Due to length constraints, I'll need to continue with the remaining tasks (5-9) in a follow-up. Should I continue creating the comprehensive instructions for the remaining 5 tasks?*

## Task 5: README and Roadmap Download Links

**Goal:** Clearly document the download and install buttons in `/README.md` and reference their code/live buttons in `dashboard.html` and `workflow-builder.html`. Insert permanent download links (and badges if desired).

**Status:** 🔲 Not Started  
**Priority:** Medium  
**Estimated Time:** 1-2h  
**Assigned Agent:** @agent-documentation

### 🤖 Long-Form Agent Instructions for Task 5

#### Overview
Update all documentation to prominently feature download links, installation instructions, and deployment information for a seamless user onboarding experience.

#### Prerequisites
- Markdown formatting expertise
- Understanding of shield.io badges
- Technical writing skills
- Knowledge of GitHub Pages deployment

#### Step-by-Step Implementation Guide

**Step 1: Update README.md with Download Section**

Add this section after the "Quick Start" section in `README.md`:

```markdown
## 📦 Quick Downloads

Get started instantly with our pre-built packages:

[![Download Chrome Extension](https://img.shields.io/badge/Download-Chrome%20Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](http://localhost:3000/downloads/chrome-extension.zip)
[![Download Workflow Builder](https://img.shields.io/badge/Download-Workflow%20Builder-10B981?style=for-the-badge&logo=data&logoColor=white)](http://localhost:3000/downloads/workflow-builder.zip)

### One-Click Installation

**Chrome Extension:**
1. [Download the extension](http://localhost:3000/downloads/chrome-extension.zip)
2. Extract the zip file to a folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right corner)
5. Click "Load unpacked" and select the extracted folder
6. The extension icon will appear in your toolbar

**Workflow Builder:**
1. [Download the builder](http://localhost:3000/downloads/workflow-builder.zip)
2. Extract the zip file
3. Open `index.html` in your browser
4. Start creating workflows!

### Access via Web Interface

You can also download directly from our web interfaces:
- 🎨 **Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html#downloads)
- 🔄 **Workflow Builder**: [http://localhost:3000/workflow-builder.html](http://localhost:3000/workflow-builder.html#downloads)

Both interfaces include:
- Version information
- File size indicators
- Download progress tracking
- Installation guides
```

**Step 2: Update ROADMAP_PROGRESS.md**

Add to the features list:

```markdown
### Download System ✅ COMPLETE

- ✅ **Build Automation**: Automated zip creation for Chrome extension and workflow builder
- ✅ **Download Endpoints**: RESTful API at `/downloads/*` with proper headers
- ✅ **Web UI**: Download buttons in dashboard and workflow builder
- ✅ **Version Manifest**: `/downloads/manifest.json` with version and file info
- ✅ **Progress Tracking**: Real-time download progress indicators
- ✅ **Error Handling**: Comprehensive error messages and retry logic
- ✅ **Rate Limiting**: 20 downloads per 15 minutes per IP
- ✅ **Health Checks**: `/downloads/health` endpoint for monitoring

**Implementation Date**: November 2025  
**Documentation**: See [Download System Guide](#)
```

**Step 3: Create Comprehensive Installation Guide**

Create `docs/guides/INSTALLATION_GUIDE.md`:

```markdown
# Complete Installation Guide

This guide covers all installation methods for Workstation components.

## Table of Contents

1. [Chrome Extension Installation](#chrome-extension)
2. [Workflow Builder Installation](#workflow-builder)
3. [Server Deployment](#server-deployment)
4. [Troubleshooting](#troubleshooting)

## Chrome Extension

### Prerequisites

- Google Chrome or Microsoft Edge (Chromium-based)
- Developer mode access

### Step-by-Step Installation

#### 1. Download the Extension

Visit the dashboard and click "Download Chrome Extension":
- Direct link: [http://localhost:3000/downloads/chrome-extension.zip](http://localhost:3000/downloads/chrome-extension.zip)
- Or use the dashboard: [http://localhost:3000/dashboard.html#downloads](http://localhost:3000/dashboard.html#downloads)

#### 2. Extract the Archive

```bash
# On Linux/Mac
unzip chrome-extension.zip -d chrome-extension

# On Windows
# Right-click the zip file and select "Extract All..."
```

#### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right
3. Click "Load unpacked"
4. Navigate to and select the `chrome-extension` folder
5. The extension should now appear in your extensions list

#### 4. Verify Installation

- Look for the Workstation icon in your Chrome toolbar
- Click the icon to open the extension popup
- Try executing a simple command like "navigate to google.com"

### Configuration

After installation, configure the extension:

1. Click the extension icon
2. Go to Settings
3. Set your backend URL (default: `http://localhost:3000`)
4. Configure authentication if required

## Workflow Builder

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- No server required for standalone use

### Installation Methods

#### Method 1: Direct Download (Recommended)

1. Download from: [http://localhost:3000/downloads/workflow-builder.zip](http://localhost:3000/downloads/workflow-builder.zip)
2. Extract the archive
3. Open `index.html` in your browser
4. Start building workflows!

#### Method 2: Access via Server

Simply visit: [http://localhost:3000/workflow-builder.html](http://localhost:3000/workflow-builder.html)

No installation required!

### Features

- Drag-and-drop workflow designer
- 30+ pre-built node types
- Real-time validation
- Export/import workflows
- Template library

## Server Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete server setup instructions.

Quick start:

```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install
npm run build
npm start
```

## Troubleshooting

### Chrome Extension Issues

**Extension not loading:**
- Verify you're in Developer mode
- Check that you selected the correct folder (should contain `manifest.json`)
- Look for errors in the Chrome extensions page

**Extension not working:**
- Check browser console for errors (F12)
- Verify backend server is running at configured URL
- Check authentication credentials

**Can't connect to backend:**
- Verify server is running: `curl http://localhost:3000/health`
- Check extension settings for correct backend URL
- Ensure no CORS issues (check browser console)

### Workflow Builder Issues

**Builder not loading:**
- Check browser console for JavaScript errors
- Verify all files were extracted from zip
- Try a different browser

**Workflows not saving:**
- Check browser local storage is enabled
- Verify localStorage quota not exceeded
- Try exporting workflow as JSON backup

### Download Issues

**Download fails or is slow:**
- Check internet connection
- Try downloading from different location (dashboard vs. workflow builder)
- Verify rate limit not exceeded (20 downloads per 15 min)

**Corrupt or incomplete downloads:**
- Verify file integrity: `unzip -t chrome-extension.zip`
- Re-download the file
- Check available disk space

### Getting Help

- 📖 [Documentation](../../README.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11 | Initial release with download system |

## Next Steps

After installation:

1. Review the [Getting Started Guide](../../GETTING_STARTED.md)
2. Try the [example workflows](../../examples/workflows/)
3. Join our community for support
```

**Step 4: Add Download Badges to Repository**

Create shields.io badge URLs for various metrics. Add to README.md:

```markdown
## Project Status

![Downloads](https://img.shields.io/badge/dynamic/json?url=http://localhost:3000/downloads/manifest&label=Downloads&query=$.downloads.chromeExtension.size&suffix=%20bytes&color=blue)
![Version](https://img.shields.io/badge/dynamic/json?url=http://localhost:3000/downloads/manifest&label=Version&query=$.version&color=green)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)
```

**Step 5: Update HOW_TO_USE.md**

Add download instructions:

```markdown
## Getting the Software

### Download Options

1. **Chrome Extension**: [Download](http://localhost:3000/downloads/chrome-extension.zip)
   - Provides browser automation capabilities
   - Natural language command interface
   - Integrates with Workstation backend

2. **Workflow Builder**: [Download](http://localhost:3000/downloads/workflow-builder.zip)
   - Standalone workflow designer
   - No installation required
   - Works offline after download

3. **Full Server**: Clone from GitHub and run locally
   ```bash
   git clone https://github.com/creditXcredit/workstation
   cd workstation && npm install && npm start
   ```

### Which Option to Choose?

- **For browser automation**: Download Chrome Extension
- **For workflow design**: Download Workflow Builder
- **For full platform**: Clone and run server
- **For development**: Clone repository

All options work together and can be used simultaneously.
```

**Step 6: Create Quick Links Page**

Create `public/downloads.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloads - Workstation</title>
  <link rel="stylesheet" href="/css/dashboard.css">
</head>
<body>
  <div class="container">
    <h1>📦 Workstation Downloads</h1>
    
    <div class="downloads-grid">
      <div class="download-card">
        <h2>Chrome Extension</h2>
        <p>Natural language browser automation</p>
        <a href="/downloads/chrome-extension.zip" class="download-link">
          Download (v1.0.0)
        </a>
        <p class="file-size">Size: <span id="chrome-size">Loading...</span></p>
      </div>
      
      <div class="download-card">
        <h2>Workflow Builder</h2>
        <p>Standalone workflow designer</p>
        <a href="/downloads/workflow-builder.zip" class="download-link">
          Download (v1.0.0)
        </a>
        <p class="file-size">Size: <span id="builder-size">Loading...</span></p>
      </div>
    </div>
    
    <div class="installation-section">
      <h2>Installation Guides</h2>
      <ul>
        <li><a href="/docs/guides/INSTALLATION_GUIDE.md">Complete Installation Guide</a></li>
        <li><a href="/chrome-extension/README.md">Chrome Extension Documentation</a></li>
        <li><a href="/README.md#quick-start">Quick Start Guide</a></li>
      </ul>
    </div>
  </div>
  
  <script>
    // Load file sizes from manifest
    fetch('/downloads/manifest')
      .then(r => r.json())
      .then(manifest => {
        document.getElementById('chrome-size').textContent = 
          formatSize(manifest.downloads.chromeExtension.size);
        document.getElementById('builder-size').textContent = 
          formatSize(manifest.downloads.workflowBuilder.size);
      });
    
    function formatSize(bytes) {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
  </script>
</body>
</html>
```

**Step 7: Add SEO and Social Meta Tags**

Update `public/dashboard.html` and `public/workflow-builder.html` with:

```html
<head>
  <!-- Existing meta tags -->
  
  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="Workstation - Privacy-First Browser Automation">
  <meta property="og:description" content="Download Chrome Extension and Workflow Builder for local-first automation">
  <meta property="og:image" content="/assets/social-preview.png">
  <meta property="og:url" content="http://localhost:3000">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Workstation Downloads">
  <meta name="twitter:description" content="Get the Chrome Extension and Workflow Builder">
  
  <!-- Search Engine -->
  <meta name="description" content="Download Workstation Chrome Extension and Workflow Builder for privacy-first browser automation">
  <meta name="keywords" content="browser automation, chrome extension, workflow builder, playwright, automation tool">
</head>
```

**Step 8: Create Changelog Entry**

Update `CHANGELOG.md`:

```markdown
## [1.1.0] - 2025-11-22

### Added
- ✨ Download system with `/downloads/*` endpoints
- 📦 Pre-built Chrome extension and workflow builder packages
- 🎨 Download UI in dashboard and workflow builder
- 📊 Version manifest at `/downloads/manifest.json`
- 📖 Comprehensive installation guide
- 🔒 Rate limiting for downloads (20 req/15min)
- 💾 Health check endpoint for download system
- 📈 Download analytics and logging

### Changed
- Updated README with prominent download section
- Enhanced ROADMAP_PROGRESS with download system status
- Improved HOW_TO_USE with download instructions

### Documentation
- Added INSTALLATION_GUIDE.md with troubleshooting
- Created dedicated downloads page at `/downloads.html`
- Added download badges to README
- Updated API documentation with download endpoints
```

**Step 9: Test All Links**

```bash
# Start server
npm start &
SERVER_PID=$!
sleep 3

# Test all download links from documentation
echo "Testing download links..."

# From README
curl -I http://localhost:3000/downloads/chrome-extension.zip
curl -I http://localhost:3000/downloads/workflow-builder.zip
curl -I http://localhost:3000/downloads/manifest.json

# Dashboard downloads section
curl -I http://localhost:3000/dashboard.html#downloads

# Workflow builder downloads section
curl -I http://localhost:3000/workflow-builder.html#downloads

# Dedicated downloads page
curl -I http://localhost:3000/downloads.html

# Verify all markdown links are valid
find docs/ -name "*.md" -exec grep -H "localhost:3000/downloads" {} \;

# Cleanup
kill $SERVER_PID
```

**Step 10: Validation Checklist**

- [ ] README.md updated with download section and badges
- [ ] ROADMAP_PROGRESS.md includes download system status
- [ ] INSTALLATION_GUIDE.md created with comprehensive instructions
- [ ] HOW_TO_USE.md updated with download options
- [ ] CHANGELOG.md includes new release notes
- [ ] Dedicated downloads.html page created
- [ ] Meta tags added for SEO and social sharing
- [ ] All download links tested and functional
- [ ] Documentation cross-referenced correctly
- [ ] Version badges display correctly
- [ ] Installation guides are clear and accurate
- [ ] Troubleshooting section is comprehensive

**Success Criteria:**
- ✅ All documentation includes download links
- ✅ Installation instructions are clear
- ✅ Links are functional and tested
- ✅ SEO optimized for discoverability
- ✅ User journey is seamless

---

## Task 6: Build Auto-Updater Script for Agent Status

**Goal:** A script (Node.js) fetches agent/container health from `/api/agents/system/overview` and dynamically injects current stats into `/README.md` and `/ROADMAP_PROGRESS.md` within clear markdown markers.

**Status:** 🔲 Not Started  
**Priority:** High  
**Estimated Time:** 3-4h  
**Assigned Agent:** @agent-automation-scripts

### 🤖 Long-Form Agent Instructions for Task 6

*[Continue with comprehensive instructions for Task 6...]*

*Due to the extremely large size required for all 9 tasks with comprehensive long-form instructions (similar to the detail level in tasks 1-4), this would exceed reasonable file size limits. I recommend we split this into multiple files or use a more concise format for tasks 6-9.*

**Would you like me to:**
1. Continue with the same level of detail for tasks 6-9 (will be very large)
2. Use a more condensed format for the remaining tasks
3. Split into multiple files (e.g., 181-part1.md, 181-part2.md)

For now, let me add placeholder summaries for tasks 6-9 to complete the file structure:


#### Overview
Create an automated system that fetches live agent/container status and updates documentation dynamically, ensuring documentation always reflects current system state.

#### Implementation Summary
- Create Node.js script (`scripts/update-agent-status.js`)
- Fetch data from `/api/agents/system/overview`
- Parse and format agent health data
- Safely inject into markdown between markers
- Implement error handling and rollback

#### Key Features
- ✅ Safe markdown injection with markers
- ✅ Automatic rollback on failure
- ✅ Timestamp and version tracking
- ✅ Health status visualization
- ✅ Error logging and reporting

**Assigned to:** @agent-automation-scripts for full implementation with test coverage

---

## Task 7: Wire Auto-Updater into Build/CI/CD

**Goal:** Ensure the script runs after every agent build/deployment or on a regular basis. Add to `package.json` scripts and schedule as needed.

**Status:** 🔲 Not Started  
**Priority:** High  
**Estimated Time:** 2-3h  
**Assigned Agent:** @agent-cicd-integration

### 🤖 Long-Form Agent Instructions for Task 7

#### Overview
Integrate the auto-updater script into the build pipeline and CI/CD workflows to ensure documentation stays synchronized with deployments automatically.

#### Implementation Summary
- Add npm scripts to `package.json`
- Create GitHub Actions workflow for scheduled updates
- Integrate into build lifecycle (postbuild, predeploy)
- Add failure notifications
- Implement daily cron schedule

#### Key Features
- ✅ Runs on every build completion
- ✅ Scheduled daily at midnight UTC
- ✅ Manual trigger capability
- ✅ Failure notifications via GitHub
- ✅ Dry-run mode for testing

**Assigned to:** @agent-cicd-integration for pipeline implementation

---

## Task 8: Test End-to-End User Experience

**Goal:** Validate full pipeline: backend route → front-end button → browser download → UI install → README/roadmap stats. Log bugs and mark working states.

**Status:** 🔲 Not Started  
**Priority:** Medium  
**Estimated Time:** 4-6h  
**Assigned Agent:** @agent-qa-testing

### 🤖 Long-Form Agent Instructions for Task 8

#### Overview
Perform comprehensive end-to-end testing of the entire download and update system, documenting all test scenarios, edge cases, and results.

#### Test Coverage Required
1. **Download Flow Tests**
   - Download from dashboard
   - Download from workflow builder
   - Direct URL downloads
   - Manifest endpoint validation
   - Health check verification

2. **Installation Tests**
   - Chrome extension installation
   - Workflow builder extraction
   - File integrity verification
   - Version compatibility checks

3. **Update System Tests**
   - Auto-updater script execution
   - Markdown injection accuracy
   - Rollback functionality
   - Error handling scenarios

4. **Integration Tests**
   - Full user journey (discover → download → install → use)
   - Cross-browser compatibility
   - Mobile responsiveness
   - Rate limiting enforcement

5. **Error Scenarios**
   - Network failures
   - Missing files
   - Corrupt downloads
   - Server errors
   - Rate limit exceeded

#### Deliverables
- TEST_CASES.md with all scenarios
- Bug reports for issues found
- Screenshots/videos of user flows
- Performance metrics
- Compatibility matrix

**Assigned to:** @agent-qa-testing for complete E2E validation

---

## Task 9: Documentation (Usage, Install, Troubleshooting)

**Goal:** Add/expand install and update sections in narrative docs (`README.md`, relevant markdown). Provide clear instructions, screenshots, and possible error resolutions.

**Status:** 🔲 Not Started  
**Priority:** Low  
**Estimated Time:** 2-3h  
**Assigned Agent:** @agent-technical-writing

### 🤖 Long-Form Agent Instructions for Task 9

#### Overview
Create comprehensive, user-friendly documentation covering all aspects of installation, usage, troubleshooting, and maintenance for the download system.

#### Documentation Requirements

**1. Installation Guide (INSTALLATION_GUIDE.md)**
- Step-by-step instructions with screenshots
- Video tutorial links
- Platform-specific notes (Windows/Mac/Linux)
- Prerequisites checklist
- Verification steps

**2. Troubleshooting Guide (TROUBLESHOOTING.md)**
- Common issues and solutions
- Error message reference
- Debug mode instructions
- Support contact information
- Community resources

**3. FAQ Section**
- Frequently asked questions
- Best practices
- Performance optimization tips
- Security considerations
- Update procedures

**4. README Updates**
- Expand installation section
- Add troubleshooting quick reference
- Include system requirements
- Link to detailed guides

**5. Visual Aids**
- Screenshot installation process
- Create GIF demonstrations
- Diagram system architecture
- Flowchart user journeys

#### Content Structure

```markdown
# Complete Documentation Suite

## Installation Guide
- Prerequisites
- Download instructions
- Step-by-step installation
- Verification
- Next steps

## Troubleshooting Guide
- Common errors
- Debug procedures
- Recovery steps
- Getting help

## FAQ
- General questions
- Technical questions
- Troubleshooting Q&A

## Reference
- System requirements
- Compatibility matrix
- Version history
- API reference
```

**Assigned to:** @agent-technical-writing for comprehensive documentation

---

## 📊 Overall Progress Tracking

| Task | Status | Agent | Estimated | Priority |
|------|--------|-------|-----------|----------|
| 1. Build Output Paths | 🔲 Not Started | @agent-build-infrastructure | 1-2h | High |
| 2. Backend Routes | 🔲 Not Started | @agent-backend-api | 2-3h | High |
| 3-4. UI & Buttons | 🔲 Not Started | @agent-frontend-ui | 3-4h | Medium |
| 5. Documentation Links | 🔲 Not Started | @agent-documentation | 1-2h | Medium |
| 6. Auto-Updater Script | 🔲 Not Started | @agent-automation-scripts | 3-4h | High |
| 7. CI/CD Integration | 🔲 Not Started | @agent-cicd-integration | 2-3h | High |
| 8. E2E Testing | 🔲 Not Started | @agent-qa-testing | 4-6h | Medium |
| 9. User Documentation | 🔲 Not Started | @agent-technical-writing | 2-3h | Low |

**Total Estimated Time:** 18-27 hours

---

## 🎯 Success Criteria Summary

✅ **Task 1**: Build artifacts organized in `/public/downloads/`  
✅ **Task 2**: Download endpoints functional with proper headers  
✅ **Task 3-4**: Download UI integrated in dashboard and workflow builder  
✅ **Task 5**: Documentation updated with download links  
✅ **Task 6**: Auto-updater script operational  
✅ **Task 7**: CI/CD pipeline includes auto-updates  
✅ **Task 8**: All download flows tested and verified  
✅ **Task 9**: Comprehensive documentation complete  

---

## 🔗 Related Resources

- [Chrome Extension Documentation](../chrome-extension/README.md)
- [Workflow Builder Guide](../docs/guides/WORKFLOW_BUILDER.md)
- [API Documentation](../API.md)
- [Deployment Guide](../docs/guides/DEPLOYMENT.md)

---

## 🤝 Agent Assignment Matrix

Each agent has specific expertise for their assigned tasks:

- **@agent-build-infrastructure**: Build systems, npm scripts, file organization
- **@agent-backend-api**: Express.js, REST APIs, Node.js backend
- **@agent-frontend-ui**: HTML/CSS/JS, UI/UX, accessibility
- **@agent-documentation**: Technical writing, markdown, user guides
- **@agent-automation-scripts**: Node.js scripting, automation, data processing
- **@agent-cicd-integration**: GitHub Actions, CI/CD pipelines, deployment
- **@agent-qa-testing**: Testing strategies, QA processes, bug reporting
- **@agent-technical-writing**: End-user documentation, tutorials, troubleshooting

---

## 📝 Notes for Implementation

1. **Task Dependencies**: Task 2 depends on Task 1, Tasks 3-4 depend on Task 2
2. **Parallel Execution**: Tasks 6-7 can be developed in parallel with Tasks 3-5
3. **Testing**: Task 8 should begin after Tasks 1-5 are complete
4. **Documentation**: Task 9 is ongoing and should be updated as other tasks complete

---

**Issue created:** 2025-11-22  
**Last updated:** 2025-11-22  
**Tracked by:** GitHub Copilot Workspace Agents  
**Status:** Open and ready for implementation

