function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script,style,noscript,svg,iframe,nav,footer")
    .forEach((n) => n.remove());
  const title = (doc.querySelector("title") || {}).textContent || "";
  const text = doc.body ? doc.body.innerText : doc.documentElement.textContent;
  return {
    title: title.trim(),
    text: (text || "").replace(/\n{3,}/g, "\n\n").trim(),
  };
}

export async function fetchWebsiteContent(url) {
  const attempts = [
    () => fetch(url).then((r) => (r.ok ? r.text() : Promise.reject())),
    () =>
      fetch(
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
      ).then((r) => (r.ok ? r.text() : Promise.reject())),
  ];
  for (const attempt of attempts) {
    try {
      const html = await attempt();
      const { title, text } = stripHtml(html);
      if (text && text.length > 40) return { title, text };
    } catch (_e) {
      /* try next */
    }
  }
  throw new Error(
    "Couldn't reach that page directly (many sites block cross-origin reading). Paste the article text instead as a Text source.",
  );
}
