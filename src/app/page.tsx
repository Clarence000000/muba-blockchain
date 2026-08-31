"use client";

import React, { useState } from "react";
import { Header } from "./components/Header";
import { ChatWindow } from "./components/ChatWindow";
import { MyTrades } from "./components/MyTrades";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "trades">("chat");

  return (
    <main className="flex flex-col min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar Matching Mockup */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main View Switching */}
      <div className="flex-1 flex flex-col justify-between">
        {activeTab === "chat" ? <ChatWindow /> : <MyTrades />}
      </div>
    </main>
  );
}
