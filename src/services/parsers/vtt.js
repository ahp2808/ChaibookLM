/**
 * WebVTT and SubRip (.srt) subtitle parser
 * Supports both standard WebVTT (00:00:00.000) and SRT (00:00:00,000) timestamp formats.
 *
 * @param {string} content - Raw subtitle text
 * @returns {Array<{start: number, dur: number, text: string}>}
 */
export function parseVTT(content) {
  const lines = (content || "").replace(/\r/g, "").split("\n");
  const timeRe =
    /(\d{2}:\d{2}:\d{2}[.,]\d{3}|\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3}|\d{2}:\d{2}[.,]\d{3})/;

  const toSeconds = (t) => {
    const p = t.replace(",", ".").split(":").map(Number);
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
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
        // Exclude cue identifier lines (pure numbers) or header tags
        textLines.push(lines[i]);
        i++;
      }
      const text = textLines
        .join(" ")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) {
        cues.push({ start, dur: Math.max(end - start, 0.5), text });
      }
    }
    i++;
  }
  return cues;
}
