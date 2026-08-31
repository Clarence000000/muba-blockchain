import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { GoogleGenAI } from "@google/genai";

async function listModels() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const list = await genai.models.list();
    console.log("Available models:");
    for await (const m of list) {
      console.log("-", m.name);
    }
  } catch (err: any) {
    console.error("List models error:", err);
  }
}

listModels();
