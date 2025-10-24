# Crawler Agent FE

This is a Next.js application for a web crawler trying to scrape content from websites

### Live Demo Link

You can play with the live demo [here](https://crawler-demo.skyfire.xyz/).

Here is a video for the running crawler demo:
![Running Crawler Demo Video](https://youtu.be/onkJ1LlS7q8)

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
   yarn install
   ```

2. Create a .env file in the root of the project folder with the following environment variables set to your information:

   ```
   NEXT_PUBLIC_PUSHER_KEY=<your_pusher_key>
   NEXT_PUBLIC_PUSHER_CLUSTER=<your_pusher_cluster>
   NEXT_PUBLIC_SELLER_SERVICE_NAME=MockNews Website
   NEXT_PUBLIC_SERVICE_BASE_URL=<your_crawler_service_local_url>
   ```

3. Start the development server

   ```
   yarn dev
   ```

Your Next.js app should now be running on `http://localhost:3000`.
