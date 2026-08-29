# SDD: OptionsCopilot — Software Design Document

**Companion to:** PRD_OptionsCopilot.md
**Stack:** Next.js (App Router), TypeScript, PostgreSQL
**Track:** Thetanuts Hackathon — Track 2 (AI × Options)

---

## 1. Overview

OptionsCopilot is a single Next.js web app. It has one job end-to-end: take a plain-English trade request, turn it into a real options trade on Thetanuts' OptionBook (Base mainnet), and show the user proof it happened. Next.js serves both the UI and the backend (API routes / route handlers), PostgreSQL stores chat history, trade records, and cached market data, and a small signing module handles the only piece that must never touch the frontend: the private key.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | Chat UI, trade cards, trades list |
| Backend | Next.js Route Handlers (`app/api/**/route.ts`) | No separate backend service needed for hackathon scope |
| Database | PostgreSQL | Chat messages, trades, cached orders/market data |
| ORM | Prisma (recommended) | Type-safe queries, quick migrations, pairs naturally with TS |
| Blockchain SDK | `@thetanuts-finance/thetanuts-client` + `ethers` | Reading orders, market data, building/filling trades |
| Agent tools | `@thetanuts-finance/mcp` (MCP server) | Reads state, prices, builds transactions — never signs |
| LLM | Gemini API (tool use) | Parses intent, selects/proposes trades via MCP tools |
| Chain | Base mainnet, chainId 8453 | Via paid Alchemy/Infura RPC key |
| Signing | Server-side only, `ethers.Wallet` | Private key in env var, never sent to client |

## 3. System architecture

```
┌─────────────────────────────┐
│         Browser (UI)         │
│  Next.js pages + components  │
└───────────────┬──────────────┘
                │ fetch (Next.js API routes)
┌───────────────▼──────────────┐
│   Next.js Route Handlers      │
│  /api/chat  /api/trade/*      │
└───┬─────────────┬────────────┘
    │             │
    ▼             ▼
┌─────────┐  ┌───────────────────────────┐
│PostgreSQL│  │  Agent orchestration layer │
│(Prisma)  │  │  Gemini (tool use) ⇄ MCP   │
└─────────┘  │  server (reads/prices/     │
             │  builds tx, never signs)   │
             └───────────┬────────────────┘
                          │ built (unsigned) tx
                          ▼
             ┌───────────────────────────┐
             │   Signing module (server)  │
             │   ethers.Wallet + RPC      │
             └───────────┬────────────────┘
                          ▼
                 Base mainnet / Thetanuts
                     OptionBook
```

Everything runs inside the Next.js app for the hackathon — no separate microservice. The MCP server can run as a local subprocess/sidecar that the route handler talks to, or its tool logic can be called directly from a server-side agent module if that's simpler to wire up in the time available.

## 4. Data model (PostgreSQL / Prisma schema)

```prisma
model User {
  id        String   @id @default(cuid())
  walletAddress String @unique
  createdAt DateTime @default(now())
  chats     ChatSession[]
  trades    Trade[]
}

model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  messages  ChatMessage[]
}

model ChatMessage {
  id          String   @id @default(cuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id])
  role        String   // "user" | "assistant" | "tool"
  content     String
  createdAt   DateTime @default(now())
}

model Trade {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  chatMessageId   String?  // the assistant message that proposed this trade
  asset           String   // e.g. "ETH"
  optionType      String   // "call" | "put"
  strike          Decimal
  expiry          DateTime
  premium         Decimal
  sizeUsd         Decimal
  status          String   // "proposed" | "confirmed" | "submitted" | "filled" | "failed"
  txHash          String?
  orderSource     String   // "optionbook" | "rfq"
  rawQuote        Json     // full MCP response for audit/debug
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model MarketDataCache {
  id          String   @id @default(cuid())
  asset       String
  payload     Json      // raw getMarketData() snapshot
  fetchedAt   DateTime  @default(now())
}
```

Notes:
- `Trade.status` drives the UI state machine: proposed → (user confirms) → submitted → filled/failed.
- `rawQuote` keeps the full MCP tool output so the team can debug mismatches between what the AI proposed and what actually filled.
- `MarketDataCache` is optional polish — mainly useful if judges ask "how fresh is this," or to avoid re-querying MCP on every keystroke.

## 5. API design (Next.js route handlers)

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Accepts a user message, runs the agent (Gemini + MCP tools), returns assistant reply + (optionally) a proposed `Trade` draft. Persists messages to `ChatMessage`. |
| `/api/trade/propose` | POST | Internal helper called by `/api/chat` when the agent has picked a matching order — writes a `Trade` row with status `proposed`. |
| `/api/trade/[id]/confirm` | POST | User has confirmed in the UI. Triggers the signing module to sign + broadcast the pre-built transaction. Updates `Trade.status` to `submitted`, then `filled`/`failed` once confirmed on-chain. |
| `/api/trade/[id]` | GET | Poll trade status (for the confirmation screen to show "pending → filled"). |
| `/api/trades` | GET | List a user's trades for the "My Trades" view. |
| `/api/wallet` | GET | Return the app's disposable wallet address + current USDC/ETH balance (for the demo, this can be a single shared hackathon wallet rather than per-user). |

