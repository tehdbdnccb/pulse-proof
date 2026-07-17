// Pulse Oracle MCP Server
//
// Wraps the x402-gated /score endpoint as an MCP tool. Any MCP client
// (Claude Desktop, an agent framework, another service) can call
// "get_match_intensity" and the server pays for the API call on the fly
// using the wallet configured via AGENT_EVM_PRIVATE_KEY, then returns
// the Hawkes-process intensity score for that World Cup match.

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { z } from "zod";

const PRIVATE_KEY = process.env.AGENT_EVM_PRIVATE_KEY;
const BASE_URL = process.env.PULSE_ORACLE_URL || "http://localhost:4021";

if (!PRIVATE_KEY) {
  console.error("Set AGENT_EVM_PRIVATE_KEY in .env before starting the MCP server.");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const paidFetch = wrapFetchWithPayment(fetch, client);

const server = new McpServer({
  name: "pulse-oracle",
  version: "0.1.0",
  description:
    "Pays per call (x402, USDC on Injective EVM) for live World Cup match " +
    "intensity scores from a Hawkes-process model.",
});

server.tool(
  "get_match_intensity",
  "Get the current in-match intensity/momentum score for a World Cup match. " +
    "Costs a small amount of USDC per call, paid automatically via x402 on Injective.",
  {
    matchId: z.string().describe("Identifier for the match, e.g. a fixture ID"),
  },
  async ({ matchId }) => {
    const res = await paidFetch(`${BASE_URL}/score?matchId=${encodeURIComponent(matchId)}`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Request failed: ${res.status} ${await res.text()}` }],
        isError: true,
      };
    }
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[pulse-oracle-mcp] ready on stdio");