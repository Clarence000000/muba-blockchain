import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { db } from "../src/prisma/db.js";

async function testOrderBy() {
  try {
    const list1 = await db.orm.public.ChatMessage.where({ sessionId: "test" }).toArray();
    console.log("List with toArray:", list1.length);

    const list2 = await db.orm.public.ChatMessage.where({ sessionId: "test" })
      .orderBy((row: any) => row.createdAt, "desc")
      .toArray();
    console.log("List with callback orderBy:", list2.length);
  } catch (e: any) {
    console.error("OrderBy error:", e.message || e);
  }
}

testOrderBy();
