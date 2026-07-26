export function parseVTT(content) {
  const lines = (content || "").replace(/\r/g, "").split("\n");
  const timeRe =
    /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/;
  const toSeconds = (t) => {
    const p = t.split(":").map(Number);
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return p[0] * 60 + p[1];
  };
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(timeRe);
    if (m) {
      const start = toSeconds(m[1]);
      const end = toSeconds(m[2]);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }
      const text = textLines
        .join(" ")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) cues.push({ start, dur: Math.max(end - start, 0.5), text });
    }
    i++;
  }
  return cues;
}

