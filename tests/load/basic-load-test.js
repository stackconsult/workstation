/**
 * K6 Load Test - Basic API Endpoints
 * Tests core API endpoints under load
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 50 }, // Ramp up to 50 users
    { duration: "2m", target: 50 }, // Stay at 50 users
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Error rate should be below 1%
    errors: ["rate<0.1"], // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/health/live`);
  check(healthRes, {
    "health check status is 200": (r) => r.status === 200,
    "health check response time < 200ms": (r) => r.timings.duration < 200,
  });
  responseTime.add(healthRes.timings.duration);
  errorRate.add(healthRes.status !== 200);

  sleep(1);

  // Test metrics endpoint
  const metricsRes = http.get(`${BASE_URL}/api/metrics/dashboard`);
  check(metricsRes, {
    "metrics status is 200": (r) => r.status === 200,
    "metrics response has data": (r) => r.body.length > 0,
  });
  responseTime.add(metricsRes.timings.duration);
  errorRate.add(metricsRes.status !== 200);

  sleep(1);

  // Test agents endpoint
  const agentsRes = http.get(`${BASE_URL}/api/agents`);
  check(agentsRes, {
    "agents status is 200": (r) => r.status === 200,
    "agents response is JSON": (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
  responseTime.add(agentsRes.timings.duration);
  errorRate.add(agentsRes.status !== 200);

  sleep(1);

  // Test workflows endpoint
  const workflowsRes = http.get(`${BASE_URL}/api/workflows`);
  check(workflowsRes, {
    "workflows status is 200": (r) => r.status === 200,
  });
  responseTime.add(workflowsRes.timings.duration);
  errorRate.add(workflowsRes.status !== 200);

  sleep(2);
}

export function handleSummary(data) {
  return {
    "tests/load/summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || "";

  let summary = `
${indent}Load Test Summary
${indent}================

${indent}Scenarios:
${indent}  - Duration: ${data.state.testRunDurationMs / 1000}s
${indent}  - VUs: ${data.metrics.vus.values.max} max

${indent}Requests:
${indent}  - Total: ${data.metrics.http_reqs.values.count}
${indent}  - Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}  - Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

${indent}Response Times:
${indent}  - Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
${indent}  - Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  - Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}  - p95: ${data.metrics.http_req_duration.values["p(95)"].toFixed(2)}ms
${indent}  - p99: ${data.metrics.http_req_duration.values["p(99)"].toFixed(2)}ms

${indent}Checks:
${indent}  - Passed: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%
`;

  return summary;
}
