import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { runAgent } from "../lib/agent/runAgent";

const testPrompts = [
  "Bet ETH goes up in the next few days",
  "Protect my ETH from a drop this week",
  "Cheapest way to speculate on ETH price",
  "I have $50 and I think ETH drops — how do I profit?",
  "Hello, what can you do?",
];

async function runTests() {
  console.log("=== Testing OptionsCopilot Intent Extraction ===\n");
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

  for (const prompt of testPrompts) {
    console.log(`\n--------------------------------------------------`);
    console.log(`[User Input]: "${prompt}"`);
    try {
      const result = await runAgent("test-session-1", prompt, []);
      console.log(`[AI Reply]:`, result.reply);
      console.log(`[Extracted Intent]:`, JSON.stringify(result.intent, null, 2));
    } catch (err: any) {
      console.error(`[Error]:`, err.message || err);
    }
  }
}

runTests();
