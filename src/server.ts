import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config.js";
import { ChainhookPayload, StoredEvent, VaultEvent } from "./types.js";

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

  // Handle Clarity value objects
  if (value.hex) {
    // It's a raw hex value, try to parse it
    return value.hex;
  }

  // For tuple/object values
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

    // Find print_event
    const printEvent = receipt.events.find(
      (e: any) => e.type === "print_event"
    );

    if (!printEvent || !printEvent.data) return null;

    // Parse the event data
    const eventData = parseClarityValue(printEvent.data);

    // Validate it's a vault event
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

// Main webhook endpoint
app.post("/webhook", (req: Request, res: Response) => {
  try {
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

          // Check if transaction was successful
          if (!tx.metadata?.success) {
            console.log(`   ⏭️  Skipping failed tx: ${txHash}`);
            continue;
          }

          // Parse vault event from print_event
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

    // Process rollback events (chain reorganization)
    if (payload.rollback && payload.rollback.length > 0) {
      console.log("⚠️  Chain rollback detected - removing events");
      // In production, remove events from rolled-back blocks
    }

    res.status(200).json({ received: true, processed: events.length });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get all events
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

// API endpoint to get events by type
app.get("/events/:type", (req: Request, res: Response) => {
  const { type } = req.params;
  const filteredEvents = events.filter((e) => e.eventType === type);

  res.json({
    total: filteredEvents.length,
    eventType: type,
    events: filteredEvents,
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    eventsStored: events.length,
    config: {
      contractIdentifier: `${config.contractAddress}.${config.contractName}`,
      webhookUrl: config.webhookUrl,
    },
  });
});

// Start server
app.listen(config.port, () => {
  console.log("🚀 STX Vault Backend Server");
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Contract: ${config.contractAddress}.${config.contractName}`);
  console.log(`   Webhook URL: ${config.webhookUrl}`);
  console.log("");
  console.log("📡 Waiting for Chainhooks events...");
});

export default app;
