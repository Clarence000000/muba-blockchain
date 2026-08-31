import React from "react";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 p-3.5 bg-[#121a2b] rounded-2xl rounded-tl-sm w-fit border border-slate-800 shadow-md">
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      <span className="text-xs font-mono text-slate-400">Analyzing options market...</span>
      <div className="flex space-x-1 items-center ml-1">
        <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
