import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { db } from "../src/prisma/db.js";

async function inspectQueryBuilder() {
  const query = db.orm.public.ChatMessage.where({ sessionId: "test" });
  console.log("Query methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(query)));
  
  // Try findMany / all / first / toArray
  try {
    const res = await query.all();
    console.log("query.all() worked:", res);
  } catch (e: any) {
    console.log("query.all() error:", e.message);
  }

  try {
    const res2 = await query.findMany();
    console.log("query.findMany() worked:", res2);
  } catch (e: any) {
    console.log("query.findMany() error:", e.message);
  }
}

inspectQueryBuilder();
