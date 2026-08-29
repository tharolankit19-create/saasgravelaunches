// ─── Evergreen guides ───────────────────────────────────────
// File-based, not database-backed: these are the site's own long-form SEO
// pages, so they ship with the repo, render statically and never depend on a
// query. (/blog stays for the AI-written Premium+ articles.)
//
// House rules for anything written here: specific over broad, no invented
// statistics, no filler adjectives, and never a claim about us we can't stand
// behind. Every guide should be worth reading even by someone who never
// launches with us.

export type Guide = {
  slug: string;
  title: string;
  /** Meta description + the line used in listings and llms.txt. */
  summary: string;
  /** Rough read time, minutes. */
  minutes: number;
  updated: string;
  /** Search phrases this page is genuinely the answer to. */
  keywords: string[];
  body: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-launch-a-saas-product",
    title: "How to launch a SaaS product (a realistic playbook)",
    summary:
      "What actually matters on launch day, what doesn't, and the order to do it in — written for solo founders without an audience.",
    minutes: 9,
    updated: "2026-08-29",
    keywords: [
      "how to launch a saas product",
      "saas launch strategy",
      "launch day checklist",
      "product launch for indie founders",
    ],
    body: `Most launch advice assumes you already have an audience. This one doesn't. It's written for the case where you've built something, nobody knows you, and you get one honest shot at attention.

## Decide what the launch is actually for

A launch can buy you three different things, and they need different plans:

1. **Users** — people who sign up and try it this week.
2. **Feedback** — a handful of real conversations that tell you what to build next.
3. **Durable discovery** — pages, backlinks and search positions that keep sending people months later.

You can't optimise for all three at once. Most solo founders should pick 2 and 3. A spike of signups from an audience you don't have is the least likely outcome, and the least useful if the product isn't finished.

## Two weeks before: make the product explainable

The single biggest predictor of a launch going nowhere is that nobody can tell what the thing does in one line. Before anything else, write the sentence:

> [Product] helps [specific person] [do specific job] without [the annoying part].

If you can't fill that in without hedging, the launch isn't the problem. Fix the sentence first — it becomes your title tag, your tagline on every directory, and the first line of every post you write.

Then get these in place, because every listing you submit to will ask for them:

- A square logo, at least 256×256, on a transparent or solid background.
- Two or three screenshots that show the product doing its job — not a landing page hero.
- A 50–60 character title and a 150–160 character description.
- A real Open Graph image, so the link doesn't render as a grey box. ([Generate the tags free](/tools/meta-tags).)

## One week before: line up the places

Launch platforms are not interchangeable. The important distinction is what survives the day:

- **Nofollow boards** (Product Hunt among them) give you a large, concentrated spike. The traffic is real; the link passes no SEO weight.
- **Dofollow boards and directories** give you far less traffic on the day, but the link keeps working. Twenty decent dofollow listings compound; one nofollow spike does not.

Do both. Put the big spike on one day, and spread the durable listings across the following weeks so you're not copy-pasting for nine hours straight. Our [ranked list of 120+ directories with a tracker](/free-directories) exists precisely so you can do this in sittings.

## Launch week: the order that works

**Monday** — go live on the weekly boards. Submit the listing everywhere that's quick. Post once, properly, on the channel where you actually have people.

**Tuesday to Thursday** — this is where most launches quietly die. Don't post the same link again. Instead, answer things: reply to people using competitors, write the "how I built it" version for a different audience, and personally message the ten people most likely to care.

**Friday** — write down what happened. Not vanity numbers. Which channel sent people who actually signed up? ([Tag your links](/tools/utm-builder) beforehand or you won't be able to answer this.)

## What to post, and how often

One good post beats five reposts. The pattern that consistently works for unknown founders isn't "I launched" — it's the story with the specific thing in it:

- The problem you had, in concrete detail.
- What you tried first and why it didn't work.
- The thing you built, shown rather than described.
- A direct, low-pressure ask.

If writing that from a blank page is the blocker, our [launch post generator](/tools/launch-post) drafts the X, Show HN and LinkedIn versions from a few fields.

## After launch day

The half-life of a launch spike is about 48 hours. The half-life of a good product page is years. So the work that matters after launch week is unglamorous:

- Keep the listings you got accurate — a dead link on a directory eventually gets pruned.
- Turn the launch into an evergreen page on your own site.
- Answer every comment you got. The people who bothered to comment are your first ten users.

## The honest summary

A launch will not save a product nobody wants, and it will not build an audience you don't have. What it can reliably do is put a durable, linkable page about your product into the world, in front of a few hundred people who build things for a living. Treat it as the start of distribution rather than the end of building, and it's worth the week.

If you want the durable half, [launching here is free](/launch) and takes about a minute — you keep the page and the dofollow link.`,
  },

  {
    slug: "startup-directory-submission-guide",
    title: "The startup directory submission guide",
    summary:
      "Which directories are worth your time, how to submit without losing a weekend, and how to tell a real listing from a link farm.",
    minutes: 8,
    updated: "2026-08-29",
    keywords: [
      "startup directory submission",
      "where to submit my startup",
      "saas directories list",
      "submit product to directories",
    ],
    body: `Submitting to directories is the least glamorous growth work there is, and one of the few that still reliably compounds. It is also easy to waste thirty hours on it and get nothing. Here's how to not do that.

## Why bother at all

Two reasons, and only two:

1. **Links.** A dofollow link from a site with real traffic tells search engines your page exists and is worth something. New domains have nothing else going for them.
2. **Long-tail discovery.** Directory pages rank for "[category] tools" queries that your own site can't touch yet. Some of them send a trickle of visitors for years.

Notice what isn't on the list: a flood of signups. If a directory sends you five visitors a month, that's normal and still fine — the link is the asset.

## How to tell a good directory from a bad one

Check these four, in order. It takes about a minute per site.

**Is the link dofollow?** Open the listing of an existing product, view source, and look at the outbound link. If it carries \`rel="nofollow"\` or \`rel="sponsored"\`, the SEO value is roughly zero. That doesn't make it useless — Product Hunt is nofollow and still worth launching on — but be honest about which bucket it's in.

**Is it indexed?** Search \`site:thedirectory.com\` in Google. If the product pages aren't in the index, your listing won't be either.

**Do the listings look human?** Scroll the recent additions. If it's 400 AI tools submitted in a week with identical descriptions, it's a link farm, and links from link farms range from worthless to actively harmful.

**Does it still have a pulse?** Look at the date on the newest listing. Abandoned directories get deindexed, and your link goes with them.

## The submission workflow that doesn't burn a weekend

The reason this takes people thirty hours is that they start fresh at every form. Don't. Prepare the assets once, in a single document, and paste from it:

- Product name
- 50-character tagline, and a 100-character version (forms vary)
- 150-character description, and a 400-character version
- Full description, ~800 characters
- Category, two or three
- Tags / keywords, five
- Logo, square, 256×256 and 512×512
- Screenshots, two or three, 1280×800
- Pricing model in one word
- Founder name, email, X handle

With that document open, most submissions take 90 seconds instead of ten minutes.

Then batch them. Twenty per sitting, three sittings, done — rather than one heroic weekend that ends in you abandoning the list at number 34. Our [free tracker](/free-directories) keeps the state for you: 120+ directories ranked by domain rating, marked dofollow or not, with done/skip tracking that persists in your browser.

## Two things that quietly matter

**Vary the description.** If every listing carries the identical paragraph, you're publishing duplicate content across a hundred domains. Keep the tagline consistent for brand recognition, but rewrite the long description two or three ways and rotate them.

**Use your real email.** Many directories email an approval link, and a lot of founders lose half their submissions to a spam folder they never check.

## Is paying for submission worth it?

Sometimes. The honest calculation: submitting to ~70 directories properly takes most people 20–40 hours. If your time is worth more than the price of a done-for-you service, paying makes sense; if you're pre-revenue with time to spare, do it yourself with a list and a tracker.

Be wary of any service promising hundreds of links overnight, or any package where the directories aren't named. If they won't tell you where they're submitting, it's because you wouldn't want the links.

We [do this by hand](/directories) if you want it done, and we publish [the full list free](/free-directories) if you'd rather do it yourself. Both are fine outcomes.

## Start here

Whatever else you do, start with the boards where the link is dofollow and the audience is builders. [Launching here is free](/launch), takes about a minute, and gives you a permanent page and a real dofollow link — which is exactly the asset this whole exercise is about.`,
  },

  {
    slug: "dofollow-vs-nofollow-backlinks",
    title: "Dofollow vs nofollow backlinks: what actually helps a new SaaS",
    summary:
      "A plain explanation of the difference, how to check any link in ten seconds, and how much either one is really worth to a young site.",
    minutes: 6,
    updated: "2026-08-29",
    keywords: [
      "dofollow vs nofollow",
      "what is a dofollow backlink",
      "do nofollow links help seo",
      "backlinks for saas startups",
    ],
    body: `Every launch board advertises "a backlink". Most founders never check what kind. Here's the difference, why it matters more for a new domain than an established one, and how to check any link yourself in ten seconds.

## The mechanical difference

When a page links to you, the link either passes ranking signal or it doesn't, and that's controlled by one attribute:

- **Dofollow** — the default. No special attribute. Search engines treat it as an endorsement and pass authority to your page.
- **Nofollow** — \`rel="nofollow"\`. A hint that the linking site doesn't vouch for the destination. Historically ignored for ranking; today treated as a hint rather than a hard rule, which in practice still means "assume close to nothing".
- **Sponsored** — \`rel="sponsored"\`. Explicitly a paid placement.
- **UGC** — \`rel="ugc"\`. User-generated, like a forum post or a comment.

## How to check in ten seconds

Open the page that links to you, right-click the link, choose Inspect, and read the anchor tag:

\`\`\`html
<!-- passes value -->
<a href="https://yourproduct.com">Your Product</a>

<!-- passes little to nothing -->
<a href="https://yourproduct.com" rel="nofollow">Your Product</a>
\`\`\`

Do this *before* spending an evening on a submission, not after.

## Does that make nofollow worthless?

No — and anyone telling you it does is selling something. Nofollow links still:

- Send real people, which is the actual point of a launch spike.
- Get your brand name in front of an audience, which produces the branded searches that do help.
- Often get copied by someone else into a dofollow context.

Product Hunt is nofollow. It is still, for many products, the single most valuable launch day available. The mistake isn't using nofollow platforms — it's *only* using them and wondering why nothing compounds.

## Why this matters more when you're new

An established domain has hundreds of links; one more barely moves anything. A domain registered four months ago has almost none, so the first twenty dofollow links from real, indexed sites are doing a completely different job — they're the difference between "search engines don't know this site exists" and "this site can rank for its own brand name".

That's the window where directory submissions and dofollow launch boards are worth the tedium. Later, they're a rounding error.

## What a good link actually looks like

Not all dofollow links are equal. In rough order of what matters:

1. **The linking page is indexed.** Check \`site:domain.com/the-page\`. An unindexed page passes nothing.
2. **The page is topically related.** A SaaS directory linking to your SaaS reads as a genuine reference. A generic "web links" page does not.
3. **The site has real traffic and real content.** Human-written listings, recent additions, an actual audience.
4. **The anchor text is natural.** Your product name is ideal. Stuffed keyword anchors from a hundred sites is a pattern that gets sites penalised.

## What to avoid outright

- Packages promising hundreds of links for a few dollars.
- Any service that won't name the sites it submits to.
- Networks of sites that exist only to link to each other.
- Paying for a dofollow link on a page that's clearly an ad — that's what \`rel="sponsored"\` is for, and misrepresenting it is a risk you're taking on, not the seller.

## The practical takeaway

Launch on the big nofollow platforms for the audience. Build your durable link profile from dofollow listings on indexed, human-curated sites, twenty at a time. Check every link before you spend an evening earning it.

For what it's worth: every live product page here carries a **dofollow** link to the product, [launching is free](/launch), and the page stays up permanently. You can verify it the same way you'd verify anyone else's — inspect the link.`,
  },

  {
    slug: "first-100-users-solo-founder",
    title: "Getting your first 100 users as a solo founder",
    summary:
      "The channels that work without an audience or a budget, in the order they're worth trying — and the ones that waste a month.",
    minutes: 8,
    updated: "2026-08-29",
    keywords: [
      "first 100 users",
      "how to get users for my saas",
      "solo founder marketing",
      "early stage distribution",
    ],
    body: `The first hundred users are the only ones you get without leverage. No audience, no budget, no referrals, no SEO yet. Almost everything written about growth assumes you're past this. Here's what's left when you're not.

## First, a reframe worth having

A hundred users is not a marketing problem. It's roughly a hundred conversations. At this stage you're not building a funnel — you're finding out whether the thing you built matches what someone will actually change their behaviour for. Channels that don't let you talk to people are the wrong channels this early, even when they work.

## Where they actually come from

In rough order of how well this works for an unknown solo founder:

**1. Places your users already complain.** Someone, right now, is describing your problem in a subreddit, a Discord, a niche forum, or a comment thread. Find those threads and be useful in them — genuinely useful, answering the question even when the answer isn't your product. Mention what you built when it's relevant. This is slow, unscalable, and the highest-converting thing available to you.

**2. Launch platforms and directories.** One concentrated day of attention plus durable listings. Won't build a business alone; will get you your first tens of users and your first backlinks. Split them: big nofollow platforms for the spike, [dofollow boards and directories](/free-directories) for the compounding.

**3. Building in public.** Not "I'm building a SaaS" — nobody cares. Specific, concrete posts: a decision you got wrong, a number that surprised you, a thing you learned about the problem. This compounds slowly and then suddenly. It only works if you can stand doing it for months.

**4. Direct outreach, done narrowly.** Twenty carefully chosen people, each message referencing something specific about them, is worth more than two hundred templated ones. Below about a hundred users, this is a completely legitimate channel.

**5. One useful free thing.** A calculator, a checklist, a dataset, a tracker — something adjacent to your product that's worth using on its own. It earns links, ranks for queries your product page can't, and gives people a reason to arrive before they need you. (This is why the tools on this site exist.)

## What to skip until later

- **Paid ads.** You don't know your positioning or your economics yet. You'll buy expensive proof that you don't know what converts.
- **SEO as a primary channel.** It works, but the timeline is months. Start the groundwork now — pages, links, one honest guide — and expect nothing from it this quarter.
- **Cold email at volume.** Deliverability and legal exposure aside, it teaches you almost nothing at this stage.
- **A press push.** Journalists write about traction. You don't have any yet.

## The part everyone skips

Talk to the first twenty. Not a survey — an actual conversation. Ask what they were doing before they found you and what nearly stopped them signing up. Two or three sentences from a real user reshapes the product more than a month of analytics at this scale.

And instrument the basics before you start, or you'll be guessing about which of the above worked. [Tagged links](/tools/utm-builder) take five minutes to set up and are the difference between "the launch went well" and "Reddit sent 40% of the signups".

## A realistic timeline

For a solo founder working evenings on a product that's genuinely useful to a specific group: the first ten users take a week or two of direct effort, the first hundred take a couple of months of the above done consistently. If it's taking dramatically longer, the usual cause isn't the channel — it's that the one-line description of what the product does still doesn't land.

## Where to start today

Pick one community where your users already are, and be useful in it this week without linking anything. Then [put a permanent page up](/launch) — free, about a minute — so the people you talk to have somewhere to look you up, and so the link starts working while you do the slow part.`,
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
