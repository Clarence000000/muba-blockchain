import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../prisma/db";

const DEMO_USER_ID = "demo-user";
const DEMO_WALLET = "0x000000000000000000000000000000000000dEaD";

async function ensureUser(userId: string) {
  try {
    const existingUser = await db.orm.public.User.where({ id: userId }).first();
    if (!existingUser) {
      await db.orm.public.User.create({
        id: userId,
        walletAddress: DEMO_WALLET,
      });
    }
  } catch (err) {
    console.warn("User validation check warning:", err);
  }
}

function formatSessionTitle(dateInput: any): string {
  try {
    const d = new Date(dateInput?.epochMilliseconds ?? dateInput);
    if (isNaN(d.getTime())) return "Chat Session";
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `Chat - ${month} ${day}, ${hours}:${mins}`;
  } catch {
    return "Chat Session";
  }
}

// GET /api/chat/sessions - Get all sessions for user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEMO_USER_ID;

    await ensureUser(userId);

    let allSessions: any[] = [];
    try {
      allSessions = await db.orm.public.ChatSession.where({ userId }).all();
    } catch (dbErr) {
      console.warn("Could not fetch sessions from DB:", dbErr);
    }

    // Sort descending by createdAt (newest first)
    allSessions.sort((a, b) => {
      const tA = new Date(a.createdAt?.epochMilliseconds ?? a.createdAt).getTime();
      const tB = new Date(b.createdAt?.epochMilliseconds ?? b.createdAt).getTime();
      return tB - tA;
    });

    const formattedSessions = allSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      createdAt: s.createdAt,
      title: formatSessionTitle(s.createdAt),
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error: any) {
    console.error("GET /api/chat/sessions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create a new chat session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || DEMO_USER_ID;

    await ensureUser(userId);

    const newSessionId = "session_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    let newSession: any = {
      id: newSessionId,
      userId,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await db.orm.public.ChatSession.create({
        id: newSessionId,
        userId,
      });
      if (created) {
        newSession = created;
      }
    } catch (dbErr) {
      console.warn("Could not persist new session to DB (using in-memory fallback):", dbErr);
    }

    return NextResponse.json({
      session: {
        id: newSession.id,
        userId: newSession.userId,
        createdAt: newSession.createdAt,
        title: formatSessionTitle(newSession.createdAt),
      },
    });
  } catch (error: any) {
    console.error("POST /api/chat/sessions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create chat session" },
      { status: 500 }
    );
  }
}
