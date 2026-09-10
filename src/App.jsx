import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

import "./App.css";

import { usePdfJs } from "./hooks/usePdfJs";
import { useNotebooks } from "./hooks/useNotebooks";
import { useSources } from "./hooks/useSources";
import { useGroundedChat } from "./hooks/useGroundedChat";

import { loadNotebookData, saveNotebookData } from "./services/storage";

import { AddSourceModal } from "./components/AddSourceModal";
import { ChatPanel } from "./components/ChatPanel";
import { NotebookRail } from "./components/NotebookRail";
import { SourceViewerDrawer } from "./components/SourceViewerDrawer";
import { SourcesPanel } from "./components/SourcesPanel";
import { ToastProvider, useToast } from "./components/Toast";

function MainApp() {
  const pdfReady = usePdfJs();
  const { showToast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [citation, setCitation] = useState(null); // { chunk, source }

  // Custom Hooks
  const {
    notebooks,
    activeId,
    activeNotebook,
    setActiveId,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    loaded,
  } = useNotebooks({ onNotify: showToast });

  const handleClearCitation = useCallback((sourceId) => {
    setCitation((prev) => (prev?.source?.id === sourceId ? null : prev));
  }, []);

  const {
    sources,
    setSources,
    pdfDocsRef,
    addSource,
    removeSource,
    reindexSource,
  } = useSources({
    onNotify: showToast,
    onClearCitation: handleClearCitation,
  });

  const { messages, setMessages, busy, sendMessage, clearChat } =
    useGroundedChat({
      onNotify: showToast,
    });

  // Load notebook data when active notebook switches
  useEffect(() => {
    if (!activeId) return;
    let isMounted = true;
    (async () => {
      const data = await loadNotebookData(activeId);
      if (isMounted) {
        setSources(data.sources || []);
        setMessages(data.messages || []);
        setCitation(null);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeId, setSources, setMessages]);

  // Debounced auto-persistence
  useEffect(() => {
    if (!activeId || !loaded) return;
    const timer = setTimeout(() => {
      saveNotebookData(activeId, { sources, messages });
    }, 400);
    return () => clearTimeout(timer);
  }, [sources, messages, activeId, loaded]);

  const handleOpenCitation = useCallback(
    (chunk) => {
      const source = sources.find((s) => s.id === chunk.sourceId);
      if (source) {
        setCitation({ chunk, source });
      }
    },
    [sources],
  );

  if (!loaded) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--color-void)] text-white gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-2xl animate-pulse">
          <img
            src="/icon1.svg"
            alt="ChaibookLM"
            className="h-10 w-10 object-contain"
          />
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
        onRemove={removeSource}
        onReindex={reindexSource}
        onOpen={(s) => {
          if (s.chunks && s.chunks.length) {
            handleOpenCitation({
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
        onSend={(q) => sendMessage(q, sources)}
        onOpenCitation={handleOpenCitation}
        onClearChat={clearChat}
        busy={busy}
      />

      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(input) => {
            addSource(input);
            setShowAddModal(false);
          }}
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
