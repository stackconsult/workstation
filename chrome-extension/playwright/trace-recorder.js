/**
 * Trace Recording System
 * Capture execution traces for debugging and analysis
 */

export class TraceRecorder {
  constructor() {
    this.traces = [];
    this.currentTrace = null;
    this.isRecording = false;
    this.startTime = null;
    this.maxTraceSize = 1000; // Maximum events per trace
  }

  /**
   * Start recording a new trace
   * @param {Object} options - Recording options
   * @returns {string} Trace ID
   */
  startTrace(options = {}) {
    const {
      name = 'Unnamed Trace',
      metadata = {}
    } = options;

    this.currentTrace = {
      id: this.generateTraceId(),
      name,
      metadata,
      startTime: Date.now(),
      events: [],
      screenshots: [],
      errors: [],
      networkActivity: [],
      consoleMessages: [],
      status: 'recording'
    };

    this.isRecording = true;
    this.startTime = Date.now();

    console.log(`🎬 Started recording trace: ${this.currentTrace.id}`);

    return this.currentTrace.id;
  }

  /**
   * Stop recording current trace
   * @returns {Object} Completed trace
   */
  stopTrace() {
    if (!this.isRecording || !this.currentTrace) {
      throw new Error('No active trace to stop');
    }

    this.currentTrace.endTime = Date.now();
    this.currentTrace.duration = this.currentTrace.endTime - this.currentTrace.startTime;
    this.currentTrace.status = 'completed';
    this.isRecording = false;

    // Save to traces history
    this.traces.push(this.currentTrace);

    // Keep only recent traces
    if (this.traces.length > 10) {
      this.traces.shift();
    }

    const completedTrace = this.currentTrace;
    this.currentTrace = null;

    console.log(`⏹️ Stopped recording trace: ${completedTrace.id} (${completedTrace.duration}ms)`);

    return completedTrace;
  }

  /**
   * Record an event in the current trace
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  recordEvent(type, data = {}) {
    if (!this.isRecording || !this.currentTrace) {
      return;
    }

    const event = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      data,
      stackTrace: this.captureStackTrace()
    };

    this.currentTrace.events.push(event);

    // Prevent memory issues
    if (this.currentTrace.events.length > this.maxTraceSize) {
      this.currentTrace.events.shift();
    }
  }

  /**
   * Record a navigation event
   * @param {string} url - URL navigated to
   */
  recordNavigation(url) {
    this.recordEvent('navigation', {
      url,
      title: document.title,
      referrer: document.referrer
    });
  }

  /**
   * Record a click event
   * @param {Object} target - Click target information
   */
  recordClick(target) {
    this.recordEvent('click', {
      selector: target.selector,
      text: target.text,
      tagName: target.tagName,
      coordinates: target.coordinates
    });
  }

  /**
   * Record a type event
   * @param {Object} target - Type target information
   * @param {string} text - Text typed
   */
  recordType(target, text) {
    this.recordEvent('type', {
      selector: target.selector,
      text: text.length > 50 ? text.substring(0, 50) + '...' : text,
      textLength: text.length
    });
  }

  /**
   * Record a wait event
   * @param {string} reason - Reason for waiting
   * @param {number} duration - Wait duration in ms
   */
  recordWait(reason, duration) {
    this.recordEvent('wait', {
      reason,
      duration
    });
  }

  /**
   * Record an error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  recordError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    };

    this.recordEvent('error', errorData);

    if (this.currentTrace) {
      this.currentTrace.errors.push({
        timestamp: Date.now(),
        ...errorData
      });
    }
  }

  /**
   * Record a screenshot
   * @param {string} dataUrl - Screenshot data URL
   * @param {Object} metadata - Screenshot metadata
   */
  recordScreenshot(dataUrl, metadata = {}) {
    if (!this.isRecording || !this.currentTrace) {
      return;
    }

    this.currentTrace.screenshots.push({
      id: this.generateEventId(),
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      dataUrl,
      metadata
    });

    this.recordEvent('screenshot', {
      screenshotId: this.currentTrace.screenshots.length - 1,
      ...metadata
    });
  }

  /**
   * Record network activity
   * @param {string} type - Request or response
   * @param {Object} data - Network data
   */
  recordNetworkActivity(type, data) {
    if (!this.isRecording || !this.currentTrace) {
      return;
    }

    this.currentTrace.networkActivity.push({
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      ...data
    });

    this.recordEvent('network', {
      type,
      url: data.url,
      method: data.method,
      status: data.status
    });
  }

