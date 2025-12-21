import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config.js";
import { ChainhookPayload, StoredEvent, VaultEvent } from "./types.js";
import * as chainhooks from "./chainhooks-manager.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory event storage (replace with database in production)
const events: StoredEvent[] = [];

// Helper to parse Clarity values from event data
function parseClarityValue(value: any): any {
  if (!value) return null;

  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);

  if (value.hex) {
    return value.hex;
  }

  if (typeof value === "object") {
    const parsed: any = {};
    for (const [key, val] of Object.entries(value)) {
      parsed[key] = parseClarityValue(val);
    }
    return parsed;
  }

  return value;
}

// Parse print event from transaction receipt
function parseVaultEvent(tx: any): VaultEvent | null {
  try {
    const receipt = tx.metadata?.receipt;
    if (!receipt || !receipt.events) return null;

    const printEvent = receipt.events.find(
      (e: any) => e.type === "print_event"
    );

    if (!printEvent || !printEvent.data) return null;

    const eventData = parseClarityValue(printEvent.data);

    if (
      eventData.event &&
      [
        "counter-incremented",
        "counter-decremented",
        "deposit",
        "withdraw",
      ].includes(eventData.event)
    ) {
      return eventData as VaultEvent;
    }

    return null;
  } catch (error) {
    console.error("Error parsing vault event:", error);
    return null;
  }
}

// ============================================
// WEBHOOK ENDPOINT
// ============================================

app.post("/webhook", (req: Request, res: Response) => {
  try {
    // Validate consumer secret
    const authHeader = req.headers.authorization;
    if (!chainhooks.validateWebhookRequest(authHeader)) {
      console.warn("❌ Unauthorized webhook request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload: ChainhookPayload = req.body;

    console.log("📥 Received webhook payload");
    console.log(`   Chainhook UUID: ${payload.chainhook?.uuid || "unknown"}`);

    // Process apply events (new blocks)
    if (payload.apply && payload.apply.length > 0) {
      for (const block of payload.apply) {
        const blockHeight = block.block_identifier.index;
        const blockHash = block.block_identifier.hash;

        console.log(`📦 Processing block #${blockHeight}`);

        for (const tx of block.transactions) {
          const txHash = tx.transaction_identifier.hash;

          if (!tx.metadata?.success) {
            console.log(`   ⏭️  Skipping failed tx: ${txHash}`);
            continue;
          }

          const vaultEvent = parseVaultEvent(tx);

          if (vaultEvent) {
            const storedEvent: StoredEvent = {
              id: `${txHash}-${Date.now()}`,
              eventType: vaultEvent.event,
              eventData: vaultEvent,
              txHash,
              blockHeight,
              blockHash,
              timestamp: Date.now(),
            };

            events.push(storedEvent);

            console.log(`   ✅ Event: ${vaultEvent.event}`);
            console.log(`      TX: ${txHash}`);
            console.log(`      Data:`, JSON.stringify(vaultEvent, null, 2));
          }
        }
      }
    }

    // Process rollback events
    if (payload.rollback && payload.rollback.length > 0) {
      console.log("⚠️  Chain rollback detected - removing events");
      // TODO: Remove events from rolled-back blocks
    }

    res.status(200).json({ received: true, processed: events.length });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================
// EVENT API ENDPOINTS
// ============================================

// Get all events (paginated)
app.get("/events", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const paginatedEvents = events.slice(offset, offset + limit);

  res.json({
    total: events.length,
    limit,
    offset,
    events: paginatedEvents,
  });
});

// Get events by type
app.get("/events/:type", (req: Request, res: Response) => {
  const { type } = req.params;
  const filteredEvents = events.filter((e) => e.eventType === type);

  res.json({
    total: filteredEvents.length,
    eventType: type,
    events: filteredEvents,
  });
});

// Get event by transaction hash
app.get("/events/tx/:txHash", (req: Request, res: Response) => {
  const { txHash } = req.params;
  const event = events.find((e) => e.txHash === txHash);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json(event);
});

// ============================================
// CHAINHOOKS MANAGEMENT ENDPOINTS
// ============================================

// List all chainhooks
app.get("/chainhooks", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await chainhooks.listChainhooks(limit, offset);
    res.json(result);
  } catch (error: any) {
    console.error("Error listing chainhooks:", error);
    res.status(500).json({ error: error.message || "Failed to list chainhooks" });
  }
});

// Get specific chainhook
app.get("/chainhooks/:uuid", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const result = await chainhooks.getChainhook(uuid);
    res.json(result);
  } catch (error: any) {
    console.error("Error getting chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to get chainhook" });
  }
});

