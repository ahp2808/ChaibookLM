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
import {IconButton} from "../components/IconButton"

/* =========================================================================
   ADD SOURCE MODAL
   ========================================================================= */
export function AddSourceModal({ onClose, onAdd, pdfReady }) {
  const [tab, setTab] = useState("pdf");
  const [text, setText] = useState("");
  const [textName, setTextName] = useState("");
  const [url, setUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytTranscript, setYtTranscript] = useState("");
  const fileRef = useRef(null);
  const vttRef = useRef(null);

  const tabs = [
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "text", label: "Text", icon: FileText },
    { id: "url", label: "Website", icon: Globe },
    { id: "youtube", label: "YouTube", icon: Video },
    { id: "vtt", label: "Transcript", icon: Captions },
  ];

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel flex w-full max-w-lg flex-col rounded-xl"
      >
        <div className="modal-header flex items-center justify-between px-5 py-4">
          <h2 className="modal-title">Add a source</h2>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`modal-tab ${tab === t.id ? "active" : ""} flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body flex-1 overflow-y-auto px-5 py-5">
          {tab === "pdf" && (
            <div>
              <p className="field-label-text" style={{ marginBottom: 12 }}>
                Text is extracted page by page, so citations can jump straight
                to the right page.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) onAdd({ type: "pdf", name: f.name, file: f });
                }}
              />
              <button
                disabled={!pdfReady}
                onClick={() => fileRef.current.click()}
                className={`dropzone ${!pdfReady ? "disabled" : ""} flex w-full flex-col items-center justify-center gap-2 rounded-lg py-10 text-sm`}
              >
                <Upload size={20} />
                {pdfReady ? "Choose a PDF file" : "Loading PDF engine…"}
              </button>
            </div>
          )}

          {tab === "text" && (
            <div className="flex flex-col gap-3">
              <input
                value={textName}
                onChange={(e) => setTextName(e.target.value)}
                placeholder="Source name (e.g. Interview notes)"
                className="field-input rounded-md px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste plain text here…"
                rows={8}
                className="field-textarea rounded-md px-3 py-2 text-sm outline-none"
              />
              <button
                disabled={!text.trim()}
                onClick={() =>
                  onAdd({
                    type: "text",
                    name: textName.trim() || "Untitled text",
                    text,
                  })
                }
                className={`btn-primary ${text.trim() ? "enabled" : "disabled"} rounded-md py-2 text-sm`}
              >
                Add text source
              </button>
            </div>
          )}

          {tab === "url" && (
            <div className="flex flex-col gap-3">
              <p className="field-label-text">
                NotebookLM tries to read the page directly, then falls back to a
                proxy. Some sites still block automated reading — if that
                happens, paste the article as a Text source instead.
              </p>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="field-input mono rounded-md px-3 py-2 text-sm outline-none"
              />
              <button
                disabled={!url.trim()}
                onClick={() =>
                  onAdd({ type: "url", name: url.trim(), url: url.trim() })
                }
                className={`btn-primary ${url.trim() ? "enabled" : "disabled"} rounded-md py-2 text-sm`}
              >
                Fetch and add
              </button>
            </div>
          )}

          {tab === "youtube" && (
            <div className="flex flex-col gap-3">
              <input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className="field-input mono rounded-md px-3 py-2 text-sm outline-none"
              />
              <p className="hint-text">
                NotebookLM will try to fetch public captions automatically. If a
                video has none reachable, paste the transcript below (plain
                text, or WebVTT with timestamps) as a fallback.
              </p>
              <textarea
                value={ytTranscript}
                onChange={(e) => setYtTranscript(e.target.value)}
                placeholder="Optional: paste transcript / VTT here as a fallback…"
                rows={5}
                className="field-textarea rounded-md px-3 py-2 text-sm outline-none"
              />
              <button
                disabled={!ytUrl.trim()}
                onClick={() =>
                  onAdd({
                    type: "youtube",
                    name: ytUrl.trim(),
                    url: ytUrl.trim(),
                    pastedTranscript: ytTranscript,
                  })
                }
                className={`btn-primary ${ytUrl.trim() ? "enabled" : "disabled"} rounded-md py-2 text-sm`}
              >
                Add video
              </button>
            </div>
          )}

          {tab === "vtt" && (
            <div>
              <p className="field-label-text" style={{ marginBottom: 12 }}>
                Upload a .vtt transcript file. Cues are grouped into chunks that
                keep their timestamp range for citation lookups.
              </p>
              <input
                ref={vttRef}
                type="file"
                accept=".vtt,text/vtt,.srt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) onAdd({ type: "vtt", name: f.name, file: f });
                }}
              />
              <button
                onClick={() => vttRef.current.click()}
                className="dropzone flex w-full flex-col items-center justify-center gap-2 rounded-lg py-10 text-sm"
              >
                <Upload size={20} />
                Choose a .vtt file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
