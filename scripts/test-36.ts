import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { GoogleGenAI } from "@google/genai";

async function testGemini36() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await genai.models.generateContent({
      model: "models/gemini-3.6-flash",
      contents: "Respond with 'OptionsCopilot Connected'",
    });
    console.log("SUCCESS with models/gemini-3.6-flash:", res.text?.trim());
  } catch (e: any) {
    console.error("models/gemini-3.6-flash error:", e.status || e.message);
  }

  try {
    const res2 = await genai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Respond with 'OptionsCopilot Connected 2'",
    });
    console.log("SUCCESS with gemini-3.6-flash:", res2.text?.trim());
  } catch (e2: any) {
    console.error("gemini-3.6-flash error:", e2.status || e2.message);
  }
}

testGemini36();
