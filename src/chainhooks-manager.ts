/**
 * Chainhooks Manager
 * Handles all chainhook operations: create, update, delete, enable, evaluate
 */

import {
  ChainhooksClient,
  CHAINHOOKS_BASE_URL,
} from "@hirosystems/chainhooks-client";
import { config, getContractIdentifier } from "./config.js";

let client: ChainhooksClient | null = null;
let consumerSecret: string | null = null;

// Initialize client
export function initializeChainhooksClient(): ChainhooksClient {
  if (!client) {
    client = new ChainhooksClient({
      baseUrl: CHAINHOOKS_BASE_URL.mainnet,
      apiKey: config.hiroApiKey,
    });
  }
  return client;
}

// Get current consumer secret
export function getConsumerSecret(): string | null {
  return consumerSecret;
}

// Set consumer secret
export function setConsumerSecret(secret: string): void {
  consumerSecret = secret;
}

// List all chainhooks
export async function listChainhooks(limit = 20, offset = 0) {
  const c = initializeChainhooksClient();
  return await c.getChainhooks({ limit, offset });
}

// Get specific chainhook
export async function getChainhook(uuid: string) {
  const c = initializeChainhooksClient();
  return await c.getChainhook(uuid);
}

// Register new chainhook
export async function registerChainhook(enableOnRegistration = true) {
  const c = initializeChainhooksClient();
  const contractIdentifier = getContractIdentifier();

  const chainhook = await c.registerChainhook({
    version: "1",
    name: `vault-events-${Date.now()}`,
    chain: "stacks",
    network: "mainnet",
    filters: {
      events: [
        {
          type: "contract_call",
          contract_identifier: contractIdentifier,
        },
      ],
    },
    action: {
      type: "http_post",
      url: config.webhookUrl,
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: enableOnRegistration,
    },
  });

  console.log(`✅ Chainhook registered: ${chainhook.uuid}`);
  return chainhook;
}

// Update chainhook
export async function updateChainhook(
  uuid: string,
  updates: {
    name?: string;
    filters?: any;
    action?: any;
    options?: any;
  }
) {
  const c = initializeChainhooksClient();
  await c.updateChainhook(uuid, updates);
  console.log(`✅ Chainhook updated: ${uuid}`);
}

// Delete chainhook
export async function deleteChainhook(uuid: string) {
  const c = initializeChainhooksClient();
  await c.deleteChainhook(uuid);
  console.log(`✅ Chainhook deleted: ${uuid}`);
}

// Enable/disable chainhook
export async function enableChainhook(uuid: string, enabled: boolean) {
  const c = initializeChainhooksClient();
  await c.enableChainhook(uuid, enabled);
  console.log(`✅ Chainhook ${enabled ? "enabled" : "disabled"}: ${uuid}`);
}

// Bulk enable/disable chainhooks
export async function bulkEnableChainhooks(
  enabled: boolean,
  filters: {
    uuids?: string[];
    webhook_url?: string;
    statuses?: ("new" | "streaming" | "expired" | "interrupted")[];
  }
) {
  const c = initializeChainhooksClient();
  await c.bulkEnableChainhooks({ enabled, filters });
  console.log(
    `✅ Bulk ${enabled ? "enabled" : "disabled"} chainhooks with filters:`,
    filters
  );
}

// Evaluate chainhook against specific block
export async function evaluateChainhook(
  uuid: string,
  params: { block_height?: number; index_block_hash?: string }
) {
  const c = initializeChainhooksClient();
  await c.evaluateChainhook(uuid, params);
  console.log(`✅ Chainhook evaluated: ${uuid}`, params);
}

// Rotate consumer secret
export async function rotateConsumerSecret(uuid: string) {
  const c = initializeChainhooksClient();
  const result = await c.rotateConsumerSecret();
  consumerSecret = result.secret;
  console.log(`✅ Consumer secret rotated`);
  return result.secret;
}

// Validate webhook request with consumer secret
export function validateWebhookRequest(authHeader: string | undefined): boolean {
  if (!consumerSecret) {
    console.warn("⚠️  No consumer secret set - skipping validation");
    return true; // Allow if no secret configured
  }

  if (!authHeader) {
    console.warn("⚠️  No Authorization header in webhook request");
    return false;
  }

  const expectedAuth = `Bearer ${consumerSecret}`;
  const isValid = authHeader === expectedAuth;

  if (!isValid) {
    console.warn("⚠️  Invalid consumer secret in webhook request");
  }

  return isValid;
}

