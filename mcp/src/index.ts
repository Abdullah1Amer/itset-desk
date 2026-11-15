#!/usr/bin/env node
/*! IT Set Desk MCP server — © 2026 Abdullah Amer. Proprietary, see ../LICENSE. */
/**
 * MCP server for IT Set Desk (stdio). Lets Claude Desktop, Claude Code and other MCP clients search and work on
 * tickets, assets and preventive maintenance with the permissions of an IT Set Desk API token.
 *   ITSET_DESK_URL    e.g. http://helpdesk.company.local:8080
 *   ITSET_DESK_TOKEN  itsd_… from IT Set Desk → Settings → API tokens (Read only, or Read & write)
 */
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { configProblem, DESK_URL } from "./desk.js";
import { registerTools } from "./tools.js";

function createServer(): McpServer {
  const server = new McpServer(
    { name: "itset-desk-mcp-server", version: "1.0.0" },
    { instructions: "IT Set Desk is the company's IT ticketing and asset system. Ticket keys look like ITS-1024; asset tags like LAP-0012. Prefer itsd_get_overview for summaries, itsd_search_tickets to find work, itsd_get_ticket before replying. Replies (kind='reply') reach the employee, so write them politely in the employee's language; use kind='internal' for staff notes. Never invent ticket keys, figures or asset data: read them with the tools." }
  );
  registerTools(server);
  return server;
}

const problem = configProblem();
if (problem) console.error(`[itset-desk-mcp] WARNING: ${problem} Tools will return this message until it is fixed.`);
serveStdio(createServer);
console.error(`[itset-desk-mcp] running on stdio → ${DESK_URL || "(ITSET_DESK_URL not set)"}`);
