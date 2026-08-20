import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

import "./App.css";

import { usePdfJs } from "./hooks/usePdfJs";
import { uid } from "./utils/ids";
import { formatTime } from "./utils/format";
import { embedText, cosineSim } from "./services/embeddings";

import {
  loadNotebooksList,
  saveNotebooksList,
  loadNotebookData,
  saveNotebookData,
  deleteNotebookData,
} from "./services/storage";
import { runIngest } from "./services/injest";
import { TYPE_CONFIG } from "./constants/sourceTypes";

import { AddSourceModal } from "./components/AddSourceModal";
import { ChatPanel } from "./components/ChatPanel";
import { NotebookRail } from "./components/NotebookRail";
import { SourceViewerDrawer } from "./components/SourceViewerDrawer";
import { SourcesPanel } from "./components/SourcesPanel";
import { ToastProvider, useToast } from "./components/Toast";

const GEMINI_API_KEY = import.meta.env.VITE_API_KEY;

function locationLabel(chunk) {
  if (chunk.page) return `p. ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

function MainApp() {
  const pdfReady = usePdfJs();
  const pdfDocsRef = useRef({});
  const { showToast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [citation, setCitation] = useState(null); // { chunk, source }
  const [busy, setBusy] = useState(false);

  // initial load
  useEffect(() => {
    (async () => {
      let list = await loadNotebooksList();
      if (!list.length) {
        list = [
          { id: uid("nb"), name: "Untitled Notebook", createdAt: Date.now() },
        ];
        await saveNotebooksList(list);
      }
      setNotebooks(list);
      setActiveId(list[0].id);
      setLoaded(true);
    })();
  }, []);

  // load notebook data on switch
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const data = await loadNotebookData(activeId);
      setSources(data.sources || []);
      setMessages(data.messages || []);
      setCitation(null);
    })();
  }, [activeId]);

  // persist (debounced)
  useEffect(() => {
    if (!activeId || !loaded) return;
    const t = setTimeout(() => {
      saveNotebookData(activeId, { sources, messages });
    }, 400);
    return () => clearTimeout(t);
  }, [sources, messages, activeId, loaded]);

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

  const handleAddSource = (input) => {
    const id = uid("src");
    const base = {
      id,
      type: input.type,
      name: input.name || TYPE_CONFIG[input.type].label,
      status: "uploading",
      createdAt: Date.now(),
      meta: {},
      chunks: [],
      error: null,
    };
    setSources((prev) => [...prev, base]);
    setShowAddModal(false);
    showToast(`Added source "${base.name}" — indexing...`, "info");
    setTimeout(() => startIngest(base, input), 50);
  };

  const handleRemoveSource = (id) => {
    const src = sources.find((s) => s.id === id);
    setSources((prev) => prev.filter((s) => s.id !== id));
    delete pdfDocsRef.current[id];
    if (citation?.source?.id === id) {
      setCitation(null);
    }
    showToast(`Removed "${src?.name || "source"}"`, "info");
  };

  const handleReindex = (source) => {
    let input = {};
    if (source.type === "text") input = { text: source.meta.fullText };
    else if (source.type === "url") input = { url: source.meta.url };
    else if (source.type === "youtube")
      input = {
        url: source.meta.url,
        pastedTranscript: "",
      };
    else if (source.type === "vtt" || source.type === "pdf") {
      patchSource(source.id, {
        status: "error",
        error:
          "Re-select original file to re-index (raw binary data is not cached).",
      });
      showToast("Please re-upload file to re-index", "error");
      return;
    }
    patchSource(source.id, { status: "uploading", error: null });
    showToast(`Re-indexing "${source.name}"...`, "info");
    setTimeout(() => startIngest(source, input), 50);
  };

  const createNotebook = async () => {
    const nb = {
      id: uid("nb"),
      name: `Research Notebook ${notebooks.length + 1}`,
      createdAt: Date.now(),
    };
    const list = [...notebooks, nb];
    setNotebooks(list);
    await saveNotebooksList(list);
    setActiveId(nb.id);
    showToast(`Created new notebook "${nb.name}"`, "success");
  };

  const renameNotebook = async (id, name) => {
    const list = notebooks.map((n) => (n.id === id ? { ...n, name } : n));
    setNotebooks(list);
    await saveNotebooksList(list);
    showToast("Notebook renamed", "success");
  };

  const deleteNotebook = async (id) => {
    const nbToDelete = notebooks.find((n) => n.id === id);
    const list = notebooks.filter((n) => n.id !== id);
    setNotebooks(list);
    await saveNotebooksList(list);
    await deleteNotebookData(id);
    if (activeId === id && list.length) {
      setActiveId(list[0].id);
    }
    showToast(`Deleted "${nbToDelete?.name || "Notebook"}"`, "info");
  };

  const handleClearChat = () => {
    setMessages([]);
    showToast("Chat cleared", "info");
  };

  const handleSend = async (question) => {
    const userMsg = { id: uid("m"), role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const pool = [];
      sources
        .filter((s) => s.status === "ready")
        .forEach((s) => {
          s.chunks.forEach((c) =>
            pool.push({
              ...c,
              sourceId: s.id,
              sourceName: s.name,
              sourceType: s.type,
            }),
          );
        });

      const qVec = await embedText(question);
      const ranked = pool
        .map((c) => ({ ...c, score: cosineSim(qVec, c.vector) }))
        .sort((a, b) => b.score - a.score)
        .filter((c) => c.score > 0.02)
        .slice(0, 6);

      if (!ranked.length) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid("m"),
            role: "assistant",
            text: "None of the indexed sources in this notebook appear relevant to this question. Please try rephrasing or add a new source covering this topic.",
            error: true,
          },
        ]);
        setBusy(false);
        return;
      }

      const contextBlock = ranked
        .map((c, i) => {
          const loc = locationLabel(c);
          return `[${i + 1}] Source: "${c.sourceName}"${loc ? ` (${loc})` : ""}\n${c.text}`;
        })
        .join("\n\n");

      const system = `You are a careful research assistant answering questions strictly from the user's own notebook sources.
Rules:
- For greeting messages like Hi, Hello: give the following output:
        Hello! Welcome to ChaibookLM. Add sources like Textual data, Web links, PDFs, YouTube links, and VTT files to your notebook and ask anything related to them.
- Use ONLY the numbered excerpts provided below. Never use outside knowledge.
- Every factual sentence must end with the bracket number(s) of the excerpt(s) that support it, e.g. "...grew 12% [1]." or "...as shown in two places [1,3]."
- If the excerpts don't answer the question, say so plainly instead of guessing.
- Be concise, direct, and well-structured.

Excerpts:
${contextBlock}`;

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gemini-3.5-flash-lite",
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
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      const output = data?.choices?.[0]?.message?.content || "";

      setMessages((prev) => [
        ...prev,
        {
          id: uid("m"),
          role: "assistant",
          text:
            output ||
            "I couldn't generate an answer just now — please try again.",
          citedChunks: ranked,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid("m"),
          role: "assistant",
          text: `${e?.message || e}`,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const openCitation = (chunk) => {
    const source = sources.find((s) => s.id === chunk.sourceId);
    if (source) {
      setCitation({ chunk, source });
    }
  };

  const activeNotebook = notebooks.find((n) => n.id === activeId);

  if (!loaded) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--color-void)] text-white gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-2xl animate-pulse">
          <img src="/icon1.svg" alt="ChaibookLM" className="h-10 w-10 object-contain" />
        </div>
        <div className="flex items-center gap-2 text-sm font-display text-slate-300">
          <Loader2 size={16} className="animate-spin text-amber-400" />
          <span>Brewing ChaibookLM workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root flex h-screen w-full overflow-hidden bg-[var(--color-void)]">
      <NotebookRail
        notebooks={notebooks}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createNotebook}
        onDelete={deleteNotebook}
        onRename={renameNotebook}
      />

      <SourcesPanel
        sources={sources}
        onAddClick={() => setShowAddModal(true)}
        onRemove={handleRemoveSource}
        onReindex={handleReindex}
        onOpen={(s) => {
          if (s.chunks && s.chunks.length) {
            openCitation({
              ...s.chunks[0],
              sourceId: s.id,
              sourceName: s.name,
            });
          }
        }}
        activeCitationSourceId={citation?.source?.id}
      />

      <ChatPanel
        notebookName={activeNotebook ? activeNotebook.name : ""}
        sources={sources}
        messages={messages}
        onSend={handleSend}
        onOpenCitation={openCitation}
        onClearChat={handleClearChat}
        busy={busy}
      />

      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSource}
          pdfReady={pdfReady}
        />
      )}

      {citation && (
        <SourceViewerDrawer
          citation={citation.chunk}
          source={citation.source}
          pdfDocsRef={pdfDocsRef}
          onClose={() => setCitation(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
