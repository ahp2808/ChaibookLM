import {
  FileText,
  Globe,
  Video,
  Captions,
  } from "lucide-react";
export const TYPE_CONFIG = {
  pdf: { label: "PDF", icon: FileText },
  text: { label: "Text", icon: FileText },
  url: { label: "Website", icon: Globe },
  youtube: { label: "YouTube", icon: Video },
  vtt: { label: "Transcript", icon: Captions },
};

export const STATUS_LABEL = {
  uploading: "Uploading",
  extracting: "Reading",
  chunking: "Chunking",
  embedding: "Embedding",
  ready: "Ready",
  error: "Failed",
};
