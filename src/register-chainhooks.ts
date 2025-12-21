/**
 * Script to register Chainhooks for the vault contract
 *
 * Run with: npm run register-hooks
 */

import {
  ChainhooksClient,
  CHAINHOOKS_BASE_URL,
} from "@hirosystems/chainhooks-client";
import { config, getContractIdentifier } from "./config.js";

async function registerChainhooks() {
  console.log("🔗 Registering Chainhooks for STX Vault");
  console.log("");

  // Validate API key
  if (!config.hiroApiKey) {
    console.error("❌ Error: HIRO_API_KEY not set in environment variables");
    console.error("   Get your API key from: https://platform.hiro.so");
    process.exit(1);
  }

  // Initialize client
  const client = new ChainhooksClient({
    baseUrl: CHAINHOOKS_BASE_URL.mainnet,
    apiKey: config.hiroApiKey,
  });

  const contractIdentifier = getContractIdentifier();

  console.log("📝 Configuration:");
  console.log(`   Contract: ${contractIdentifier}`);
  console.log(`   Webhook URL: ${config.webhookUrl}`);
  console.log("");

  try {
    // Register a chainhook for all vault contract interactions
    console.log("⏳ Registering vault events chainhook...");

    const chainhook = await client.registerChainhook({
      version: "1",
      name: "vault-all-events",
      chain: "stacks",
      network: "mainnet",
      filters: {
        events: [
          {
            type: "contract_call",
            contract_identifier: contractIdentifier,
            // Listen to all function calls
            // Alternatively, specify: function_name: "deposit"
          },
        ],
      },
      action: {
        type: "http_post",
        url: config.webhookUrl,
      },
      options: {
        decode_clarity_values: true,
        enable_on_registration: true,
      },
    });

    console.log("✅ Chainhook registered successfully!");
    console.log(`   UUID: ${chainhook.uuid}`);
    console.log(`   Name: ${chainhook.definition.name}`);
    console.log("");

    // List all registered chainhooks
    console.log("📋 Listing all your chainhooks:");
    const allHooks = await client.getChainhooks({ limit: 20 });
    console.log(`   Total chainhooks: ${allHooks.total}`);

    for (const hook of allHooks.results) {
      const status = hook.status?.enabled ? "🟢 enabled" : "🔴 disabled";
      console.log(`   - ${hook.definition.name} (${status})`);
      console.log(`     UUID: ${hook.uuid}`);
    }

    console.log("");
    console.log("✨ Setup complete! Your webhook will now receive events.");
    console.log("");
    console.log("💡 Tips:");
    console.log("   - Make sure your webhook server is running");
    console.log("   - For local development, use ngrok to expose your webhook");
    console.log(
      "   - Test by calling contract functions with the driver script"
    );
  } catch (error: any) {
    console.error("❌ Error registering chainhook:");
    console.error(`   ${error.message || error}`);

    if (error.response) {
      console.error("   Response:", error.response);
    }

    process.exit(1);
  }
}

// Run registration
registerChainhooks();
