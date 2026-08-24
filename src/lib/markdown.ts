// ─── Tiny, safe markdown → HTML ─────────────────────────────
// Just the subset the AI writer emits: headings, paragraphs, bold, italics,
// links, and lists. Everything is HTML-escaped first, so nothing the model
// returns can inject markup — then we add back only the tags we recognise.
//
// Links render dofollow (no rel="nofollow") on purpose: passing SEO value to
// the buyer's product is the whole point of the Premium+ article.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let out = escapeHtml(s);
  // links [text](url) — only http(s) or root-relative
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_m, text, href) => {
    const external = /^https?:\/\//i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${href}"${attrs}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      html.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)/))) {
      flushPara();
      flushList();
      html.push(`<h3>${inline(m[1])}</h3>`);
    } else if ((m = line.match(/^##\s+(.*)/))) {
      flushPara();
      flushList();
      html.push(`<h2>${inline(m[1])}</h2>`);
    } else if ((m = line.match(/^#\s+(.*)/))) {
      flushPara();
      flushList();
      html.push(`<h2>${inline(m[1])}</h2>`);
    } else if ((m = line.match(/^[-*]\s+(.*)/))) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+\.\s+(.*)/))) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(m[1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return html.join("\n");
}
