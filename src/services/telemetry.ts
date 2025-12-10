/**
 * OpenTelemetry Telemetry Service
 * Auto-instrumentation for observability and monitoring
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { logger } from "../utils/logger";

// Prometheus exporter configuration
const prometheusExporter = new PrometheusExporter(
  {
    port: parseInt(process.env.PROMETHEUS_PORT || "9464"),
    endpoint: "/metrics",
  },
  () => {
    logger.info(
      `Prometheus metrics available at http://localhost:${process.env.PROMETHEUS_PORT || "9464"}/metrics`,
    );
  },
);

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable specific instrumentations
      "@opentelemetry/instrumentation-http": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-pg": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-redis": {
        enabled: true,
      },
      // Disable noisy instrumentations
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-dns": {
        enabled: false,
      },
    }),
  ],
});

/**
 * Initialize telemetry
 * Call this before importing any instrumented modules
 */
export function initializeTelemetry(): void {
  if (process.env.TELEMETRY_ENABLED === "false") {
    logger.info("Telemetry disabled");
    return;
  }

  try {
    sdk.start();
    logger.info("OpenTelemetry auto-instrumentation started", {
      serviceName: process.env.SERVICE_NAME || "workstation-browser-agent",
      environment: process.env.NODE_ENV || "development",
      prometheusPort: process.env.PROMETHEUS_PORT || "9464",
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => logger.info("OpenTelemetry SDK shut down successfully"))
        .catch((error) =>
          logger.error("Error shutting down OpenTelemetry SDK", { error }),
        );
    });
  } catch (error) {
    logger.error("Failed to initialize OpenTelemetry", { error });
  }
}

/**
 * Shutdown telemetry
 */
export async function shutdownTelemetry(): Promise<void> {
  try {
    await sdk.shutdown();
    logger.info("Telemetry shut down");
  } catch (error) {
    logger.error("Error shutting down telemetry", { error });
  }
}

// Export SDK for advanced usage
export { sdk };
