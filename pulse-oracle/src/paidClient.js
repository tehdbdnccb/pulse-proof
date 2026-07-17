// Demo script: pays the Pulse Oracle /score endpoint like an autonomous
// agent would — no API key, just a funded wallet and a signed payment.
//
// Run: node src/paidClient.js <matchId>

import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

const PRIVATE_KEY = process.env.AGENT_EVM_PRIVATE_KEY;
const BASE_URL = process.env.PULSE_ORACLE_URL || "http://localhost:4021";

if (!PRIVATE_KEY) {
  console.error("Set AGENT_EVM_PRIVATE_KEY in .env — use a throwaway demo wallet only.");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer: account });

const paidFetch = wrapFetchWithPayment(fetch, client);

async function main() {
  const matchId = process.argv[2] || "demo-match-1";
  console.log(`[paidClient] paying for GET /score?matchId=${matchId} ...`);

  const res = await paidFetch(`${BASE_URL}/score?matchId=${encodeURIComponent(matchId)}`);
  if (!res.ok) {
    console.error(`[paidClient] request failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log("[paidClient] paid response:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("[paidClient] error:", err);
  process.exit(1);
});