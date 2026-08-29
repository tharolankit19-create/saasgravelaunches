import type { MetadataRoute } from "next";

// The assistants and answer engines we explicitly welcome. Naming them matters:
// several of these check for a rule addressed to their own token before falling
// back to `*`, and an explicit allow is the difference between being cited and
// being skipped. `/api/` stays closed except the agent feed, which exists to be
// read by exactly these crawlers.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "YouBot",
];

const PRIVATE = ["/dashboard", "/admin", "/checkout", "/login", "/register", "/order/"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE, "/api/"],
      },
      {
        userAgent: AI_AGENTS,
        allow: ["/", "/api/agent/"],
        disallow: PRIVATE,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
