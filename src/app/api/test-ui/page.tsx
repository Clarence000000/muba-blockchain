"use client";

import { useEffect, useState } from "react";
import TradeConfirm, { Trade } from "@/components/TradeConfirm";

// ---------------------------------------------------------------------------
// E2E Test Page  –  /api/test-ui
//
// On mount, calls /api/test-seed to insert a fresh "proposed" Trade row,
// then renders <TradeConfirm> wired to the real DB record.
// Click "Confirm Trade" to trigger the full chain:
//   Browser → POST /api/trade/:id/confirm → signer.ts → Base mainnet → DB
// ---------------------------------------------------------------------------

type SeedResult =
  | { ok: true; trade: Trade }
  | { ok: false; error: string };

export default function E2ETestPage() {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [seeding, setSeeding] = useState(true);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    async function seed() {
      setSeeding(true);
      setSeedError(null);
      try {
        const res = await fetch("/api/test-seed");
        const data: SeedResult = await res.json();
        if (!res.ok || !data.ok) {
          setSeedError((data as { ok: false; error: string }).error ?? "Seed failed");
        } else {
          setTrade(data.trade);
        }
      } catch (e: unknown) {
        setSeedError(e instanceof Error ? e.message : String(e));
      } finally {
        setSeeding(false);
      }
    }
    seed();
  }, []);

  function handleSuccess() {
    // After a successful fill, re-seed so the page can be tested again
    // without a manual refresh.
    console.log("[E2E] onSuccess fired — trade filled on-chain.");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-8 p-8">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
          End-to-End Test Harness
        </p>
        <h1 className="text-white text-3xl font-bold tracking-tight">
          OptionsCopilot Execution Test
        </h1>
        <p className="text-white/40 text-sm">
          Seeds a real DB row → signs → broadcasts to Base mainnet → returns txHash
        </p>
      </div>

      {/* Status */}
      {seeding && (
        <div className="flex items-center gap-3 text-white/60 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Seeding test record…
        </div>
      )}

      {seedError && (
        <div className="w-full max-w-md rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4">
          <p className="text-red-300 text-sm font-medium">Seed error</p>
          <p className="text-red-400/80 text-xs mt-1 font-mono">{seedError}</p>
        </div>
      )}

      {/* Trade card */}
      {trade && (
        <div className="w-full max-w-md space-y-3">
          {/* Debug: show DB record ID */}
          <p className="text-center text-xs font-mono text-white/25">
            trade.id = {trade.id}
          </p>
          <TradeConfirm trade={trade} onSuccess={handleSuccess} />
          {/* Re-seed button */}
          <button
            onClick={() => {
              setTrade(null);
              setSeeding(true);
              setSeedError(null);
              fetch("/api/test-seed")
                .then((r) => r.json())
                .then((d: SeedResult) => {
                  if (d.ok) setTrade(d.trade);
                  else setSeedError((d as { ok: false; error: string }).error);
                })
                .catch((e: unknown) =>
                  setSeedError(e instanceof Error ? e.message : String(e))
                )
                .finally(() => setSeeding(false));
            }}
            className="
              w-full rounded-xl border border-white/10 hover:border-white/25
              py-2 text-xs text-white/40 hover:text-white/70
              transition-all duration-150
            "
          >
            Reset &amp; Re-seed
          </button>
        </div>
      )}
    </div>
  );
}