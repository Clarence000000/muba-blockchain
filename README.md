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

## Next Steps
We are now ready to begin **Feature 1: Chat & Intent Parsing**, which involves building the chat UI and wiring up the Gemini AI!
