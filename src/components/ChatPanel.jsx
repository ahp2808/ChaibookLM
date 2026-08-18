import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Send,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Volume2,
} from "lucide-react";
import { renderAnswerWithCitations } from "./Citation";
import { formatTime } from "../utils/format";
import { IconButton } from "./IconButton";
import { useToast } from "./Toast";
import { TYPE_CONFIG } from "../constants/sourceTypes";

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
  onClearChat,
  busy,
}) {
  const [input, setInput] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const { showToast } = useToast();

  const readySources = sources.filter((s) => s.status === "ready");

  const starterPrompts = [
    {
      label: "Summarize Key Takeaways",
      prompt: "Provide a comprehensive summary of the main points and key takeaways from all indexed sources.",
    },
    {
      label: "Main Arguments & Evidence",
      prompt: "What are the core arguments and supporting evidence presented across the sources?",
    },
    {
      label: "Extract Key Statistics & Quotes",
      prompt: "List all notable statistics, metrics, and direct key quotes mentioned in the sources.",
    },
    {
      label: "Timeline of Events",
      prompt: "Can you create a chronological timeline or structured outline of events described in the sources?",
    },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, busy]);

  const submit = () => {
    if (!input.trim() || busy || !readySources.length) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleStarterClick = (promptText) => {
    if (!readySources.length) {
      showToast("Please add and index at least one source first", "info");
      return;
    }
    onSend(promptText);
  };

  const copyMessageText = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    showToast("Answer copied to clipboard", "success");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      showToast("Speech synthesis not supported in this browser", "error");
      return;
    }
    window.speechSynthesis.cancel();
    // Strip citation numbers like [1] before reading
    const cleanText = text.replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast("Reading aloud...", "info");
  };

  return (
    <main className="chat-panel flex h-full flex-1 flex-col overflow-hidden relative">
      {/* Top Header */}
      <header className="px-8 pt-5 pb-4 border-b border-[var(--color-hairline)] bg-[var(--color-void)]/60 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10">
        <div className="min-w-0 flex-1 mr-4">
          <h1 className="font-display italic font-semibold text-xl text-[var(--color-ink)] tracking-tight truncate">
            {notebookName || "Untitled Notebook"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
              <span className="relative flex h-2 w-2">
                <span className={`inline-flex rounded-full h-2 w-2 ${readySources.length ? "bg-amber-400" : "bg-slate-500"}`}></span>
              </span>
              Grounded in {readySources.length} active source{readySources.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && onClearChat && (
            <IconButton
              title="Clear conversation"
              onClick={onClearChat}
              className="text-slate-400 hover:text-rose-400"
            >
              <Trash2 size={15} />
            </IconButton>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-12 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl pt-8 pb-12 text-center animate-fade-in">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <Sparkles size={26} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-white tracking-tight">
              Ask your grounded notebook
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Every factual sentence in your answers is verified and linked to exact page numbers, video timestamps, or textual excerpts from your sources.
            </p>

            {/* Quick Starter Prompts */}
            <div className="mt-8">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                Suggested questions to get started:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-xl mx-auto">
                {starterPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleStarterClick(p.prompt)}
                    className="prompt-chip flex flex-col p-3 rounded-xl text-left group cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-amber-400/90 group-hover:text-amber-300 transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                      "{p.prompt}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="animate-slide-up">
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bubble-user max-w-xl rounded-2xl rounded-tr-sm px-5 py-3 text-sm leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-3xl w-full">
                    <div className="bubble-assistant rounded-2xl rounded-tl-sm px-6 py-5 text-sm leading-relaxed relative group">
                      {/* Assistant Header Badge */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-display">
                            ☕
                          </div>
                          <span className="font-semibold text-xs text-amber-400 tracking-wide">
                            ChaibookLM Answer
                          </span>
                        </div>

                        {/* Message Toolbar */}
                        {!m.error && (
                          <div className="flex items-center gap-1">
                            <IconButton
                              title="Read aloud"
                              size="sm"
                              onClick={() => speakText(m.text)}
                            >
                              <Volume2 size={13} />
                            </IconButton>
                            <IconButton
                              title="Copy answer"
                              size="sm"
                              onClick={() => copyMessageText(m.id, m.text)}
                            >
                              {copiedMsgId === m.id ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </IconButton>
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      {m.error ? (
                        <div className="text-rose-400 text-sm font-medium">
                          {m.text}
                        </div>
                      ) : (
                        renderAnswerWithCitations(
                          m.text,
                          m.citedChunks || [],
                          onOpenCitation,
                        )
                      )}
                    </div>

                    {/* Cited Source Badges List */}
                    {m.citedChunks && m.citedChunks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 px-1 items-center">
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          Cited Sources:
                        </span>
                        {m.citedChunks.map((c, i) => {
                          const cfg = TYPE_CONFIG[c.sourceType] || TYPE_CONFIG.text;
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => onOpenCitation(c)}
                              className="source-chip flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                              title={`Inspect Citation [${i + 1}] in ${c.sourceName}`}
                            >
                              <span className="source-chip-num rounded px-1.5 py-0.2 text-[10px]">
                                {i + 1}
                              </span>
                              <Icon size={12} className="text-amber-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px] font-medium text-slate-200">
                                {c.sourceName}
                              </span>
                              {locationLabel(c) && (
                                <span className="font-mono text-[10px] text-amber-400/80">
                                  ({locationLabel(c)})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Processing State */}
        {busy && (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-5 py-3.5 max-w-md animate-pulse">
            <Loader2 size={16} className="animate-spin text-amber-400" />
            <span className="text-xs font-medium text-amber-200">
              Synthesizing response from {readySources.length} indexed sources…
            </span>
          </div>
        )}
      </div>

      {/* Floating Bottom Composer */}
      <footer className="px-6 md:px-12 pb-6 pt-2 flex-shrink-0">
        <div className="composer-bar relative flex flex-col rounded-2xl p-2 transition-all">
          <textarea
            ref={textareaRef}
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
                ? "Ask a question grounded in your sources..."
                : "Add and index sources in the sidebar to start asking questions..."
            }
            rows={2}
            disabled={!readySources.length || busy}
            className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-[var(--color-ink)] placeholder-slate-500 outline-none max-h-36 leading-relaxed"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-sans">Enter ↵</kbd> to ask · <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-sans">Shift+Enter</kbd> for newline
              </span>
            </div>

            <button
              onClick={submit}
              disabled={!input.trim() || busy || !readySources.length}
              className="send-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <span>Ask</span>
              <Send size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
