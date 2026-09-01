# OptionsCopilot - Thetanuts Hackathon

OptionsCopilot is an AI-powered trading agent built for the Thetanuts Finance MUBA Hackathon. It allows users to place real on-chain options trades on Base mainnet using natural language.

---

## Tech Stack
* **Framework:** Next.js (App Router) + React + Tailwind CSS
* **Database:** Supabase (PostgreSQL) + Prisma Next (v8)
* **Blockchain:** `ethers.js` + `@thetanuts-finance/thetanuts-client`
* **AI / Agent Logic:** Google Gemini + `@modelcontextprotocol/sdk`

---

## Set Up & Running the App

### 1. Prerequisites & Environment Setup
Create a `.env` file in the root directory containing:
```env
DATABASE_URL=your_supabase_postgresql_url
DIRECT_URL=your_supabase_direct_url
GEMINI_API_KEY=your_gemini_api_key
THETANUTS_RPC_URL=https://mainnet.base.org
THETANUTS_PRIVATE_KEY=your_disposable_wallet_private_key
```

### 2. Start the Application
```bash
# 1. Install dependencies
npm install

# 2. Run plumbing / RPC sanity checks
node node_modules/tsx/dist/cli.mjs scripts/sanity-check.ts

# 3. Start local development server
npm run dev
```

### 3. How to Use the App
1. Open **`http://localhost:3000`** in your browser.
2. Select a suggested starter prompt (e.g., *"Bet ETH goes up this week"*) or type a custom natural language trade request into the chat box.
3. The **Gemini AI Agent** parses your intent (asset, direction, timeframe) and calls `/api/trade/propose` to discover and price an option contract.
4. Review the **Trade Summary Card** with plain-English cost, strike, breakeven, and expiry details.
5. Click **Confirm Trade** to sign and execute the trade live on **Base Mainnet**. View your confirmed transaction on BaseScan.

---

## 🚀 Progress Updates Log

### Setup Progress (Steps 1 - 5)
* **Step 1: Project Initialization:** Next.js App Router project setup with `app/api/`, `lib/agent/`, `lib/chain/`, `lib/db/`.
* **Step 2: Core Dependencies:** Installed `@google/genai`, `ethers`, `prisma@next`, `@thetanuts-finance/thetanuts-client`.
* **Step 3: Database Configuration:** Defined models (`User`, `ChatSession`, `ChatMessage`, `Trade`, `MarketDataCache`) in `src/prisma/contract.prisma` and synced with Supabase.
* **Step 4: Wallet Setup:** Configured disposable signing wallet and `.env` credentials.
* **Step 5: Plumbing Sanity Checks:** RPC connectivity check on Base Mainnet (Chain ID 8453) and vendored SDK setup in `vendor/thetanuts-sdk`.

### Feature 1: Chat & Intent Parsing (Person A)
* **AI Agent:** Powered by Gemini 3.6 Flash with function calling (`extract_trade_intent`).
* **Chat Route:** `POST /api/chat` with Supabase message persistence and session history.
* **UI Components:** Dark Midnight layout, prompt chips, real-time message thread, and thinking state.

### Feature 2: Trade Discovery & Pricing (Person B)
* **API Route:** `POST /api/trade/propose` calculates spot price, target strike, premium cost, expiry, breakeven, and plain-English summary. Links `chatMessageId` to trade records in PostgreSQL DB.
* **Session & History Endpoints:** Added `GET /api/chat/sessions` and `POST /api/chat/sessions` to manage chat sessions, and `GET /api/chat/history` to load complete conversation history per session with associated trade proposals (`tradeDraftId`).
* **Chat History Sidebar & Persistence UI:** Integrated a collapsible left sidebar in `ChatWindow.tsx` with session switching, auto-reloading of the most recent chat on page refresh, timestamp session titles, and "+ New Chat" creation.
* **Database Sync:** Persists trade drafts with status `proposed` linked to specific chat sessions and assistant messages.
* **Trade Summary Card:** Enhanced `TradeSummaryCard.tsx` component displaying plain-English summary & cost breakdown.

### Feature 3: Trade Execution & Confirmation (Person C)
* **Signing Service:** `lib/chain/signer.ts` constructs, signs, and submits transactions to Base Mainnet via Ethers.
* **Confirm Route:** `POST /api/trade/[id]/confirm` handles transaction submission and updates trade status to `filled` with `txHash`.
* **Confirmation UI:** Interactive `TradeConfirm.tsx` component with BaseScan transaction verification link.
