"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Trade {
  id: string;
  status: "proposed" | "submitted" | "filled" | "failed" | string;
  txHash?: string | null;
  asset?: string;
  optionType?: string;
  strike?: number | string;
  expiry?: string;
  premium?: number | string;
  sizeUsd?: number | string;
}

interface TradeConfirmProps {
  trade: Trade;
  /** Called after a successful on-chain confirmation so the parent can refresh. */
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TradeConfirm
// ---------------------------------------------------------------------------

export default function TradeConfirm({ trade: initialTrade, onSuccess }: TradeConfirmProps) {
  const [trade, setTrade] = useState<Trade>(initialTrade);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Core action ──────────────────────────────────────────────────────────
  async function handleConfirm() {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/trade/${trade.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: { success: boolean; txHash?: string; error?: string } =
        await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? `Server error (${res.status})`);
        return;
      }

      if (data.success && data.txHash) {
        setTrade((prev) => ({ ...prev, status: "filled", txHash: data.txHash }));
        onSuccess?.();
      } else if (data.success) {
        setTrade((prev) => ({ ...prev, status: "filled" }));
        onSuccess?.();
      } else {
        setTrade((prev) => ({ ...prev, status: "failed" }));
        setErrorMsg(data.error ?? "Transaction failed on-chain.");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Unexpected network error."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function fmt(value: number | string | undefined) {
    if (value === undefined || value === null) return "—";
    return String(value);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <span className="text-lg font-semibold text-white tracking-tight">
          Trade Confirmation
        </span>
        <StatusBadge status={trade.status} />
      </div>

      {/* Order details */}
      <div className="px-6 py-5 space-y-3 text-sm">
        <DetailRow label="Asset" value={fmt(trade.asset)} />
        <DetailRow label="Option Type" value={fmt(trade.optionType)} />
        <DetailRow label="Strike" value={fmt(trade.strike)} />
        <DetailRow
          label="Expiry"
          value={trade.expiry ? new Date(trade.expiry).toLocaleString() : "—"}
        />
        <DetailRow label="Premium" value={fmt(trade.premium)} />
        <DetailRow label="Size (USD)" value={fmt(trade.sizeUsd)} />
      </div>

      {/* Status-driven action area */}
      <div className="px-6 pb-6 space-y-3">
        {/* ── proposed ── */}
        {trade.status === "proposed" && (
          <button
            id="confirm-trade-btn"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="
              w-full flex items-center justify-center gap-2
              rounded-xl px-5 py-3
              bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
              text-white font-semibold text-sm tracking-wide
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent
            "
          >
            {isSubmitting ? (
              <>
                <Spinner />
                <span>Submitting…</span>
              </>
            ) : (
              "Confirm Trade"
            )}
          </button>
        )}

        {/* ── submitted ── */}
        {trade.status === "submitted" && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3">
            <Spinner />
            <span className="text-yellow-300 text-sm font-medium">
              Transaction in progress…
            </span>
          </div>
        )}

        {/* ── filled ── */}
        {trade.status === "filled" && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 space-y-2">
            <p className="text-emerald-300 text-sm font-semibold">
              Transaction confirmed
            </p>
            {trade.txHash && (
              <a
                href={`https://basescan.org/tx/${trade.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-200 underline underline-offset-2 transition-colors"
              >
                View on BaseScan
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* ── failed ── */}
        {trade.status === "failed" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3">
              <p className="text-red-300 text-sm font-medium">
                Transaction failed. You may retry below.
              </p>
            </div>
            <button
              id="retry-trade-btn"
              onClick={() => {
                setTrade((prev) => ({ ...prev, status: "proposed" }));
                setErrorMsg(null);
              }}
              className="
                w-full rounded-xl px-5 py-3
                border border-white/20 hover:border-white/40
                text-white/70 hover:text-white text-sm font-medium
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-white/30
              "
            >
              Try Again
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <p className="text-xs text-red-400 leading-snug pt-1">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    proposed:  "bg-blue-500/20 text-blue-300 border-blue-400/30",
    submitted: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
    filled:    "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    failed:    "bg-red-500/20 text-red-300 border-red-400/30",
  };
  const cls = variants[status] ?? "bg-white/10 text-white/50 border-white/10";

  return (
    <span
      className={`ml-auto inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
