// ─── The questions founders actually ask ────────────────────
// Kept in one place because they're rendered twice: as the landing page's FAQ
// section, and as FAQPage structured data. Google reads the second one, so the
// answers have to be genuinely useful and genuinely true — a schema block that
// doesn't match the visible copy is a manual-action risk, not a shortcut.
//
// Nothing here quotes a metric we can't stand behind. Where a number would
// normally go, the answer explains the mechanism instead.

export type Faq = { q: string; a: string };

export const LANDING_FAQ: Faq[] = [
  {
    q: "Is launching really free?",
    a: "Yes — launching is free and always will be. You get a ranked place on the week's board, a permanent product page, and a dofollow backlink to your site. No card, no trial. The paid options (a Featured slot, or having us submit you to directories by hand) are opt-in extras you choose at the last step, and skipping them changes nothing about your launch.",
  },
  {
    q: "What is a dofollow backlink, and why does it matter?",
    a: "A dofollow link passes SEO authority from the linking page to yours; a nofollow link asks search engines to ignore it. Most directories give you nofollow links, which do nothing for your ranking. Every live product page here links out to your site with a dofollow link, and the page stays up permanently — so the link keeps working long after your launch week ends.",
  },
  {
    q: "How is this different from Product Hunt?",
    a: "Product Hunt is a single enormous daily feed, where a launch competes with hundreds of others and disappears within 24 hours. This is a weekly board: your launch runs the full week, competes with a capped number of products, and keeps a permanent page afterwards. It's built for indie makers and solo founders who don't have a launch-day audience to mobilise.",
  },
  {
    q: "When should I launch?",
    a: "You pick the week yourself at submit time. Each week holds a limited number of free launches, and the picker shows you exactly how many places are left in each upcoming week, so you can choose a quieter one if this week is filling up. A less crowded week usually means a higher finish.",
  },
  {
    q: "Do I have to add a badge to my site?",
    a: "For a free launch, yes — you add our badge to your site and hit verify, and that's what publishes your launch. It's how the link works in both directions, which is what keeps the board's outbound links worth something. Premium members skip verification entirely and publish instantly.",
  },
  {
    q: "What does AI autofill actually do?",
    a: "You paste your product's URL and we read the page, then draft your listing from it: the name, logo, tagline, description, categories and the SEO fields. It takes a few seconds, and everything it writes is editable before you publish — it's a first draft to correct, not a black box.",
  },
  {
    q: "What happens after my launch week ends?",
    a: "Your product page stays live permanently, with its dofollow link, its upvote count and its comments intact. It stays indexed, stays in the directory and the all-time leaderboard, and keeps sending you traffic. The only thing that ends is your run on that week's board.",
  },
  {
    q: "Can I launch more than one product?",
    a: "Yes. The free tier allows one launch per week, which is enough for almost everyone. If you ship more often than that, Premium removes the limit and adds full analytics, the AI Launch Copilot and a verified badge.",
  },
  {
    q: "What are the directory submissions?",
    a: "Getting listed across dozens of startup directories is a real SEO lever, and it's also a weekend of copy-pasting the same details into the same forms. We do it by hand for you — 30, 70 or 100+ high-DR directories depending on the package — and send you a report with every live link. It's entirely optional, and there's a free list of 120 directories on the site if you'd rather do it yourself.",
  },
  {
    q: "Who is this for?",
    a: "Indie hackers, solo founders and small teams launching a SaaS, an AI tool, a developer tool or a side project — anyone who has shipped something and needs the first people to find it. You don't need an audience, a launch-day army or a budget.",
  },
];
