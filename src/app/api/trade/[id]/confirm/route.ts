import { NextResponse } from "next/server";
import { db } from "../../../../../prisma/db";
import { signAndSubmit } from "../../../../../../lib/chain/signer";

// ---------------------------------------------------------------------------
// POST /api/trade/[id]/confirm
//
// Status machine:
//   proposed → submitted → filled
//                       ↘ failed
// ---------------------------------------------------------------------------

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const orm = (db.orm as any).public;

    // ── 1. Fetch the trade record ──────────────────────────────────────────
    const trade = await orm.Trade.where({ id }).first();

    if (!trade) {
      return NextResponse.json(
        { success: false, error: `Trade not found: ${id}` },
        { status: 404 },
      );
    }

    // ── 2. Guard against duplicate confirmations ───────────────────────────
    if (trade.status !== "proposed") {
      return NextResponse.json(
        {
          success: false,
          error: `Trade is not in a confirmable state. Current status: "${trade.status}"`,
        },
        { status: 400 },
      );
    }

    // ── 3. Mark as submitted (idempotency lock before hitting the chain) ───
    await orm.Trade.where({ id }).update({ status: "submitted" });

    // ── 4. Sign & broadcast ────────────────────────────────────────────────
    const result = await signAndSubmit(trade.rawQuote as any);

    // ── 5. Persist outcome ─────────────────────────────────────────────────
    if (result.success) {
      await orm.Trade.where({ id }).update({
        status: "filled",
        txHash: result.txHash,
      });

      return NextResponse.json(
        { success: true, txHash: result.txHash },
        { status: 200 },
      );
    } else {
      await orm.Trade.where({ id }).update({ status: "failed" });

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 200 },
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[confirm] Unexpected error for trade ${id}:`, message);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${message}` },
      { status: 500 },
    );
  }
}
