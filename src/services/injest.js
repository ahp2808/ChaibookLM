import {chunkCues,chunkPages,chunkPlainText} from "./chunking"
import { embedText,cosineSim } from "./embeddings";

import {fetchWebsiteContent} from "../services/parsers/html"
import {fetchYouTubeTranscript} from "../services/parsers/youtube"
import {parseVTT} from "../services/parsers/vtt"

/* =========================================================================
   INGEST PIPELINE
   ========================================================================= */
export async function runIngest({ source, input, patch, pdfDocsRef }) {
  try {
    patch({ status: "extracting", error: null });
    let chunks = [];
    let meta = { ...(source.meta || {}) };

    if (source.type === "pdf") {
      const buf = await input.file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      pdfDocsRef.current[source.id] = pdf;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        pages.push(tc.items.map((it) => it.str).join(" "));
      }
      meta.numPages = pdf.numPages;
      patch({ status: "chunking" });
      chunks = chunkPages(pages).map((c, i) => ({
        id: source.id + "-c" + i,
        text: c.text,
        page: c.page,
      }));
    } else if (source.type === "text") {
      meta.fullText = input.text;
      patch({ status: "chunking" });
      chunks = chunkPlainText(input.text).map((c, i) => ({
        id: source.id + "-c" + i,
        text: c.text,
        charStart: c.start,
        charEnd: c.end,
      }));
    } else if (source.type === "url") {
      const { title, text } = await fetchWebsiteContent(input.url);
      meta.url = input.url;
      meta.title = title || source.name;
      meta.fullText = text;
      patch({ status: "chunking", name: title || source.name });
      chunks = chunkPlainText(text).map((c, i) => ({
        id: source.id + "-c" + i,
        text: c.text,
        charStart: c.start,
        charEnd: c.end,
      }));
    } else if (source.type === "youtube") {
      const videoId = extractYouTubeId(input.url);
      meta.videoId = videoId;
      meta.url = input.url;
      let cues;
      if (input.pastedTranscript && input.pastedTranscript.trim()) {
        cues = parseVTT(input.pastedTranscript).length
          ? parseVTT(input.pastedTranscript)
          : [{ start: 0, dur: 0, text: input.pastedTranscript.trim() }];
      } else {
        if (!videoId) throw new Error("Couldn't find a video ID in that URL.");
        cues = await fetchYouTubeTranscript(videoId);
      }
      meta.fullTranscript = cues;
      patch({ status: "chunking" });
      chunks = chunkCues(cues).map((c, i) => ({
        id: source.id + "-c" + i,
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));
    } else if (source.type === "vtt") {
      const raw = await input.file.text();
      const cues = parseVTT(raw);
      if (!cues.length)
        throw new Error("Couldn't find any WebVTT cues in that file.");
      meta.fullTranscript = cues;
      patch({ status: "chunking" });
      chunks = chunkCues(cues).map((c, i) => ({
        id: source.id + "-c" + i,
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));
    }

    patch({ status: "embedding" });
    await new Promise((r) => setTimeout(r, 200));
    chunks = chunks
      .filter((c) => c.text && c.text.trim().length > 2)
      .map((c) => ({ ...c, vector: embedText(c.text) }));

    if (!chunks.length)
      throw new Error("No readable text was found in this source.");

    patch({ status: "ready", chunks, meta, error: null });
  } catch (e) {
    patch({
      status: "error",
      error:
        e && e.message === "NO_CAPTIONS"
          ? "No captions are available for this video. Remove this source and re-add it, pasting the transcript into the fallback box."
          : (e && e.message) ||
            "Something went wrong while indexing this source.",
    });
  }
}
