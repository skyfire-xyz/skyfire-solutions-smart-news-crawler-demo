# Skyfire Solutions Crawler Bot Protection Proxy

A Node.js/Express proxy service with bot protection and Redis-based usage tracking.

## Features Overview

- **Bot Identification** - Identifies bot requests via `x-isbot: true` header, human requests bypass token verification
- **Kya+Pay Token Verification** - Validates `skyfire-pay-id` JWT tokens with signature verification and seller service association
- **Usage Tracking & Charging** - Redis-based session management with incremental charging and batch processing
- **Request Proxying** - Forwards valid requests to target website
- **Session Expiration** - Automatic cleanup with final charging on expiry

## Live Demo Link

You can play with the live demo [here](https://real-estate-list-scraping-demo.skyfire.xyz/).

## 💳 How Proxy Charges Token

The proxy operates in a multi-step process to protect against unauthorized bot access while allowing legitimate traffic:

```mermaid
sequenceDiagram
    participant BC as Bot Client
    participant BBS as Bot Blocker Service
    participant RQ as Redis + Queue
    participant PW as Protected Website

    Note over BC, PW: High-Level Bot Blocker Flow

    BC->>BBS: Request (with/without token)

    alt No token
        BBS-->>BC: 402 Payment Required
    else Token present
        BBS->>BBS: Validate token (signature, expiry)

        alt Token invalid
            BBS-->>BC: 401 Invalid Token
        else Token valid
            BBS->>BBS: Initial charge for request (e.g. $0.0001)
            BBS->>PW: Forward request
            PW-->>BBS: Website content
            BBS-->>BC: Return content

            BBS->>RQ: Track request (increment count, accumulate charges, update timestamp)
            RQ->>RQ: Check thresholds, session expiry & remaining balance

            alt Remaining insufficient for request (Remaining < per use + accumulated charges)
                RQ-->>BBS: 402 Payment Required (Low Balance)
                BBS->>BBS: Process accumulated charges
            else Batch threshold reached (e.g. $0.001 == accumulated charges)
                RQ-->>BBS: Trigger batch processing
                BBS->>BBS: Process accumulated charges
            else Max request limit exceeded
                RQ-->>BBS: 402 Payment Required
            else Session expired (user inactive)
                BBS->>BBS: Process accumulated charges & cleanup session
            else Within limits
                RQ-->>BBS: Continue (tracking updated)
            end
        end
    end
```

### Step 0: Bot Identification

- Checks for the `x-isbot: true` header to identify bot requests
- Human requests (without the header) bypass token verification and usage tracking
- Bot requests proceed to the next steps

### Step 1: Kya+Pay Token Verification

- Validates the `skyfire-pay-id` JWT token in the request header
- Verifies token signature, issuer, audience, and expiration
- Ensures the token is associated with the correct seller service
- Returns 401 Unauthorized for invalid or missing tokens

### Step 2: Usage Tracking & Charging

- **Session Management**: Creates Redis-based sessions for each token
- **Initial Charge**: Charges the token for the first request in a session (In order to get the current balance of the token)
- **Batch Processing**: Accumulates charges and processes them in batches once it hits threshold (configured via `BATCH_AMOUNT_THRESHOLD` default 0.1)
- **Threshold Monitoring**: Tracks remaining balance and maximum request limits
- **Payment Required**: Returns 402 Payment Required when:
  - Insufficient balance for next request
  - Maximum request count reached
  - Token charging fails

### Step 3: Request Proxying

- Forwards valid requests to the target website (configured via `PROXY_TARGET`)

### Step 4: Session Expiration

- **Automatic Cleanup**: Sessions are automatically cleaned up after the configured expiry time (default: 300 seconds)
- **Background Monitoring**: A session expiry monitor runs every 30 seconds to remove expired sessions
- **Final Charging**: Any accumulated charges are automatically charged when sessions expire

## 📋 Prerequisites

1. Approved Seller Service with Seller Skyfire API Key
   In order to charge tokens, you will need to create a seller service and get it approved.
   Please follow the Skyfire Platform Setup Guide to create a seller account and seller service.

2. Docker Environment

## 🏠 Local Installation

### 1. Install Dependencies

```bash
   yarn install
```

### 2. Configure Environment

Copy .env.example to .env

```
# Configs
PORT=4000
REDIS_HOST=localhost
REDIS_PORT=6379

# Proxy URL
PROXY_TARGET=<your_website> or use our real estate demo website https://demo-real-estate-prv4.onrender.com/

# API
SKYFIRE_API_URL="https://api.skyfire.xyz"

## Seller Service Information
JWT_ISSUER=https://app.skyfire.xyz
SKYFIRE_SELLER_API_KEY=<your_seller_agent_api_key>
SELLER_SERVICE_AGENT_ID=<your_seller_agent_id>
SELLER_SERVICE_ID=<your_seller_service_id>
```

### 3. Start Services

```bash
docker-compose up
```

This starts both Redis and the application with hot reloading enabled.

## 🧪 How to test request

Create a buyer token by create-token script.

```
yarn create-token <your_buyer_token_api_key>
```

If successful, this will create a JWT token and gives you the curl command that you can use right away

```
curl -IH "x-isbot: true" -H "skyfire-pay-id: <your_newly_created_JWT_token>" http://localhost:4000/
```
