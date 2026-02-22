---
name: omnihub
description: Use the OmniHub CLI to search, install, update, and publish agent skills from omnihub.com. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed omnihub CLI.
metadata:
  {
    "omniagent":
      {
        "requires": { "bins": ["omnihub"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "omnihub",
              "bins": ["omnihub"],
              "label": "Install OmniHub CLI (npm)",
            },
          ],
      },
  }
---

# OmniHub CLI

Install

```bash
npm i -g omnihub
```

Auth (publish)

```bash
omnihub login
omnihub whoami
```

Search

```bash
omnihub search "postgres backups"
```

Install

```bash
omnihub install my-skill
omnihub install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)

```bash
omnihub update my-skill
omnihub update my-skill --version 1.2.3
omnihub update --all
omnihub update my-skill --force
omnihub update --all --no-input --force
```

List

```bash
omnihub list
```

Publish

```bash
omnihub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes

- Default registry: https://omnihub.com (override with OMNIHUB_REGISTRY or --registry)
- Default workdir: cwd (falls back to OmniAgent workspace); install dir: ./skills (override with --workdir / --dir / OMNIHUB_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
