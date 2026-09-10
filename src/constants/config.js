/**
 * Global Configuration Constants for ChaibookLM
 */

export const APP_CONFIG = {
  // Storage Keys
  STORAGE_KEYS: {
    NOTEBOOKS_LIST: "notebooks-list",
    LOCAL_NOTEBOOKS: "chaibooklm_notebooks",
    NOTEBOOK_DATA_PREFIX: "notebook-data:",
    LOCAL_DATA_PREFIX: "chaibooklm_data_",
  },

  // AI & RAG Configuration
  AI: {
    DEFAULT_MODEL: "gemini-3.5-flash-lite",
    EMBEDDING_MODEL: "gemini-embedding-001",
    MIN_SIMILARITY_SCORE: 0.02,
    MAX_CITED_CHUNKS: 6,
    API_URL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  },

  // Chunking parameters
  CHUNKING: {
    TEXT_SIZE: 700,
    TEXT_OVERLAP: 120,
    CUES_SIZE: 650,
  },

  // Ingestion Limits
  INGESTION_TIMEOUT_MS: 60000, // 1 minute limit for reading/indexing any source
};
