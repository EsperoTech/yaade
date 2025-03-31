#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('url', {
    description: 'Yaade URL',
    type: 'string',
    required: true
  })
  .option('token', {
    description: 'Yaade API Access Token',
    type: 'string',
    required: true
  })
  .argv;

// Check if Yaade is reachable
try {
  const healthResponse = await axios.get(`${argv.url}/api/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Yaade health check failed with status ${healthResponse.status}`);
  }
} catch (error) {
  console.error('Error connecting to Yaade:', error.message);
  process.exit(1);
}


// Create an MCP server
const server = new McpServer({
  name: "yaade",
  version: "1.0.0"
});

// List scripts tool
server.tool(
  "list_scripts",
  "List all available scripts in Yaade. This tool should be used first whenever the user asks to interact with Yaade.",
  {},
  async () => {
    try {
      const response = await axios.get(`${argv.url}/api/v1/list-scripts`, {
        headers: {
          'Authorization': `Bearer ${argv.token}`
        }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data) }]
      };
    } catch (error) {
      console.error('Error listing scripts:', error.message);
      throw error;
    }
  }
);

// Run script tool
server.tool(
  "run_script",
  {
    script_id: z.number(),
    env: z.string().optional(),
    additionalEnvData: z.array(z.object({
      key: z.string(),
      value: z.string()
    })).optional()
  },
  async ({ script_id, env, additionalEnvData }) => {
    try {
      let runUrl = `${argv.url}/api/v1/scripts/${script_id}/run`;
      if (env) {
        runUrl += `?env=${env}`;
      }
      
      const response = await axios.post(runUrl, { additionalEnvData }, {
        headers: {
          'Authorization': `Bearer ${argv.token}`,
        }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data) }]
      };
    } catch (error) {
      console.error('Error running script:', error.message);
      throw error;
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport); 