  /**
   * Record console message
   * @param {string} level - Console level (log, warn, error)
   * @param {Array} args - Console arguments
   */
  recordConsoleMessage(level, args) {
    if (!this.isRecording || !this.currentTrace) {
      return;
    }

    this.currentTrace.consoleMessages.push({
      id: this.generateEventId(),
      level,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      message: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch (e) {
          return String(arg);
        }
      }).join(' ')
    });
  }

  /**
   * Get current trace
   * @returns {Object|null} Current trace
   */
  getCurrentTrace() {
    return this.currentTrace;
  }

  /**
   * Get trace by ID
   * @param {string} traceId - Trace ID
   * @returns {Object|null} Trace
   */
  getTrace(traceId) {
    return this.traces.find(trace => trace.id === traceId) || null;
  }

  /**
   * Get all traces
   * @returns {Array} All traces
   */
  getAllTraces() {
    return this.traces;
  }

  /**
   * Export trace as JSON
   * @param {string} traceId - Trace ID
   * @returns {string} JSON string
   */
  exportTrace(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    return JSON.stringify(trace, null, 2);
  }

  /**
   * Import trace from JSON
   * @param {string} json - JSON string
   * @returns {Object} Imported trace
   */
  importTrace(json) {
    try {
      const trace = JSON.parse(json);
      this.traces.push(trace);
      return trace;
    } catch (error) {
      throw new Error(`Failed to import trace: ${error.message}`);
    }
  }

  /**
   * Generate trace summary
   * @param {string} traceId - Trace ID
   * @returns {Object} Trace summary
   */
  generateTraceSummary(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    const eventsByType = {};
    trace.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      id: trace.id,
      name: trace.name,
      duration: trace.duration,
      startTime: new Date(trace.startTime).toISOString(),
      endTime: trace.endTime ? new Date(trace.endTime).toISOString() : null,
      status: trace.status,
      totalEvents: trace.events.length,
      eventsByType,
      errorCount: trace.errors.length,
      screenshotCount: trace.screenshots.length,
      networkActivityCount: trace.networkActivity.length,
      consoleMessageCount: trace.consoleMessages.length
    };
  }

  /**
   * Analyze trace for issues
   * @param {string} traceId - Trace ID
   * @returns {Object} Analysis results
   */
  analyzeTrace(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    const issues = [];
    const warnings = [];
    const suggestions = [];

    // Check for errors
    if (trace.errors.length > 0) {
      issues.push({
        type: 'errors',
        count: trace.errors.length,
        message: `Trace contains ${trace.errors.length} error(s)`,
        details: trace.errors.map(e => e.message)
      });
    }

    // Check for slow operations
    const longWaits = trace.events.filter(e => 
      e.type === 'wait' && e.data.duration > 5000
    );
    if (longWaits.length > 0) {
      warnings.push({
        type: 'slow-operations',
        count: longWaits.length,
        message: `Found ${longWaits.length} operation(s) taking >5 seconds`
      });
    }

    // Check for failed network requests
    const failedRequests = trace.networkActivity.filter(activity =>
      activity.type === 'response' && activity.status >= 400
    );
    if (failedRequests.length > 0) {
      issues.push({
        type: 'network-failures',
        count: failedRequests.length,
        message: `${failedRequests.length} network request(s) failed`,
        details: failedRequests.map(r => ({ url: r.url, status: r.status }))
      });
    }

    // Check for console errors
    const consoleErrors = trace.consoleMessages.filter(m => m.level === 'error');
    if (consoleErrors.length > 0) {
      warnings.push({
        type: 'console-errors',
        count: consoleErrors.length,
        message: `${consoleErrors.length} console error(s) logged`
      });
    }

    // Suggest optimizations
    const clickEvents = trace.events.filter(e => e.type === 'click');
    if (clickEvents.length > 20) {
      suggestions.push({
        type: 'too-many-clicks',
        message: 'Consider combining multiple clicks into fewer actions'
      });
    }

    return {
      traceId,
      summary: this.generateTraceSummary(traceId),
      issues,
      warnings,
      suggestions,
      overallHealth: issues.length === 0 ? 'healthy' : 'unhealthy'
    };
  }

  /**
   * Clear all traces
   */
  clearTraces() {
    this.traces = [];
    console.log('🧹 All traces cleared');
  }

  /**
   * Generate trace ID
   * @returns {string} Trace ID
   */
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Capture stack trace
   * @returns {string} Stack trace
   */
  captureStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      const stack = e.stack.split('\n').slice(2, 5).join('\n');
      return stack;
    }
  }

  /**
   * Get recording status
   * @returns {boolean} Is recording
   */
  isRecordingActive() {
    return this.isRecording;
  }

  /**
   * Get trace statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalTraces: this.traces.length,
      currentlyRecording: this.isRecording,
      traces: this.traces.map(trace => this.generateTraceSummary(trace.id))
    };
  }
}
