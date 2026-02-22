---
summary: "CLI reference for `omniagent agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `omniagent agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
omniagent agents list
omniagent agents add work --workspace ~/.omniagent/workspace-work
omniagent agents set-identity --workspace ~/.omniagent/workspace --from-identity
omniagent agents set-identity --agent main --avatar avatars/omniagent.png
omniagent agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.omniagent/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
omniagent agents set-identity --workspace ~/.omniagent/workspace --from-identity
```

Override fields explicitly:

```bash
omniagent agents set-identity --agent main --name "OmniAgent" --emoji "🦞" --avatar avatars/omniagent.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OmniAgent",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/omniagent.png",
        },
      },
    ],
  },
}
```
