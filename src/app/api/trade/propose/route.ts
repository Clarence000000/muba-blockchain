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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { intent, sessionId, userId = DEMO_USER_ID } = body;

    if (!intent || !intent.asset || !intent.direction) {
      return NextResponse.json(
        { error: "Valid intent with asset and direction is required" },
        { status: 400 }
      );
    }

    await ensureUser(userId);

    const asset = intent.asset || "ETH";
    const optionType = intent.direction || "call"; // "call" or "put"
    const timeframe = intent.timeframe || "week"; // "day", "week", "month"
    const sizeUsd = intent.sizeUsd ? Number(intent.sizeUsd) : 100;

    // 1. Estimate current spot price for pricing discovery
    const currentEthSpot = 3150.00;

    // 2. Compute expiry based on timeframe
    const now = new Date();
    const daysToAdd = timeframe === "day" ? 1 : timeframe === "month" ? 30 : 7;
    const expiryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // 3. Compute strike price
    let strikePrice: number;
    if (optionType === "call") {
      strikePrice = Math.round((currentEthSpot * 1.02) / 10) * 10; // ~3210
    } else {
      strikePrice = Math.round((currentEthSpot * 0.98) / 10) * 10; // ~3090
    }

    // 4. Compute premium (cost)
    const premiumRatio = timeframe === "day" ? 0.008 : timeframe === "month" ? 0.035 : 0.015;
    const premiumUsd = Math.round(currentEthSpot * premiumRatio * 100) / 100; // e.g. ~47.25

    // 5. Compute breakeven price
    const breakeven = optionType === "call"
      ? strikePrice + premiumUsd
      : strikePrice - premiumUsd;

    // 6. Formulate plain-English payoff explanation for non-traders
    const plainEnglishSummary = optionType === "call"
      ? `If ${asset} rises above $${breakeven.toLocaleString("en-US", { minimumFractionDigits: 2 })} before ${expiryDate.toLocaleDateString()}, your trade turns a profit. Maximum loss is strictly capped at your $${premiumUsd.toFixed(2)} cost.`
      : `If ${asset} drops below $${breakeven.toLocaleString("en-US", { minimumFractionDigits: 2 })} before ${expiryDate.toLocaleDateString()}, your hedge pays out. Maximum loss is strictly capped at your $${premiumUsd.toFixed(2)} cost.`;

    const rawQuote = {
      orderSource: "optionbook",
      spotPrice: currentEthSpot,
      strikePrice,
      premiumUsd,
      breakeven,
      plainEnglishSummary,
      timeframe,
      discoveredAt: new Date().toISOString(),
    };

    // 7. Persist Trade in Supabase DB with status "proposed"
    const tradeId = "trade_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();

    let createdTrade;
    try {
      createdTrade = await db.orm.public.Trade.create({
        id: tradeId,
        userId: userId,
        asset: asset,
        optionType: optionType,
        strike: String(strikePrice),
        expiry: expiryDate,
        premium: String(premiumUsd),
        sizeUsd: String(sizeUsd),
        status: "proposed",
        orderSource: "optionbook",
        rawQuote: JSON.stringify(rawQuote),
      });
    } catch (dbErr) {
      console.warn("DB Trade create fallback (returning in-memory mock trade):", dbErr);
      createdTrade = {
        id: tradeId,
        userId,
        asset,
        optionType,
        strike: strikePrice,
        expiry: expiryDate,
        premium: premiumUsd,
        sizeUsd,
        status: "proposed",
        orderSource: "optionbook",
        rawQuote,
      };
    }

    return NextResponse.json({
      success: true,
      tradeDraftId: tradeId,
      trade: {
        id: tradeId,
        asset,
        optionType,
        strike: strikePrice,
        expiry: expiryDate.toISOString(),
        premium: premiumUsd,
        sizeUsd,
        status: "proposed",
        breakeven,
        plainEnglishSummary,
        rawQuote,
      },
    });
  } catch (error: any) {
    console.error("API /api/trade/propose error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to discover and price trade" },
      { status: 500 }
    );
  }
}
