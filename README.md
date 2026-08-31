# OptionsCopilot - Thetanuts Hackathon

OptionsCopilot is an AI-powered trading agent built for the Thetanuts Finance MUBA Hackathon. It allows users to place real on-chain options trades on Base mainnet using natural language.

This repository is currently a work in progress. Below is a summary of the infrastructure and plumbing that has been set up so far (Steps 1-5).

## Tech Stack
* **Framework:** Next.js (App Router) + React + Tailwind CSS
* **Database:** Supabase (PostgreSQL) + Prisma Next (v8)
* **Blockchain:** `ethers.js` + `@thetanuts-finance/thetanuts-client`
* **AI / Agent Logic:** Google Gemini + `@modelcontextprotocol/sdk`

---

## Setup Progress (Steps 1 - 5)

### Step 1: Project Initialization
* Initialized a brand new Next.js App Router project.
* Set up the core directory structure required by our architecture:
  * `app/api/` (Next.js backend routes)
  * `app/components/` (React UI components)
  * `lib/agent/` (Gemini AI logic)
  * `lib/chain/` (Blockchain interaction logic)
  * `lib/db/` (Database client)

### Step 2: Core Dependencies
* Installed all necessary NPM packages for the backend and blockchain integration:
  * `@prisma/client` and `prisma@next` for database management.
  * `@google/genai` for the AI brain.
  * `ethers` for blockchain connectivity.
  * `@thetanuts-finance/thetanuts-client` for interacting with the Thetanuts protocol.

### Step 3: Database Configuration (Supabase & Prisma 8)
* Defined our core data models inside `src/prisma/contract.prisma`:
  * `User`
  * `ChatSession` & `ChatMessage`
  * `Trade`
  * `MarketDataCache`
* Compiled the new Prisma 8 "Data Contract".
* Successfully synced the schema to the live Supabase PostgreSQL database using `npx prisma db update`.

### Step 4: Disposable Wallet Setup
* We bypassed a broken CLI command by using an `ethers.js` Node script to generate a fresh, disposable Ethereum wallet.
* The `.env` file is fully populated with `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `THETANUTS_RPC_URL`, and `THETANUTS_PRIVATE_KEY`.

### Step 5: Plumbing Sanity Checks
* **RPC Check:** Created `lib/chain/thetanutsClient.ts` and successfully verified our `THETANUTS_RPC_URL` connects and reads from the Base Mainnet (Chain ID 8453).
* **MCP Server Integration:** Because the `@thetanuts-finance/mcp` package was not published to the public NPM registry, we successfully cloned the [official GitHub repository](https://github.com/Thetanuts-Finance/thetanuts-sdk) directly into `vendor/thetanuts-sdk`. 
* We built the SDK and the MCP server locally and successfully linked it into our `node_modules` so our Next.js app can use it natively.

---

## Feature 1: Chat & Intent Parsing (Person A Progress)

### 1. Shared Types & Data Contracts
* **File:** `lib/agent/types.ts`
* Defined `TradeIntent`, `ChatRole`, and `ChatMessageUI` types for cross-team contract consistency (Person B & C integration).

### 2. AI Brain & Intent Parsing Agent
* **File:** `lib/agent/runAgent.ts`
* Powered by **Google Gemini 3.6 Flash** with native **Function Calling / Tool Use** (`extract_trade_intent`):
  * **Asset Extraction:** Defaults to `ETH` (supports `BTC`).
  * **Direction Parsing:** Accurately maps bullish/yield view to `call` and protective/downside view to `put`.
  * **Timeframe Extraction:** Categorizes duration into `day`, `week`, or `month`.
  * **Position Size:** Automatically extracts USD amounts (e.g. `"$150"` → `150`).
  * **Contextual Memory:** Ingests conversation history (last 10 messages) for multi-turn follow-ups.
  * **Greeting & FAQ Filter:** Answers off-topic and general questions naturally without triggering false trades.

### 3. Backend Route & Database Persistence
* **File:** `src/app/api/chat/route.ts`
* Handles `POST /api/chat` requests with full validation.
* Auto-provisions demo user records (`demo-user`) and active `ChatSession` in Supabase PostgreSQL.
* Decodes PostgreSQL timestamptz seamlessly with `temporal-polyfill` inside `src/prisma/db.ts`.
* Automatically stores all user prompts and assistant replies to `ChatMessage`.
* Integrated with Person B's `/api/trade/propose` endpoint with resilient fallback.

### 4. Modern Dark Midnight Frontend
* **Header ([`Header.tsx`](src/app/components/Header.tsx)):** `OptionsCopilot` branding, tab navigation (`Copilot Chat` & `My Trades`), balance badge (`$124.50 USDC`), and copyable wallet address button (`0x71C...3A9f`).
* **Hero & Prompt Chips ([`ChatWindow.tsx`](src/app/components/ChatWindow.tsx), [`PromptChips.tsx`](src/app/components/PromptChips.tsx)):** Glowing bot avatar, title, and 4 one-click starter chips (`Bet ETH goes up`, `Protect my ETH`, `Yield on USDC`, `High Volatility play`) that immediately submit queries.
* **Message Thread & Thinking State ([`ThinkingIndicator.tsx`](src/app/components/ThinkingIndicator.tsx), [`TradeSummaryCard.tsx`](src/app/components/TradeSummaryCard.tsx)):** Real-time chat bubbles, animated pulse & bounce thinking wave, auto-scroll, and strategy proposal card slot.
* **Floating Input Bar:** Dark capsule container with Enter-to-submit (Shift+Enter for newline), input disable protection during inference, and disclaimer footer.
* **My Trades View ([`MyTrades.tsx`](src/app/components/MyTrades.tsx)):** Portfolio position tracking with strike, contract expiry, and P&L indicators.

