export function skyfireKyaTokenHook(token: string) {
  return async (crawlingContext, gotOptions) => {
    console.log(`🔑 KYA Token Hook: Adding token to request`, {
      token: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
      url: crawlingContext.request.url,
      headers: {
        "skyfire-pay-id": token ?? "",
        "x-isbot": "true",
      },
    });

    crawlingContext.request.headers = {
      ...crawlingContext.request.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true",
    };
    gotOptions.headers = {
      ...gotOptions.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true",
    };
  };
}
