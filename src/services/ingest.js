import { chunkCues, chunkPages, chunkPlainText } from "./chunking";
import { embedDocuments } from "./embeddings";

import { fetchWebsiteContent } from "./parsers/html";
import { fetchYouTubeTranscript, extractYouTubeId } from "./parsers/youtube";
import { parseVTT } from "./parsers/vtt";
import { APP_CONFIG } from "../constants/config";

/**
 * Executes the ingestion pipeline for a given source with a strict timeout:
 * 1. Extraction (PDF, Text, Web scraping, YouTube captions, VTT parsing)
 * 2. Semantic Chunking
 * 3. Embedding vector generation
 * 4. Status updates via patch callback
 *
 * Times out if the process takes longer than APP_CONFIG.INGESTION_TIMEOUT_MS (1 minute).
 *
 * @param {object} params
 * @param {object} params.source - Source base object
 * @param {object} params.input - Input payload (file, text, or url)
 * @param {Function} params.patch - State update patch function
 * @param {React.MutableRefObject} params.pdfDocsRef - Reference map for loaded PDF document instances
 */
export async function runIngest({ source, input, patch, pdfDocsRef }) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Source reading/indexing timed out (exceeded 1 minute limit). Please check your network or try pasting the content directly as Text.",
        ),
      );
    }, APP_CONFIG.INGESTION_TIMEOUT_MS);
  });

  const ingestProcess = async () => {
    patch({ status: "extracting", error: null });
    let chunks = [];
    const meta = { ...(source.meta || {}) };

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
        id: `${source.id}-c${i}`,
        text: c.text,
        page: c.page,
      }));
    } else if (source.type === "text") {
      meta.fullText = input.text;
      patch({ status: "chunking" });
      chunks = chunkPlainText(input.text).map((c, i) => ({
        id: `${source.id}-c${i}`,
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
        id: `${source.id}-c${i}`,
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
        id: `${source.id}-c${i}`,
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));
    } else if (source.type === "vtt") {
      const raw = await input.file.text();
      const cues = parseVTT(raw);
      if (!cues.length) {
        throw new Error("Couldn't find any WebVTT cues in that file.");
      }
      meta.fullTranscript = cues;
      patch({ status: "chunking" });
      chunks = chunkCues(cues).map((c, i) => ({
        id: `${source.id}-c${i}`,
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));
    }

    patch({ status: "embedding" });
    const validChunks = chunks.filter((c) => c.text && c.text.trim().length > 2);
    if (validChunks.length > 0) {
      const texts = validChunks.map((c) => c.text);
      const vectors = await embedDocuments(texts);
      chunks = validChunks.map((c, i) => ({ ...c, vector: vectors[i] }));
    } else {
      chunks = [];
    }

    if (!chunks.length) {
      throw new Error("No readable text was found in this source.");
    }

    patch({ status: "ready", chunks, meta, error: null });
  };

  try {
    await Promise.race([ingestProcess(), timeoutPromise]);
  } catch (e) {
    patch({
      status: "error",
      error:
        e && e.message === "NO_CAPTIONS"
          ? "No captions are available for this video. Remove this source and re-add it, pasting the transcript into the fallback box."
          : (e && e.message) ||
            "Something went wrong while indexing this source.",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
