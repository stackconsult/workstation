/**
 * K6 Load Test - Spike Test
 * Tests system recovery from sudden traffic spikes
 */

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // Normal load
    { duration: "10s", target: 100 }, // Sudden spike
    { duration: "30s", target: 100 }, // Sustained spike
    { duration: "10s", target: 10 }, // Recovery
    { duration: "30s", target: 10 }, // Normal load
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/metrics/dashboard`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(1);
}
