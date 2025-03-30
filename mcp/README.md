# Yaade MCP

A Node.js MCP Server to interact with your YAADE instance. The MCP Server has tool calls to list available scripts and execute them. Simply create a script in your YAADE instance to make it available to your LLM tool via this MCP server.

## Installation

Install it in your MCP compatible tool, e.g. Cursor or Claude Desktop:

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

After installing the MCP server check if the tools are available. If so you can now ask your LLM to use the provided tools like:

`in yaade: create a new user in my dev environment and return the user id`.

This assumes that you have a script in your YAADE instance that can create a user.

Note that the LLM sees the following information for each of your available script:

- script name
- script description
- collection name
- collection description
- available environments in the collection

So if you want the LLM to understand what it should use the scripts for, simply provide instructions in the name and description. Let's say that you have a system called `My Service` and already created a collection inside of YAADE you can go and add a description to the collection like 

```
Provides all publically available API requests for My Service. There are three available environments:
- dev
- test
- prod

As dev environment is ephemeral, it has to be created first by executing the script called "Start Dev Env".
```

Inside the collection you could have two scripts: `Start Dev Env` and `Create User`.

Now if you instruct the LLM to create a new user in dev. It would see the description of the collection and therefore know to first call the `Start Dev Env` script
