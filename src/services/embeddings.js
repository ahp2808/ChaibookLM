import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";

// Default API Key from environment
const GEMINI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) ||
  (typeof globalThis !== "undefined" && globalThis.process?.env?.VITE_API_KEY) ||
  "";

/**
 * Creates an instance of GoogleGenerativeAIEmbeddings or OpenAIEmbeddings
 */
export function getEmbeddingModel(options = {}) {
  const provider = options.provider || "google";
  const apiKey = options.apiKey || GEMINI_API_KEY;

  if (provider === "openai") {
    return new OpenAIEmbeddings({
      model: options.model || "text-embedding-3-small",
      openAIApiKey: apiKey,
    });
  }

  return new GoogleGenerativeAIEmbeddings({
    model: options.model || "gemini-embedding-001", // can also use gemini-embedding-002
    apiKey: apiKey,
  });
}

/**
 * Convert user query / single text into vector embeddings
 * @param {string} userQuery
 * @param {object} [options]
 * @returns {Promise<number[]>}
 */
export async function query(userQuery, options = {}) {
  const embeddings = getEmbeddingModel(options);
  return await embeddings.embedQuery(userQuery);
}

/**
 * Alias for query (embeds single text)
 * @param {string} text
 * @param {object} [options]
 * @returns {Promise<number[]>}
 */
export async function embedText(text, options = {}) {
  return await query(text, options);
}

/**
 * Convert multiple document chunks into vector embeddings
 * @param {string[]} texts
 * @param {object} [options]
 * @returns {Promise<number[][]>}
 */
export async function embedDocuments(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const embeddings = getEmbeddingModel(options);
  return await embeddings.embedDocuments(texts);
}

/**
 * Computes cosine similarity between two embedding vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

export { GoogleGenerativeAIEmbeddings, OpenAIEmbeddings };
