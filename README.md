# Pulse Oracle

Live World Cup match-intensity oracle, paid per call in USDC, deployed on
Injective. Built for **The Injective Global Cup** (HackQuest, July 3–19, 2026).

## What it does / problem it solves

Fans, prediction-market builders, and trading agents want a real-time signal
for "is this match getting intense right now" — not just pre-match odds.
Pulse Oracle exposes a Hawkes-process intensity model (adapted from an
existing live-events model) as a **pay-per-call API**, so any client —
human, script, or autonomous agent — can pull the current momentum score for
a match without signing up for an account or an API key.

## How users interact with it

- **Directly via HTTP**: `GET /score?matchId=<id>`, paid on the fly with
  USDC on Injective EVM.
- **Via an MCP client** (e.g. Claude, or any agent framework): call the
  `get_match_intensity` tool, which pays and fetches on the caller's
  behalf.
- **Via an Agent Skill**: drop `skills/pulse-oracle/SKILL.md` into a coding
  agent's skills directory and it will know when and how to use the tool.

## How the required Injective technologies are used

| Technology | Where | What it does here |
|---|---|---|
| **x402** | `src/server.js` | `injectivePaymentMiddleware` gates `GET /score` behind a USDC micropayment on Injective EVM (chain `eip155:1776`). No accounts, no API keys — a valid payment receipt is the only credential. |
| **CCTP** | `src/cctpTopUp.js` | Lets a user fund the agent's paying wallet with native USDC from another chain via Circle's CCTP burn/mint flow, landing spendable USDC on Injective EVM. |
| **MCP Server** | `src/mcp-server.js` | Exposes `get_match_intensity` as an MCP tool. Any MCP-compatible agent can call it; the server handles the x402 payment transparently on the agent's behalf. |
| **Agent Skills** | `skills/pulse-oracle/SKILL.md` | Tells a coding/task agent when this tool is relevant (live in-match momentum questions) and how to call it, so it can be picked up automatically rather than manually wired in. |

## Architecture

```
Agent / script / human
        │
        │  MCP tool call            HTTP GET (paid)
        ▼                                  ▼
 mcp-server.js  ── paidFetch (x402) ──►  server.js
        │                                  │
   pays via                        injectivePaymentMiddleware
  AGENT_EVM_PRIVATE_KEY                    │
        │                                  ▼
        │                          hawkesScorer.js
        │                       (Hawkes intensity model)
        ▼
 Injective EVM (x402 facilitator settles USDC payment)
```

## Running it

```bash
npm install
cp .env.example .env   # fill in wallet addresses / keys

# Terminal 1: run the paid API
npm run server

# Terminal 2: run the MCP server (for agent clients)
npm run mcp

# Terminal 3: pay for a call directly, like an agent would
npm run pay-test -- demo-match-1
```

## Running it with Docker

```bash
cp .env.example .env   # fill in wallet addresses / keys

# Build and run the paid API server on :4021
docker compose up --build server

# Run the MCP server in a container too (stdio-based, for local testing —
# real MCP clients should still connect to a stdio process, see note in
# docker-compose.yml)
docker compose --profile mcp run --rm mcp
```

The image is a multi-stage Alpine build (`node:20-alpine`), runs as a
non-root user, and installs with `npm ci --omit=dev` against the committed
`package-lock.json` for reproducible builds.

## Status / what's stubbed for the hackathon demo

- `hawkesScorer.js` ships with a deterministic demo stub. Swap in the real
  live-events Hawkes model before relying on scores beyond the demo.
- `cctpTopUp.js` outlines the CCTP burn/attestation/mint flow but is not
  wired to live contract addresses — confirm current Injective CCTP
  contract addresses before demo day.
- USDC asset address and facilitator URL in `.env.example` should be
  double-checked against current Injective docs
  (https://docs.injective.network/developers-ai/x402) before the live demo.

## Prizes this targets

Injective Global Cup judged track (Top 3, $150 each): usefulness, execution
quality, code structure/documentation, World Cup data integration, and
meaningful use of all four required technologies.
