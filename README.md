# STX Vault Backend

Backend webhook receiver and Chainhooks integration for the STX Vault smart contract.

## Overview

This backend service:
- Receives real-time events from Hiro Chainhooks when vault contract interactions occur
- Validates and processes blockchain events (deposits, withdrawals, counter updates)
- Stores event data and provides API endpoints for the frontend
- Demonstrates Chainhooks integration for the Stacks blockchain

## Smart Contract

Connects to: `SP1WEKNK5SGNTYM0J8M34FMBM7PTRJSYRWY9C1CGR.vault-v2`

Repository: [stx-vault](https://github.com/Saving-Bitcoinstx-vault)

## Events Monitored

- `deposit` - User deposits STX to vault
- `withdraw` - User withdraws STX from vault
- `counter-incremented` - Counter incremented
- `counter-decremented` - Counter decremented

## Tech Stack

- Node.js + Express
- TypeScript
- Hiro Chainhooks SDK (`@hirosystems/chainhooks-client`)
- Stacks.js libraries

## Setup

npm install
npm run dev## Environment Variables

HIRO_API_KEY=your_hiro_api_key
PORT=3001## Architecture
