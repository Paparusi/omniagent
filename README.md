# OmniAgent

**The AI Agent Platform with Built-in Economy**

---

OmniAgent is an AI agent platform forked from [OpenClaw](https://github.com/steipete/openclaw), enhanced with A2A Corp's economic layer for AI tool marketplace (AgentForge), zero-knowledge secrets management (PassBox), and blockchain payments (APay). It runs on your own devices and connects to the messaging channels you already use.

## Key Features

- **Multi-channel support** -- Discord, Slack, Telegram, WhatsApp, Signal, iMessage, Google Chat, Microsoft Teams, Matrix, WebChat, and more
- **AI agent tools and skills marketplace (AgentForge)** -- discover, publish, and execute AI tools with a built-in commission model
- **Zero-knowledge secrets vault (PassBox)** -- securely store and manage API keys, tokens, and credentials without exposing them to anyone
- **Blockchain USDC payments on Base (APay)** -- on-chain payments with escrow-based settlement for tool usage and marketplace transactions
- **Plugin ecosystem with 39+ extensions** -- bundled, managed, and workspace skills that extend agent capabilities
- **Mobile apps (iOS, Android, macOS)** -- companion apps with voice wake, talk mode, canvas, camera, and screen recording
- **MCP (Model Context Protocol) integration** -- standardized protocol for connecting AI agents to tools and data sources

## Quick Start

Runtime: **Node >= 22**

```bash
npm install -g omniagent@latest

omniagent onboard --install-daemon
```

The onboarding wizard walks you through gateway setup, workspace configuration, channel pairing, and skill installation. Works on macOS, Linux, and Windows (via WSL2).

To start the gateway manually:

```bash
omniagent gateway --port 18789 --verbose
```

Send a test message:

```bash
omniagent agent --message "Hello from OmniAgent" --thinking high
```

## A2A Corp Economic Layer

OmniAgent integrates three platforms from A2A Corp that add an economic layer to AI agent interactions.

### AgentForge

The AI tools and skills marketplace. Developers publish tools that any OmniAgent instance can discover and execute. AgentForge operates on a 20% commission model -- tool creators earn 80% of each transaction, and the platform retains 20% to fund infrastructure and development.

### PassBox

A zero-knowledge vault for secrets management. API keys, tokens, credentials, and other sensitive data are encrypted client-side before storage. Neither OmniAgent nor any third party can read your secrets. PassBox ensures that tools and skills can authenticate with external services without exposing credentials in plaintext.

### APay

On-chain USDC payments on Base. APay handles all monetary transactions within the OmniAgent ecosystem with a 0.5% transaction fee. Payments are escrow-based: funds are held in a smart contract until the tool execution completes successfully, then released to the provider. This protects both buyers and sellers in marketplace transactions.

## Built on OpenClaw

OmniAgent is a fork of [OpenClaw](https://github.com/steipete/openclaw), originally created by Peter Steinberger. We are grateful for the foundation that OpenClaw provides -- a robust, local-first AI assistant with multi-channel support, a powerful gateway architecture, and a thriving plugin ecosystem. OmniAgent builds on this foundation by adding the A2A Corp economic layer while preserving full compatibility with the upstream project.

The original OpenClaw project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.

## OmniHub

OmniHub is the skills marketplace for OmniAgent. Browse, search, and install skills directly from the command line.

```bash
npx omnihub
```

OmniHub connects to the AgentForge registry to list available skills, show descriptions and ratings, and install them into your workspace. Skills range from simple utility tools to full-featured integrations with external APIs and services.

## License

MIT -- see [LICENSE](LICENSE) for details.
