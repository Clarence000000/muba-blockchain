"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessageUI } from "../../../lib/agent/types";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { PromptChips } from "./PromptChips";
import { TradeSummaryCard } from "./TradeSummaryCard";

interface ChatSessionItem {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
}

export function ChatWindow() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load message history for a given session ID
  const loadHistory = async (sid: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sid)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn("Failed to load session history:", err);
      setMessages([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Fetch session list on mount and load default session
  useEffect(() => {
    async function initSessions() {
      try {
        const res = await fetch("/api/chat/sessions");
        let sessionList: ChatSessionItem[] = [];
        if (res.ok) {
          const data = await res.json();
          sessionList = data.sessions || [];
        }

        const storedSid = localStorage.getItem("options_copilot_session_id");
        let activeSid = "";

        if (storedSid && sessionList.some((s) => s.id === storedSid)) {
          activeSid = storedSid;
        } else if (sessionList.length > 0) {
          activeSid = sessionList[0].id;
        } else {
          // No existing sessions found, create a new session
          const createRes = await fetch("/api/chat/sessions", { method: "POST" });
          if (createRes.ok) {
            const createData = await createRes.json();
            const newSession = createData.session;
            sessionList = [newSession];
            activeSid = newSession.id;
          }
        }

        setSessions(sessionList);
        if (activeSid) {
          setSessionId(activeSid);
          localStorage.setItem("options_copilot_session_id", activeSid);
          await loadHistory(activeSid);
        } else {
          setIsHistoryLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize sessions:", err);
        setIsHistoryLoading(false);
      }
    }

    initSessions();
  }, []);

  // Auto-scroll to bottom on message change or loading state
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Switch active session
  const handleSelectSession = async (sid: string) => {
    if (sid === sessionId || isLoading) return;
    setSessionId(sid);
    localStorage.setItem("options_copilot_session_id", sid);
    await loadHistory(sid);
  };

  // Create a new chat session
  const handleNewChat = async () => {
    if (isLoading) return;
    setError(null);
    try {
      const res = await fetch("/api/chat/sessions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const newSession: ChatSessionItem = data.session;
        setSessions((prev) => [newSession, ...prev]);
        setSessionId(newSession.id);
        localStorage.setItem("options_copilot_session_id", newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create new chat session:", err);
      setError("Could not create a new chat session.");
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage ?? input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setInput("");

    // Ensure session exists
    let activeSid = sessionId;
    if (!activeSid) {
      activeSid = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      setSessionId(activeSid);
      localStorage.setItem("options_copilot_session_id", activeSid);
    }

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
          sessionId: activeSid,
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

      // Refresh sessions list to keep ordering updated
      const sessRes = await fetch("/api/chat/sessions");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData.sessions || []);
      }
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
  const currentSessionTitle =
    sessions.find((s) => s.id === sessionId)?.title || "Chat Session";

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#090d16]">
      {/* Collapsible Left Sidebar for Chat History */}
      <aside
        className={`transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-[#0c121e]/95 backdrop-blur-md flex flex-col z-20 shrink-0 ${
          isSidebarOpen ? "w-64" : "w-14"
        }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
          {isSidebarOpen ? (
            <>
              <button
                onClick={handleNewChat}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                title="Start a new chat session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Chat</span>
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-3 py-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={handleNewChat}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="New Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Chat History Sessions List */}
        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Chat History
            </div>

            {sessions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500 text-center italic">
                No past chats found
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === sessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                      isActive
                        ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-medium shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="truncate flex-1">{s.title}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden justify-between max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* Top Header Bar inside Main View */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-[#111928] border border-slate-800 rounded-lg transition-colors cursor-pointer mr-1"
                title="Show history sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-2">
              <span>{currentSessionTitle}</span>
            </h2>
          </div>

          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111928] hover:bg-[#162136] border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* History Loading State */}
        {isHistoryLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading conversation history...</p>
          </div>
        ) : (
          /* Scrollable Message Thread or Initial Hero */
          <div className="flex-1 overflow-y-auto flex flex-col">
            {isInitialState ? (
              /* Empty / Initial Hero View (Matching Mockup) */
              <div className="flex-1 flex flex-col items-center justify-center text-center my-auto animate-fade-in py-4">
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
                        <path d="M12 7v4" />
                      </svg>
                    </div>
                    <ThinkingIndicator />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

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
          {/* Suggestion Chips above input if in active conversation */}
          {!isInitialState && !isHistoryLoading && (
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
              disabled={isLoading || isHistoryLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Copilot for trade ideas or strategy analysis..."
              className="flex-1 max-h-28 min-h-[38px] py-2 px-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none disabled:opacity-50 font-sans"
            />

            {/* Send Button */}
            <button
              type="button"
              disabled={isLoading || isHistoryLoading || !input.trim()}
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
    </div>
  );
}
