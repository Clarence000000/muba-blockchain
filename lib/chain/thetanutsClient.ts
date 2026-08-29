import { ethers } from 'ethers';

// This file wraps the chain connection and SDK logic.
// It should only be imported on the server-side (Next.js API routes).

export function getProvider() {
  const rpcUrl = process.env.THETANUTS_RPC_URL;
  if (!rpcUrl) {
    throw new Error('THETANUTS_RPC_URL is missing in environment variables');
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function checkChainConnection() {
  const provider = getProvider();
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return {
      success: true,
      chainId: network.chainId.toString(),
      blockNumber,
      isBaseMainnet: network.chainId === 8453n
    };
  } catch (error) {
    console.error("Failed to connect to the blockchain:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
