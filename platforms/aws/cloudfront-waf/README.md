# CloudFront-Based Architectures (CloudFront + AWS WAF + Lambda@Edge)

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

[Example Lambda@Edge Function](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/blob/SKYK-930-aws-integration/platforms/aws/cloudfront-waf/lambda%40edge/index.mjs) for Skyfire Token Verification

Note: This example uses a Viewer Request event so token validation happens before cache evaluation.

If your environment requires advanced security (bot mitigation, IP filtering, rate limiting, geo-restrictions), you can layer AWS WAF on top of your CloudFront + Lambda@Edge architecture.

## ​​AWS WAF Overview
AWS WAF is a web application firewall that lets you inspect the inbound HTTP and HTTPS traffic that are forwarded to your protected web application resources using:
- IP rules
- String/regex matching
- Rate-limit rules
- Managed rule groups
- Bot Control (Bot Manager)
- CAPTCHA / Challenge actions

For each rule one can choose to:
- Allow
- Block
- Count
- Run CAPTCHA
- Run Challenge
AWS WAF lets you control access to your content. Based on conditions that you specify, such as the IP addresses that requests originate from or the values of query strings, your protected resource responds to requests either with the requested content, with an HTTP 403 status code (Forbidden), or with a custom response.

Note: When using AWS WAF, WAF evaluates the request before your Viewer Request Lambda@Edge executes.

#### Bot Classification Requirement

The client needs to classify bots into 3 categories:

1. Allowed Bots (no Skyfire token required)
Examples:
- Googlebot
- Bingbot
These should bypass Skyfire logic if verified as good bots.

2. Bots with Skyfire Token
- Acceptable: These must present a valid Skyfire token. If a token is missing or invalid, then block.
- Non-acceptable: Even if a Skyfire token is present, these should not override other WAF security rules.

Examples:
- AI scrapers
- Automated crawlers

3. Unidentified bots (which don’t present Skyfire token)

#### Important Requirement

"Bot classification should not prevent the Skyfire token verification rule from running.
 Bot logic + Skyfire token logic must both be considered before allowing access."

This typically requires:
- Correct priority ordering of WAF rules
- Using WAF labels or rule groups
- Ensuring Skyfire-related logic happens after bot evaluation
- Ensuring Lambda@Edge logic still fires for acceptable bot types

Note: WAF rules can be reordered to meet business logic requirements.

#### Deployment Steps
1. Create a CloudFront Distribution
Configure your origin, cache policy, and any required behaviors based on your application architecture.

2. Create a Lambda@Edge Function
Lambda@Edge functions must be created in the N. Virginia (us-east-1) region. 
CloudFront's control plane is hosted exclusively in this region, and all edge function replication begins from here. More details [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-how-it-works-tutorial.html).

3. Configure Web ACL security on CloudFront Distribution