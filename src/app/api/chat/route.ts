import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "../../../../lib/agent/runAgent";
import { db } from "../../../prisma/db";

const DEMO_USER_ID = "demo-user";
const DEMO_WALLET = "0x000000000000000000000000000000000000dEaD";

async function ensureDemoUserAndSession(sessionId: string) {
  try {
    // 1. Check/create demo user
    const existingUser = await db.orm.public.User.where({ id: DEMO_USER_ID }).first();
    if (!existingUser) {
      await db.orm.public.User.create({
        id: DEMO_USER_ID,
        walletAddress: DEMO_WALLET,
      });
    }

    // 2. Check/create session
    const existingSession = await db.orm.public.ChatSession.where({ id: sessionId }).first();
    if (!existingSession) {
      await db.orm.public.ChatSession.create({
        id: sessionId,
        userId: DEMO_USER_ID,
      });
    }
  } catch (err) {
    console.warn("DB session/user ensure warning (will continue):", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, message } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid sessionId is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Ensure user and chat session exist in DB
    await ensureDemoUserAndSession(sessionId);

    // 2. Persist user message in DB
    try {
      await db.orm.public.ChatMessage.create({
        id: "msg_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now(),
        sessionId,
        role: "user",
        content: message.trim(),
      });
    } catch (dbErr) {
      console.warn("Could not persist user message to DB:", dbErr);
    }

    // 3. Load conversation history (latest 10 messages)
    let history: Array<{ role: string; content: string }> = [];
    try {
      const allSessionMessages = await db.orm.public.ChatMessage
        .where({ sessionId })
        .all();

      // Sort by createdAt ascending (oldest to newest for LLM context), taking the last 10
      const recent = allSessionMessages
        .sort((a: any, b: any) => {
          const tA = a.createdAt?.epochMilliseconds ?? (new Date(a.createdAt).getTime());
          const tB = b.createdAt?.epochMilliseconds ?? (new Date(b.createdAt).getTime());
          return tA - tB;
        })
        .slice(-10);

      history = recent.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
    } catch (historyErr) {
      console.warn("Could not load history from DB, proceeding with fresh context:", historyErr);
    }

    // 4. Run LLM Agent to extract intent & generate reply
    const { reply, intent } = await runAgent(sessionId, message, history);

    // 5. Persist assistant reply to DB
    const assistantMsgId = "msg_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    try {
      await db.orm.public.ChatMessage.create({
        id: assistantMsgId,
        sessionId,
        role: "assistant",
        content: reply,
      });
    } catch (dbErr) {
      console.warn("Could not persist assistant reply to DB:", dbErr);
    }

    // 6. If intent was extracted, attempt to propose trade to Person B's endpoint
    let tradeDraftId: string | null = null;
    if (intent) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const tradeRes = await fetch(`${baseUrl}/api/trade/propose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, sessionId, chatMessageId: assistantMsgId }),
        });

        if (tradeRes.ok) {
          const tradeData = await tradeRes.json();
          tradeDraftId = tradeData.tradeDraftId ?? null;
        }
      } catch (tradeErr) {
        // Safe fallback: Person B's route is not ready yet or internal network unreachable
        console.warn("Person B trade propose endpoint not available:", tradeErr);
      }
    }

    return NextResponse.json({
      reply,
      intent,
      tradeDraftId,
    });
  } catch (error: any) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
