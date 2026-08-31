import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";
import { TradeIntent } from "./types";

const SYSTEM_PROMPT = `You are OptionsCopilot, an AI trading assistant for Thetanuts on-chain options.
Your job is to understand what options trade a user wants and extract it into structured parameters.
- If the user wants to profit from a price increase → direction: "call"
- If the user wants to profit from or hedge against a price decrease → direction: "put"
- If the user does not specify a timeframe, default to "week".
- For MVP, only ETH is supported. Treat any mention of "crypto" or unlisted assets as ETH.
- If the user mentions an options trade or market outlook, ALWAYS call the extract_trade_intent function.
- If the user is just saying hello, asking a general question, or chatting off-topic, do NOT call the tool and respond helpfully in plain English.
After or alongside calling the function, also write a brief, friendly plain-English confirmation of what you understood.`;

const INTENT_EXTRACTION_TOOL = {
  functionDeclarations: [
    {
      name: "extract_trade_intent",
      description: "Extract structured trade intent from the user's plain-English message",
      parameters: {
        type: Type.OBJECT,
        properties: {
          asset: {
            type: Type.STRING,
            enum: ["ETH", "BTC"],
            description: "The cryptocurrency asset to trade. Default is ETH.",
          },
          direction: {
            type: Type.STRING,
            enum: ["call", "put"],
            description: "Option direction: call for upside/bullish, put for downside/bearish/hedging.",
          },
          timeframe: {
            type: Type.STRING,
            enum: ["day", "week", "month"],
            description: "Timeframe of trade: day (daily/today), week (weekly/this week), or month (monthly).",
          },
          sizeUsd: {
            type: Type.NUMBER,
            description: "Position or premium size in USD if specified by the user, otherwise null.",
          },
        },
        required: ["asset", "direction", "timeframe"],
      },
    },
  ],
};

export async function runAgent(
  sessionId: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>
): Promise<{ reply: string; intent: TradeIntent | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  const genai = new GoogleGenAI({ apiKey });

  // Map role to Gemini expected roles ("user" | "model")
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await genai.models.generateContent({
      model: "models/gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [INTENT_EXTRACTION_TOOL],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    let intent: TradeIntent | null = null;

    // Check functionCalls via SDK helper or candidate parts
    const functionCalls = response.functionCalls;
    const targetCall = functionCalls?.find((call) => call.name === "extract_trade_intent");

    if (targetCall && targetCall.args) {
      const args = targetCall.args as {
        asset?: "ETH" | "BTC";
        direction?: "call" | "put";
        timeframe?: "day" | "week" | "month";
        sizeUsd?: number;
      };

      intent = {
        asset: args.asset ?? "ETH",
        direction: args.direction ?? "call",
        timeframe: args.timeframe ?? "week",
        sizeUsd: args.sizeUsd ?? null,
        rawText: userMessage,
      };
    } else {
      // Fallback check in candidate parts
      const candidate = response.candidates?.[0];
      const partWithCall = candidate?.content?.parts?.find((p) => p.functionCall);
      if (partWithCall?.functionCall?.name === "extract_trade_intent") {
        const args = partWithCall.functionCall.args as {
          asset?: "ETH" | "BTC";
          direction?: "call" | "put";
          timeframe?: "day" | "week" | "month";
          sizeUsd?: number;
        };
        intent = {
          asset: args?.asset ?? "ETH",
          direction: args?.direction ?? "call",
          timeframe: args?.timeframe ?? "week",
          sizeUsd: args?.sizeUsd ?? null,
          rawText: userMessage,
        };
      }
    }

    // Extract text reply
    let reply = response.text || "";
    if (!reply) {
      const candidate = response.candidates?.[0];
      const textPart = candidate?.content?.parts?.find((p) => p.text);
      reply = textPart?.text || "";
    }

    if (!reply && intent) {
      reply = `I've prepared a ${intent.timeframe} ${intent.asset} ${intent.direction.toUpperCase()} strategy for your review.`;
    } else if (!reply) {
      reply = "How can I assist you with your options trading strategy today?";
    }

    return { reply, intent };
  } catch (error: any) {
    console.error("Error in runAgent:", error);
    throw error;
  }
}
