// ─── Email templates ────────────────────────────────────────
// Server-only. Hand-built, table-based, fully-inlined HTML — the only thing
// that renders the same in Gmail, Apple Mail and Outlook. The look is the
// product's: warm paper, one ember rule, a serif masthead. No framework, no
// generic-SaaS gradients. These are the emails a founder screenshots.

const PAPER = "#faf7f1";
const CARD = "#fffdf9";
const INK = "#181510";
const INK_SOFT = "#3c372e";
const INK_MUTE = "#6d675a";
const EMBER = "#f2671e";
const BRASS = "#bf9235";
const LINE = "#e9e2d5";

const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The shell every email sits in: preheader, masthead with the ember rule,
 * a paper card, and a quiet footer.
 */
function shell(opts: { preheader: string; body: string; siteUrl: string }): string {
  const { preheader, body, siteUrl } = opts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Saasgrave Launches</title>
</head>
<body style="margin:0; padding:0; background:${PAPER}; color:${INK_SOFT}; font-family:${FONT_SANS};">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

  <!-- masthead -->
  <tr><td style="padding:0 4px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:${FONT_MONO}; font-size:10px; letter-spacing:2.5px; text-transform:uppercase; color:${INK_MUTE};">Saasgrave</td>
        <td align="right" style="font-family:${FONT_MONO}; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:${EMBER};">The Launch Register</td>
      </tr>
    </table>
    <div style="font-family:${FONT_SERIF}; font-size:24px; font-weight:700; color:${INK}; letter-spacing:-0.5px; margin-top:2px;">Launches</div>
    <div style="height:3px; background:${EMBER}; border-radius:2px; margin-top:10px;"></div>
  </td></tr>

  <!-- card -->
  <tr><td style="background:${CARD}; border:1px solid ${LINE}; border-radius:14px; padding:32px 30px;">
    ${body}
  </td></tr>

  <!-- footer -->
  <tr><td style="padding:22px 6px 4px; text-align:center;">
    <p style="margin:0 0 6px; font-family:${FONT_SANS}; font-size:12px; line-height:1.6; color:${INK_MUTE};">
      You're getting this because you have a Saasgrave account.
    </p>
    <p style="margin:0; font-family:${FONT_MONO}; font-size:11px; letter-spacing:0.5px; color:#978f7e;">
      <a href="${esc(siteUrl)}" style="color:${INK_MUTE}; text-decoration:underline;">launches.saasgrave.org</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0;"><tr>
    <td style="background:${INK}; border-radius:6px;">
      <a href="${esc(href)}" style="display:inline-block; padding:13px 26px; font-family:${FONT_SANS}; font-size:14px; font-weight:600; color:${PAPER}; text-decoration:none;">${esc(label)}</a>
    </td></tr></table>`;
}

// ─── 1 · "your product is live" ─────────────────────────────

export function launchLiveEmail(p: {
  productName: string;
  tagline: string;
  productUrl: string;
  boardUrl: string;
  siteUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 6px; font-family:${FONT_MONO}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:${EMBER};">You're live</p>
    <h1 style="margin:0 0 14px; font-family:${FONT_SERIF}; font-size:28px; line-height:1.15; font-weight:700; color:${INK}; letter-spacing:-0.5px;">
      ${esc(p.productName)} is on the board.
    </h1>
    <p style="margin:0 0 18px; font-family:${FONT_SANS}; font-size:15px; line-height:1.65; color:${INK_SOFT};">
      Your launch is published with a permanent product page and a <strong style="color:${INK};">dofollow backlink</strong> that stays live long after this week ends. Here's the thing that decides how far it climbs: the first few hours.
    </p>
    <div style="border-left:3px solid ${EMBER}; padding:2px 0 2px 14px; margin:0 0 22px;">
      <p style="margin:0; font-family:${FONT_SERIF}; font-size:16px; font-weight:600; color:${INK};">${esc(p.productName)}</p>
      <p style="margin:4px 0 0; font-family:${FONT_SANS}; font-size:14px; color:${INK_MUTE};">${esc(p.tagline)}</p>
    </div>
    ${button(p.productUrl, "View your launch →")}
    <p style="margin:18px 0 0; font-family:${FONT_SANS}; font-size:14px; line-height:1.65; color:${INK_SOFT};">
      Share the link with three people who'd genuinely use it. On a board ranked by real upvotes, three honest votes in the first hour is the whole ballgame — and every founder who lands top three this week gets written up in Sunday's digest to everyone here.
    </p>
    <p style="margin:16px 0 0; font-family:${FONT_SANS}; font-size:13px; color:${INK_MUTE};">
      — The Saasgrave Launches desk
    </p>`;

  return {
    subject: `${p.productName} is live on Saasgrave Launches`,
    html: shell({
      preheader: `${p.productName} is on the board — the first few hours decide where it lands.`,
      body,
      siteUrl: p.siteUrl,
    }),
  };
}

