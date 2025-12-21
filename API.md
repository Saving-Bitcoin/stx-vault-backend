# API Documentation

Complete API reference for STX Vault Backend v2.0

## Base URL

```
http://localhost:3001  (development)
https://your-app.onrender.com  (production)
```

## Event Endpoints

### GET /events

Get all events with pagination.

**Query Parameters:**
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Starting position (default: 0)

**Example:**
```bash
curl http://localhost:3001/events?limit=20&offset=0
```

**Response:**
```json
{
  "total": 150,
  "limit": 20,
  "offset": 0,
  "events": [...]
}
```

---

### GET /events/:type

Get events by type.

**Parameters:**
- `type` - Event type (counter-incremented, counter-decremented, deposit, withdraw)

**Example:**
```bash
curl http://localhost:3001/events/deposit
```

---

### GET /events/tx/:txHash

Get event by transaction hash.

**Example:**
```bash
curl http://localhost:3001/events/tx/0xabc123...
```

---

## Chainhooks Management

### GET /chainhooks

List all your chainhooks.

**Query Parameters:**
- `limit` (optional) - Number of results (default: 20)
- `offset` (optional) - Starting position (default: 0)

**Example:**
```bash
curl http://localhost:3001/chainhooks
```

---

### GET /chainhooks/:uuid

Get specific chainhook details.

**Example:**
```bash
curl http://localhost:3001/chainhooks/be4ab3ed-b606-4fe0-97c4-6c0b1ac9b185
```

---

### POST /chainhooks

Register new chainhook.

**Body:**
```json
{
  "enable_on_registration": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/chainhooks \
  -H "Content-Type: application/json" \
  -d '{"enable_on_registration": true}'
```

---

### PATCH /chainhooks/:uuid

Update chainhook configuration.

**Body:**
```json
{
  "name": "Updated name",
  "filters": {
    "events": [...]
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3001/chainhooks/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

---

### DELETE /chainhooks/:uuid

Delete a chainhook.

**Example:**
```bash
curl -X DELETE http://localhost:3001/chainhooks/<uuid>
```

---

### POST /chainhooks/:uuid/enable

Enable or disable a chainhook.

**Body:**
```json
{
  "enabled": true
}
```

**Example:**
```bash
# Enable
curl -X POST http://localhost:3001/chainhooks/<uuid>/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Disable
curl -X POST http://localhost:3001/chainhooks/<uuid>/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### POST /chainhooks/bulk/enable

Bulk enable/disable multiple chainhooks.

**Body:**
```json
{
  "enabled": true,
  "filters": {
    "uuids": ["uuid1", "uuid2"],
    "webhook_url": "https://example.com/webhook",
    "statuses": ["inactive"]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/chainhooks/bulk/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "filters": {"uuids": ["uuid1"]}}'
```

---

### POST /chainhooks/:uuid/evaluate

Evaluate chainhook against a specific past block.

**Body:**
```json
{
  "block_height": 123456
}
```

**Or:**
```json
{
  "index_block_hash": "0xa204..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/chainhooks/<uuid>/evaluate \
  -H "Content-Type: application/json" \
  -d '{"block_height": 100000}'
```

---

### POST /chainhooks/:uuid/secret

Rotate consumer secret for webhook validation.

**Example:**
```bash
curl -X POST http://localhost:3001/chainhooks/<uuid>/secret
```

**Response:**
```json
{
  "success": true,
  "secret": "your-new-secret-here",
  "message": "Store this secret securely..."
}
```

⚠️ **Important:** Store the secret and update your environment variable!

---

## Webhook Endpoint

### POST /webhook

Receives events from Hiro Chainhooks (called automatically).

**Headers:**
```
Authorization: Bearer <consumer-secret>
```

**Body:** Chainhook payload (handled automatically)

---

## Utility Endpoints

### GET /health

Health check and status.

**Example:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "eventsStored": 42,
  "config": {
    "contractIdentifier": "SP1...vault-v2",
    "webhookUrl": "https://..."
  },
  "features": {
    "consumerSecretValidation": true
  }
}
```

---

### GET /

API overview and endpoint list.

**Example:**
```bash
curl http://localhost:3001/
```

---

## CLI Management

Alternative to API - manage chainhooks via command line:

```bash
# List all chainhooks
npm run manage -- list

# Get specific chainhook
npm run manage -- get <uuid>

# Enable/disable
npm run manage -- enable <uuid>
npm run manage -- disable <uuid>

# Delete chainhook
npm run manage -- delete <uuid>

# Evaluate against past block
npm run manage -- evaluate <uuid> --block 123456

# Rotate consumer secret
npm run manage -- rotate-secret <uuid>
```

---

## Authentication

Consumer secret validation is enabled when a secret is set. All webhook requests must include:

```
Authorization: Bearer <your-secret>
```

To set up:
1. Generate secret: `POST /chainhooks/:uuid/secret`
2. Store in environment or database
3. Webhook validation happens automatically

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

