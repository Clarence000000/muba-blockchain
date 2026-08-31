import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { GoogleGenAI } from "@google/genai";

async function testWorkingModel() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [
    "models/gemini-2.5-flash",
    "gemini-2.5-flash",
    "models/gemini-3.7-flash",
    "models/gemini-flash-latest",
  ];

  for (const m of models) {
    try {
      const res = await genai.models.generateContent({
        model: m,
        contents: "Hello! Reply with 'OptionsCopilot Ready'",
      });
      console.log(`✅ Model '${m}' WORKED! Output:`, res.text?.trim());
      break;
    } catch (e: any) {
      console.log(`❌ Model '${m}' error:`, e.status || e.message);
    }
  }
}

testWorkingModel();
