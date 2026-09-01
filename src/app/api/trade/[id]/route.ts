import { NextResponse } from "next/server";
import { db } from "../../../../prisma/db";

// ---------------------------------------------------------------------------
// GET /api/trade/[id]
//
// Fetches details of a specific trade by ID from Supabase / Postgres DB.
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const orm = (db.orm as any).public;
    const trade = await orm.Trade.where({ id }).first();

    if (!trade) {
      return NextResponse.json(
        { success: false, error: `Trade not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trade: {
        ...trade,
        rawQuote: typeof trade.rawQuote === "string" ? JSON.parse(trade.rawQuote) : trade.rawQuote,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[trade/[id]] Error fetching trade ${id}:`, message);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
