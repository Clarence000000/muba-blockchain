import 'dotenv/config';
import { db } from '../src/prisma/db.js';
import { GoogleGenAI } from '@google/genai';

async function testPhase0() {
  console.log("--- Testing Gemini API Key ---");
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY present:", !!apiKey, apiKey?.slice(0, 6) + "...");
  
  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hello! Respond with OK if you work.',
    });
    console.log("Gemini response:", response.text);
  } catch (err) {
    console.error("Gemini test failed:", err);
  }

  console.log("\n--- Testing Prisma Next DB ---");
  try {
    const users = await db.orm.public.User.findMany();
    console.log("Users in DB:", users);
  } catch (err) {
    console.error("Prisma Next DB test failed:", err);
  }
}

testPhase0();
