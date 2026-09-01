# Trade Execution & Confirmation — Integration Guide

> **Module Status**: Verified & Production-Ready  
> **Target Chain**: Base Mainnet / Base Sepolia  
> **Author**: Core Infrastructure Team  

---

## 1. Overview

The **Trade Execution & Confirmation** module provides a production-grade, failsafe mechanism for executing options trades on the Base blockchain. It bridges AI strategy generation with secure on-chain transaction broadcast.

### Key Capabilities & Safeguards:
- **Backend Signing (`lib/chain/signer.ts`)**: Accepts unsigned transaction drafts (`rawQuote`), signs them securely on the server using `ethers` (v6), and broadcasts them to the Base RPC.
- **Failsafe Dry-Run Pre-Flight**: Before submitting any live transaction, the module runs `provider.estimateGas(unsignedTx)`. If EVM execution would revert (e.g., insufficient liquidity or contract conditions not met), execution halts immediately without wasting gas or crashing the server.
- **Idempotency & Double-Click Lock**: Enforces a strict status state-machine (`proposed` → `submitted` → `filled` / `failed`) in the database prior to network submission, preventing duplicate execution and double-spending.

---

## 2. Prerequisites

Ensure your local `.env` (or `.env.local`) includes valid chain credentials before starting the server:

```env
# Blockchain / Wallet Credentials
THETANUTS_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
THETANUTS_PRIVATE_KEY="0xYOUR_SERVER_PRIVATE_KEY"
```

> **Note**: If either environment variable is missing or empty, the server module will fail fast on startup with an explicit descriptive error.

---

## 3. How to Integrate: Backend / AI Strategy Side

If you are building the **AI Agent**, **MCP Tool**, or **Options Strategy Generator**, your responsibility is simple: **create a record in the `Trade` database table**.

You **do not** need to write any web3, RPC, or signing logic.

### Integration Steps for AI / Backend Teammates:

1. Generate your options quote/transaction draft as an unsigned EVM payload (`{ to, data, value }`).
2. Insert a new row into the `Trade` model via Prisma with `status: "proposed"`.

#### Example Code (Prisma Next 8):

```typescript
import { db } from "@/prisma/db";
import { Temporal } from "@js-temporal/polyfill";

const orm = (db.orm as any).public;

// 1. Construct unsigned transaction draft (rawQuote)
const rawQuote = {
  to: "0x0301a6a0e5Ce452a29681fE90dA4cA1933f5482f", // Target contract or vault
  value: "0",                                      // Wei amount
  data: "0x...",                                   // Encoded contract call
};

// 2. Persist trade proposal to Database
const trade = await orm.Trade.create({
  userId: currentUser.id,
  asset: "ETH",
  optionType: "call",                               // "call" | "put"
  strike: 3500,
  expiry: Temporal.Now.instant().add({ hours: 168 }),// 7-day expiration
  premium: 42.5,
  sizeUsd: 1000,
  status: "proposed",                              // ⚠️ MUST BE "proposed"
  orderSource: "optionbook",
  rawQuote: rawQuote,                              // ⚠️ Store raw quote payload here
});

// 3. Return `trade` object to the frontend
```

### What Happens Automatically Next:
- Once the row exists with `status: "proposed"`, the core infrastructure handles everything else:
  - State locking (`submitted`)
  - Gas pre-flight dry-run (`provider.estimateGas`)
  - On-chain transaction broadcast (`wallet.sendTransaction`)
  - Waiting for 1-block confirmation (`txResponse.wait(1)`)
  - Database status update to `filled` (with `txHash`) or `failed` (with error message)

---

## 4. Frontend Component Usage

If you are developing the UI or AI Chat Interface, render the pre-built `<TradeConfirm />` client component to display the order card and handle user execution.

### Installation / Import:

```tsx
import TradeConfirm, { Trade } from "@/components/TradeConfirm";
```

### Usage Example:

```tsx
"use client";

export default function TradeExecutionCard({ trade }: { trade: Trade }) {
  const handleSuccess = () => {
    console.log("Trade successfully confirmed on-chain!");
    // Optional: Refresh user portfolio, clear chat input, or fetch balance
  };

  return (
    <div className="p-4">
      <TradeConfirm 
        trade={trade} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}
```

### Component Features:
- **`proposed`**: Displays order parameter breakdown and an active **Confirm Trade** button (with loading spinner during submission).
- **`submitted`**: Renders an in-progress indicator while block confirmation is pending.
- **`filled`**: Renders a green success card with an automatic link to BaseScan (`https://basescan.org/tx/${txHash}`).
- **`failed`**: Renders error details and an interactive **Try Again** button.

---

## 5. State Machine & Execution Lifecycle

```
┌─────────────┐       User Clicks       ┌─────────────┐
│  proposed   │ ──────────────────────> │  submitted  │  (Idempotency Lock)
└─────────────┘     "Confirm Trade"     └──────┬──────┘
                                               │
                                      Dry-Run & Broadcast
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
               Pre-flight & On-Chain OK                      Dry-Run / Broadcast Failed
                        │                                             │
                        ▼                                             ▼
                 ┌─────────────┐                               ┌─────────────┐
                 │   filled    │                               │   failed    │
                 │ (w/ txHash) │                               │ (Retryable) │
                 └─────────────┘                               └─────────────┘
```

---

## 6. Important Notes for Team Members

> [!IMPORTANT]
> **Preserve Core Architecture**: Please build on top of this foundation and **do not modify** `lib/chain/signer.ts` or `src/app/api/trade/[id]/confirm/route.ts` directly. Modifying the underlying signer logic can break dry-run assertions or compromise private key handling.

If you need additional custom fields in `Trade` or want extra event callbacks during execution, reach out to the infrastructure lead or extend the `Trade` model contract via `src/prisma/contract.prisma`.
