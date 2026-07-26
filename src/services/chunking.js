
/* =========================================================================
   CHUNKING
   ========================================================================= */
export function chunkPlainText(text, size = 700, overlap = 120) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start + size * 0.5) end = lastSpace;
    }
    const text2 = clean.slice(start, end).trim();
    if (text2) chunks.push({ text: text2, start, end });
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

export function chunkPages(pages) {
  const out = [];
  pages.forEach((pageText, idx) => {
    chunkPlainText(pageText).forEach((c) => out.push({ ...c, page: idx + 1 }));
  });
  return out;
}

export function chunkCues(cues, size = 650) {
  const out = [];
  let buf = [];
  let bufLen = 0;
  const flush = () => {
    if (!buf.length) return;
    out.push({
      text: buf
        .map((c) => c.text)
        .join(" ")
        .trim(),
      startTime: buf[0].start,
      endTime: buf[buf.length - 1].start + (buf[buf.length - 1].dur || 2),
    });
    buf = [];
    bufLen = 0;
  };
  cues.forEach((c) => {
    buf.push(c);
    bufLen += c.text.length;
    if (bufLen >= size) flush();
  });
  flush();
  return out.filter((c) => c.text);
}
