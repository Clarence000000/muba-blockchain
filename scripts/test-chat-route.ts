import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { POST } from "../src/app/api/chat/route";
import { NextRequest } from "next/server";

async function testChatRoute() {
  console.log("=== Testing /api/chat Route Handler directly ===");
  
  const testPayload = {
    sessionId: "test-integration-session-" + Date.now(),
    message: "I want to bet ETH goes up this week with $150",
  };

  const req = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  try {
    const res = await POST(req);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Route test error:", err);
  }
}

testChatRoute();
