---
summary: "CLI reference for `omniagent config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `omniagent config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `omniagent configure`).

## Examples

```bash
omniagent config get browser.executablePath
omniagent config set browser.executablePath "/usr/bin/google-chrome"
omniagent config set agents.defaults.heartbeat.every "2h"
omniagent config set agents.list[0].tools.exec.node "node-id-or-name"
omniagent config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
omniagent config get agents.defaults.workspace
omniagent config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
omniagent config get agents.list
omniagent config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
omniagent config set agents.defaults.heartbeat.every "0m"
omniagent config set gateway.port 19001 --strict-json
omniagent config set channels.whatsapp.groups '["*"]' --strict-json
```

Restart the gateway after edits.
