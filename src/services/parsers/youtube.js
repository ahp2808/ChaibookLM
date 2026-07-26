
function extractYouTubeId(url) {
  const m = (url || "").match(
    /(?:youtu\.be\/|[?&]v=|embed\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export async function fetchYouTubeTranscript(videoId) {
  const proxied =
    "https://api.allorigins.win/raw?url=" +
    encodeURIComponent(
      `https://video.google.com/timedtext?lang=en&v=${videoId}`,
    );


  const res = await fetch(proxied);
  const xml = await res.text();
  if (!xml || xml.indexOf("<text") === -1) {
    throw new Error("NO_CAPTIONS");
  }
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const nodes = Array.from(doc.getElementsByTagName("text"));
  if (!nodes.length) throw new Error("NO_CAPTIONS");
  const area = document.createElement("textarea");
  return nodes.map((n) => {
    area.innerHTML = n.textContent;
    return {
      start: parseFloat(n.getAttribute("start")) || 0,
      dur: parseFloat(n.getAttribute("dur") || "2"),
      text: area.value,
    };
  });
}

