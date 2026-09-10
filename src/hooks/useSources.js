import { useState, useCallback, useRef } from "react";
import { uid } from "../utils/ids";
import { TYPE_CONFIG } from "../constants/sourceTypes";
import { runIngest } from "../services/ingest";

/**
 * Custom hook to manage sources for the current active notebook.
 *
 * @param {object} options
 * @param {Function} [options.onNotify] - Callback for toasts/notifications
 * @param {Function} [options.onClearCitation] - Callback to clear open citation if source is removed
 */
export function useSources({ onNotify, onClearCitation } = {}) {
  const [sources, setSources] = useState([]);
  const pdfDocsRef = useRef({});

  const patchSource = useCallback((id, patch) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...patch, meta: { ...s.meta, ...(patch.meta || {}) } }
          : s,
      ),
    );
  }, []);

  const startIngest = useCallback(
    (source, input) => {
      runIngest({
        source,
        input,
        patch: (p) => patchSource(source.id, p),
        pdfDocsRef,
      });
    },
    [patchSource],
  );

  const addSource = useCallback(
    (input) => {
      const id = uid("src");
      const base = {
        id,
        type: input.type,
        name: input.name || TYPE_CONFIG[input.type]?.label || "Source",
        status: "uploading",
        createdAt: Date.now(),
        meta: {},
        chunks: [],
        error: null,
      };
      setSources((prev) => [...prev, base]);
      onNotify?.(`Added source "${base.name}" — indexing...`, "info");
      setTimeout(() => startIngest(base, input), 50);
      return id;
    },
    [onNotify, startIngest],
  );

  const removeSource = useCallback(
    (id) => {
      const src = sources.find((s) => s.id === id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      delete pdfDocsRef.current[id];
      onClearCitation?.(id);
      onNotify?.(`Removed "${src?.name || "source"}"`, "info");
    },
    [sources, onClearCitation, onNotify],
  );

  const reindexSource = useCallback(
    (source) => {
      let input = {};
      if (source.type === "text") input = { text: source.meta.fullText };
      else if (source.type === "url") input = { url: source.meta.url };
      else if (source.type === "youtube") {
        input = {
          url: source.meta.url,
          pastedTranscript: "",
        };
      } else if (source.type === "vtt" || source.type === "pdf") {
        patchSource(source.id, {
          status: "error",
          error:
            "Re-select original file to re-index (raw binary data is not cached).",
        });
        onNotify?.("Please re-upload file to re-index", "error");
        return;
      }
      patchSource(source.id, { status: "uploading", error: null });
      onNotify?.(`Re-indexing "${source.name}"...`, "info");
      setTimeout(() => startIngest(source, input), 50);
    },
    [patchSource, onNotify, startIngest],
  );

  return {
    sources,
    setSources,
    pdfDocsRef,
    patchSource,
    addSource,
    removeSource,
    reindexSource,
  };
}
