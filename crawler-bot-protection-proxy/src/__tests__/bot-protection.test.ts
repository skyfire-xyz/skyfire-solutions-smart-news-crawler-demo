import express from "express";
import identifyBot from "../middleware/identify-bot";
import verifyHeader from "../middleware/verify-header";
import usageTrack from "../middleware/usage-track";
import { connectRedis, disconnectRedis } from "../lib/redis";

const SKYFIRE_API_URL =
  process.env.SKYFIRE_API_URL || "https://api.skyfire.xyz";

// Mock the external dependencies
jest.mock("../services/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../lib/dd-agent", () => ({}));

describe("Bot Protection Integration Tests", () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Environment variables are loaded from .env.test via jest.setup.js

    // Connect to Redis for testing
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add middleware in the same order as the main app
    app.use(identifyBot);
    app.use(verifyHeader);
    app.use(usageTrack);

    // Add a test endpoint that will be reached if middleware passes
    app.get("/", (req, res) => {
      res.json({
        success: true,
        isBot: (req as any).isBot,
        hasToken: !!(req as any).skyfireToken,
      });
    });

    // Start server on a random port
    server = app.listen(0);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  const makeRequest = async (headers: Record<string, string> = {}) => {
    const port = (server.address() as any).port;
    const url = `http://localhost:${port}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    let body;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      body = (await response.json()) as any;
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text();
      body = text;
    }

    // Capture important headers
    const responseHeaders = {
      "X-Payment-Charged": response.headers.get("X-Payment-Charged"),
      "X-Payment-Session-Count": response.headers.get(
        "X-Payment-Session-Count"
      ),
      "X-Payment-Session-Accumulated-Amount": response.headers.get(
        "X-Payment-Session-Accumulated-Amount"
      ),
      "X-Payment-Session-Remaining-Balance": response.headers.get(
        "X-Payment-Session-Remaining-Balance"
      ),
      "X-Payment-Session-Batch-Threshold": response.headers.get(
        "X-Payment-Session-Batch-Threshold"
      ),
      "X-Payment-Session-Token-MNR": response.headers.get(
        "X-Payment-Session-Token-MNR"
      ),
      "X-Payment-Session-Expires-At": response.headers.get(
        "X-Payment-Session-Expires-At"
      ),
    };

    return { status: response.status, body, headers: responseHeaders };
  };

  describe("Token Creation and Validation", () => {
    test("should pass request without bot header", async () => {
      const response = await makeRequest({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject bot request without token", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
      });

      expect(response.status).toBe(402);
      expect(response.body.error).toBe(
        "Missing Kya+pay token `skyfire-pay-id`. Please create an account at https://app.skyfire.xyz and create a kya+pay token - https://docs.skyfire.xyz/reference/create-token."
      );
    });

    test("should reject bot request with invalid token", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": "invalid.token.here",
      });

      expect(response.status).toBe(401);
      // The middleware should return JSON error for invalid tokens
      expect(response.body.error).toBe("Your JWT token is invalid");
    });
  });

  describe("End-to-End Bot Protection Flow", () => {
    test("should handle complete bot protection flow with valid token", async () => {
      // First, create a token
      const tokenResponse = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens`, {
        method: "POST",
        headers: {
          "skyfire-api-key": process.env.SKYFIRE_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type: "pay",
          buyerTag: "",
          tokenAmount: "0.001",
          sellerServiceId: process.env.SELLER_SERVICE_ID,
          expiresAt: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
        }),
      });

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      const token = data.token;

      // Now test the bot protection with the created token
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": token,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isBot).toBe(true);
      expect(response.body.hasToken).toBe(true);
    }, 15000);
  });

  describe("Batch Charging Behavior with Shared Session", () => {
    let sharedToken: string;

    beforeAll(async () => {
      // Create a shared token for all tests in this describe block
      const tokenResponse = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens`, {
        method: "POST",
        headers: {
          "skyfire-api-key": process.env.SKYFIRE_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type: "pay",
          buyerTag: "",
          tokenAmount: "0.001",
          sellerServiceId: process.env.SELLER_SERVICE_ID,
          expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        }),
      });

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      sharedToken = data.token;
    });

    test("should get charged 0.0001 for the first request", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isBot).toBe(true);
      expect(response.body.hasToken).toBe(true);
    });

    test("should make another 9 successful requests", async () => {
      const responses = [];

      // Make exactly 9 requests (total 10 with the first one)
      for (let i = 0; i < 9; i++) {
        const response = await makeRequest({
          "x-isbot": "true",
          "skyfire-pay-id": sharedToken,
        });

        responses.push({
          requestNumber: i + 1,
          status: response.status,
          body: response.body,
          headers: response.headers,
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // All requests should succeed
      const successfulRequests = responses.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBe(9);
    }, 30000);

    test("should next request fail with 402", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the batch threshold header
      expect(response.status).toBe(402);
      expect(response.body.error).toContain("Payment Required");
      expect(response.headers["X-Payment-Session-Remaining-Balance"]).toBe("0");
      expect(response.headers["X-Payment-Session-Accumulated-Amount"]).toBe(
        "0"
      );
    }, 30000);
  });

  describe("Batch Threshold Tests with 0.0005 threshold", () => {
    let originalThreshold: string | undefined;
    let sharedToken: string;

    beforeAll(async () => {
      originalThreshold = process.env.BATCH_AMOUNT_THRESHOLD;
      process.env.BATCH_AMOUNT_THRESHOLD = "0.0005";

      // Create a shared token for all tests in this describe block
      const tokenResponse = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens`, {
        method: "POST",
        headers: {
          "skyfire-api-key": process.env.SKYFIRE_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type: "pay",
          buyerTag: "",
          tokenAmount: "0.001",
          sellerServiceId: process.env.SELLER_SERVICE_ID,
          expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        }),
      });

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      sharedToken = data.token;
    });

    afterAll(() => {
      if (originalThreshold !== undefined) {
        process.env.BATCH_AMOUNT_THRESHOLD = originalThreshold;
      } else {
        delete process.env.BATCH_AMOUNT_THRESHOLD;
      }
    });

    test("should work for first 5 requests", async () => {
      // Your test code

      const responses = [];

      // Make exactly 5 requests
      for (let i = 0; i < 5; i++) {
        const response = await makeRequest({
          "x-isbot": "true",
          "skyfire-pay-id": sharedToken,
        });

        responses.push({
          requestNumber: i + 1,
          status: response.status,
          body: response.body,
          headers: response.headers,
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(responses[0].headers["X-Payment-Session-Batch-Threshold"]).toBe(
        "0.0005"
      );

      // All requests should succeed
      const successfulRequests = responses.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBe(5);
    });

    test("should get charged 0.0005 on 6th request", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isBot).toBe(true);
      expect(response.body.hasToken).toBe(true);

      expect(response.headers["X-Payment-Charged"]).toBe("0.0005");
      expect(response.headers["X-Payment-Session-Accumulated-Amount"]).toBe(
        "0"
      );
    });

    test("should get 4 another successful requests", async () => {
      const responses = [];

      // Make exactly 4 requests
      for (let i = 0; i < 4; i++) {
        const response = await makeRequest({
          "x-isbot": "true",
          "skyfire-pay-id": sharedToken,
        });

        responses.push({
          requestNumber: i + 1,
          status: response.status,
          body: response.body,
          headers: response.headers,
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // All requests should succeed
      const successfulRequests = responses.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBe(4);
    });
  });

  describe("Maximum Request Count Tests MNR", () => {
    let originalThreshold: string | undefined;
    let sharedToken: string;

    beforeAll(async () => {
      originalThreshold = process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT;
      process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT = "5";

      // Create a shared token for all tests in this describe block
      const tokenResponse = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens`, {
        method: "POST",
        headers: {
          "skyfire-api-key": process.env.SKYFIRE_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type: "pay",
          buyerTag: "",
          tokenAmount: "0.001",
          sellerServiceId: process.env.SELLER_SERVICE_ID,
          expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        }),
      });

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      sharedToken = data.token;
    });

    afterAll(() => {
      if (originalThreshold !== undefined) {
        process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT = originalThreshold;
      } else {
        delete process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT;
      }
    });

    test("should work for first 5 requests", async () => {
      // Your test code

      const responses = [];

      // Make exactly 5 requests
      for (let i = 0; i < 5; i++) {
        const response = await makeRequest({
          "x-isbot": "true",
          "skyfire-pay-id": sharedToken,
        });

        responses.push({
          requestNumber: i + 1,
          status: response.status,
          body: response.body,
          headers: response.headers,
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(responses[0].headers["X-Payment-Session-Token-MNR"]).toBe("5");

      // All requests should succeed
      const successfulRequests = responses.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBe(5);
    });

    test("should fail on 6th request with 402", async () => {
      // Your test code
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });

      expect(response.status).toBe(402);
      expect(response.body.error).toContain("Payment Required");
      expect(response.headers["X-Payment-Charged"]).toBe("0.0004");
      expect(response.headers["X-Payment-Session-Count"]).toBe("5");
    });
  });
});
