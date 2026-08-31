import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { GoogleGenAI } from "@google/genai";

async function listOrTestModels() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
  ];

  for (const model of candidateModels) {
    try {
      const res = await genai.models.generateContent({
        model,
        contents: "Respond with OK",
      });
      console.log(`✅ Model '${model}' works! Response:`, res.text?.trim());
      break;
    } catch (e: any) {
      console.log(`❌ Model '${model}' failed:`, e.status || e.message);
    }
  }
}

listOrTestModels();
