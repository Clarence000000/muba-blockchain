import { checkChainConnection } from '../lib/chain/thetanutsClient';
import dotenv from 'dotenv';

// Load environment variables manually for this script
dotenv.config({ path: '.env' });

async function runSanityChecks() {
  console.log("=== OptionsCopilot Sanity Checks ===\n");

  console.log("1. Checking Blockchain RPC Connection...");
  const chainStatus = await checkChainConnection();
  
  if (chainStatus.success) {
    console.log("✅ Successfully connected to RPC!");
    console.log(`   - Chain ID: ${chainStatus.chainId}`);
    console.log(`   - Current Block: ${chainStatus.blockNumber}`);
    
    if (chainStatus.isBaseMainnet) {
      console.log("✅ Verified: Connected to Base Mainnet (8453)");
    } else {
      console.log("⚠️ Warning: Connected successfully, but NOT to Base Mainnet (8453). Check your RPC URL.");
    }
  } else {
    console.log("❌ Failed to connect to RPC.");
    console.log(`   Error: ${chainStatus.error}`);
  }
  
  console.log("\n2. Checking MCP Package Installation...");
  try {
    // Use dynamic import instead of require.resolve for ES Module compatibility
    await import('@thetanuts-finance/mcp');
    console.log("✅ @thetanuts-finance/mcp is installed and resolvable.");
  } catch (e) {
    console.log("❌ @thetanuts-finance/mcp could not be found.");
    console.error("   Details:", e.message);
  }
  
  console.log("\nSanity checks complete!");
}

runSanityChecks();
