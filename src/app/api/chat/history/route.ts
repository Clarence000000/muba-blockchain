import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../prisma/db";

// GET /api/chat/history?sessionId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId parameter is required" },
        { status: 400 }
      );
    }

    // 1. Fetch all messages for session
    let allSessionMessages: any[] = [];
    try {
      allSessionMessages = await db.orm.public.ChatMessage
        .where({ sessionId })
        .all();
    } catch (dbErr) {
      console.warn("Could not fetch messages from DB:", dbErr);
    }

    // Sort by createdAt ascending (chronological order)
    allSessionMessages.sort((a: any, b: any) => {
      const tA = new Date(a.createdAt?.epochMilliseconds ?? a.createdAt).getTime();
      const tB = new Date(b.createdAt?.epochMilliseconds ?? b.createdAt).getTime();
      return tA - tB;
    });

    // 2. Fetch any Trades associated with this user / session
    let trades: any[] = [];
    try {
      trades = await db.orm.public.Trade.all();
    } catch (tradeErr) {
      console.warn("Could not fetch trades from DB:", tradeErr);
    }

    // Map trade by chatMessageId if present
    const tradeMapByMessageId = new Map<string, string>();
    for (const tr of trades) {
      if (tr.chatMessageId) {
        tradeMapByMessageId.set(tr.chatMessageId, tr.id);
      }
    }

    // Format messages for UI
    const formattedMessages = allSessionMessages.map((msg: any) => {
      const tradeDraftId = tradeMapByMessageId.get(msg.id);
      return {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        tradeDraftId: tradeDraftId || undefined,
      };
    });

    return NextResponse.json({
      sessionId,
      messages: formattedMessages,
    });
  } catch (error: any) {
    console.error("GET /api/chat/history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
