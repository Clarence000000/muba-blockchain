import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "../src/prisma/db.js";

async function seedDemoUser() {
  console.log("=== Seeding Demo User in Database ===");
  try {
    const user = await db.orm.public.User.where({ id: "demo-user" }).first();
    if (user) {
      console.log("✅ Demo user already exists:", user);
    } else {
      const created = await db.orm.public.User.create({
        id: "demo-user",
        walletAddress: "0x000000000000000000000000000000000000dEaD",
      });
      console.log("✅ Successfully seeded demo user:", created);
    }
  } catch (err: any) {
    console.warn("Notice: Database query exception:", err.message || err);
  }
}

seedDemoUser();
