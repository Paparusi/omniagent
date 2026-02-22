# @a2a/omniagent-plugin

A2A Corp economic layer for [OmniAgent](https://github.com/Paparusi/omniagent) — the open-source AI assistant.

## What is A2A Corp?

A2A Corp provides the missing economic infrastructure for AI agents:

- **AgentForge** — AI tool marketplace with 1000+ tools, trust scoring, and automatic billing
- **PassBox** — Zero-knowledge secrets vault with client-side encryption
- **APay** — Blockchain USDC payments on Base chain with escrow sessions and x402 support

## Installation

### Option 1: OmniAgent Plugin (Recommended)

```bash
# Install the plugin
omnihub install a2a-corp

# Or manually in omniagent.json
```

Add to your `~/.omniagent/omniagent.json`:

```json
{
  "plugins": {
    "entries": {
      "a2a-corp": {
        "agentforge": {
          "apiKey": "agf_your_key_here",
          "baseUrl": "http://localhost:3002"
        },
        "passbox": {
          "token": "your_passbox_token",
          "serverUrl": "http://localhost:3001"
        },
        "apay": {
          "apiKey": "apay_your_key_here",
          "serverUrl": "http://localhost:3003",
          "sessionId": "0x...",
          "chain": "base-sepolia"
        }
      }
    }
  }
}
```

### Option 2: MCP Bridge via mcporter

If you prefer using A2A Hub as an MCP server:

```bash
# Install mcporter if not already installed
npm install -g mcporter
```

Add to your `~/.omniagent/omniagent.json`:

```json
{
  "mcpServers": {
    "a2a-hub": {
      "command": "node",
      "args": ["path/to/a2a-hub/dist/index.js"],
      "env": {
        "AGENTFORGE_API_KEY": "agf_your_key",
        "AGENTFORGE_BASE_URL": "http://localhost:3002",
        "PASSBOX_TOKEN": "your_token",
        "PASSBOX_SERVER_URL": "http://localhost:3001",
        "APAY_API_KEY": "apay_your_key",
        "APAY_SERVER_URL": "http://localhost:3003"
      }
    }
  }
}
```

Then use via mcporter:

```
mcporter call a2a-hub.forge_discover query="sentiment analysis"
mcporter call a2a-hub.passbox_get_secret vault=myproject key=API_KEY
mcporter call a2a-hub.apay_check_balance
```

## Tools (33 total)

### AgentForge (6 tools)

| Tool | Description |
|------|-------------|
| `forge_discover` | Search marketplace by query, category, price, trust score |
| `forge_execute` | Execute a tool with automatic billing |
| `forge_get_schema` | Get tool input/output schema |
| `forge_balance` | Check balance, spending, tier |
| `forge_list_categories` | List tool categories |
| `forge_batch_execute` | Execute up to 10 tools in parallel |

### PassBox (10 tools)

| Tool | Description |
|------|-------------|
| `passbox_get_secret` | Retrieve and decrypt a secret |
| `passbox_set_secret` | Create/update a secret |
| `passbox_list_secrets` | List secret names |
| `passbox_delete_secret` | Delete a secret |
| `passbox_list_vaults` | List all vaults |
| `passbox_list_environments` | List environments |
| `passbox_get_environment` | Get all secrets in environment |
| `passbox_diff_env` | Compare .env with vault |
| `passbox_import_env` | Import .env into vault |
| `passbox_rotate_secret` | Trigger secret rotation |

### APay (13 tools)

| Tool | Description |
|------|-------------|
| `apay_check_balance` | USDC balance and spending limits |
| `apay_budget_check` | Verify affordability |
| `apay_spending_history` | Spending analytics |
| `apay_pay_service` | Pay a service |
| `apay_pay_signed` | Gasless signed payment |
| `apay_estimate_cost` | Estimate with 0.5% fee |
| `apay_list_services` | List services |
| `apay_get_service` | Service details |
| `apay_channel_status` | Channel status |
| `apay_stream_open` | Open payment channel |
| `apay_stream_pay` | Streaming micropayment |
| `apay_stream_close` | Close channel |
| `apay_x402_fetch` | Auto-pay x402 URLs |

### Composite (4 tools)

| Tool | Description |
|------|-------------|
| `a2a_discover_and_pay` | Find tool + estimate + pay |
| `a2a_secure_execute` | Execute with PassBox credentials injected |
| `a2a_full_pipeline` | End-to-end: discover -> budget -> credentials -> execute |
| `a2a_budget_status` | Unified budget across platforms |

## Skills

Three OmniHub skills provide contextual guidance:

- **a2a-marketplace** — AgentForge marketplace workflows
- **a2a-payments** — APay blockchain payment patterns
- **a2a-vault** — PassBox secrets management

## Commands

- `/a2a status` — Check platform connectivity
- `/a2a balance` — Show balances across all platforms
- `/a2a help` — Show available commands

## Configuration

Each platform is independently configurable. Only configure the platforms you use:

| Platform | Required Config | Environment Variable Alternative |
|----------|----------------|----------------------------------|
| AgentForge | `agentforge.apiKey` | `AGENTFORGE_API_KEY` |
| PassBox | `passbox.token` | `PASSBOX_TOKEN` |
| APay | `apay.apiKey` | `APAY_API_KEY` |

## Development

```bash
cd omniagent/extensions/a2a-corp
npm install
npm run build
npm test
```

## Architecture

```
extensions/a2a-corp/
├── omniagent.plugin.json   # Plugin manifest
├── package.json
├── src/
│   ├── index.ts           # Entry point (register tools, hooks, commands)
│   ├── service.ts         # Client management (AgentForge, PassBox, APay)
│   ├── commands.ts        # /a2a CLI commands
│   └── tools/
│       ├── forge.ts       # AgentForge marketplace tools
│       ├── passbox.ts     # PassBox vault tools
│       ├── apay.ts        # APay payment tools
│       └── composite.ts   # Cross-platform workflow tools
└── skills/
    ├── a2a-marketplace/SKILL.md
    ├── a2a-payments/SKILL.md
    └── a2a-vault/SKILL.md
```

## License

MIT
