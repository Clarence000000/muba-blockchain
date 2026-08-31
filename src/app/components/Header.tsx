"use client";

import React, { useState } from "react";

interface HeaderProps {
  activeTab: "chat" | "trades";
  onTabChange: (tab: "chat" | "trades") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const walletAddress = "0x71C849B749aB40484A9A690B445037d40Db53A9f";
  const displayAddress = "0x71C...3A9f";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange("chat")}>
            <span className="text-xl font-bold tracking-tight text-cyan-400 font-sans">
              OptionsCopilot
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button
              onClick={() => onTabChange("chat")}
              className={`relative py-5 font-medium transition-colors cursor-pointer ${
                activeTab === "chat"
                  ? "text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Copilot Chat
              {activeTab === "chat" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
            <button
              onClick={() => onTabChange("trades")}
              className={`relative py-5 font-medium transition-colors cursor-pointer ${
                activeTab === "trades"
                  ? "text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              My Trades
              {activeTab === "trades" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          </nav>
        </div>

        {/* Right Status Widgets */}
        <div className="flex items-center gap-3">
          {/* Balance Pill */}
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-[#111928] border border-slate-800/80 text-xs font-mono text-slate-300">
            $124.50 USDC
          </div>

          {/* Wallet Address Button */}
          <button
            onClick={handleCopy}
            title="Copy wallet address"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111928] hover:bg-[#162136] border border-slate-800/90 hover:border-slate-700 text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" strokeWidth="2" />
              <path
                strokeWidth="2"
                d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
              />
            </svg>
            <span>{copied ? "Copied!" : displayAddress}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
