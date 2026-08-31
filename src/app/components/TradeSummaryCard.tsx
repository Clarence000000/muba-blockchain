import React from "react";

interface TradeSummaryCardProps {
  tradeDraftId?: string | null;
}

export function TradeSummaryCard({ tradeDraftId }: TradeSummaryCardProps) {
  if (!tradeDraftId) return null;

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[#101827] via-[#0d1422] to-[#101827] text-white border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold tracking-wider uppercase rounded-bl-lg border-l border-b border-cyan-500/30">
        Proposed Strategy
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-semibold text-cyan-400">Thetanuts Option Strategy</span>
      </div>

      <p className="text-xs text-slate-300 mb-3">
        Trade draft initialized. Ready for RFQ quote discovery and on-chain execution.
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Draft ID: {tradeDraftId}</span>
        <span className="text-cyan-400 font-mono text-[11px]">Base Mainnet</span>
      </div>
    </div>
  );
}
