"use client";

import { useState } from "react";
import {
  Search,
  Star,
  Code,
  Image,
  Globe,
  Languages,
  BarChart3,
  Heart,
  Filter,
  Play,
  TrendingUp,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  icon: React.ElementType;
  price: string;
  trustScore: number;
  reviews: number;
  author: string;
  executions: string;
}

const mockTools: Tool[] = [
  {
    id: "tool-1",
    name: "CodeGen Pro",
    description:
      "Advanced AI-powered code generation supporting 50+ languages. Generates production-ready code with tests and documentation.",
    category: "Development",
    categoryColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
    icon: Code,
    price: "$0.02/call",
    trustScore: 4.8,
    reviews: 342,
    author: "OmniOrg",
    executions: "128K",
  },
  {
    id: "tool-2",
    name: "ImageAnalyzer",
    description:
      "Computer vision pipeline for image classification, object detection, and OCR. Supports batch processing and streaming.",
    category: "Vision",
    categoryColor:
      "text-accent-purple bg-accent-purple/10 border-accent-purple/20",
    icon: Image,
    price: "$0.05/call",
    trustScore: 4.6,
    reviews: 189,
    author: "VisionLabs",
    executions: "67K",
  },
  {
    id: "tool-3",
    name: "WebScraper",
    description:
      "Intelligent web content extraction with JavaScript rendering support. Auto-handles rate limiting and CAPTCHA bypassing.",
    category: "Data",
    categoryColor:
      "text-accent-green bg-accent-green/10 border-accent-green/20",
    icon: Globe,
    price: "$0.01/call",
    trustScore: 4.5,
    reviews: 276,
    author: "DataForge",
    executions: "215K",
  },
  {
    id: "tool-4",
    name: "TextTranslator",
    description:
      "Neural machine translation across 100+ languages with context-aware translation and domain-specific terminology support.",
    category: "NLP",
    categoryColor:
      "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    icon: Languages,
    price: "$0.01/call",
    trustScore: 4.7,
    reviews: 412,
    author: "LinguaAI",
    executions: "340K",
  },
  {
    id: "tool-5",
    name: "DataAnalyzer",
    description:
      "Automated data analysis and visualization. Generates insights, statistical summaries, and interactive charts from raw datasets.",
    category: "Analytics",
    categoryColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
    icon: BarChart3,
    price: "$0.03/call",
    trustScore: 4.4,
    reviews: 156,
    author: "AnalyticsHub",
    executions: "45K",
  },
  {
    id: "tool-6",
    name: "SentimentDetector",
    description:
      "Multi-modal sentiment analysis for text, audio, and video content. Real-time streaming support with confidence scoring.",
    category: "NLP",
    categoryColor:
      "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    icon: Heart,
    price: "$0.02/call",
    trustScore: 4.3,
    reviews: 98,
    author: "EmotionAI",
    executions: "32K",
  },
];

const categories = [
  "All",
  "Development",
  "Vision",
  "Data",
  "NLP",
  "Analytics",
];

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.floor(score)
              ? "fill-amber-400 text-amber-400"
              : star <= score
                ? "fill-amber-400/50 text-amber-400"
                : "text-dark-border"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-text-muted">{score}</span>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <div className="group flex flex-col rounded-xl border border-dark-border bg-dark-card p-5 transition-all hover:border-dark-hover hover:shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-bg">
            <Icon className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{tool.name}</h3>
            <p className="text-xs text-text-muted">by {tool.author}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tool.categoryColor}`}
        >
          {tool.category}
        </span>
      </div>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-text-secondary line-clamp-2">
        {tool.description}
      </p>

      {/* Stats */}
      <div className="mb-4 flex items-center justify-between">
        <StarRating score={tool.trustScore} />
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <TrendingUp className="h-3 w-3" />
          {tool.executions} runs
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-dark-border pt-4">
        <div>
          <span className="text-sm font-semibold text-text-primary">
            {tool.price}
          </span>
          <span className="ml-1 text-xs text-text-muted">
            ({tool.reviews} reviews)
          </span>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-blue/90">
          <Play className="h-3 w-3" />
          Execute
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState("all");
  const [minTrustScore, setMinTrustScore] = useState("all");

  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    const matchesTrust =
      minTrustScore === "all" || tool.trustScore >= parseFloat(minTrustScore);
    return matchesSearch && matchesCategory && matchesTrust;
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            AgentForge Marketplace
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Discover, install, and execute AI tools and capabilities for your
            agents.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, skills, and capabilities..."
            className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-blue/50"
          />
        </div>

        {/* Filter Row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Filter className="h-4 w-4" />
            Filters:
          </div>

          {/* Category */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
                    : "border-dark-border bg-dark-card text-text-secondary hover:border-dark-hover hover:text-text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden h-5 w-px bg-dark-border sm:block" />

          {/* Price Range */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-accent-blue/50"
          >
            <option value="all">Any Price</option>
            <option value="free">Free</option>
            <option value="low">Under $0.02</option>
            <option value="mid">$0.02 - $0.05</option>
            <option value="high">Over $0.05</option>
          </select>

          {/* Trust Score */}
          <select
            value={minTrustScore}
            onChange={(e) => setMinTrustScore(e.target.value)}
            className="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-accent-blue/50"
          >
            <option value="all">Any Trust</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-text-muted">
          {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}{" "}
          found
        </div>

        {/* Tool Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dark-border bg-dark-card py-20 text-center">
            <Search className="mb-4 h-10 w-10 text-text-muted" />
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              No tools found
            </h3>
            <p className="max-w-sm text-sm text-text-secondary">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
