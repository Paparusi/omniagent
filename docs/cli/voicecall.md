---
summary: "CLI reference for `omniagent voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `omniagent voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
omniagent voicecall status --call-id <id>
omniagent voicecall call --to "+15555550123" --message "Hello" --mode notify
omniagent voicecall continue --call-id <id> --message "Any questions?"
omniagent voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
omniagent voicecall expose --mode serve
omniagent voicecall expose --mode funnel
omniagent voicecall unexpose
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
