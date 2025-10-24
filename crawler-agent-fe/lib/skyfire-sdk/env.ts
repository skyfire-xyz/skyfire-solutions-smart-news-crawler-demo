export const SKYFIRE_API_KEY = process.env.SKYFIRE_API_KEY
export const SKYFIRE_ENV = process.env.SKYFIRE_APP_ENV || "production"
export const SKYFIRE_ENDPOINT_URL =
  SKYFIRE_ENV === "production"
    ? "https://api.skyfire.xyz"
    : SKYFIRE_ENV === "sandbox"
    ? "https://api-qa.skyfire.xyz"
    : process.env.SKYFIRE_SDK_BASELINE_URL
export const SKYFIRE_SDK_BASELINE_URL = process.env.SKYFIRE_SDK_BASELINE_URL
