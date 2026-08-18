import { useState, useRef } from "react";
import {
  FileText,
  Globe,
  Video,
  Captions,
  X,
  Upload,
  Link,
  CheckCircle2,
} from "lucide-react";
import { IconButton } from "./IconButton";

export function AddSourceModal({ onClose, onAdd, pdfReady }) {
  const [tab, setTab] = useState("pdf");
  const [text, setText] = useState("");
  const [textName, setTextName] = useState("");
  const [url, setUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytTranscript, setYtTranscript] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileRef = useRef(null);
  const vttRef = useRef(null);

  const tabs = [
    { id: "pdf", label: "PDF", icon: FileText, color: "text-rose-400" },
    { id: "text", label: "Text", icon: FileText, color: "text-amber-400" },
    { id: "url", label: "Website", icon: Globe, color: "text-sky-400" },
    { id: "youtube", label: "YouTube", icon: Video, color: "text-red-400" },
    { id: "vtt", label: "Transcript", icon: Captions, color: "text-purple-400" },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (tab === "pdf" && file.type === "application/pdf") {
        setSelectedFile(file);
      } else if (tab === "vtt" && (file.name.endsWith(".vtt") || file.name.endsWith(".srt"))) {
        setSelectedFile(file);
      }
    }
  };

  const handlePdfSubmit = () => {
    if (selectedFile) {
      onAdd({ type: "pdf", name: selectedFile.name, file: selectedFile });
    }
  };

  const handleVttSubmit = () => {
    if (selectedFile) {
      onAdd({ type: "vtt", name: selectedFile.name, file: selectedFile });
    }
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel flex w-full max-w-lg flex-col rounded-2xl overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              +
            </div>
            <h2 className="font-display font-semibold text-lg text-white tracking-tight">
              Add Knowledge Source
            </h2>
          </div>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--color-hairline)] bg-[var(--color-void)] px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelectedFile(null);
                }}
                className={`modal-tab ${active ? "active" : ""} flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium cursor-pointer`}
              >
                <Icon size={14} className={t.color} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="modal-body flex-1 overflow-y-auto p-6 bg-[var(--color-raised)]">
          {tab === "pdf" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                PDF documents are indexed page by page with full text vectorization. Citations will jump straight to the exact page.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setSelectedFile(f);
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`dropzone-box ${isDragging ? "dragging" : ""} ${!pdfReady ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center`}
              >
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <Upload size={22} />
                </div>

                {selectedFile ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>{selectedFile.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to index
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {pdfReady ? "Click or drag PDF file here" : "Loading PDF parser engine…"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports research papers, reports, notes, and ebooks
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedFile || !pdfReady}
                  onClick={handlePdfSubmit}
                  className="send-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Index PDF
                </button>
              </div>
            </div>
          )}

          {tab === "text" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Title
                </label>
                <input
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                  placeholder="e.g. Meeting Notes / Research Outline"
                  className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline-2)] px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Content
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {text.length} characters
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or write plain text, markdown, or excerpts..."
                  rows={7}
                  className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline-2)] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/60 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!text.trim()}
                  onClick={() =>
                    onAdd({
                      type: "text",
                      name: textName.trim() || "Untitled Text Source",
                      text: text.trim(),
                    })
                  }
                  className="send-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Index Text
                </button>
              </div>
            </div>
          )}

          {tab === "url" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter any public webpage or article URL. Content will be extracted and converted into indexed text chunks.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Website URL
                </label>
                <div className="relative flex items-center">
                  <Link size={14} className="absolute left-3 text-slate-400" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/..."
                    className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline-2)] pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!url.trim()}
                  onClick={() =>
                    onAdd({ type: "url", name: url.trim(), url: url.trim() })
                  }
                  className="send-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Fetch & Index
                </button>
              </div>
            </div>
          )}

          {tab === "youtube" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste a YouTube URL. ChaibookLM will extract timestamps and speech captions for exact playback jumping.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  YouTube Video Link
                </label>
                <input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline-2)] px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Fallback Transcript
                </label>
                <textarea
                  value={ytTranscript}
                  onChange={(e) => setYtTranscript(e.target.value)}
                  placeholder="Paste manual captions or WebVTT cues if video has disabled auto-subtitles..."
                  rows={4}
                  className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline-2)] px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/60 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
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
                  className="send-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Index Video
                </button>
              </div>
            </div>
          )}

          {tab === "vtt" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a <code>.vtt</code> or <code>.srt</code> subtitle file. Cues will retain timestamp metadata for accurate citations.
              </p>

              <input
                ref={vttRef}
                type="file"
                accept=".vtt,text/vtt,.srt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setSelectedFile(f);
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => vttRef.current?.click()}
                className={`dropzone-box ${isDragging ? "dragging" : ""} cursor-pointer flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center`}
              >
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Captions size={22} />
                </div>

                {selectedFile ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>{selectedFile.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ready to index transcript
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click or drag .vtt / .srt file here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports WebVTT and SubRip subtitle formats
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedFile}
                  onClick={handleVttSubmit}
                  className="send-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Index Transcript
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