## 6. Frontend structure (App Router)

```
app/
  page.tsx                → Chat screen (main entry point)
  trades/page.tsx         → "My Trades" list
  components/
    ChatWindow.tsx         → message list + input
    TradeSummaryCard.tsx   → plain-English proposed trade + Confirm button
    TradeStatusBadge.tsx   → proposed/submitted/filled/failed states
    TradesList.tsx         → table/list of past trades with tx links
  api/
    chat/route.ts
    trade/propose/route.ts
    trade/[id]/confirm/route.ts
    trade/[id]/route.ts
    trades/route.ts
    wallet/route.ts
lib/
  agent/                  → Gemini tool-use orchestration
    runAgent.ts
    mcpClient.ts
  chain/
    signer.ts             → server-only signing module
    thetanutsClient.ts    → wraps @thetanuts-finance/thetanuts-client
  db/
    prisma.ts
```

## 7. Agent design (`lib/agent`)

- `runAgent(sessionId, userMessage)`:
  1. Loads recent `ChatMessage` history for context.
  2. Sends the conversation to Gemini with the MCP server's tools registered (fetch orders, get market data, build transaction).
  3. Gemini decides which tool calls to make — e.g., `getMarketData`, `fetchOrders`, then `buildFillTransaction` for the chosen order.
  4. The unsigned transaction + a plain-English summary come back from the agent; both get persisted as a `Trade` row (`status: proposed`) and an assistant `ChatMessage`.
  5. Returns the reply + trade draft to the frontend.

This is the piece that keeps the options "load-bearing": the LLM is the one selecting which live order to propose, not a hardcoded lookup.

## 8. Signing module design (`lib/chain/signer.ts`)

- Server-only, never imported into any client component.
- Reads `THETANUTS_PRIVATE_KEY` and `THETANUTS_RPC_URL` from environment variables (`.env`, not committed).
- Exposes one function: `signAndSubmit(unsignedTx): Promise<{ txHash: string }>`.
- Always runs a `--dry-run`-equivalent simulation before submitting for real (mirrors the CLI's `--dry-run` flag).
- Approvals are set to the exact amount needed per trade, never `MaxUint256`.
- After submission, a lightweight poller (or webhook if available) updates `Trade.status` to `filled` or `failed` once the tx confirms on Base.

## 9. Trade lifecycle (state machine)

```
proposed → (user taps Confirm) → submitted → filled
                                          └──→ failed
```

- `proposed`: agent found a matching order and built the tx, nothing sent on-chain yet.
- `submitted`: signing module broadcast the transaction, waiting for confirmation.
- `filled`: transaction confirmed — this is the state the demo needs to reach at least once.
- `failed`: tx reverted or errored — UI should show this clearly rather than hang.

## 10. Security & secrets

- `THETANUTS_PRIVATE_KEY` and RPC keys live only in server-side env vars, never exposed to the client bundle.
- Use a fresh, disposable wallet (`thetanuts wallet create`) funded with 1–3 USDC — never a wallet holding anything of value.
- `.env` is git-ignored; check git history before submitting the repo.
- Exact-amount approvals only.
- All trade sizes capped small in the UI (hackathon demo, not production).

## 11. Feature → module mapping (matches PRD's 4-person split)

| PRD Feature | Owner | Primary modules |
|---|---|---|
| 1. Chat & Intent Parsing | Person A | `app/page.tsx`, `components/ChatWindow.tsx`, `lib/agent/runAgent.ts` (prompt/intent extraction part) |
| 2. Trade Discovery & Pricing | Person B | `lib/agent/mcpClient.ts`, `components/TradeSummaryCard.tsx`, `api/trade/propose/route.ts` |
| 3. Trade Execution & Confirmation | Person C | `lib/chain/signer.ts`, `lib/chain/thetanutsClient.ts`, `api/trade/[id]/confirm/route.ts`, `components/TradeStatusBadge.tsx` |
| 4. Positions, Testing & Pitch | Person D | `app/trades/page.tsx`, `components/TradesList.tsx`, `api/trades/route.ts`, `api/wallet/route.ts`, plus end-to-end test runs |

Shared/setup (do together first): Prisma schema + migration, `.env` config, RPC key, wallet creation, MCP server connectivity check.

## 12. Open questions for the team

- Single shared hackathon wallet vs. per-demo-user wallet — shared is simpler and matches "trade small" guidance.
- Poll for tx confirmation vs. webhook — poll is simpler to build in the time available.
- Prisma vs. raw `pg` client — Prisma recommended for speed of iteration with TypeScript.
