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

Usually, as the user of the AI application you only care about running a script. To use the tool, simply write what you want to do in natural language. For example, say that you have a script that performs a health check, simply write something like `in yaade, check if my service is up`. The LLM should then go on to list the available scripts, find the health check script and then run it.

### Inject data into the environment

Most scripts depend on some environment data to provide useful functionality. Let's say you have a script to create a user, but you need to provide some information first, like the username. In a normal scenario you would go into your environment, set the key `username` to the value `jondoe` and then run the script. To make it easier for the LLM to do the same thing, we allow it to inject additional environment data when running a script. To run the previous example in your LLM you could simply ask something like `in yaade, create me a user with the username jondoe` - the LLM should understand that it should inject the username as additional env data.

### Giving Context

But how does a script know what a script does and what additional env data it should set? For that, we provide some context for every script when listing the available scripts. For each script the LLM will see:

- Script Name and Description
- Collection Name and Description
- Available Environments

So if you want to let your LLM know that a script requires the `username` key, you can just add that as text into the script description. E.g.:

```
# Create User Script

Creates a user for the given username.

## Required Env Data

- username: the username of the new user
```

That's it. Magic, right? Note that this is no deterministic process and it can happen that the LLM makes mistakes, so always check back what your LLM is doing.
