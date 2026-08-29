# PRD: OptionsCopilot — AI Chat-Based Options Trading Web App

**Track:** Thetanuts Hackathon — Track 2 (AI × Options)
**Team size:** 4
**Doc owner:** [Your name]
**Status:** Draft — hackathon MVP

---

## 1. Problem

On-chain options are powerful but hard to use. To trade one, a user has to understand strikes, expiries, structures (spreads, condors, iron condors), and then manually navigate a DEX-style interface to find and fill an order. Most crypto users who'd benefit from options (hedging a position, expressing a view, generating yield) never touch them because the interface is built for professionals, not for someone who just wants to say what they want.

## 2. Product idea

**OptionsCopilot** is a web app where a user chats in plain English (or picks from suggested prompts) to place real options trades on Thetanuts' OptionBook, live on Base mainnet. Instead of navigating strikes and order books, the user says something like *"protect my ETH from a 10% drop this week"* or *"I think ETH goes up — smallest way to bet on that"*, and the AI agent translates that into a specific, priced, on-chain trade the user can review and confirm with one click.

**Elevator pitch:** *A chat box that turns "I want to bet ETH goes up" into a real, filled options trade — no strikes, no Greeks, no spreadsheets.*

## 3. Target users

- Crypto-native users who understand spot/perps but have never traded options because the UX is intimidating.
- DeFi power users who want a faster way to place a trade they already understand, without clicking through an order book.
- (Secondary) options-curious traders who want the AI to explain *why* a structure fits their view before they commit.

## 4. Goals & success metrics (for the hackathon)

| Goal | Metric |
|---|---|
| Prove the AI trade path works end-to-end | At least 1 real trade filled on Thetanuts OptionBook via the app, on Base mainnet |
| Prove the AI is load-bearing, not decorative | The AI must choose the specific order/structure — not a hardcoded fill |
| Show it's usable by a non-expert | A teammate who didn't build it can place a trade using only the chat, unaided |
| Tell a believable "who cares" story | One clear target user + one sentence on why they'd use this over Thetanuts' own UI |

## 5. Scope

### In scope (MVP — must ship)
- Web app, single page: chat interface + wallet/position summary panel.
- User describes a trade in natural language or taps a suggested prompt.
- Agent (LLM + Thetanuts MCP server) interprets intent, fetches live OptionBook orders, and proposes **one** matching trade with plain-English terms (what it costs, what it pays off, when it expires).
- User confirms → app signs with a disposable wallet → trade is filled on-chain.
- Confirmation screen showing the transaction hash / Base explorer link.
- Support for simple vanilla calls/puts only (no spreads/condors in MVP).

### Out of scope (stretch, if time allows)
- RFQ flow for custom strikes/expiries.
- Multi-leg structures (spreads, condors, iron condors).
- Portfolio-aware suggestions ("you're already long ETH, consider a put instead").
- Automated/scheduled hedging (no autonomous re-triggering).
- Mobile-responsive polish beyond "doesn't break."

### Explicitly not doing
- Custody of user funds beyond the demo's disposable wallet.
- Real user onboarding, KYC, or production security hardening.

## 6. User stories

1. *As a user*, I can type "I want to bet ETH goes up in the next few days" and get back one clear, priced option I can accept or decline.
2. *As a user*, I can see in plain English what I pay, what I could get back, and when it expires — before I confirm.
3. *As a user*, after I confirm, I can see proof the trade actually happened on-chain.
4. *As a returning user*, I can see my open position(s) in a simple list.

## 7. Core flow (MVP)

1. Landing screen: chat box + 3–4 example prompts ("Bet ETH goes up", "Protect my ETH from a drop", "Cheapest way to speculate on ETH this week").
2. User sends a prompt.
3. Agent calls the Thetanuts MCP server to read live OptionBook orders and market data.
4. Agent picks the best-matching listed order and returns a plain-English trade summary (cost, payoff, expiry, breakeven).
5. User taps **Confirm**.
6. App signs the transaction with the connected/disposable wallet and submits it via the SDK.
7. App shows a success state with the tx hash and a link to BaseScan.
8. Position appears in a simple "My Trades" list.

## 8. Architecture (high level)

