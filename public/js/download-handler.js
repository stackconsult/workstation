/**
 * Download Handler for stackBrowserAgent packages
 * Provides reusable download functionality for dashboard and workflow builder
 */

class DownloadHandler {
  constructor() {
    this.manifestUrl = '/downloads/manifest.json';
    this.manifest = null;
  }

  /**
   * Fetch and cache the downloads manifest
   */
  async fetchManifest() {
    try {
      const response = await fetch(this.manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }
      this.manifest = await response.json();
      return this.manifest;
    } catch (error) {
      console.error('Error fetching manifest:', error);
      throw error;
    }
  }

  /**
   * Format file size in human-readable format
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Initialize download UI for a package
   */
  async initializeDownloadUI(packageKey, options = {}) {
    const {
      versionElementId,
      sizeElementId,
      buttonElementId,
      statusElementId
    } = options;

    try {
      if (!this.manifest) {
        await this.fetchManifest();
      }

      const pkg = this.manifest.packages[packageKey];
      
      if (!pkg) {
        throw new Error(`Package ${packageKey} not found in manifest`);
      }

      // Update version display
      if (versionElementId) {
        const versionEl = document.getElementById(versionElementId);
        if (versionEl) {
          versionEl.textContent = `Version: ${this.manifest.version}`;
        }
      }

      // Update size display
      if (sizeElementId) {
        const sizeEl = document.getElementById(sizeElementId);
        if (sizeEl) {
          sizeEl.textContent = `Size: ${this.formatSize(pkg.size)}`;
        }
      }

      // Setup download button
      if (buttonElementId) {
        const button = document.getElementById(buttonElementId);
        if (button) {
          if (pkg.available) {
            button.textContent = `⬇️ Download ${pkg.filename}`;
            button.disabled = false;
            button.onclick = () => this.downloadPackage(packageKey, statusElementId);
          } else {
            button.textContent = '⚠️ Not Available';
            button.disabled = true;
            
            if (statusElementId) {
              const statusEl = document.getElementById(statusElementId);
              if (statusEl) {
                // Safely construct the status message without using innerHTML
                statusEl.textContent = '';
                const span = document.createElement('span');
                span.style.color = '#ffc107';
                span.appendChild(document.createTextNode('⚠️ Package not built. Run: '));
                const code = document.createElement('code');
                code.textContent = this.manifest.buildCommands[packageKey];
                span.appendChild(code);
                statusEl.appendChild(span);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error initializing download UI for ${packageKey}:`, error);
      
      // Show error in button
      if (buttonElementId) {
        const button = document.getElementById(buttonElementId);
        if (button) {
          button.textContent = '❌ Error';
          button.disabled = true;
        }
      }

      // Show error in status
      if (statusElementId) {
        const statusEl = document.getElementById(statusElementId);
        if (statusEl) {
          const span = document.createElement('span');
          span.style.color = '#dc3545';
          span.textContent = `❌ ${error.message}`;
          statusEl.textContent = '';
          statusEl.appendChild(span);
        }
      }
    }
  }

  /**
   * Download a package
   */
  async downloadPackage(packageKey, statusElementId) {
    const statusEl = statusElementId ? document.getElementById(statusElementId) : null;

    try {
      if (!this.manifest) {
        await this.fetchManifest();
      }

      const pkg = this.manifest.packages[packageKey];
      
      if (!pkg || !pkg.available) {
        throw new Error('Package not available for download');
      }

      // Show loading status
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #17a2b8;">⏳ Preparing download...</span>';
      }

      // Trigger download without adding element to DOM
      const link = document.createElement('a');
      link.href = pkg.downloadUrl;
      link.download = pkg.filename;
      link.style.display = 'none';
      link.click();

      // Show success status
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #28a745;">✅ Download started!</span>';
        
        // Clear status after 3 seconds
        setTimeout(() => {
          statusEl.innerHTML = '';
        }, 3000);
      }

    } catch (error) {
      console.error(`Error downloading ${packageKey}:`, error);
      
      if (statusEl) {
        statusEl.style.color = "#dc3545";
        statusEl.textContent = `❌ Download failed: ${error.message}`;
      }
    }
  }

  /**
   * Initialize all downloads on the page
   * Automatically detects standard element IDs
   */
  async initializeAll() {
    await Promise.allSettled([
      this.initializeDownloadUI('chromeExtension', {
        versionElementId: 'chrome-ext-version',
        sizeElementId: 'chrome-ext-size',
        buttonElementId: 'download-chrome-btn',
        statusElementId: 'chrome-download-status'
      }),
      this.initializeDownloadUI('workflowBuilder', {
        versionElementId: 'workflow-version',
        sizeElementId: 'workflow-size',
        buttonElementId: 'download-workflow-btn',
        statusElementId: 'workflow-download-status'
      })
    ]);
  }
}

// Create global instance
window.downloadHandler = new DownloadHandler();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.downloadHandler.initializeAll().catch(console.error);
  });
} else {
  // DOM already loaded
  window.downloadHandler.initializeAll().catch(console.error);
}
