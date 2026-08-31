"use client";

import React from "react";

export function MyTrades() {
  const mockTrades = [
    {
      id: "trade_8f912a",
      asset: "ETH",
      type: "CALL",
      strike: "$2,850",
      expiry: "Mar 07, 2026 (7d)",
      sizeUsd: "$150.00",
      premium: "$12.40",
      status: "Filled",
      pnl: "+$28.50 (+19%)",
      isProfitable: true,
    },
    {
      id: "trade_4e109b",
      asset: "ETH",
      type: "PUT",
      strike: "$2,600",
      expiry: "Mar 14, 2026 (14d)",
      sizeUsd: "$200.00",
      premium: "$18.20",
      status: "Filled",
      pnl: "-$4.10 (-2.2%)",
      isProfitable: false,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto px-4 py-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Open Option Positions</h2>
          <p className="text-xs text-slate-400 mt-1">Live positions executed on Base Mainnet via Thetanuts</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-[#111928] border border-slate-800 text-xs font-mono text-cyan-400">
          2 Active Contracts
        </div>
      </div>

      <div className="space-y-3">
        {mockTrades.map((trade) => (
          <div
            key={trade.id}
            className="p-4 rounded-xl bg-[#0f1726]/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                  trade.type === "CALL"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {trade.type}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{trade.asset} {trade.strike}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162234] text-slate-300 border border-slate-700">
                    {trade.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Expires {trade.expiry}</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
              <div>
                <span className="text-[11px] text-slate-400 block">Position Size</span>
                <span className="text-xs font-mono font-medium text-slate-200">{trade.sizeUsd}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Unrealized P&L</span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    trade.isProfitable ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {trade.pnl}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
