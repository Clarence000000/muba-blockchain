import { NextResponse } from "next/server";
import { db } from "../../../prisma/db";
import { Temporal } from "@js-temporal/polyfill";

// ---------------------------------------------------------------------------
// GET /api/test-seed
//
// Creates (or resets) a single E2E test Trade and returns it.
// Upserts a deterministic "dev wallet" User so the FK is always satisfied.
// ---------------------------------------------------------------------------

const SEED_WALLET = "0x0301a6a0e5Ce452a29681fE90dA4cA1933f5482f";
const SEED_TRADE_ID = "e2e-seed-trade-001";

// A 0-value self-transfer: passes estimateGas, costs ~21 000 gas on Base.
const RAW_QUOTE_TX = {
  to: SEED_WALLET,
  value: "0",
  data: "0x",
};

export async function GET() {
  try {
    const orm = (db.orm as any).public;

    // 1. Ensure the test user exists
    let user = await orm.User.where({ walletAddress: SEED_WALLET }).first();
    if (!user) {
      user = await orm.User.create({ walletAddress: SEED_WALLET });
    }

    // 2. Delete any stale seed trade so we always start from "proposed"
    await orm.Trade.where({ id: SEED_TRADE_ID }).delete();

    // 3. Create a fresh proposed trade
    const expiryInstant = Temporal.Now.instant().add({ hours: 168 }); // 7 days

    const trade = await orm.Trade.create({
      id: SEED_TRADE_ID,
      userId: user.id,
      asset: "ETH",
      optionType: "call",
      strike: 3500,
      expiry: expiryInstant,
      premium: 42.5,
      sizeUsd: 1000,
      status: "proposed",
      orderSource: "e2e-test",
      rawQuote: RAW_QUOTE_TX,
    });

    return NextResponse.json({ ok: true, trade });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[test-seed] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
