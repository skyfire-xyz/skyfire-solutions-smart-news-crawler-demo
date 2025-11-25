# CloudFront with Lambda@edge

You can attach Lambda@Edge functions to CloudFront to run custom logic at the edge before requests reach your origin. Lambda@Edge enables token validation, request transformation, bot checks, security filtering, and more - all close to your users.
CloudFront Events Supported by Lambda@Edge
Lambda@Edge functions can be invoked during four event phases:
- Viewer Request: Triggered when CloudFront receives a request from a viewer before checking the cache.
- Origin Request: Triggered when CloudFront forwards a request to the origin (executes only on cache misses).
- Origin Response: Triggered after CloudFront receives a response from the origin, but before caching it.
- Viewer Response: Triggered before CloudFront returns the response to the viewer (cache hit or miss).

A CloudFront distribution can attach one Lambda function per event type.

#### Deployment Steps
1. Create a CloudFront Distribution
Configure your origin, cache policy, and any required behaviors based on your application architecture.

2. Create a Lambda@Edge Function
Lambda@Edge functions must be created in the us-east-1 region. 
CloudFront's control plane is hosted exclusively in this region, and all edge function replication begins from here. More details here.

3. Example Lambda@Edge Function: Skyfire Token Verification

import { JwtVerifier } from "aws-jwt-verify";

// Create the verifier outside the Lambda handler (= during cold start),
// so the cache can be reused for subsequent invocations. Then, only during the
// first invocation, will the verifier actually need to fetch the JWKS.
const verifier = JwtVerifier.create({
    issuer: "https://app.skyfire.xyz", 
    audience: <SELLER_AGENT_ID>, 
    jwksUri: "https://app.skyfire.xyz/.well-known/jwks.json",
  });

export const handler = async (event) => {
  const { request } = event.Records[0].cf;
  if (request.headers["skyfire-pay-id"] && request.headers["skyfire-pay-id"][0].value) {
    const skyfireToken = request.headers["skyfire-pay-id"][0].value || null; 
    try {
      const payload = await verifier.verify(skyfireToken); 
      console.log("Token is valid!");
      return request; // allow request to proceed
    } catch {
      console.log("Token not valid!");
    }
  }
  return {
    status: "402",
    body: "Invalid/missing token received",
  };
};

This example uses a Viewer Request event so token validation happens before cache evaluation.

#### Flow Summary (High-Level)

- Viewer sends request.
- CloudFront receives request → triggers Viewer Request Lambda@Edge.
- Lambda verifies the token (if present).
    - If valid → request continues (may be served from cache or origin).
    - If invalid → return error response.