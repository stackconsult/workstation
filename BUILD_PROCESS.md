# Build Process Documentation

This document outlines the build processes for the Workstation AI Agent project.

## Table of Contents

- [Overview](#overview)
- [Build Scripts](#build-scripts)
- [Download Builds](#download-builds)
- [Directory Structure](#directory-structure)
- [Build Verification](#build-verification)
- [CI/CD Integration](#cicd-integration)

## Overview

The Workstation project has multiple build outputs:

1. **TypeScript Compilation**: Source code → `dist/` directory
2. **Chrome Extension**: Browser extension → `public/downloads/chrome-extension.zip`
3. **Workflow Builder**: Standalone app → `public/downloads/workflow-builder.zip`

## Build Scripts

### Main Build Commands

```bash
# Build TypeScript source code
npm run build

# Build distributable downloads (Chrome extension + Workflow builder)
npm run build:downloads

# Generate download manifest
npm run generate:manifest

# Build Chrome extension only (legacy)
npm run build:chrome
```

### Script Details

#### `npm run build`
- **Purpose**: Compile TypeScript to JavaScript
- **Input**: `src/**/*.ts`
- **Output**: `dist/**/*.js`
- **Process**:
  1. Run TypeScript compiler (`tsc`)
  2. Copy static assets (SQL schemas, etc.)
  
#### `npm run build:downloads`
- **Purpose**: Create distributable zip files
- **Script**: `scripts/build-downloads.js`
- **Output**: 
  - `public/downloads/chrome-extension.zip`
  - `public/downloads/workflow-builder.zip`
  - `public/downloads/manifest.json`
- **Process**:
  1. Build Chrome extension zip
  2. Build Workflow builder zip
  3. Generate manifest with checksums

#### `npm run generate:manifest`
- **Purpose**: Generate download manifest with metadata
- **Script**: `scripts/generate-manifest.js`
- **Output**: `public/downloads/manifest.json`
- **Contents**:
  - File names and sizes
  - SHA256 checksums
  - Version information
  - Download URLs

## Download Builds

### Chrome Extension Build

**Source**: `chrome-extension/` directory

**Includes**:
- Extension manifest (`manifest.json`)
- Background service worker (`background.js`)
- Content scripts (`content.js`)
- Popup UI (`popup/`)
- Playwright automation features (`playwright/`)
- Icons and assets (`icons/`)

**Output**: `public/downloads/chrome-extension.zip` (≈73 KB)

**Build Command**:
```bash
npm run build:downloads
```

**Manual Verification**:
```bash
# Test zip integrity
unzip -t public/downloads/chrome-extension.zip

# Verify checksum
sha256sum public/downloads/chrome-extension.zip
# Compare with manifest.json
```

### Workflow Builder Build

**Source**: `public/workflow-builder.html` + dependencies

**Includes**:
- Main HTML file (`workflow-builder.html`)
- Stylesheets (`css/workflow-builder.css`)
- JavaScript modules (`js/dashboard.js`)
- README with installation instructions

**Output**: `public/downloads/workflow-builder.zip` (≈21 KB)

**Build Command**:
```bash
npm run build:downloads
```

**Manual Verification**:
```bash
# Test zip integrity
unzip -t public/downloads/workflow-builder.zip

# Verify checksum
sha256sum public/downloads/workflow-builder.zip
# Compare with manifest.json
```

## Directory Structure

### Build Output Directories

```
workstation/
├── dist/                           # TypeScript compiled output
│   ├── index.js
│   ├── auth/
│   ├── routes/
│   └── ...
│
├── build/                          # Legacy build artifacts (gitignored)
│   └── chrome-extension/           # Uncompressed extension copy
│
└── public/
    ├── downloads/                  # **Primary distribution directory**
    │   ├── README.md               # Documentation
    │   ├── manifest.json           # Download metadata (committed)
    │   ├── chrome-extension.zip    # Chrome extension (gitignored)
    │   └── workflow-builder.zip    # Workflow builder (gitignored)
    │
    ├── workflow-builder.html       # Source for workflow builder
    ├── css/
    └── js/
```

### Git Tracking

**Committed Files**:
- `public/downloads/README.md` - Documentation
- `public/downloads/manifest.json` - Version tracking

**Ignored Files** (`.gitignore`):
- `public/downloads/*.zip` - Built artifacts
- `build/` - Temporary build directory
- `.build-temp/` - Script temporary files

## Build Verification

### Automated Checks

The build scripts automatically verify:

1. **Zip Integrity**: Files can be uncompressed without errors
2. **Checksums**: SHA256 hashes match manifest
3. **File Size**: Reasonable size for web downloads

### Manual Verification

```bash
# 1. Build downloads
npm run build:downloads

# 2. Verify zip integrity
cd public/downloads
unzip -t chrome-extension.zip
unzip -t workflow-builder.zip

# 3. Verify checksums match manifest
sha256sum *.zip
cat manifest.json | grep checksum

# 4. Test extraction
mkdir -p /tmp/test-extract
cd /tmp/test-extract
unzip /path/to/chrome-extension.zip
# Verify all files present

# 5. Test Chrome extension in browser
# - Open chrome://extensions/
# - Enable Developer mode
# - Click "Load unpacked"
# - Select extracted chrome-extension directory
```

### Download Accessibility

Test that downloads are accessible via HTTP:

```bash
# Start the server
npm start

# In another terminal, test download endpoints
curl -I http://localhost:3000/downloads/chrome-extension.zip
curl -I http://localhost:3000/downloads/workflow-builder.zip
curl http://localhost:3000/downloads/manifest.json
```

Expected response:
```
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Length: 74766
...
```

## CI/CD Integration

### GitHub Actions Workflow

The build process integrates with CI/CD:

```yaml
# Suggested workflow step
- name: Build Downloads
  run: |
    npm run build
    npm run build:downloads
    
- name: Verify Build
  run: |
    # Check files exist
    test -f public/downloads/chrome-extension.zip
    test -f public/downloads/workflow-builder.zip
    test -f public/downloads/manifest.json
    
    # Verify zip integrity
    unzip -t public/downloads/chrome-extension.zip
    unzip -t public/downloads/workflow-builder.zip

- name: Upload Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: downloads
    path: public/downloads/
```

### Deployment

**Railway Deployment**:
- Builds automatically run via `npm run build`
- Downloads built in deployment step: `npm run build:downloads`
- Static files served from `public/` directory

**Docker Deployment**:
```dockerfile
# In Dockerfile
RUN npm run build && npm run build:downloads

# Ensure downloads are included
COPY public/downloads /app/public/downloads
```

### Release Process

1. **Version Bump**: Update `package.json` version
2. **Build Downloads**: `npm run build:downloads`
3. **Commit Manifest**: `git add public/downloads/manifest.json`
4. **Tag Release**: `git tag v1.0.0`
5. **Push**: `git push && git push --tags`
6. **Deploy**: CI/CD handles deployment

## Build Dependencies

### Required System Tools

- **Node.js**: ≥18.0.0
- **npm**: Package manager
- **zip**: Archive utility (for compression)
- **sha256sum**: Checksum calculation (usually pre-installed)

### NPM Dependencies

- **TypeScript**: Source compilation
- **ts-node**: Development runtime

## Troubleshooting

### Build Failures

**Issue**: `zip` command not found

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install zip

# macOS
brew install zip

# Fallback: Scripts will copy files without compression
```

**Issue**: Permission denied on scripts

**Solution**:
```bash
chmod +x scripts/build-downloads.js
chmod +x scripts/generate-manifest.js
```

**Issue**: Checksums don't match

**Solution**:
```bash
# Regenerate manifest
npm run generate:manifest

# Rebuild downloads
rm public/downloads/*.zip
npm run build:downloads
```

### Verification Failures

**Issue**: Zip files corrupted

**Solution**:
```bash
# Clean and rebuild
rm -rf public/downloads/*.zip .build-temp/
npm run build:downloads
```

**Issue**: Files not accessible via HTTP

**Solution**:
```bash
# Check Express is serving public/ directory
# Verify in src/index.ts:
# app.use(express.static(join(__dirname, '..', 'public')));

# Restart server
npm start
```

## Performance Considerations

### Build Times

- **TypeScript Build**: ~5-10 seconds
- **Downloads Build**: ~2-3 seconds
- **Total**: ~10-15 seconds

### File Sizes

- **Chrome Extension**: ~73 KB (compressed)
- **Workflow Builder**: ~21 KB (compressed)
- **Total Downloads**: ~94 KB

### Optimization

- Zip files use maximum compression
- Exclude unnecessary files (node_modules, .git)
- Minimize included assets

## Security

### Checksum Verification

All downloads include SHA256 checksums in `manifest.json`:

```json
{
  "downloads": [
    {
      "name": "chrome-extension.zip",
      "checksum": "f77948a8ec4083d2..."
    }
  ]
}
```

Users can verify:
```bash
sha256sum chrome-extension.zip
# Compare with manifest.json
```

### Build Reproducibility

- Same source → Same checksums
- Deterministic build process
- Version-locked dependencies

## Future Improvements

- [ ] Add digital signatures for downloads
- [ ] Implement build caching
- [ ] Add download analytics
- [ ] Create automated release notes
- [ ] Support multiple version downloads
- [ ] Add browser extension auto-update manifest
- [ ] Implement download rate limiting

## References

- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [Chrome Extension Distribution](https://developer.chrome.com/docs/extensions/mv3/hosting/)
- [SHA256 Checksums](https://en.wikipedia.org/wiki/SHA-2)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: 2025-11-23  
**Maintainer**: Workstation Development Team
