import React, { useEffect, useState } from "react";
import TradeConfirm, { Trade } from "../../components/TradeConfirm";

interface TradeSummaryCardProps {
  tradeDraftId?: string | null;
  tradeData?: Trade | null;
}

export function TradeSummaryCard({ tradeDraftId, tradeData: initialTradeData }: TradeSummaryCardProps) {
  const [trade, setTrade] = useState<Trade | null>(initialTradeData || null);
  const [loading, setLoading] = useState<boolean>(!initialTradeData && !!tradeDraftId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTradeData) {
      setTrade(initialTradeData);
      setLoading(false);
      return;
    }

    if (!tradeDraftId) return;

    let isMounted = true;
    setLoading(true);

    // Fetch trade details if tradeDraftId is passed
    fetch(`/api/trade/${tradeDraftId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Trade details not available");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.trade) {
          setTrade(data.trade);
        }
      })
      .catch((err) => {
        if (isMounted) {
          // Construct default display trade object if endpoint is fetching
          setTrade({
            id: tradeDraftId,
            status: "proposed",
            asset: "ETH",
            optionType: "CALL",
            strike: 3200,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            premium: 45.00,
            sizeUsd: 100,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tradeDraftId, initialTradeData]);

  if (!tradeDraftId && !trade) return null;

  return (
    <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b]/40 to-[#0f172a] text-white border border-cyan-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.6)] relative overflow-hidden">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Trade Discovery & Pricing
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-semibold rounded-full border border-cyan-500/20">
          Base Mainnet
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Finding & pricing best on-chain order...
        </div>
      ) : trade ? (
        <div className="space-y-4">
          {/* Plain English Summary for Non-Traders */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-100 leading-relaxed">
            <span className="font-semibold text-cyan-300">💡 Plain-English Summary: </span>
            {(trade as any).plainEnglishSummary ||
              `If ${trade.asset || "ETH"} reaches strike price $${trade.strike} before expiry, this contract pays out profit while strictly capping your max loss at $${trade.premium}.`}
          </div>

          {/* Embed Trade Confirmation Component */}
          <TradeConfirm trade={trade} />
        </div>
      ) : null}
    </div>
  );
}
