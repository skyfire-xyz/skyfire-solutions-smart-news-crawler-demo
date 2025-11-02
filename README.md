# Smart News Crawler Demo - News and Content given End-User Identity

In this reference implementation, we’ll demonstrate how you can use `kya` tokens to gate agentic and bot access to your websites and APIs. Content publishers can require agentic platforms and bots to submit verified `kya` tokens that deliver the identity of the human end-user. Content publishers no longer need to be disintermediated from their human end-users.

### The Problem: Crawling Protected Content

Publishers typically want their content to be accessed by human end-users because they aim to either generate ad impressions and/or sell the human end-users on paid subscriptions. They therefore set their bot managers to block web crawlers, bots and agents from accessing their websites unless these bots and agents deliver the identity of their human end-user.

### The Solution: Skyfire’s KYA Token

Skyfire enables agents and bots to deliver an **identity token**, also known as a `kya` token, to websites and APIs. This token contains the identity of the human principal or business entity on whose behalf the agent is acting. It enables crawlers, bots and agents access protected content in a secure, auditable, and automated way. Here’s how it works:

- **Identity Verification:** The human principal or business entity behind the crawler, agent or bot verifies their identity with a trusted Identity Token Issuer like Skyfire
- **Token Generation:** The crawler, agent or bot, requests a KYA token using Skyfire’s API
- **Token Submission:** The crawler includes the token in the HTTP headers of its requests to the protected website.
- **Verification and Enforcement:** The protected website verifies the token and tracks usage, ensuring that only authorized crawlers can access the data.

### Live Demo Link

You can play with the live demo [here](https://news-crawler-demo.skyfire.xyz/).

Here is a [video link](https://youtu.be/onkJ1LlS7q8) for the running crawler demo

### Flow

Here is a diagram explaining the flow:
![Flow Diagram](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/blob/main/static/images/crawler_flow.png?raw=true)


### Pre-requisites

To run this demo,

- Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create Skyfire API key, complete Buyer and Seller Onboarding.

### Contents:

The demo consists of four integrated projects that work together to demonstrate how content owners can control access to their valuable data while providing legitimate crawlers with authorized access.

1. Crawler Agent FE:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/crawler-agent-fe](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/tree/main/crawler-agent-fe)
- Purpose: Interactive frontend that demonstrates the difference between authorized and unauthorized crawling
- Features:
  - Skyfire token management interface
  - Demonstrates successful requests (with valid identification tokens)
- Technology: Next.js frontend with intuitive UI

2. Crawler Agent Core:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/crawler-agent-core](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/tree/main/crawler-agent-core)
- Purpose: Backend service that performs the actual crawling operations
- Features:
  - Executes crawl requests with and without identification tokens
  - Integrates with Bot Protect Proxy for access control
  - Handles token validation and request processing
  - Provides API endpoints for the frontend
  - Manages crawl job queuing and execution
- Technology: Node.js/Express with crawler logic

3. Bot Protection Proxy:

- Available at: [https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/crawler-bot-protection-proxy](https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo/tree/main/crawler-bot-protection-proxy)
- Purpose: Acts as the protective barrier and identification processor
- Features:
  - Kya Token Verification - Validates `skyfire-pay-id` KYA tokens from Skyfire
  - Access Logging - Logs all authenticated bot requests for audit and monitoring
  - Request Proxying - Forwards valid requests to target website
- Technology: Node.js/Express (docker)

4. Protected Website:

- Available at: [https://demo-mock-news.onrender.com](https://demo-mock-news.onrender.com)
- Purpose: Simulates valuable content that requires identification from crawler bots.

### Installation Steps

1.  Clone the repository:
    ```bash
    git clone https://github.com/skyfire-xyz/skyfire-solutions-smart-news-crawler-demo.git
    ```
2.  Follow installation instructions in each sub-directory

### Note:

Take a look at the live demo [here](https://news-crawler-demo.skyfire.xyz/).
