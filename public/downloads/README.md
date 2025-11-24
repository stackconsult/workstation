# Downloads Directory

This directory contains build artifacts for distribution via static serving.

## Available Downloads

### Chrome Extension (`chrome-extension.zip`)
- **Description**: Workstation AI Agent browser extension
- **Version**: See manifest.json for current version
- **Build Command**: `npm run build:downloads`
- **Install**: Download and load unpacked in Chrome extensions page

### Workflow Builder (`workflow-builder.zip`)
- **Description**: Standalone workflow builder application
- **Version**: See manifest.json for current version
- **Build Command**: `npm run build:downloads`
- **Install**: Extract and open workflow-builder.html in browser

## Download Manifest

The `manifest.json` file tracks all available downloads with metadata:
```json
{
  "generated": "ISO timestamp",
  "version": "package.json version",
  "downloads": [
    {
      "name": "chrome-extension.zip",
      "description": "...",
      "size": "bytes",
      "checksum": "sha256 hash"
    }
  ]
}
```

## API Access

Downloads are accessible via HTTP:
- Chrome Extension: `GET /downloads/chrome-extension.zip`
- Workflow Builder: `GET /downloads/workflow-builder.zip`
- Manifest: `GET /downloads/manifest.json`

## Build Process

1. **Build Source**: `npm run build` (TypeScript compilation)
2. **Build Downloads**: `npm run build:downloads` (Creates zips)
3. **Verify**: Check manifest.json for correct checksums

## File Integrity

All downloads include SHA256 checksums in manifest.json for verification:
```bash
# Verify chrome extension
sha256sum chrome-extension.zip
# Compare with manifest.json checksum
```

## Automated Builds

The build process is automated via CI/CD:
- Triggered on: Push to main, release tags
- Artifacts: Stored in this directory
- Verification: Checksums validated automatically

## Notes

- Zip files are excluded from git (see .gitignore)
- manifest.json is committed to track versions
- Downloads are served statically via Express
- Rate limiting applies to download endpoints
