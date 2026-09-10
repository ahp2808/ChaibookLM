import { embedText, cosineSim } from "./embeddings";
import { formatTime } from "../utils/format";
import { APP_CONFIG } from "../constants/config";

const GEMINI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) ||
  (typeof globalThis !== "undefined" && globalThis.process?.env?.VITE_API_KEY) ||
  "";

/**
 * Format chunk location label for citations (e.g. "p. 3" or "02:15")
 * @param {object} chunk
 * @returns {string|null}
 */
export function formatLocationLabel(chunk) {
  if (!chunk) return null;
  if (chunk.page) return `p. ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

/**
 * Rank source chunks based on semantic similarity to the user question
 * @param {string} question - User's query
 * @param {Array} sources - List of source objects
 * @returns {Promise<Array>} - Top matching ranked chunks
 */
export async function rankRelevantChunks(question, sources) {
  const pool = [];
  sources
    .filter((s) => s.status === "ready")
    .forEach((s) => {
      (s.chunks || []).forEach((c) =>
        pool.push({
          ...c,
          sourceId: s.id,
          sourceName: s.name,
          sourceType: s.type,
        }),
      );
    });

  if (!pool.length) return [];

  const qVec = await embedText(question);
  return pool
    .map((c) => ({ ...c, score: cosineSim(qVec, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .filter((c) => c.score > APP_CONFIG.AI.MIN_SIMILARITY_SCORE)
    .slice(0, APP_CONFIG.AI.MAX_CITED_CHUNKS);
}

/**
 * Build grounded system prompt with numbered source excerpt blocks
 * @param {Array} rankedChunks
 * @returns {string}
 */
export function buildGroundedPrompt(rankedChunks) {
  const contextBlock = rankedChunks
    .map((c, i) => {
      const loc = formatLocationLabel(c);
      return `[${i + 1}] Source: "${c.sourceName}"${loc ? ` (${loc})` : ""}\n${c.text}`;
    })
    .join("\n\n");

  return `You are a careful research assistant answering questions strictly from the user's own notebook sources.
Rules:
- For greeting messages like Hi, Hello: give the following output:
        Hello! Welcome to ChaibookLM. Add sources like Textual data, Web links, PDFs, YouTube links, and VTT files to your notebook and ask anything related to them.
- Use ONLY the numbered excerpts provided below. Never use outside knowledge.
- Every factual sentence must end with the bracket number(s) of the excerpt(s) that support it, e.g. "...grew 12% [1]." or "...as shown in two places [1,3]."
- If the excerpts don't answer the question, say so plainly instead of guessing.
- Be concise, direct, and well-structured.

Excerpts:
${contextBlock}`;
}

/**
 * Call Gemini API with grounded context
 * @param {string} question
 * @param {Array} rankedChunks
 * @returns {Promise<string>}
 */
export async function queryGemini(question, rankedChunks) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini API Key. Please add VITE_API_KEY to your .env file.",
    );
  }

  const system = buildGroundedPrompt(rankedChunks);

  const res = await fetch(APP_CONFIG.AI.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: APP_CONFIG.AI.DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.error?.message || "";
    } catch (_e) {
      // ignore json parse error
    }
    throw new Error(
      `Gemini API error (${res.status}): ${errorDetail || res.statusText}`,
    );
  }

  const data = await res.json();
  return (
    data?.choices?.[0]?.message?.content ||
    "I couldn't generate an answer just now — please try again."
  );
}
