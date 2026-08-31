import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import prisma from "../lib/db/prisma";

async function testStandardPrisma() {
  console.log("=== Testing Standard Prisma Client ===");
  try {
    const users = await prisma.user.findMany();
    console.log("Users in DB:", users);

    const demoUser = await prisma.user.upsert({
      where: { id: "demo-user" },
      update: {},
      create: {
        id: "demo-user",
        walletAddress: "0x000000000000000000000000000000000000dEaD",
      },
    });
    console.log("✅ Seeded demo user with Prisma Client:", demoUser);
  } catch (err: any) {
    console.error("Prisma error:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

testStandardPrisma();
