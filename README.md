# Smart Web Crawler Demo

In this demo, we’ll explore how Skyfire enables seamless, token-based payments for crawling protected websites, and how its batch-based charging model benefits both data providers and consumers.

### The Problem: Crawling Protected Content

Traditional web crawlers often hit a wall when they encounter protected content. Website owners want to monetize their data, while authorized crawlers need a way to pay for access.

### The Solution: Skyfire’s KYA+PAY Token

Skyfire introduces a **token-based payment system** that allows crawlers to access protected content in a secure, auditable, and automated way. Here’s how it works:

- **Token Generation:** The crawler agent requests a KYA+PAY token from Skyfire’s API, specifying the amount of access or data required.
- **Token Submission:** The crawler includes the token in the HTTP headers of its requests to the protected website.
- **Batch-Based Charging:** Instead of charging for every single request, the protected website can **charge tokens in batches**—for example, after every 10 pages crawled, a single token deduction is made. This reduces transaction overhead and makes the process more efficient for both parties.
- **Verification and Enforcement:** The protected website verifies the token and tracks usage, ensuring that only authorized crawlers with sufficient balance can access the data.

### Live Demo Link

You can play with the live demo [here](https://crawler-demo.skyfire.xyz/).

Here is a [video link](https://youtu.be/onkJ1LlS7q8) for the running crawler demo

### Flow

Here is a diagram explaining the flow:
![Flow Diagram](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/blob/main/static/images/crawler_flow.png?raw=true)

### Pre-requisites

To run this demo,

- Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create Skyfire API key, complete Buyer and Seller Onboarding.

### Contents:

The demo consists of four integrated projects that work together to demonstrate how content owners can monetize their valuable data while providing legitimate crawlers with paid access.

1. Crawler Agent FE:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/crawler-agent-fe](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/tree/main/crawler-agent-fe)
- Purpose: Interactive frontend that demonstrates the difference between paid and unpaid crawling
- Features:
  - Skyfire token management interface
  - Demonstrates successful requests (with valid payment tokens)
- Technology: Next.js frontend with intuitive UI

2. Crawler Agent Core:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-crawler-service-demo/crawler-agent-core](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/tree/main/crawler-agent-core)
- Purpose: Backend service that performs the actual crawling operations
- Features:
  - Executes crawl requests with and without payment tokens
  - Integrates with Bot Protect Proxy for access control
  - Handles token validation and request processing
  - Provides API endpoints for the frontend
  - Manages crawl job queuing and execution
- Technology: Node.js/Express with crawler logic

3. Bot Protection Proxy:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/crawler-bot-protection-proxy](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/tree/main/crawler-bot-protection-proxy)
- Purpose: Acts as the protective barrier and payment processor
- Features:
  - Kya+Pay Token Verification - Validates `skyfire-pay-id` Kya+pay tokens from Skyfire
  - Usage Tracking & Charging - Redis-based session management with incremental charging and batch processing
  - Request Proxying - Forwards valid requests to target website
  - Session Expiration - Automatic cleanup with final charging on expiry
- Technology: Node.js/Express (docker) with Redis for session management

4. Protected Website:

- Available at: [https://demo-real-estate-prv4.onrender.com/](https://demo-real-estate-prv4.onrender.com/)
- Purpose: Simulates valuable content that requires paid access from crawler bots.

### Installation Steps

1.  Clone the repository:
    ```bash
    git clone https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo.git
    ```
2.  Follow installation instructions in each sub-directory

### Note:

Take a look at the live demo [here](https://crawler-demo.skyfire.xyz/).
