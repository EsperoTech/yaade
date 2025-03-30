# MCP

Model Context Protocol (MCP) is a protocol designed to standardize how AI applications interact with external tools. We provide a rudimentary MCP server that can be used to execute scripts stored in YAADE via your LLM application, e.g. Claude Desktop, Cursor or ChatGPT Desktop.

## Requirements

To use the MCP server you simply need to have a running YAADE instance and a valid access token.

## Configuration

Exact configuration will depend on the tool that you integrate the MCP server with. Here is an example configuration for Cursor:

```json
{
  "mcpServers": {
    "yaade-mcp": {
      "command": "npx",
      "args": [
        "yaade-mcp",
        "--url",
        "<YAADE_URL>",
        "--token",
        "<YAADE_ACCESS_TOKEN>"
      ]
    }
  }
}
```

Where the YAADE URL is of the form `https://yaade.example.com` and the token is your YAADE access token like `yaade_fd03fmdksax...`.

## Usage

The MCP server currently provides two tools:

1. List available scripts
2. Run a script

Usually you as the user of the AI application only care about running a script. To use the tool, simply write what you want to do in natural language. For example, say that you have a script to create a new user in the database, simply write something like `in yaade, create a new user`. The LLM should then go on to list the available scripts, find the create user script and then run it.

### Giving Context

Of course your LLM doesn't out of the box know what a specific script is used for. To fix that we make some important information available to the LLM when listing available scripts:

- Script Name and Description
- Collection Name and Description
- Available Environments

So if you have two scripts in a collection and both are called "uptime monitor" but one notes in the description that it is for Service A and one for Service B, then writing to your LLM sth. like `in yaade, give me the uptime status of service a` will result in the correct script being called.
