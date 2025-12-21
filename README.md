# STX Vault Backend v2.0

Complete backend service with Hiro Chainhooks integration, event processing, and management API for the STX Vault smart contract.

## 🚀 Features

### Core Features

- ✅ **Webhook Receiver** - Receives real-time blockchain events
- ✅ **Event Storage** - In-memory storage (database-ready)
- ✅ **REST API** - Query events and vault data
- ✅ **Consumer Secret Validation** - Secure webhook authentication

### Chainhooks Management

- ✅ **List & Get** - View all chainhooks and details
- ✅ **Create & Update** - Register and modify chainhooks
- ✅ **Enable/Disable** - Control chainhook activation
- ✅ **Bulk Operations** - Manage multiple chainhooks at once
- ✅ **Historical Evaluation** - Test against past blocks
- ✅ **Secret Rotation** - Generate and rotate consumer secrets

### Management Tools

- 🖥️ **REST API** - Full HTTP API for all operations
- 🔧 **CLI Tool** - Command-line management interface
- 📚 **Complete Documentation** - API reference and guides

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```env
HIRO_API_KEY=your_key_here
WEBHOOK_URL=https://your-domain.com/webhook
CONTRACT_ADDRESS=SP1WEKNK5SGNTYM0J8M34FMBM7PTRJSYRWY9C1CGR
CONTRACT_NAME=vault-v2
```

### 3. Start Server

```bash
npm run dev
```

### 4. Register Chainhooks

```bash
npm run register-hooks
```

### 5. Setup Security (Optional)

```bash
# Rotate consumer secret for webhook validation
npm run manage -- rotate-secret <chainhook-uuid>

# Store the secret in your environment
```

## 📚 Documentation

- **[API.md](./API.md)** - Complete API reference
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide

## 🛠️ Management

### Via CLI

```bash
# List all chainhooks
npm run manage -- list

# Get chainhook details
npm run manage -- get <uuid>

# Enable/disable
npm run manage -- enable <uuid>
npm run manage -- disable <uuid>

# Delete chainhook
npm run manage -- delete <uuid>

# Test against past block
npm run manage -- evaluate <uuid> --block 123456

# Rotate security secret
npm run manage -- rotate-secret <uuid>
```

### Via REST API

```bash
# List chainhooks
curl http://localhost:3001/chainhooks

# Enable a chainhook
curl -X POST http://localhost:3001/chainhooks/<uuid>/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Evaluate against past block
curl -X POST http://localhost:3001/chainhooks/<uuid>/evaluate \
  -H "Content-Type: application/json" \
  -d '{"block_height": 100000}'
```

## 📡 API Endpoints

### Events

```
GET  /events              - List all events (paginated)
GET  /events/:type        - Get events by type
GET  /events/tx/:txHash   - Get event by transaction hash
```

### Chainhooks Management

```
GET    /chainhooks                - List all chainhooks
GET    /chainhooks/:uuid          - Get specific chainhook
POST   /chainhooks                - Register new chainhook
PATCH  /chainhooks/:uuid          - Update chainhook
DELETE /chainhooks/:uuid          - Delete chainhook
POST   /chainhooks/:uuid/enable   - Enable/disable chainhook
POST   /chainhooks/bulk/enable    - Bulk enable/disable
POST   /chainhooks/:uuid/evaluate - Test against past blocks
POST   /chainhooks/:uuid/secret   - Rotate consumer secret
```

### Webhook

```
POST /webhook  - Receives events from Hiro Chainhooks
```

### Utility

```
GET /health  - Health check and status
GET /        - API overview
```

## 🔒 Security

### Consumer Secret Validation

1. **Generate Secret:**

```bash
npm run manage -- rotate-secret <chainhook-uuid>
```

2. **Store Secret:**
   Add to `.env` or database

3. **Automatic Validation:**
   All webhook requests are validated with `Authorization: Bearer <secret>`

### Best Practices

- ✅ Always use HTTPS in production
- ✅ Store secrets securely (environment variables, secret manager)
- ✅ Rotate secrets periodically
- ✅ Monitor webhook deliveries
- ✅ Implement rate limiting

## 🧪 Testing

### Test Webhook Locally

1. **Start server:**

```bash
npm run dev
```

2. **Expose with ngrok:**

```bash
ngrok http 3001
```

3. **Update webhook URL:**

```bash
# Update .env with ngrok URL
WEBHOOK_URL=https://your-id.ngrok.io/webhook

# Restart server
npm run dev
```

4. **Trigger events:**

```bash
cd ../stx-vault
npx tsx x-temp/vault-driver.ts --fast --mode=counter
```

### Test Historical Evaluation

```bash
# Evaluate chainhook against a specific past block
npm run manage -- evaluate <uuid> --block 123456

# Or via API
curl -X POST http://localhost:3001/chainhooks/<uuid>/evaluate \
  -H "Content-Type: application/json" \
  -d '{"block_height": 123456}'
```

## 📊 Monitoring

### Check Status

```bash
curl http://localhost:3001/health
```

### View Events

```bash
# All events
curl http://localhost:3001/events

# By type
curl http://localhost:3001/events/deposit

# By transaction
curl http://localhost:3001/events/tx/0xabc123...
```

### List Chainhooks

```bash
curl http://localhost:3001/chainhooks
```

## 🚀 Deployment

### Render

1. Push to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set environment variables:
   - `HIRO_API_KEY`
   - `CONTRACT_ADDRESS`
   - `CONTRACT_NAME`
   - `NODE_ENV=production`
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Deploy!

After deployment:

- Get your webhook URL: `https://your-app.onrender.com/webhook`
- Update `WEBHOOK_URL` environment variable
- Re-register or update chainhooks with new URL

### Other Platforms

Works on:

- Vercel
- Railway
- Heroku
- AWS/GCP/Azure

## 🔧 Development

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Register chainhooks
npm run register-hooks

# Manage chainhooks
npm run manage -- <command>
```

## 📁 Project Structure

```
src/
├── server.ts              # Express server & API endpoints
├── chainhooks-manager.ts  # Chainhooks SDK wrapper
├── register-chainhooks.ts # Initial registration script
├── manage-chainhooks.ts   # CLI management tool
├── types.ts               # TypeScript type definitions
└── config.ts              # Configuration management
```

## 🔄 Upgrading from v1.0

New in v2.0:

- ✅ Full chainhooks management API
- ✅ Consumer secret validation
- ✅ Historical block evaluation
- ✅ CLI management tool
- ✅ Bulk operations
- ✅ Enhanced security
- ✅ Better error handling

## 🐛 Troubleshooting

### Webhook not receiving events

1. Check server is running: `curl http://localhost:3001/health`
2. Verify chainhook is enabled: `npm run manage -- get <uuid>`
3. Check webhook URL is correct and publicly accessible
4. Test with historical evaluation: `npm run manage -- evaluate <uuid> --block <height>`

### Consumer secret validation fails

1. Rotate secret: `npm run manage -- rotate-secret <uuid>`
2. Update environment variable
3. Restart server

### Can't list chainhooks

1. Verify `HIRO_API_KEY` is set
2. Check API key is valid at https://platform.hiro.so
3. Ensure you have internet connection

## 🤝 Related

- **Contract:** [stx-vault](https://github.com/YOUR_USERNAME/stx-vault)
- **Frontend:** [stx-vault-frontend](https://github.com/YOUR_USERNAME/stx-vault-frontend)

## 📝 License

MIT
