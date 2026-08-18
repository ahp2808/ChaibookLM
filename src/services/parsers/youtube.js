import { YoutubeTranscript } from "youtube-transcript";

export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]+).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function fetchYouTubeTranscript(videoId) {
  try {
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
    const transcript = await YoutubeTranscript.fetchTranscript(proxiedUrl);
    return transcript.map((item) => ({
      start: item.offset,
      dur: item.duration,
      text: item.text,
    }));
  } catch (_error) {
    throw new Error("NO_CAPTIONS");
  }
}