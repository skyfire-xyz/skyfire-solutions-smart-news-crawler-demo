# Crawler Agent Core

This is an Express application with crawling logic for web crawler

### Pre-requisites

1. Approved Seller Service with Seller Skyfire API Key:
- Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create a seller account and seller service.

2. Pusher Credentials:
- Create a Pusher Account and App:
      - Go to the Pusher website and create a new account or sign in to your existing one. 
      - Navigate to the Pusher Channels dashboard and create a new app. 
      - Give your app a name and select a cluster (region) closest to your users to minimize latency. 
- Get Your Pusher Credentials:
      - After creating the app, find and click on it in the dashboard. 
      - Go to the "App Keys" tab to find your app_id, key, secret, and cluster. 
      - Store these credentials securely, as they will be needed to configure your application. 

### Installation Steps

If you would like to run this app locally -

1. Install dependencies

   ```
   npm install
   ```

2. Create a .env file in the root of the project folder with the following environment variables set to your information:

   ```
   PORT=8080
   PUSHER_KEY=<your_pusher_key>
   PUSHER_APP_ID=<your_pusher_app_id>
   PUSHER_SECRET=<your_pusher_secret>
   PUSHER_CLUSTER=<your_pusher_cluster>
   PUSHER_USE_TLS=true
   BUYER_TAG=crawl-demo-au3ctqolmc5
   SELLER_SERVICE_ID=<your_skyfire_seller_service_id>
   SKYFIRE_API_KEY=<your_skyfire_api_key>
   SKYFIRE_API_BASE_URL=https://api.skyfire.xyz
   ```

3. Build the code to generate equivalent JavaScript files from TypeScript files. This should create a dist folder in your root directory

   ```
   npm run build
   ```

4. Run the server
   ```
   npm run start
   ```

### skyfireKyaPayTokenHook with CheerioCrawler

To make token-based authentication and bot identification reusable and easy to integrate, Skyfire provides a utility called `skyfireKyaPayTokenHook`. This hook is designed to be used with Crawlee's `CheerioCrawler` and ensures that every outgoing request includes the necessary Skyfire KYA+PAY token and a bot identifier header by injecting in `preNavigationHooks` hooks before each navigation.

**Source code (controllers/skyfireKyaPayTokenHook.ts):**
```ts
export function skyfireKyaPayTokenHook(token: string) {
  return async (crawlingContext, gotOptions) => {
    crawlingContext.request.headers = {
      ...crawlingContext.request.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true"
    };
    gotOptions.headers = {
      ...gotOptions.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true"
    };
  };
}
```

The `x-isbot: true` header is used in this demo to help protected sites distinguish between human and automated traffic. In a real-world production environment, more sophisticated bot detection mechanisms would typically be employed.

#### Usage of the Hook with CheerioCrawler

```ts
import { CheerioCrawler } from 'crawlee';
import { skyfireKyaPayTokenHook } from './controllers/skyfireKyaPayTokenHook';

const token = 'YOUR_KYA_PAY_TOKEN';

const crawler = new CheerioCrawler({
  preNavigationHooks: [skyfireKyaPayTokenHook(token)],
    // ...other options
});
```