// Pulse Oracle — x402-gated match intensity API on Injective EVM
//
// Reference: https://docs.injective.network/developers-ai/x402
// Any HTTP client (human, script, or AI agent) that presents a valid USDC
// payment receipt on Injective EVM gets served. No API keys, no accounts.

import "dotenv/config";
import express from "express";
import { injectivePaymentMiddleware } from "@injectivelabs/x402/middleware";
import { scoreMatch } from "./hawkesScorer.js";

const app = express();
const PORT = process.env.PORT || 4021;

const PAY_TO = process.env.X402_PAY_TO_ADDRESS;
const CHAIN_ID = process.env.INJECTIVE_EVM_CHAIN_ID || "1776";
const USDC_ASSET = process.env.INJECTIVE_USDC_ASSET;
const PRICE = process.env.PRICE_PER_CALL || "10000"; // $0.01 at 6 decimals

if (!PAY_TO || !USDC_ASSET) {
  console.warn(
    "[pulse-oracle] Missing X402_PAY_TO_ADDRESS or INJECTIVE_USDC_ASSET in .env — " +
    "the endpoint will not accept real payments until these are set."
  );
}

app.use(
  injectivePaymentMiddleware(
    {
      "GET /score": {
        accepts: [
          {
            network: `eip155:${CHAIN_ID}`, // Injective EVM
            asset: USDC_ASSET,             // USDC on Injective EVM
            amount: PRICE,                 // smallest unit, 6 decimals
            payTo: PAY_TO,
          },
        ],
      },
    },
    { facilitatorUrl: process.env.X402_FACILITATOR_URL }
  )
);

// This handler only runs after a valid x402 USDC payment has settled.
app.get("/score", async (req, res) => {
  try {
    const matchId = req.query.matchId;
    const result = await scoreMatch(matchId);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Free health check so judges can confirm the server is alive without paying.
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "pulse-oracle", network: `eip155:${CHAIN_ID}` });
});

app.listen(PORT, () => {
  console.log(`[pulse-oracle] listening on :${PORT}`);
  console.log(`[pulse-oracle] paid endpoint: GET /score?matchId=<id> (price: ${PRICE} USDC units)`);
});