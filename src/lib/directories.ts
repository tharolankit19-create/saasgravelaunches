// ─── Directory list ─────────────────────────────────────────
// 120 high-DR startup directories (2026), plus our own boards pinned on top
// as Featured. Data is static — no API — so the tracker page is pure SEO and
// works with zero backend. Logos come from the domain's favicon at render time.

export type Directory = {
  name: string;
  url: string;
  dr: number;
  dofollow: boolean;
  dofollowNote: string;
  type: string;
  category: string;
  free: boolean;
  bestFor: string;
  featured?: boolean;
};

export const FEATURED_DIRECTORIES: Directory[] = [
  { name: "Saasgrave Launches", url: "https://ls.saasgrave.org", dr: 0, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General Tech", free: true, bestFor: "A weekly board, AI listing, permanent dofollow backlink", featured: true },
  { name: "Saasgrave", url: "https://saasgrave.org", dr: 0, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General Tech", free: true, bestFor: "The graveyard of dead startups — list yours, or buy one", featured: true },
];

export const DIRECTORIES: Directory[] = [
  { name: "LinkedIn Company Page", url: "https://linkedin.com", dr: 98, dofollow: false, dofollowNote: "No", type: "Business Directory", category: "General", free: true, bestFor: "Professional credibility, B2B visibility" },
  { name: "GitHub (if OSS)", url: "https://github.com", dr: 96, dofollow: true, dofollowNote: "Yes", type: "Dev Platform", category: "Developer Tools", free: true, bestFor: "Open-source projects, dev tool credibility" },
  { name: "Shopify App Store", url: "https://apps.shopify.com", dr: 95, dofollow: false, dofollowNote: "No", type: "Marketplace", category: "E-commerce", free: false, bestFor: "Shopify apps & integrations" },
  { name: "X (Twitter)", url: "https://x.com", dr: 94, dofollow: false, dofollowNote: "No", type: "Community", category: "General", free: true, bestFor: "Founders with pre-built audience" },
  { name: "Trustpilot", url: "https://www.trustpilot.com", dr: 93, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "General", free: true, bestFor: "Business trust signals, review-driven credibility" },
  { name: "Product Hunt", url: "https://www.producthunt.com", dr: 92, dofollow: true, dofollowNote: "Yes (top of day)", type: "Launch Platform", category: "General Tech", free: true, bestFor: "Biggest launch-day audience, DR 92 backlink" },
  { name: "SourceForge", url: "https://sourceforge.net", dr: 91, dofollow: true, dofollowNote: "Yes", type: "Dev Directory", category: "Developer Tools", free: true, bestFor: "Open-source & developer tools, high DR dofollow" },
  { name: "G2", url: "https://www.g2.com", dr: 91, dofollow: false, dofollowNote: "No", type: "Review Marketplace", category: "B2B SaaS", free: true, bestFor: "Purchase-ready B2B buyers, enterprise credibility" },
  { name: "Gartner Peer Insights", url: "https://www.gartner.com/reviews", dr: 91, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "Enterprise", free: true, bestFor: "Enterprise buyer reviews, Gartner credibility" },
  { name: "Reddit (r/SaaS, r/SideProject)", url: "https://reddit.com", dr: 91, dofollow: false, dofollowNote: "No", type: "Community", category: "General", free: true, bestFor: "Niche ICP conversations, feedback" },
  { name: "TechCrunch", url: "https://techcrunch.com", dr: 91, dofollow: false, dofollowNote: "No", type: "Media", category: "Press", free: false, bestFor: "Premier tech press coverage, startup features" },
  { name: "Gartner Digital Markets", url: "https://digitalmarkets.gartner.com", dr: 90, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "Enterprise software visibility" },
  { name: "Capterra", url: "https://www.capterra.com", dr: 90, dofollow: false, dofollowNote: "No", type: "Review Marketplace", category: "B2B SaaS", free: true, bestFor: "SMB-focused tool discovery, Gartner-owned" },
  { name: "Crunchbase", url: "https://www.crunchbase.com", dr: 90, dofollow: false, dofollowNote: "No", type: "Company Database", category: "General", free: true, bestFor: "Investor visibility, press legitimacy, company profile" },
  { name: "VentureBeat", url: "https://venturebeat.com", dr: 89, dofollow: false, dofollowNote: "No", type: "Media", category: "Press", free: false, bestFor: "Tech news and startup coverage" },
  { name: "Hacker News (Show HN)", url: "https://news.ycombinator.com", dr: 88, dofollow: false, dofollowNote: "No", type: "Community", category: "Tech", free: true, bestFor: "Technical audiences, high-variance viral potential" },
  { name: "About.me", url: "https://about.me", dr: 88, dofollow: false, dofollowNote: "No", type: "Profile Directory", category: "Founder", free: true, bestFor: "Founder personal brand, online presence" },
  { name: "The Next Web", url: "https://thenextweb.com", dr: 87, dofollow: false, dofollowNote: "No", type: "Media", category: "Press", free: false, bestFor: "Tech media coverage" },
  { name: "Softpedia", url: "https://softpedia.com", dr: 85, dofollow: false, dofollowNote: "No", type: "Software Directory", category: "General", free: true, bestFor: "Software downloads & reviews" },
  { name: "AngelList / Wellfound", url: "https://wellfound.com", dr: 85, dofollow: false, dofollowNote: "No", type: "Startup Directory", category: "General", free: true, bestFor: "Startup profile, talent & investor discovery" },
  { name: "Clutch.co", url: "https://clutch.co", dr: 84, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B Services", free: true, bestFor: "Agency & service provider reviews" },
  { name: "Startup Fame", url: "https://startupfa.me", dr: 83, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "Highest free DR dofollow backlink (DR 83)" },
  { name: "AppSumo", url: "https://appsumo.com", dr: 81, dofollow: false, dofollowNote: "No", type: "Marketplace", category: "Deals", free: false, bestFor: "Revenue via LTDs, cash flow boost" },
  { name: "Indie Hackers", url: "https://indiehackers.com", dr: 80, dofollow: false, dofollowNote: "No", type: "Community", category: "Bootstrapped", free: true, bestFor: "Bootstrapped founders, build-in-public, feedback" },
  { name: "GetApp", url: "https://www.getapp.com", dr: 80, dofollow: false, dofollowNote: "No", type: "Review Marketplace", category: "B2B SaaS", free: true, bestFor: "SMB software discovery, Gartner-owned" },
  { name: "SaaSHub", url: "https://saashub.com", dr: 79, dofollow: true, dofollowNote: "Yes (paid)", type: "Directory", category: "SaaS Comparison", free: true, bestFor: "SaaS alternatives & comparison traffic" },
  { name: "AlternativeTo", url: "https://alternativeto.net", dr: 79, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Software Comparison", free: true, bestFor: "'Alternative to X' search traffic, evergreen" },
  { name: "Turbo0", url: "https://turbo0.com", dr: 78, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Fast SEO indexing, structured tool queries" },
  { name: "Software Advice", url: "https://www.softwareadvice.com", dr: 78, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "Software recommendations with advisor calls" },
  { name: "StackShare", url: "https://stackshare.io", dr: 78, dofollow: true, dofollowNote: "Yes", type: "Dev Directory", category: "Developer Tools", free: true, bestFor: "Tech stack visibility, dev tool discovery" },
  { name: "F6S", url: "https://www.f6s.com", dr: 76, dofollow: false, dofollowNote: "No", type: "Startup Network", category: "General", free: true, bestFor: "Founder networking, accelerator discovery, deals" },
  { name: "TrustRadius", url: "https://www.trustradius.com", dr: 76, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "In-depth verified B2B reviews" },
  { name: "BetaList", url: "https://betalist.com", dr: 75, dofollow: false, dofollowNote: "No", type: "Pre-launch Directory", category: "Early Stage", free: true, bestFor: "Pre-launch waitlists, beta testers" },
  { name: "FinancesOnline", url: "https://financesonline.com", dr: 74, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "B2B software reviews, expert analysis" },
  { name: "GoodFirms", url: "https://www.goodfirms.co", dr: 73, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B Services", free: true, bestFor: "Software & service provider reviews" },
  { name: "SoftwareSuggest", url: "https://www.softwaresuggest.com", dr: 72, dofollow: false, dofollowNote: "No", type: "Directory", category: "B2B SaaS", free: true, bestFor: "Emerging markets, business software discovery" },
  { name: "AppAdvice", url: "https://appadvice.com", dr: 72, dofollow: false, dofollowNote: "No", type: "App Directory", category: "Mobile", free: true, bestFor: "Mobile app discovery and reviews" },
  { name: "Startup Ranking", url: "https://www.startupranking.com", dr: 71, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "Solid DA ~71 dofollow with zero budget" },
  { name: "PeerPush", url: "https://peerpush.co", dr: 71, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "AI-driven discovery, AI agent visibility" },
  { name: "Futurepedia", url: "https://futurepedia.io", dr: 70, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI product niche categorization, B2B workflow tools" },
  { name: "Smol Launch", url: "https://smollaunch.com", dr: 70, dofollow: true, dofollowNote: "Yes (badge)", type: "Launch Platform", category: "Indie", free: true, bestFor: "Full week on homepage, permanent listing" },
  { name: "SideProjectors", url: "https://sideprojectors.com", dr: 70, dofollow: false, dofollowNote: "No", type: "Marketplace", category: "Indie", free: true, bestFor: "Buying, selling, showcasing side projects" },
  { name: "Startups.com", url: "https://startups.com", dr: 68, dofollow: false, dofollowNote: "No", type: "Community", category: "Startups", free: true, bestFor: "Startup community and resources" },
  { name: "Crozdesk", url: "https://crozdesk.com", dr: 68, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "B2B software discovery and comparison" },
  { name: "There's An AI For That", url: "https://theresanaiforthat.com", dr: 68, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: false, bestFor: "AI tools discovery, massive organic traffic" },
  { name: "Toolify.ai", url: "https://www.toolify.ai", dr: 65, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "Power users & researchers tracking AI trends" },
  { name: "Alternative.me", url: "https://alternative.me", dr: 65, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Software Comparison", free: true, bestFor: "Software alternatives and reviews" },
  { name: "Slant.co", url: "https://www.slant.co", dr: 64, dofollow: false, dofollowNote: "No", type: "Community", category: "Software Comparison", free: true, bestFor: "Community-powered tool recommendations" },
  { name: "Serchen", url: "https://www.serchen.com", dr: 62, dofollow: false, dofollowNote: "No", type: "Directory", category: "B2B SaaS", free: true, bestFor: "Business software search & reviews" },
  { name: "KillerStartups", url: "https://killerstartups.com", dr: 62, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Startups", free: true, bestFor: "Startup reviews and features" },
  { name: "Startup Stash", url: "https://startupstash.com", dr: 62, dofollow: true, dofollowNote: "Yes", type: "Resource Directory", category: "General", free: true, bestFor: "Curated startup resources & tools" },
  { name: "FutureTools", url: "https://futuretools.io", dr: 62, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI tools curated by content creator audience" },
  { name: "FeaturedCustomers", url: "https://www.featuredcustomers.com", dr: 60, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "Customer success stories & reviews" },
  { name: "StartupBlink", url: "https://startupblink.com", dr: 60, dofollow: false, dofollowNote: "No", type: "Directory", category: "Startups", free: true, bestFor: "Global startup ecosystem map" },
  { name: "Lovable Launchpad", url: "https://launched.lovable.app", dr: 60, dofollow: false, dofollowNote: "Verify", type: "Directory", category: "No-Code", free: true, bestFor: "Products built with Lovable no-code platform" },
  { name: "Peerlist", url: "https://peerlist.io", dr: 58, dofollow: false, dofollowNote: "Verify", type: "Launch Platform", category: "Tech", free: true, bestFor: "Profile-linked launches for builders" },
  { name: "IT Central Station", url: "https://www.itcentralstation.com", dr: 58, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "Enterprise", free: true, bestFor: "Enterprise IT product reviews" },
  { name: "Dang AI", url: "https://dang.ai", dr: 58, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI tool discovery with community engagement" },
  { name: "SaaSWorthy", url: "https://www.saasworthy.com", dr: 58, dofollow: false, dofollowNote: "No", type: "Directory", category: "SaaS", free: true, bestFor: "AI-powered SaaS discovery" },
  { name: "SaaS Worthy", url: "https://saasworthy.com", dr: 58, dofollow: false, dofollowNote: "No", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS comparison and reviews" },
  { name: "Twelve Tools", url: "https://twelve.tools", dr: 58, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Daily 12-tool discovery format" },
  { name: "Fazier", url: "https://fazier.com", dr: 56, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General", free: true, bestFor: "Less crowded board, better odds of ranking" },
  { name: "SelectHub", url: "https://www.selecthub.com", dr: 56, dofollow: false, dofollowNote: "No", type: "Review Platform", category: "B2B SaaS", free: true, bestFor: "Enterprise software selection" },
  { name: "AITools.inc", url: "https://aitools.inc", dr: 55, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "Large-scale AI tools directory" },
  { name: "MakerPad (now different)", url: "https://makerpad.co", dr: 55, dofollow: false, dofollowNote: "No", type: "Directory", category: "No-Code", free: true, bestFor: "Caution: repurposed company" },
  { name: "SaaSCity", url: "https://saascity.io", dr: 55, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "Gamified city-map directory, unique visual format" },
  { name: "Uneed", url: "https://uneed.best", dr: 55, dofollow: false, dofollowNote: "No", type: "Launch Platform", category: "General", free: true, bestFor: "Newsletter exposure, calmer launch day" },
  { name: "LaunchBoosts", url: "https://launchboosts.com", dr: 55, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General", free: true, bestFor: "Fast approval, guaranteed dofollow backlinks" },
  { name: "Tiny Startups", url: "https://tinystartups.com", dr: 54, dofollow: false, dofollowNote: "Verify", type: "Directory", category: "Indie", free: true, bestFor: "Products whose buyers are other founders" },
  { name: "ScrollLaunch", url: "https://scrolllaunch.com", dr: 52, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General", free: true, bestFor: "Weekly visibility + dofollow SEO compounding" },
  { name: "EverFeatured", url: "https://everfeatured.com", dr: 52, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "Long-term SEO + editorial review article" },
  { name: "SoftwareWorld", url: "https://softwareworld.co", dr: 52, dofollow: false, dofollowNote: "No", type: "Directory", category: "B2B SaaS", free: true, bestFor: "Software reviews and visibility" },
  { name: "StartupTracker", url: "https://startuptracker.io", dr: 52, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Startups", free: true, bestFor: "Startup tracking and discovery" },
  { name: "AppVita", url: "https://appvita.com", dr: 52, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Web Apps", free: true, bestFor: "Web app discovery and reviews" },
  { name: "PitchWall", url: "https://pitchwall.co", dr: 52, dofollow: false, dofollowNote: "No (free)", type: "Directory", category: "General", free: true, bestFor: "Startup pitch visibility" },
  { name: "AI Tool Directory", url: "https://aitoolsdirectory.com", dr: 51, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI/ML tool listings" },
  { name: "Awesome Indie", url: "https://awesomeindie.com", dr: 51, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Indie", free: true, bestFor: "Indie maker products" },
  { name: "ToolPilot", url: "https://toolpilot.ai", dr: 50, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI tools with smart search & comparison" },
  { name: "StartupBase", url: "https://startupbase.io", dr: 50, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Startups", free: true, bestFor: "Startup discovery and tracking" },
  { name: "Launching Next", url: "https://launchingnext.com", dr: 50, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "Permanent free dofollow backlink" },
  { name: "Launch Igniter", url: "https://launchigniter.com", dr: 48, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General", free: true, bestFor: "Structured launch announcements" },
  { name: "Tool Finder", url: "https://toolfinder.co", dr: 48, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Tool discovery and comparison" },
  { name: "StartupBuffer", url: "https://startupbuffer.com", dr: 48, dofollow: false, dofollowNote: "No", type: "Directory", category: "Startups", free: true, bestFor: "Startup showcase" },
  { name: "SaaSGenius", url: "https://www.saasgenius.com", dr: 48, dofollow: false, dofollowNote: "No", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS product discovery" },
  { name: "1000 Tools", url: "https://1000.tools", dr: 48, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Tool discovery for makers" },
  { name: "Launch.cab", url: "https://launch.cab", dr: 48, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "General", free: true, bestFor: "Quick low-effort launch listings" },
  { name: "DevHunt", url: "https://devhunt.org", dr: 48, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "Dev Tools", free: true, bestFor: "Dev tools, APIs, OSS — GitHub-verified" },
  { name: "AIWith.me", url: "https://aiwith.me", dr: 48, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI tools with editorial reviews" },
  { name: "RankInPublic", url: "https://rankinpublic.xyz", dr: 46, dofollow: true, dofollowNote: "Yes", type: "Launch Platform", category: "General", free: true, bestFor: "Tournament-style weekly launches, social proof" },
  { name: "MagicBox Tools", url: "https://magicbox.tools", dr: 46, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI & SaaS tools, card-based interface" },
  { name: "WebAppRater", url: "https://webapprater.com", dr: 46, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Web Apps", free: true, bestFor: "Web app reviews" },
  { name: "SaaS Mag", url: "https://saasmag.com", dr: 46, dofollow: false, dofollowNote: "No", type: "Media/Directory", category: "SaaS", free: true, bestFor: "SaaS news and product features" },
  { name: "LaunchDB", url: "https://launchdb.com", dr: 45, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Indie", free: true, bestFor: "Indie startup database" },
  { name: "NoCodeList", url: "https://nocodelist.co", dr: 45, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "No-Code", free: true, bestFor: "No-code/low-code tools" },
  { name: "Microlaunch", url: "https://microlaunch.net", dr: 45, dofollow: false, dofollowNote: "Verify", type: "Launch Platform", category: "Early Stage", free: true, bestFor: "Early feedback over vanity, MVP stage" },
  { name: "ProductArena", url: "https://productarena.co", dr: 44, dofollow: false, dofollowNote: "Verify", type: "Directory", category: "General", free: true, bestFor: "Community-validated tournament brackets" },
  { name: "StartupList", url: "https://startuplist.com", dr: 44, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Startups", free: true, bestFor: "Startup listings" },
  { name: "DiscoverCloud", url: "https://discovercloud.com", dr: 44, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "Cloud software discovery" },
  { name: "Findly.tools", url: "https://findly.tools", dr: 44, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "Tool directory visibility" },
  { name: "Tool Hunt", url: "https://toolhunt.co", dr: 44, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Daily tool discoveries" },
  { name: "SaaS Tools", url: "https://saastools.io", dr: 44, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS tool discovery" },
  { name: "SaaS Wheel", url: "https://saaswheel.com", dr: 42, dofollow: false, dofollowNote: "Verify", type: "Directory", category: "General", free: true, bestFor: "Continuous passive discovery via wheel" },
  { name: "Tool Review", url: "https://toolreview.io", dr: 42, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Tool reviews and ratings" },
  { name: "ToolsFine", url: "https://toolsfine.com", dr: 42, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI and productivity tools" },
  { name: "SaaS List", url: "https://saaslist.co", dr: 42, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "Curated SaaS listings" },
  { name: "SaaS Directory", url: "https://www.saasdirectory.com", dr: 42, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS tool listings" },
  { name: "SaaS World", url: "https://saasworld.com", dr: 42, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "Global SaaS discovery" },
  { name: "SaaS Platform", url: "https://saasplatform.com", dr: 42, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS tool listings" },
  { name: "TrustMRR", url: "https://trustmrr.com", dr: 40, dofollow: false, dofollowNote: "Verify", type: "Directory", category: "SaaS", free: true, bestFor: "Credibility with revenue-focused founders" },
  { name: "SubmitAITools", url: "https://submitaitools.org", dr: 40, dofollow: true, dofollowNote: "Yes", type: "AI Directory", category: "AI Tools", free: true, bestFor: "AI tool submissions, fast approval" },
  { name: "SaaS Weekly", url: "https://saasweekly.com", dr: 40, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "Weekly SaaS showcases" },
  { name: "SaaS Radar", url: "https://saasradar.com", dr: 40, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS product visibility" },
  { name: "SaaS Scout", url: "https://saasscout.com", dr: 40, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS product discovery" },
  { name: "ToolSpot", url: "https://toolspot.io", dr: 40, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Tool discovery platform" },
  { name: "SaaS Review", url: "https://saasreview.com", dr: 40, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS reviews and ratings" },
  { name: "SaaS Insights", url: "https://saasinsights.com", dr: 38, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS analytics and discovery" },
  { name: "SaaS Zone", url: "https://saaszone.com", dr: 38, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS categorization and search" },
  { name: "SaaS Watch", url: "https://saaswatch.com", dr: 38, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "SaaS", free: true, bestFor: "SaaS product monitoring" },
  { name: "ToolStack", url: "https://toolstack.io", dr: 38, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Stack-based tool discovery" },
  { name: "ToolTrek", url: "https://tooltrek.com", dr: 36, dofollow: true, dofollowNote: "Yes", type: "Directory", category: "Tools", free: true, bestFor: "Tool exploration" },
];

export const ALL_DIRECTORIES: Directory[] = [...FEATURED_DIRECTORIES, ...DIRECTORIES];

/** Directory logo via the domain's favicon — no assets to store. */
export function faviconFor(url: string, size = 64): string {
  try {
    const h = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${h}&sz=${size}`;
  } catch {
    return "";
  }
}
