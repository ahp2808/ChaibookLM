import { parseVTT } from "./vtt";

/**
 * Extract 11-character YouTube video ID from standard, shortened, shorts, or embed URLs.
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]+).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Parses XML timedtext into subtitle cues
 * @param {string} xmlStr
 * @returns {Array<{start: number, dur: number, text: string}>}
 */
function parseTimedTextXml(xmlStr) {
  try {
    const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
    const nodes = doc.querySelectorAll("text");
    const cues = [];
    nodes.forEach((n) => {
      const start = parseFloat(n.getAttribute("start") || "0");
      const dur = parseFloat(n.getAttribute("dur") || "2");
      const raw = n.textContent || "";
      const text = raw
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n+/g, " ")
        .trim();
      if (text) {
        cues.push({ start, dur, text });
      }
    });
    return cues;
  } catch (_e) {
    return [];
  }
}

/**
 * Parses JSON3 timedtext into subtitle cues
 * @param {object} jsonObj
 * @returns {Array<{start: number, dur: number, text: string}>}
 */
function parseTimedTextJson(jsonObj) {
  try {
    const cues = [];
    if (jsonObj && Array.isArray(jsonObj.events)) {
      jsonObj.events.forEach((ev) => {
        if (ev.segs && ev.segs.length) {
          const text = ev.segs
            .map((s) => s.utf8 || "")
            .join("")
            .replace(/\n+/g, " ")
            .trim();
          const start = (ev.tStartMs || 0) / 1000;
          const dur = (ev.dDurationMs || 2000) / 1000;
          if (text) {
            cues.push({ start, dur, text });
          }
        }
      });
    }
    return cues;
  } catch (_e) {
    return [];
  }
}

/**
 * Fetches YouTube transcript using multiple resilient fallback endpoints:
 * 1. Piped & Invidious Open APIs (extracts WebVTT caption tracks)
 * 2. Scrapes YouTube watch page via CORS proxy to extract captionTracks baseUrl
 * 3. Direct TimedText XML API via CORS proxies
 * 4. Jina AI Video Content Reader as fallback
 *
 * @param {string} videoId
 * @returns {Promise<Array<{start: number, dur: number, text: string}>>}
 */
export async function fetchYouTubeTranscript(videoId) {
  if (!videoId) throw new Error("Invalid YouTube Video ID");

  // Strategy 1: Piped / Invidious open API instances (fast, direct VTT subtitles)
  const pipedInstances = [
    `https://pipedapi.kavin.rocks/streams/${videoId}`,
    `https://api.piped.private.coffee/streams/${videoId}`,
    `https://pipedapi.adminforge.de/streams/${videoId}`,
  ];

  for (const endpoint of pipedInstances) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.subtitles && data.subtitles.length > 0) {
          // Prefer English subtitle, otherwise first available
          const sub =
            data.subtitles.find(
              (s) => s.lang === "en" || s.name?.toLowerCase().includes("english"),
            ) || data.subtitles[0];

          if (sub?.url) {
            const vttRes = await fetch(sub.url);
            if (vttRes.ok) {
              const vttText = await vttRes.text();
              const cues = parseVTT(vttText);
              if (cues.length > 0) return cues;
            }
          }
        }
      }
    } catch (_err) {
      // try next
    }
  }

  // Strategy 2: Scrape watch page via CORS proxies to extract captionTracks JSON
  const watchPageProxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
  ];

  for (const proxyUrl of watchPageProxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (captionMatch) {
          const tracks = JSON.parse(captionMatch[1]);
          const track =
            tracks.find(
              (t) =>
                t.languageCode === "en" ||
                t.vssId?.includes("en") ||
                t.name?.simpleText?.toLowerCase().includes("english"),
            ) || tracks[0];

          if (track?.baseUrl) {
            // Fetch caption track baseUrl
            const trackUrl = `${track.baseUrl}&fmt=json3`;
            const trackProxy = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(trackUrl)}`;
            const trackRes = await fetch(trackProxy).catch(() => fetch(trackUrl));
            if (trackRes.ok) {
              const textOrJson = await trackRes.text();
              try {
                const jsonObj = JSON.parse(textOrJson);
                const cues = parseTimedTextJson(jsonObj);
                if (cues.length > 0) return cues;
              } catch (_e) {
                const cues = parseTimedTextXml(textOrJson);
                if (cues.length > 0) return cues;
              }
            }
          }
        }
      }
    } catch (_err) {
      // try next
    }
  }

  // Strategy 3: Direct timedtext via CORS proxies (XML / JSON3)
  const timedTextUrls = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`)}`,
  ];

  for (const url of timedTextUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 20) {
          try {
            const jsonObj = JSON.parse(text);
            const cues = parseTimedTextJson(jsonObj);
            if (cues.length > 0) return cues;
          } catch (_e) {
            const cues = parseTimedTextXml(text);
            if (cues.length > 0) return cues;
          }
        }
      }
    } catch (_err) {
      // try next
    }
  }

  // Strategy 4: Jina AI Reader for YouTube content
  try {
    const res = await fetch(`https://r.jina.ai/https://www.youtube.com/watch?v=${videoId}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) {
        // Break lines into synthetic 15-second cues
        const sentences = text
          .replace(/Title:.*\n/i, "")
          .split(/(?<=[.?!])\s+/)
          .filter((s) => s.trim().length > 10);

        if (sentences.length > 0) {
          return sentences.map((s, idx) => ({
            start: idx * 15,
            dur: 15,
            text: s.trim(),
          }));
        }
      }
    }
  } catch (_err) {
    // ignore
  }

  throw new Error("NO_CAPTIONS");
}