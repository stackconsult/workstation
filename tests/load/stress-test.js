/**
 * K6 Load Test - Stress Test
 * Tests system behavior under extreme load
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 100 }, // Ramp up to 100 users
    { duration: "3m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 300 }, // Spike to 300 users
    { duration: "3m", target: 300 }, // Stay at 300 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(99)<2000"], // 99% under 2s
    http_req_failed: ["rate<0.05"], // Error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const endpoints = [
    "/health/live",
    "/health/ready",
    "/api/metrics/dashboard",
    "/api/agents",
    "/api/workflows",
  ];

  // Random endpoint selection
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  check(res, {
    "status is 200 or 503": (r) => r.status === 200 || r.status === 503,
  });

  errorRate.add(res.status !== 200 && res.status !== 503);

  sleep(Math.random() * 3); // Random sleep 0-3s
}
