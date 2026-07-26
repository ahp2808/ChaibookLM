import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Globe,
  Video,
  Captions,
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Send,
  ExternalLink,
  Library,
  Sparkles,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { AddSourceModal } from "./AddSourceModal";
import {renderAnswerWithCitations} from "./Citation"
import {FullTextHighlight} from "./FullTextHighlight"
import {IconButton} from "./IconButton"
import {NotebookRail} from "./NotebookRail"
import {SourceRow} from "./SourceRow"
import {SourceViewerDrawer} from "./SourceViewerDrawer"
import {SourcesPanel} from "./SoursesPanel"
import {StatusBadge} from "./StatusBadge"

function locationLabel(chunk) {
  if (chunk.page) return `p. ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

export function ChatPanel({
  notebookName,
  sources,
  messages,
  onSend,
  onOpenCitation,
  busy,
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const readySources = sources.filter((s) => s.status === "ready");

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const submit = () => {
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="chat-panel flex h-full flex-1 flex-col">
      <div className="chat-header px-6 pt-6 pb-4">
        <div className="chat-title">{notebookName}</div>
        <div className="chat-subtitle">
          Grounded in {readySources.length} indexed source
          {readySources.length === 1 ? "" : "s"} — every claim below is
          traceable to one.
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-10 text-center">
            <Sparkles
              size={22}
              className="mx-auto mb-3"
              style={{ color: "var(--color-gold)" }}
            />
            <p className="empty-chat-title">Ask your notebook something</p>
            <p className="empty-chat-text">
              Answers are built only from what you've added here, with a
              numbered citation you can click to jump to the exact page,
              timestamp, or passage.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.role === "user" ? (
              <div className="flex justify-end">
                <div className="bubble-user max-w-lg rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div
                    className={`bubble-assistant ${m.error ? "error-text" : ""} rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed`}
                  >
                    {m.error
                      ? m.text
                      : renderAnswerWithCitations(
                          m.text,
                          m.citedChunks || [],
                          onOpenCitation,
                        )}
                  </div>
                  {m.citedChunks && m.citedChunks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                      {m.citedChunks.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => onOpenCitation(c)}
                          className="source-chip flex items-center gap-1 rounded-md px-2 py-1"
                        >
                          <span className="source-chip-num rounded px-1">
                            {i + 1}
                          </span>
                          <span className="source-chip-name truncate">
                            {c.sourceName}
                          </span>
                          {locationLabel(c) && (
                            <span
                              className="font-mono"
                              style={{ color: "var(--color-ink-faint)" }}
                            >
                              · {locationLabel(c)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="busy-indicator flex items-center gap-2 px-1">
            <Loader2 size={14} className="animate-spin" />
            Reading sources and drafting a grounded answer…
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="composer flex items-end gap-2 rounded-xl px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              readySources.length
                ? "Ask a question grounded in your sources…"
                : "Add and index a source first…"
            }
            rows={1}
            disabled={!readySources.length}
            className="composer-textarea max-h-32 flex-1 resize-none py-1.5 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || busy || !readySources.length}
            className={`send-btn ${input.trim() && !busy && readySources.length ? "enabled" : "disabled"} flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
