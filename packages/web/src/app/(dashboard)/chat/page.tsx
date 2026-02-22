"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "What agents are available in the marketplace?",
  "Help me set up a new agent for code review",
  "Analyze the performance of my deployed agents",
  "Show me how A2A delegation works",
];

const mockAgentResponses: Record<string, string> = {
  default: `I'm **OmniAgent**, your AI assistant for the OmniAgent platform. I can help you with:

- **Agent Management** -- deploy, configure, and monitor your agents
- **Marketplace** -- discover and install tools from AgentForge
- **Payments** -- manage your USDC balance and transactions via APay
- **A2A Network** -- discover and delegate tasks to remote agents

What would you like to do?`,
  marketplace: `Here are some popular tools in the **AgentForge Marketplace**:

1. **CodeGen Pro** -- AI-powered code generation (Trust: 4.8/5)
2. **ImageAnalyzer** -- Computer vision analysis pipeline (Trust: 4.6/5)
3. **WebScraper** -- Intelligent web content extraction (Trust: 4.5/5)

You can browse all tools in the [Marketplace](/marketplace) tab. Would you like me to recommend tools based on your use case?`,
  agent: `To set up a new **code review agent**, follow these steps:

1. Go to the **Agents** tab and click "Create Agent"
2. Select the \`gpt-4o\` model for best code understanding
3. Add the \`code-review\` and \`git-integration\` skills
4. Configure your repository webhook

The agent will automatically review pull requests and provide inline comments. Want me to walk you through any of these steps in detail?`,
};

function formatContent(content: string): string {
  let formatted = content;
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="text-text-primary font-semibold">$1</strong>'
  );
  formatted = formatted.replace(
    /`(.*?)`/g,
    '<code class="rounded bg-dark-bg px-1.5 py-0.5 font-mono text-xs text-accent-blue">$1</code>'
  );
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-accent-blue underline hover:text-accent-blue/80">$1</a>'
  );
  formatted = formatted.replace(
    /^(\d+)\.\s(.+)$/gm,
    '<div class="ml-4 mb-1"><span class="text-accent-blue mr-2">$1.</span>$2</div>'
  );
  formatted = formatted.replace(
    /^-\s(.+)$/gm,
    '<div class="ml-4 mb-1 flex gap-2"><span class="text-accent-green">--</span><span>$1</span></div>'
  );
  formatted = formatted.replace(/\n\n/g, '<div class="h-3"></div>');
  formatted = formatted.replace(/\n/g, "<br/>");
  return formatted;
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-purple/10">
        <Bot className="h-4 w-4 text-accent-purple" />
      </div>
      <div className="rounded-xl rounded-tl-none bg-dark-card border border-dark-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full bg-text-muted"
            style={{ animation: "typing 1.2s ease-in-out infinite" }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-text-muted"
            style={{
              animation: "typing 1.2s ease-in-out infinite",
              animationDelay: "0.2s",
            }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-text-muted"
            style={{
              animation: "typing 1.2s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getAgentResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    if (lower.includes("marketplace") || lower.includes("tool")) {
      return mockAgentResponses.marketplace;
    }
    if (
      lower.includes("agent") ||
      lower.includes("setup") ||
      lower.includes("set up")
    ) {
      return mockAgentResponses.agent;
    }
    return mockAgentResponses.default;
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate agent response delay
    setTimeout(() => {
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: getAgentResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/10">
                <Sparkles className="h-8 w-8 text-accent-blue" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-text-primary">
                Start a conversation with OmniAgent
              </h2>
              <p className="mb-8 max-w-md text-text-secondary">
                Ask about your agents, explore the marketplace, manage payments,
                or delegate tasks across the A2A network.
              </p>
              <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptClick(prompt)}
                    className="rounded-xl border border-dark-border bg-dark-card px-4 py-3 text-left text-sm text-text-secondary transition-all hover:border-accent-blue/30 hover:bg-dark-hover hover:text-text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 animate-fade-in ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      message.role === "user"
                        ? "bg-accent-blue/10"
                        : "bg-accent-purple/10"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-accent-blue" />
                    ) : (
                      <Bot className="h-4 w-4 text-accent-purple" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      message.role === "user"
                        ? "rounded-tr-none bg-accent-blue text-white"
                        : "rounded-tl-none border border-dark-border bg-dark-card text-text-secondary"
                    }`}
                  >
                    {message.role === "agent" ? (
                      <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(message.content),
                        }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    )}
                    <p
                      className={`mt-2 text-xs ${
                        message.role === "user"
                          ? "text-white/60"
                          : "text-text-muted"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-dark-border bg-dark-card/50 px-4 py-4 backdrop-blur-sm md:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isTyping}
            className="flex-1 rounded-xl border border-dark-border bg-dark-bg px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-blue/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white transition-all hover:bg-accent-blue/90 disabled:opacity-40 disabled:hover:bg-accent-blue"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
