"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessageUI } from "../../../lib/agent/types";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { PromptChips } from "./PromptChips";
import { TradeSummaryCard } from "./TradeSummaryCard";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or retrieve persistent sessionId
  useEffect(() => {
    let sid = localStorage.getItem("options_copilot_session_id");
    if (!sid) {
      sid = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("options_copilot_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Auto-scroll to bottom on message change or loading state
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage ?? input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setInput("");

    const userMessageId = "user_" + Date.now();
    const newUserMessage: ChatMessageUI = {
      id: userMessageId,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId || "demo-session",
          message: textToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessageUI = {
        id: "assistant_" + Date.now(),
        role: "assistant",
        content: data.reply || "I have analyzed your request.",
        tradeDraftId: data.tradeDraftId,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to process message. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto px-4 py-6 justify-between">
      {/* Scrollable Message Thread or Initial Hero */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {isInitialState ? (
          /* Empty / Initial Hero View (Matching Mockup) */
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto animate-fade-in">
            {/* Glowing Bot Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full bg-[#121927] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.3)]">
                <svg
                  className="w-8 h-8 text-cyan-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16.01" strokeWidth="3" />
                  <line x1="16" y1="16" x2="16" y2="16.01" strokeWidth="3" />
                </svg>
              </div>
            </div>

            {/* Heading & Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-sans">
              What&apos;s your market outlook today?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed font-sans">
              I can analyze current conditions and propose options strategies across Base network.
            </p>

            {/* 4 Prompt Chips */}
            <PromptChips
              disabled={isLoading}
              onSelect={(promptText) => {
                handleSendMessage(promptText);
              }}
            />
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="space-y-4 py-4 max-w-3xl w-full mx-auto">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} transition-all duration-200`}
                >
                  <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[80%]">
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#121927] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0 mt-1">
                        <svg
                          className="w-4 h-4 text-cyan-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="11" width="18" height="10" rx="2" />
                          <circle cx="12" cy="5" r="2" />
                          <path d="M12 7v4" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#132238] border border-cyan-500/30 text-white rounded-tr-sm shadow-md font-medium"
                          : "bg-[#101726] text-slate-200 rounded-tl-sm border border-slate-800 shadow-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.tradeDraftId && (
                        <TradeSummaryCard tradeDraftId={msg.tradeDraftId} />
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#1c2a40] border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-mono shrink-0 mt-1">
                        You
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-[#121927] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                  </svg>
                </div>
                <ThinkingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="max-w-3xl w-full mx-auto mb-3 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 flex items-center justify-between shadow-lg">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold hover:text-red-200 px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Floating Input Bar & Disclaimer */}
      <div className="w-full max-w-3xl mx-auto pt-2">
        {/* Suggestion Chips above input if in conversation */}
        {!isInitialState && (
          <div className="mb-2">
            <PromptChips
              disabled={isLoading}
              onSelect={(promptText) => {
                handleSendMessage(promptText);
              }}
            />
          </div>
        )}

        {/* Input Pill Container */}
        <div className="bg-[#0f1726]/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-2 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
          {/* Plus Button */}
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#162136] transition-colors cursor-pointer shrink-0"
            title="Options action menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot for trade ideas or strategy analysis..."
            className="flex-1 max-h-28 min-h-[38px] py-2 px-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none disabled:opacity-50 font-sans"
          />

          {/* Send Button */}
          <button
            type="button"
            disabled={isLoading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="w-10 h-10 bg-[#16283f] hover:bg-[#1d3554] active:scale-95 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
          >
            <svg
              className="w-4 h-4 transform rotate-45 -translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        {/* Footer Disclaimer */}
        <p className="text-[11px] font-mono text-slate-500 text-center mt-2.5">
          AI responses may be inaccurate. Confirm all trades before execution.
        </p>
      </div>
    </div>
  );
}
