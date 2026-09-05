# OptionsCopilot - Thetanuts Hackathon

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=base&logoColor=white)](https://base.org/)
[![Thetanuts Finance](https://img.shields.io/badge/Thetanuts_Finance-FFA500?style=for-the-badge&logo=ethereum&logoColor=white)](https://thetanuts.finance/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

OptionsCopilot is an AI-powered trading agent built for the Thetanuts Finance MUBA Hackathon. It allows users to place real on-chain options trades on Base mainnet using natural language.

---

## Product Description

**OptionsCopilot** is an AI-driven options trading copilot built for the Thetanuts Finance ecosystem on Base Mainnet.

### The Problem It Solves
On-chain options are powerful financial instruments for hedging risk and expressing leveraged market views with defined downside. However, decentralized options platforms are notoriously intimidating for everyday crypto users:
* **Complex Terminology & High Cognitive Overhead:** Traders must understand Greeks (&Delta;, &Gamma;, &Theta;), implied volatility surfaces, strike selection, expiries, and multi-step order books.
* **Intimidating UX:** Most users who hold directional views (e.g., *"I think ETH will go up this week"* or *"I want to protect my portfolio from a drop"*) avoid options because existing DEX interfaces are built for quants and professional traders.
* **Risk of Costly Mistakes:** Entering incorrect strikes, picking inappropriate expiration dates, or miscalculating premium costs and breakevens can lead to immediate financial loss.

### How It Works
OptionsCopilot transforms complex derivatives trading into an intuitive, conversation-driven experience:
* **Conversational Trading Interface:** Express your market outlook in plain English (e.g., *"Bet ETH goes up this week"*, *"Protect my ETH from a 10% drop"*) or tap suggested starter prompt chips.
* **AI-Powered Intent Parsing:** Powered by Google Gemini with structured function calling (`extract_trade_intent`), the agent extracts the underlying asset, direction (`call` vs. `put`), timeframe, and position size.
* **Transparent Trade Discovery & Pricing:** Automatically maps user intent into tailored contract parameters with a plain-English Trade Summary Card detailing strike price, premium cost, expiry date, breakeven price, and strictly capped maximum loss.
* **1-Click On-Chain Execution:** Signs and broadcasts transactions directly to the Thetanuts OptionBook on Base Mainnet with pre-flight gas estimations and instant BaseScan verification.
* **Session & History Persistence:** Full chat history, session switching, and trade draft states are persisted in PostgreSQL via Supabase and Prisma Next.

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

### Feature 1: Chat & Intent Parsing 
* **AI Agent:** Powered by Gemini 3.6 Flash with function calling (`extract_trade_intent`).
* **Chat Route:** `POST /api/chat` with Supabase message persistence and session history.
* **UI Components:** Dark Midnight layout, prompt chips, real-time message thread, and thinking state.

### Feature 2: Trade Discovery & Pricing 
* **API Route:** `POST /api/trade/propose` calculates spot price, target strike, premium cost, expiry, breakeven, and plain-English summary. Links `chatMessageId` to trade records in PostgreSQL DB.
* **Session & History Endpoints:** Added `GET /api/chat/sessions` and `POST /api/chat/sessions` to manage chat sessions, and `GET /api/chat/history` to load complete conversation history per session with associated trade proposals (`tradeDraftId`).
* **Chat History Sidebar & Persistence UI:** Integrated a collapsible left sidebar in `ChatWindow.tsx` with session switching, auto-reloading of the most recent chat on page refresh, timestamp session titles, and "+ New Chat" creation.
* **Database Sync:** Persists trade drafts with status `proposed` linked to specific chat sessions and assistant messages.
* **Trade Summary Card:** Enhanced `TradeSummaryCard.tsx` component displaying plain-English summary & cost breakdown.

### Feature 3: Trade Execution & Confirmation 
* **Signing Service:** `lib/chain/signer.ts` constructs, signs, and submits transactions to Base Mainnet via Ethers.
* **Confirm Route:** `POST /api/trade/[id]/confirm` handles transaction submission and updates trade status to `filled` with `txHash`.
* **Confirmation UI:** Interactive `TradeConfirm.tsx` component with BaseScan transaction verification link.
