import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Send,
} from "lucide-react";

import "./App.css";

import { OpenAI } from "openai";

import {usePdfJs} from "./hooks/usePdfJs"
import {uid} from "./utils/ids"
import {formatTime} from "./utils/format"
import { embedText, cosineSim } from "./services/embeddings";

import {
  loadNotebooksList,
  saveNotebooksList,
  loadNotebookData,
  saveNotebookData,
  deleteNotebookData,
} from "./services/storage";
import {runIngest} from "./services/injest";

import { TYPE_CONFIG } from "./constants/sourceTypes";

import {AddSourceModal} from "./components/AddSourceModal"
import {ChatPanel} from "./components/ChatPanel"
import {NotebookRail} from "./components/NotebookRail"
import {SourceViewerDrawer} from "./components/SourceViewerDrawer"
import {SourcesPanel} from "./components/SoursesPanel"

// import { askGroundedQuestion } from "./services/anthropicApi";

const GEMINI_API_KEY = import.meta.env.VITE_API_KEY;

const EMBED_DIM = 160;
const STOPWORDS = new Set(
  "a an the of to in on for and or is are was were be been being this that these those it its as at by with from into over under about than then so if not no do does did can could should would will shall may might i you he she we they them his her our your their what which who whom how when where why".split(
    " ",
  ),
);


function locationLabel(chunk) {
  if (chunk.page) return `p. ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

export default function App() {
  const pdfReady = usePdfJs();
  const pdfDocsRef = useRef({});

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
          { id: uid("nb"), name: "Untitled notebook", createdAt: Date.now() },
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
    setTimeout(() => startIngest(base, input), 50);
  };

  const handleRemoveSource = (id) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    delete pdfDocsRef.current[id];
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
          "Re-select the original file to re-index this source (raw file data isn't kept in memory).",
      });
      return;
    }
    patchSource(source.id, { status: "uploading", error: null });
    setTimeout(() => startIngest(source, input), 50);
  };

  const createNotebook = async () => {
    const nb = {
      id: uid("nb"),
      name: "Untitled notebook",
      createdAt: Date.now(),
    };
    const list = [...notebooks, nb];
    setNotebooks(list);
    await saveNotebooksList(list);
    setActiveId(nb.id);
  };

  const renameNotebook = async (id, name) => {
    const list = notebooks.map((n) => (n.id === id ? { ...n, name } : n));
    setNotebooks(list);
    await saveNotebooksList(list);
  };

  const deleteNotebook = async (id) => {
    const list = notebooks.filter((n) => n.id !== id);
    setNotebooks(list);
    await saveNotebooksList(list);
    await deleteNotebookData(id);
    if (activeId === id && list.length) setActiveId(list[0].id);
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

      const qVec = embedText(question);
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
            text: "None of the indexed sources in this notebook seem related to that question, so I can't ground an answer in them. Try rephrasing, or add a source that covers this.",
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
        Hello, Welcome to ChaibookLM. Add sources like Textual data, Web links, PDFs, Youtube links and VTT files to the notebook and ask anything related to them.
- Use ONLY the numbered excerpts provided below. Never use outside knowledge.
- Every factual sentence must end with the bracket number(s) of the excerpt(s) that support it, e.g. "...grew 12% [1]." or "...as shown in two places [1,3]."
- If the excerpts don't answer the question, say so plainly instead of guessing.
- Be concise and direct.

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
      console.log(data);
      console.log(data.choices[0].message.content);
      const output = data.choices[0].message.content;
      const answerText = (output || []);

      setMessages((prev) => [
        ...prev,
        {
          id: uid("m"),
          role: "assistant",
          text:
            answerText ||
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
          text: `${e}`,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const openCitation = (chunk) => {
    const source = sources.find((s) => s.id === chunk.sourceId);
    if (source) setCitation({ chunk, source });
  };

  const activeNotebook = notebooks.find((n) => n.id === activeId);

  if (!loaded) {
    return (
      <div className="loading-screen flex h-screen w-full items-center justify-center">
        <Loader2
          className="animate-spin"
          style={{ color: "var(--color-gold)" }}
          size={22}
        />
      </div>
    );
  }

  return (
    <div className="app-root flex h-screen w-full overflow-hidden">
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
          if (s.chunks && s.chunks.length)
            openCitation({
              ...s.chunks[0],
              sourceId: s.id,
              sourceName: s.name,
            });
        }}
      />
      <ChatPanel
        notebookName={activeNotebook ? activeNotebook.name : ""}
        sources={sources}
        messages={messages}
        onSend={handleSend}
        onOpenCitation={openCitation}
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
