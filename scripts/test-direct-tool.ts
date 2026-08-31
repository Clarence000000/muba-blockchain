import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { GoogleGenAI, Type } from "@google/genai";

async function testSingleCall() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const tool = {
    functionDeclarations: [
      {
        name: "extract_trade_intent",
        description: "Extract structured trade intent",
        parameters: {
          type: Type.OBJECT,
          properties: {
            asset: { type: Type.STRING, enum: ["ETH", "BTC"] },
            direction: { type: Type.STRING, enum: ["call", "put"] },
            timeframe: { type: Type.STRING, enum: ["day", "week", "month"] },
            sizeUsd: { type: Type.NUMBER },
          },
          required: ["asset", "direction", "timeframe"],
        },
      },
    ],
  };

  console.log("Sending request to Gemini 3.6 Flash...");
  try {
    const res = await genai.models.generateContent({
      model: "models/gemini-3.6-flash",
      contents: "Bet ETH goes up this week",
      config: {
        tools: [tool],
      },
    });
    console.log("functionCalls:", JSON.stringify(res.functionCalls, null, 2));
    console.log("text:", res.text);
  } catch (err: any) {
    console.error("Error:", err);
  }
}

testSingleCall();
