/**
 * Cleans and extracts title and readable text from raw HTML
 * @param {string} html
 * @returns {{title: string, text: string}}
 */
function stripHtml(html) {
  if (!html) return { title: "", text: "" };

  // If content is already markdown (e.g. from Jina Reader)
  if (html.startsWith("Title:") || html.startsWith("# ")) {
    const lines = html.split("\n");
    let title = "";
    const contentLines = [];

    for (const line of lines) {
      if (!title && (line.startsWith("Title:") || line.startsWith("# "))) {
        title = line.replace(/^(Title:\s*|#\s*)/, "").trim();
      } else {
        contentLines.push(line);
      }
    }

    const text = contentLines
      .join("\n")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip markdown links
      .replace(/[*_~`#]/g, "") // strip markdown symbols
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      title: title || "Web Article",
      text,
    };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "script,style,noscript,svg,iframe,nav,footer,header,aside,.ad,.ads,advertisement",
    )
    .forEach((n) => n.remove());

  const title = (
    doc.querySelector("title")?.textContent ||
    doc.querySelector("h1")?.textContent ||
    ""
  ).trim();

  // Prefer article or main container if available
  const mainEl =
    doc.querySelector("article") ||
    doc.querySelector("main") ||
    doc.querySelector(".content") ||
    doc.body;

  const rawText = mainEl ? mainEl.innerText : doc.documentElement.textContent;
  const text = (rawText || "").replace(/\n{3,}/g, "\n\n").trim();

  return {
    title,
    text,
  };
}

/**
 * Fetch and parse website content using multiple resilient proxies and reader engines.
 * @param {string} rawUrl - Target website URL
 * @returns {Promise<{title: string, text: string}>}
 */
export async function fetchWebsiteContent(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const fetchAttempts = [
    // 1. Jina Reader Engine (CORS-friendly, handles SPAs, clean markdown)
    async () => {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          Accept: "text/plain",
        },
      });
      if (!res.ok) throw new Error(`Jina error: ${res.status}`);
      return await res.text();
    },

    // 2. CodeTabs CORS Proxy
    async () => {
      const res = await fetch(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      );
      if (!res.ok) throw new Error(`CodeTabs error: ${res.status}`);
      return await res.text();
    },

    // 3. AllOrigins JSON API
    async () => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      );
      if (!res.ok) throw new Error(`AllOrigins JSON error: ${res.status}`);
      const data = await res.json();
      if (!data.contents) throw new Error("Empty contents in AllOrigins");
      return data.contents;
    },

    // 4. AllOrigins Raw Proxy
    async () => {
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      );
      if (!res.ok) throw new Error(`AllOrigins Raw error: ${res.status}`);
      return await res.text();
    },

    // 5. Direct Fetch (if CORS is allowed by host)
    async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Direct fetch error: ${res.status}`);
      return await res.text();
    },
  ];

  for (const attempt of fetchAttempts) {
    try {
      const raw = await attempt();
      const { title, text } = stripHtml(raw);
      if (text && text.length > 40) {
        return {
          title: title || url,
          text,
        };
      }
    } catch (_err) {
      // Continue to next fallback strategy
    }
  }

  throw new Error(
    "Unable to extract readable text from that webpage. Please copy and paste the article into a Text source.",
  );
}