// ─── 2 · the Sunday weekly digest ───────────────────────────

export type DigestWinner = {
  rank: number;
  name: string;
  tagline: string;
  url: string;
  upvotes: number;
};

export function weeklyDigestEmail(p: {
  weekLabel: string;
  winners: DigestWinner[];
  stats: { launches: number; upvotes: number; makers: number };
  boardUrl: string;
  launchUrl: string;
  siteUrl: string;
}): { subject: string; html: string } {
  const medal = ["🥇", "🥈", "🥉"];
  const metalName = ["Gold", "Silver", "Bronze"];
  const metalColor = [BRASS, "#8c8577", EMBER];

  const winnersHtml = p.winners
    .slice(0, 3)
    .map((w, i) => {
      const c = metalColor[i] || INK_MUTE;
      return `
      <tr><td style="padding:14px 0; border-bottom:1px solid ${LINE};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="46" valign="top" style="font-size:26px; line-height:1;">${medal[i] || w.rank}</td>
          <td valign="top">
            <div style="font-family:${FONT_MONO}; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:${c}; margin-bottom:3px;">${metalName[i] || `#${w.rank}`}</div>
            <a href="${esc(w.url)}" style="font-family:${FONT_SERIF}; font-size:18px; font-weight:700; color:${INK}; text-decoration:none;">${esc(w.name)}</a>
            <div style="font-family:${FONT_SANS}; font-size:13px; color:${INK_MUTE}; margin-top:2px;">${esc(w.tagline)}</div>
          </td>
          <td width="66" align="right" valign="top">
            <div style="font-family:${FONT_MONO}; font-size:18px; font-weight:700; color:${INK};">${w.upvotes}</div>
            <div style="font-family:${FONT_MONO}; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:#978f7e;">upvotes</div>
          </td>
        </tr></table>
      </td></tr>`;
    })
    .join("");

  const statCell = (value: number, label: string) =>
    `<td align="center" style="padding:0 6px;">
       <div style="font-family:${FONT_MONO}; font-size:22px; font-weight:700; color:${INK};">${value}</div>
       <div style="font-family:${FONT_MONO}; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:${INK_MUTE}; margin-top:2px;">${esc(label)}</div>
     </td>`;

  const body = `
    <p style="margin:0 0 6px; font-family:${FONT_MONO}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:${EMBER};">${esc(p.weekLabel)} · the results</p>
    <h1 style="margin:0 0 12px; font-family:${FONT_SERIF}; font-size:27px; line-height:1.18; font-weight:700; color:${INK}; letter-spacing:-0.5px;">
      This week's board is in.
    </h1>
    <p style="margin:0 0 20px; font-family:${FONT_SANS}; font-size:15px; line-height:1.65; color:${INK_SOFT};">
      Every rank below was earned by makers clicking upvote — no paid placement, ever. Here's who topped ${esc(p.weekLabel)}.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      ${winnersHtml || `<tr><td style="font-family:${FONT_SANS}; font-size:14px; color:${INK_MUTE}; padding:8px 0;">A quiet week — no launches ranked. Yours could own next week outright.</td></tr>`}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; border:1px solid ${LINE}; border-radius:10px; padding:16px 8px; margin:0 0 22px;">
      <tr>
        ${statCell(p.stats.launches, "launched")}
        ${statCell(p.stats.upvotes, "upvotes")}
        ${statCell(p.stats.makers, "makers")}
      </tr>
    </table>

    ${button(p.boardUrl, "See the full board →")}

    <p style="margin:20px 0 0; font-family:${FONT_SANS}; font-size:14px; line-height:1.65; color:${INK_SOFT};">
      Shipping something this week? <a href="${esc(p.launchUrl)}" style="color:${EMBER}; text-decoration:underline; font-weight:600;">Launch it free</a> — paste a URL and you're on next week's board in a minute, with a backlink that lasts.
    </p>
    <p style="margin:16px 0 0; font-family:${FONT_SANS}; font-size:13px; color:${INK_MUTE};">
      Same time next Sunday. — The Saasgrave Launches desk
    </p>`;

  return {
    subject: `${p.weekLabel}: this week's top launches`,
    html: shell({
      preheader: p.winners[0]
        ? `${p.winners[0].name} took the week. See who placed.`
        : `This week's board is in.`,
      body,
      siteUrl: p.siteUrl,
    }),
  };
}
