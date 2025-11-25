# CloudFront-Based Architectures (CloudFront + Lambda@Edge)

## CloudFront Overview
Amazon CloudFront is AWS’s global content delivery network (CDN). It accelerates delivery of web assets (static and dynamic content, APIs, media) by caching content at globally distributed edge locations. Requests are served from the nearest edge location, reducing latency and improving performance.
CloudFront integrates seamlessly with multiple AWS services and can be extended using edge compute (Lambda@Edge).

## CloudFront + Lambda@Edge

You can attach Lambda@Edge functions to CloudFront to run custom logic at the edge before requests reach your origin. Lambda@Edge enables token validation, request transformation, bot checks, security filtering, and more - all close to your users.
CloudFront Events Supported by Lambda@Edge
Lambda@Edge functions can be invoked during four event phases:
- Viewer Request: Triggered when CloudFront receives a request from a viewer before checking the cache.
- Origin Request: Triggered when CloudFront forwards a request to the origin (executes only on cache misses).
- Origin Response: Triggered after CloudFront receives a response from the origin, but before caching it.
- Viewer Response: Triggered before CloudFront returns the response to the viewer (cache hit or miss).

A CloudFront distribution can attach one Lambda function per event type.

If your environment requires advanced security (bot mitigation, IP filtering, rate limiting, geo-restrictions), you can layer AWS WAF on top of your CloudFront + Lambda@Edge architecture - refer [here](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/tree/SKYK-930-aws-integration/platforms/aws/cloudfront-waf).

#### Deployment Steps
1. Create a CloudFront Distribution
Configure your origin, cache policy, and any required behaviors based on your application architecture.

2. Create a Lambda@Edge Function
Lambda@Edge functions must be created in the us-east-1 region. 
CloudFront's control plane is hosted exclusively in this region, and all edge function replication begins from here. More details here.

3. [Sample Lambda@Edge Function](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/blob/SKYK-930-aws-integration/platforms/aws/cloudfront/lambda%40edge/index.mjs) for Skyfire Token Verification

Note: This sample uses a Viewer Request event so token validation happens before cache evaluation.

#### Flow Summary (High-Level)

- Viewer sends request.
- CloudFront receives request → triggers Viewer Request Lambda@Edge.
- Lambda verifies the token (if present).
    - If valid → request continues (may be served from cache or origin).
    - If invalid → return error response.