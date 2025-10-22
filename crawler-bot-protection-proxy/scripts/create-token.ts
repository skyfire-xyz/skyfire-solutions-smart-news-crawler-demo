#!/usr/bin/env tsx

import dotenv from "dotenv";
import readline from "readline";

// Load environment variables from .env
dotenv.config({ path: ".env" });

interface TokenParams {
  tokenAmount: string;
  buyerTag?: string;
  sellerServiceId?: string;
  apiKey?: string;
  backendUrl?: string;
}

function parseCommandLineArgs(): Partial<TokenParams> {
  const args = process.argv.slice(2);
  const params: Partial<TokenParams> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--api-key":
      case "-k":
        if (nextArg && !nextArg.startsWith("-")) {
          params.apiKey = nextArg;
          i++; // Skip next argument
        }
        break;
      case "--amount":
      case "-a":
        if (nextArg && !nextArg.startsWith("-")) {
          params.tokenAmount = nextArg;
          i++; // Skip next argument
        }
        break;
      case "--buyer-tag":
      case "-b":
        if (nextArg && !nextArg.startsWith("-")) {
          params.buyerTag = nextArg;
          i++; // Skip next argument
        }
        break;
      case "--seller-id":
      case "-s":
        if (nextArg && !nextArg.startsWith("-")) {
          params.sellerServiceId = nextArg;
          i++; // Skip next argument
        }
        break;
      case "--backend-url":
      case "-u":
        if (nextArg && !nextArg.startsWith("-")) {
          params.backendUrl = nextArg;
          i++; // Skip next argument
        }
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
    }
  }

  return params;
}

function showHelp(): void {
  console.log(`
🌐 Skyfire Token Creator

Usage: yarn create-token [options]

Options:
  -k, --api-key <key>        Skyfire API key (required)
  -a, --amount <amount>       Token amount (e.g., 0.01)
  -b, --buyer-tag <tag>      Buyer tag (optional)
  -s, --seller-id <id>       Seller service ID (optional)
  -u, --backend-url <url>    Backend API URL (optional)
  -h, --help                 Show this help message

Examples:
  yarn create-token --api-key your-api-key --amount 0.01
  yarn create-token -k your-api-key -a 0.01 -b "test-buyer"
  yarn create-token -k your-api-key -a 0.01 -s your-seller-id

If not provided via command line, the script will prompt for missing values
or use values from .env file.
`);
}

async function promptForParams(
  cliParams: Partial<TokenParams>
): Promise<TokenParams> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log("🌐 Skyfire Token Creator");
    console.log("========================\n");

    const tokenAmount =
      cliParams.tokenAmount ||
      (await question("Enter token amount (default: 0.01): "));
    const buyerTag =
      cliParams.buyerTag ||
      (await question("Enter buyer tag (optional, press Enter to skip): "));
    const sellerServiceId =
      cliParams.sellerServiceId ||
      (await question(
        `Enter seller service ID (optional, default: ${process.env.SELLER_SERVICE_ID}): `
      ));

    return {
      tokenAmount: tokenAmount.trim() || "0.01",
      buyerTag: buyerTag.trim() || undefined,
      sellerServiceId: sellerServiceId.trim() || process.env.SELLER_SERVICE_ID,
      apiKey: cliParams.apiKey,
      backendUrl: cliParams.backendUrl,
    };
  } finally {
    rl.close();
  }
}

async function createToken(params: TokenParams): Promise<void> {
  const apiKey = params.apiKey || process.env.SKYFIRE_API_KEY;
  const backendUrl =
    params.backendUrl ||
    process.env.SKYFIRE_API_URL ||
    "https://api.skyfire.xyz";

  if (!apiKey) {
    console.error(
      "❌ Error: API key not provided. Use --api-key or set SKYFIRE_API_KEY in .env.test"
    );
    process.exit(1);
  }

  if (!backendUrl) {
    console.error(
      "❌ Error: Backend URL not provided. Use --backend-url or set SKYFIRE_API_URL in .env.test"
    );
    process.exit(1);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes from now

  const requestBody = {
    type: "pay",
    buyerTag: params.buyerTag || "",
    tokenAmount: params.tokenAmount,
    sellerServiceId: params.sellerServiceId,
    expiresAt,
  };

  console.log("\n📤 Creating token...");
  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${backendUrl}/api/v1/tokens`, {
      method: "POST",
      headers: {
        "skyfire-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error("Response:", errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log("\n✅ Token created successfully!");
    console.log("========================");
    console.log(`Token: ${data.token}`);
    console.log(`Expires: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`Amount: ${params.tokenAmount}`);
    console.log(`Buyer Tag: ${params.buyerTag || "None"}`);
    console.log(`Seller Service ID: ${params.sellerServiceId}`);

    // Generate curl command
    const port = process.env.PORT || "4000";
    const curlCommand = `curl -IH "x-isbot: true" -H "skyfire-pay-id: ${data.token}" http://localhost:${port}/`;

    console.log("\n🔗 Test with curl:");
    console.log("========================");
    console.log(curlCommand);

    // Copy token to clipboard if available
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(data.token);
      console.log("\n📋 Token copied to clipboard!");
    }
  } catch (error) {
    console.error("❌ Error creating token:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    const cliParams = parseCommandLineArgs();
    const params = await promptForParams(cliParams);
    await createToken(params);
  } catch (error) {
    console.error("❌ Script error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
