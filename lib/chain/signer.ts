/**
 * lib/chain/signer.ts
 *
 * [!] SERVER-ONLY MODULE [!]
 * This file MUST NOT be imported from any client-side code (Client Components,
 * browser-facing routes, etc.).  It reads private key material from process.env
 * and communicates directly with the Base chain RPC endpoint.
 *
 * In Next.js App Router, import this only inside:
 *   - Server Components
 *   - Route Handlers  (app/api/[...]/route.ts)
 *   - Server Actions  ('use server')
 *
 * To enforce this boundary at build time, install the `server-only` package:
 *   npm install server-only
 * and replace the comment block below with:
 *   import 'server-only';
 */

import { ethers } from 'ethers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal representation of an unsigned EVM transaction.
 * Pass additional ethers-compatible fields (nonce, gasLimit, maxFeePerGas…)
 * when you need fine-grained control; they will be forwarded as-is.
 */
export interface UnsignedTransaction {
  to: string;
  data?: string;
  value?: bigint | string | number;
  [key: string]: unknown; // allow any extra ethers TransactionRequest fields
}

/**
 * Discriminated union returned by signAndSubmit.
 * The function NEVER throws – errors are always surfaced via `success: false`.
 */
export type SignAndSubmitResult =
  | { success: true; txHash: string; blockNumber: number }
  | { success: false; error: string; txHash?: never };

// ---------------------------------------------------------------------------
// Environment validation (fail fast at module load time)
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[signer] Missing required environment variable: ${name}. ` +
        `Make sure it is set in your .env.local (or deployment secrets) before starting the server.`,
    );
  }
  return value.trim();
}

// Validated once when this module is first imported.
const RPC_URL = requireEnv('THETANUTS_RPC_URL');
const PRIVATE_KEY = requireEnv('THETANUTS_PRIVATE_KEY');

// ---------------------------------------------------------------------------
// Provider & Wallet singletons
// ---------------------------------------------------------------------------

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;

/**
 * Returns (and lazily initialises) the shared JsonRpcProvider.
 * Exported for unit-test injection / connectivity checks.
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

/**
 * Returns (and lazily initialises) the shared Wallet bound to the provider.
 * Exported for unit-test inspection.
 */
export function getWallet(): ethers.Wallet {
  if (!_wallet) {
    _wallet = new ethers.Wallet(PRIVATE_KEY, getProvider());
  }
  return _wallet;
}

// ---------------------------------------------------------------------------
// Core function: signAndSubmit
// ---------------------------------------------------------------------------

/**
 * Signs and submits an unsigned transaction to the configured RPC endpoint.
 *
 * Safety guarantees:
 *  1. Runs `provider.estimateGas()` as a dry-run *before* broadcasting.
 *     If the EVM would revert, we return early without spending gas.
 *  2. Waits for 1 block confirmation before resolving.
 *  3. Never throws – every failure path is returned as `{ success: false, error }`.
 *
 * @param unsignedTx - Transaction fields (to, data, value, …).
 * @returns A SignAndSubmitResult describing the outcome.
 */
export async function signAndSubmit(
  unsignedTx: UnsignedTransaction,
): Promise<SignAndSubmitResult> {
  const provider = getProvider();
  const wallet = getWallet();

  // ── Step 1: Pre-flight dry-run ──────────────────────────────────────────
  let estimatedGas: bigint;
  try {
    estimatedGas = await provider.estimateGas({
      from: wallet.address,
      ...unsignedTx,
    });
    console.log(
      `[signer] [OK] Pre-flight passed. Estimated gas: ${estimatedGas.toString()} units`,
    );
  } catch (estimateError: unknown) {
    const reason =
      estimateError instanceof Error
        ? estimateError.message
        : String(estimateError);
    console.error(`[signer] [ERR] Pre-flight failed: ${reason}`);
    return {
      success: false,
      error: `Pre-flight check failed: ${reason}`,
    };
  }

  // ── Step 2: Broadcast ───────────────────────────────────────────────────
  let txResponse: ethers.TransactionResponse;
  try {
    // Attach the estimated gas limit (with a 20% buffer) so the node doesn't
    // re-estimate with a potentially stale state.
    const txWithGas: ethers.TransactionRequest = {
      from: wallet.address,
      gasLimit: (estimatedGas * BigInt(120)) / BigInt(100), // +20% buffer
      ...unsignedTx,
    };

    txResponse = await wallet.sendTransaction(txWithGas);
    console.log(
      `[signer] [TX] Transaction broadcast. Hash: ${txResponse.hash}`,
    );
  } catch (sendError: unknown) {
    const reason =
      sendError instanceof Error ? sendError.message : String(sendError);
    console.error(`[signer] [ERR] Broadcast failed: ${reason}`);
    return {
      success: false,
      error: `Transaction broadcast failed: ${reason}`,
    };
  }

  // ── Step 3: Wait for 1-block confirmation ───────────────────────────────
  try {
    const receipt = await txResponse.wait(1);

    if (!receipt) {
      // wait() can return null if the transaction was replaced/cancelled.
      return {
        success: false,
        error: `Transaction not confirmed (receipt is null). The tx may have been replaced or dropped. Hash: ${txResponse.hash}`,
      };
    }

    console.log(
      `[signer] [CONFIRMED] Transaction confirmed in block #${receipt.blockNumber}. ` +
        `Gas used: ${receipt.gasUsed.toString()}`,
    );

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (waitError: unknown) {
    const reason =
      waitError instanceof Error ? waitError.message : String(waitError);
    console.error(
      `[signer] [WARN] Confirmation wait failed for ${txResponse.hash}: ${reason}`,
    );
    return {
      success: false,
      error: `Error while waiting for transaction confirmation: ${reason}`,
    };
  }
}
