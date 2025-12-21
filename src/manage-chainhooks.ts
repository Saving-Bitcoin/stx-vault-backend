/**
 * Chainhooks Management CLI
 *
 * Usage:
 *   npm run manage -- list
 *   npm run manage -- get <uuid>
 *   npm run manage -- enable <uuid>
 *   npm run manage -- disable <uuid>
 *   npm run manage -- delete <uuid>
 *   npm run manage -- evaluate <uuid> --block 123456
 *   npm run manage -- rotate-secret <uuid>
 */

import * as chainhooks from "./chainhooks-manager.js";

const command = process.argv[2];
const uuid = process.argv[3];

async function main() {
  console.log("🔧 Chainhooks Management CLI");
  console.log("");

  try {
    switch (command) {
      case "list": {
        console.log("📋 Listing all chainhooks...");
        const result = await chainhooks.listChainhooks(50, 0);
        console.log(`Total: ${result.total}`);
        console.log("");

        for (const hook of result.results) {
          const status = hook.status?.enabled ? "🟢 enabled" : "🔴 disabled";
          console.log(`${hook.definition.name} (${status})`);
          console.log(`  UUID: ${hook.uuid}`);
          const event = hook.definition.filters.events?.[0];
          const contractId =
            event && "contract_identifier" in event
              ? event.contract_identifier
              : "N/A";
          console.log(`  Contract: ${contractId}`);
          console.log("");
        }
        break;
      }

      case "get": {
        if (!uuid) {
          console.error("❌ Error: UUID required");
          console.log("Usage: npm run manage -- get <uuid>");
          process.exit(1);
        }

        console.log(`📄 Getting chainhook: ${uuid}`);
        const hook = await chainhooks.getChainhook(uuid);
        console.log(JSON.stringify(hook, null, 2));
        break;
      }

      case "enable": {
        if (!uuid) {
          console.error("❌ Error: UUID required");
          console.log("Usage: npm run manage -- enable <uuid>");
          process.exit(1);
        }

        console.log(`✅ Enabling chainhook: ${uuid}`);
        await chainhooks.enableChainhook(uuid, true);
        break;
      }

      case "disable": {
        if (!uuid) {
          console.error("❌ Error: UUID required");
          console.log("Usage: npm run manage -- disable <uuid>");
          process.exit(1);
        }

        console.log(`🔴 Disabling chainhook: ${uuid}`);
        await chainhooks.enableChainhook(uuid, false);
        break;
      }

      case "delete": {
        if (!uuid) {
          console.error("❌ Error: UUID required");
          console.log("Usage: npm run manage -- delete <uuid>");
          process.exit(1);
        }

        console.log(`🗑️  Deleting chainhook: ${uuid}`);
        await chainhooks.deleteChainhook(uuid);
        break;
      }

      case "evaluate": {
        if (!uuid) {
          console.error("❌ Error: UUID required");
          console.log(
            "Usage: npm run manage -- evaluate <uuid> --block 123456"
          );
          process.exit(1);
        }

        const blockArg = process.argv.find((arg) => arg === "--block");
        const blockIndex = process.argv.indexOf("--block");
        const blockHeight =
          blockIndex !== -1 ? parseInt(process.argv[blockIndex + 1]) : null;

        if (!blockHeight) {
          console.error("❌ Error: Block height required");
          console.log(
            "Usage: npm run manage -- evaluate <uuid> --block 123456"
          );
          process.exit(1);
        }

        console.log(
          `🔍 Evaluating chainhook ${uuid} against block ${blockHeight}`
        );
        await chainhooks.evaluateChainhook(uuid, { block_height: blockHeight });
        console.log("✅ Evaluation triggered. Check your webhook for results.");
        break;
      }

      case "rotate-secret": {
        console.log(`🔑 Rotating consumer secret (applies to all chainhooks)`);
        const secret = await chainhooks.rotateConsumerSecret("");
        console.log("");
        console.log("✅ New secret generated:");
        console.log(`   ${secret}`);
        console.log("");
        console.log(
          "⚠️  Store this securely! It will be used to validate all webhook requests."
        );
        break;
      }

      default: {
        console.log("Available commands:");
        console.log("  list              - List all chainhooks");
        console.log("  get <uuid>        - Get chainhook details");
        console.log("  enable <uuid>     - Enable a chainhook");
        console.log("  disable <uuid>    - Disable a chainhook");
        console.log("  delete <uuid>     - Delete a chainhook");
        console.log(
          "  evaluate <uuid> --block <height> - Test against past block"
        );
        console.log(
          "  rotate-secret     - Generate new consumer secret (global)"
        );
        console.log("");
        console.log("Examples:");
        console.log("  npm run manage -- list");
        console.log(
          "  npm run manage -- enable be4ab3ed-b606-4fe0-97c4-6c0b1ac9b185"
        );
        console.log("  npm run manage -- evaluate <uuid> --block 100000");
        console.log("  npm run manage -- rotate-secret");
        process.exit(1);
      }
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message || error);
    process.exit(1);
  }
}

main();
