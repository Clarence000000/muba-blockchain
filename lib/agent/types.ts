export type TradeIntent = {
  asset: "ETH" | "BTC";
  direction: "call" | "put";
  timeframe: "day" | "week" | "month";
  sizeUsd: number | null;
  rawText: string;
};

export type ChatRole = "user" | "assistant" | "tool";

export type ChatMessageUI = {
  id: string;
  role: ChatRole;
  content: string;
  tradeDraftId?: string | null; // present when assistant proposed a trade
};