// Register new chainhook
app.post("/chainhooks", async (req: Request, res: Response) => {
  try {
    const enableOnRegistration = req.body.enable_on_registration !== false;
    const result = await chainhooks.registerChainhook(enableOnRegistration);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error registering chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to register chainhook" });
  }
});

// Update chainhook
app.patch("/chainhooks/:uuid", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    await chainhooks.updateChainhook(uuid, req.body);
    res.json({ success: true, message: "Chainhook updated" });
  } catch (error: any) {
    console.error("Error updating chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to update chainhook" });
  }
});

// Delete chainhook
app.delete("/chainhooks/:uuid", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    await chainhooks.deleteChainhook(uuid);
    res.json({ success: true, message: "Chainhook deleted" });
  } catch (error: any) {
    console.error("Error deleting chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to delete chainhook" });
  }
});

// Enable/disable chainhook
app.post("/chainhooks/:uuid/enable", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const enabled = req.body.enabled !== false;
    await chainhooks.enableChainhook(uuid, enabled);
    res.json({ success: true, enabled });
  } catch (error: any) {
    console.error("Error enabling/disabling chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to enable/disable chainhook" });
  }
});

// Bulk enable/disable chainhooks
app.post("/chainhooks/bulk/enable", async (req: Request, res: Response) => {
  try {
    const { enabled, filters } = req.body;
    await chainhooks.bulkEnableChainhooks(enabled, filters);
    res.json({ success: true, enabled, filters });
  } catch (error: any) {
    console.error("Error bulk enabling/disabling chainhooks:", error);
    res.status(500).json({ error: error.message || "Failed to bulk enable/disable" });
  }
});

// Evaluate chainhook against specific block
app.post("/chainhooks/:uuid/evaluate", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { block_height, index_block_hash } = req.body;

    if (!block_height && !index_block_hash) {
      return res.status(400).json({ 
        error: "Must provide either block_height or index_block_hash" 
      });
    }

    await chainhooks.evaluateChainhook(uuid, { block_height, index_block_hash });
    res.json({ 
      success: true, 
      message: "Evaluation triggered. Check your webhook for results." 
    });
  } catch (error: any) {
    console.error("Error evaluating chainhook:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate chainhook" });
  }
});

// Rotate consumer secret (global for all chainhooks)
app.post("/chainhooks/secret", async (req: Request, res: Response) => {
  try {
    const secret = await chainhooks.rotateConsumerSecret("");
    res.json({ 
      success: true, 
      secret,
      message: "Store this secret securely. It will be used to validate all webhook requests." 
    });
  } catch (error: any) {
    console.error("Error rotating consumer secret:", error);
    res.status(500).json({ error: error.message || "Failed to rotate secret" });
  }
});

// ============================================
// HEALTH & INFO ENDPOINTS
// ============================================

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    eventsStored: events.length,
    config: {
      contractIdentifier: `${config.contractAddress}.${config.contractName}`,
      webhookUrl: config.webhookUrl,
    },
    features: {
      consumerSecretValidation: chainhooks.getConsumerSecret() !== null,
    },
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "STX Vault Backend",
    version: "2.0.0",
    endpoints: {
      webhook: "POST /webhook",
      events: {
        list: "GET /events",
        byType: "GET /events/:type",
        byTx: "GET /events/tx/:txHash",
      },
      chainhooks: {
        list: "GET /chainhooks",
        get: "GET /chainhooks/:uuid",
        create: "POST /chainhooks",
        update: "PATCH /chainhooks/:uuid",
        delete: "DELETE /chainhooks/:uuid",
        enable: "POST /chainhooks/:uuid/enable",
        bulkEnable: "POST /chainhooks/bulk/enable",
        evaluate: "POST /chainhooks/:uuid/evaluate",
        rotateSecret: "POST /chainhooks/:uuid/secret",
      },
      health: "GET /health",
    },
  });
});

// Start server
app.listen(config.port, () => {
  console.log("🚀 STX Vault Backend v2.0");
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Contract: ${config.contractAddress}.${config.contractName}`);
  console.log(`   Webhook URL: ${config.webhookUrl}`);
  console.log("");
  console.log("✨ Features enabled:");
  console.log("   ✅ Webhook receiver");
  console.log("   ✅ Event storage & API");
  console.log("   ✅ Chainhooks management");
  console.log("   ✅ Consumer secret validation");
  console.log("   ✅ Historical evaluation");
  console.log("");
  console.log("📡 Waiting for Chainhooks events...");
});

export default app;
