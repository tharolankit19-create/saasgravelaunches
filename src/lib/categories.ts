// The category set. Small on purpose — a directory with 60 categories has 60
// empty pages, and every extra option is another decision between a maker and
// a finished launch.

export type Category = {
  name: string;
  slug: string;
  blurb: string;
  /** Lowercase substrings the autofill looks for when guessing. */
  match: string[];
};

export const CATEGORIES: Category[] = [
  {
    name: "AI",
    slug: "ai",
    blurb: "Agents, copilots, models and everything built on top of them.",
    match: ["ai ", "artificial intelligence", "llm", "gpt", "agent", "prompt", "machine learning"],
  },
  {
    name: "SaaS",
    slug: "saas",
    blurb: "Subscription software for teams and businesses.",
    match: ["saas", "platform", "workspace", "all-in-one", "software for"],
  },
  {
    name: "Marketing",
    slug: "marketing",
    blurb: "Growth, ads, email, social and everything that brings traffic.",
    match: ["marketing", "campaign", "ads", "email", "newsletter", "social media", "growth"],
  },
  {
    name: "SEO",
    slug: "seo",
    blurb: "Rankings, backlinks, content and technical SEO tooling.",
    match: ["seo", "backlink", "keyword", "ranking", "serp", "domain rating"],
  },
  {
    name: "Developer Tools",
    slug: "developer-tools",
    blurb: "APIs, CLIs, infrastructure and anything that ships code faster.",
    match: ["developer", "api", "sdk", "cli", "open source", "deploy", "database", "framework"],
  },
  {
    name: "Design",
    slug: "design",
    blurb: "UI kits, prototyping, images, video and brand tooling.",
    match: ["design", "figma", "ui kit", "mockup", "logo", "video", "image", "template"],
  },
  {
    name: "Productivity",
    slug: "productivity",
    blurb: "Notes, tasks, focus and the tools that clear a day.",
    match: ["productivity", "notes", "task", "todo", "calendar", "focus", "habit", "workflow"],
  },
  {
    name: "Analytics",
    slug: "analytics",
    blurb: "Dashboards, tracking, attribution and product data.",
    match: ["analytics", "dashboard", "metrics", "tracking", "insight", "report", "data"],
  },
  {
    name: "Finance",
    slug: "finance",
    blurb: "Payments, invoicing, accounting and money for founders.",
    match: ["invoice", "payment", "billing", "accounting", "finance", "revenue", "tax", "payroll"],
  },
  {
    name: "No-Code",
    slug: "no-code",
    blurb: "Builders, automations and site generators without the code.",
    match: ["no-code", "no code", "drag and drop", "website builder", "automation", "zapier"],
  },
  {
    name: "Community",
    slug: "community",
    blurb: "Forums, directories, newsletters and places people gather.",
    match: ["community", "forum", "directory", "network", "members", "discord", "slack"],
  },
  {
    name: "Other",
    slug: "other",
    blurb: "Everything that refuses to sit in a box.",
    match: [],
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug.toLowerCase());
}

export function categorySlug(name: string): string {
  return CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.slug || "other";
}

export const PRICING_MODELS = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "trial", label: "Free trial" },
  { value: "paid", label: "Paid" },
];