- **Frontend:** Next.js/React web app — chat UI + trade confirmation card + trades list.
- **Agent layer:** LLM (Gemini, tool-use) with access to the Thetanuts MCP server's tools (read orders, get market data, build transaction). The LLM decides *which* order/structure to propose — this is what keeps the options "load-bearing."
- **Signing service:** Small backend piece that takes the MCP-built transaction and signs/broadcasts it using a disposable wallet's private key (`THETANUTS_PRIVATE_KEY`, never committed, `.env` only).
- **Chain:** Base mainnet (chainId 8453), via a paid Alchemy/Infura RPC key (not the public endpoint).

```
User → Web UI → LLM agent ⇄ Thetanuts MCP server (reads, prices, builds tx)
                     ↓
              Signing service (signs + broadcasts)
                     ↓
              Base mainnet / Thetanuts OptionBook
```

## 9. Team of 4 — feature-based ownership

Instead of splitting by layer (one frontend person, one backend person, etc.), each teammate owns one **feature end-to-end** — their own slice of frontend, backend, blockchain, agent, and product thinking. This avoids hand-off bottlenecks (nobody is blocked waiting on "the blockchain person") and means every teammate can demo their own piece independently.

| Feature | Owner | What they build across every layer |
|---|---|---|
| **1. Chat & Intent Parsing**<br>*"Turn plain English into a trade request"* | Person A | **Frontend:** chat box UI + example prompts. **Agent:** prompt design and LLM tool-use setup so the model extracts structured intent (asset, direction, size, timeframe) from free text. **Blockchain:** none required yet. **Product:** defines the example prompts a real target user would type. |
| **2. Trade Discovery & Pricing**<br>*"Find and price the actual on-chain trade"* | Person B | **Frontend:** the trade summary card (cost, payoff, expiry, breakeven, in plain English). **Agent:** calling the Thetanuts MCP server to fetch live OptionBook orders/market data and picking the best match for the parsed intent. **Blockchain:** understanding order/RFQ data shapes returned by the SDK. **Product:** makes sure the summary is honestly understandable to a non-trader. |
| **3. Trade Execution & Confirmation**<br>*"Actually sign and send the trade"* | Person C | **Frontend:** confirm button + success/failure state + tx hash / BaseScan link. **Backend:** the signing service that takes the MCP-built transaction and broadcasts it. **Blockchain:** wallet setup (`thetanuts wallet create`), RPC key, `.env` handling, `--dry-run` testing, exact-amount approvals. **Product:** makes sure a failed trade fails safely and legibly. |
| **4. Positions, Testing & Pitch**<br>*"Prove it works and explain why it matters"* | Person D | **Frontend:** the "My Trades" list view. **Backend/Agent:** pulls position data back from the SDK/MCP to display. **Blockchain:** owns end-to-end testing of real fills (the person most likely to be running `--dry-run` → real ~$1 trades repeatedly). **Product:** owns the target-user narrative, demo script, and judging-criteria checklist. |

Each feature is a vertical slice, but all four share the same underlying agent/MCP/signing plumbing — so pairing up on the shared plumbing (RPC + wallet + MCP connection) in the first few hours before splitting off into features is worth it.

## 10. Suggested timeline (for a ~48hr hackathon)

- **Hours 0–4:** RPC key, disposable wallet, SDK/CLI/MCP install, run the 30-second connectivity check.
- **Hours 4–10:** Agent can read live orders and produce a correct plain-English trade summary (no signing yet).
- **Hours 10–16:** Signing service wired up; first `--dry-run` trade; first real ~$1 fill on mainnet.
- **Hours 16–30:** Frontend chat UI + confirmation card + trades list built around the working backend.
- **Hours 30–40:** End-to-end polish, error handling, a couple more real test fills.
- **Hours 40–48:** Demo script, screenshots/tx links as backup proof, pitch narrative, buffer for bugs.

## 11. Risks

| Risk | Mitigation |
|---|---|
| LLM misreads intent and proposes a wrong trade | Always show a plain-English confirmation step before signing; never auto-fill |
| RPC rate-limiting mid-hackathon | Use a paid Alchemy/Infura key from hour 0, not the public endpoint |
| No matching order on the book for a given ask | Fall back to RFQ or narrow MVP prompts to instruments known to be listed |
| Running out of time before a real fill | Get one real ~$1 fill working by hour ~16 as a hard checkpoint, before frontend polish |

## 12. Judging criteria alignment

- **Does it work?** One real fill on Base mainnet, shown via tx hash — not a mockup.
- **Are the options load-bearing?** The LLM chooses the specific order/trade from live data; nothing is hardcoded.
- **Does it fit the market?** Target user = crypto-native users who avoid options because of UX complexity; pitch = "say what you want, we handle strikes and expiries."
