---
summary: "CLI reference for `omniagent reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `omniagent reset`

Reset local config/state (keeps the CLI installed).

```bash
omniagent reset
omniagent reset --dry-run
omniagent reset --scope config+creds+sessions --yes --non-interactive
```
