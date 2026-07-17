---
name: pulse-oracle
description: >
  Use this skill when a task needs a live World Cup match intensity or
  momentum score (e.g. "is this match getting intense", "build a live
  in-match dashboard", "should I hedge this prediction now"). Provides
  a single MCP tool, get_match_intensity, backed by a Hawkes-process
  model over live match events, paid per call via x402 in USDC on
  Injective EVM. Do not use for pre-match odds or historical stats —
  this is a real-time in-play signal only.
---

# Pulse Oracle Skill

## What this does

Calls the `get_match_intensity` MCP tool exposed by the Pulse Oracle MCP
server (`src/mcp-server.js` in this repo). Each call:

1. Signs and settles a small USDC payment on Injective EVM via x402
   (no API key, no pre-registered account).
2. Returns the current Hawkes-process intensity score, a momentum label
   (`quiet` / `building` / `high_pressure`), and a timestamp for the
   requested `matchId`.

## When to use it

- The user asks about live match tempo, pressure, or momentum for a
  specific World Cup fixture.
- A dashboard or agent workflow needs to poll a real-time intensity
  signal rather than static pre-match odds.
- You want to demonstrate autonomous, per-call payment for data access
  (this is the core Injective Global Cup demo moment — no manual
  billing setup required).

## How to use it

1. Ensure the MCP server is running and connected as an MCP client
   (`npm run mcp` in this repo, or configured in your agent's MCP
   client list).
2. Call the tool with a `matchId` string identifying the fixture.
3. Read `intensity` (0–1 float) and `momentum` (label) from the
   response. Treat values above 0.75 as "high pressure" moments worth
   surfacing to the user.

## Cost model

Each call costs a small, configurable amount of USDC (default $0.01,
set via `PRICE_PER_CALL` in `.env`). This is intentional — it
demonstrates x402 pay-per-call pricing rather than a flat subscription,
which is the point of the Injective Global Cup's technology requirement.

## Constraints

- Requires a funded EVM wallet on Injective (holding USDC) configured
  via `AGENT_EVM_PRIVATE_KEY`.
- The underlying scoring model (`src/hawkesScorer.js`) currently ships
  with a demo stub. Swap it for the real Hawkes intensity model before
  relying on scores for anything beyond the hackathon demo.