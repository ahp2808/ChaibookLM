import { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants/sourceTypes";
import { formatTime } from "../utils/format";
import { FullTextHighlight } from "./FullTextHighlight";
import { IconButton } from "./IconButton";

function locationLabel(chunk) {
  if (!chunk) return null;
  if (chunk.page) return `Page ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

export function SourceViewerDrawer({ citation, source, pdfDocsRef, onClose }) {
  const canvasRef = useRef(null);
  const [pageError, setPageError] = useState(false);
  const [currentPage, setCurrentPage] = useState(citation?.page || 1);
  const [pdfScale, setPdfScale] = useState(1.3);
  const bodyRef = useRef(null);

  const numPages = (source?.meta && source.meta.numPages) || 1;

  useEffect(() => {
    if (citation?.page) {
      setCurrentPage(citation.page);
    }
  }, [citation]);

  useEffect(() => {
    setPageError(false);
    if (!source) return;

    if (source.type === "pdf") {
      const pdf = pdfDocsRef.current[source.id];
      if (!pdf) {
        setPageError(true);
        return;
      }
      (async () => {
        try {
          const page = await pdf.getPage(currentPage);
          const viewport = page.getViewport({ scale: pdfScale });
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (_e) {
          setPageError(true);
        }
      })();
    }

    if (bodyRef.current) {
      setTimeout(() => {
        const el = bodyRef.current?.querySelector("[data-highlight='true']");
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 100);
    }
  }, [citation, source, currentPage, pdfScale, pdfDocsRef]);

  if (!source) return null;

  const cfg = TYPE_CONFIG[source.type] || TYPE_CONFIG.text;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="drawer-overlay fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Slide-out Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="drawer-panel relative flex h-full w-full max-w-2xl flex-col bg-[var(--color-surface)] border-l border-[var(--color-hairline-2)] shadow-2xl animate-slide-right"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-void)]/60">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate max-w-md" title={source.name}>
                {source.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                <span className="text-amber-400">
                  {locationLabel(citation) ? `Cited passage · ${locationLabel(citation)}` : "Source Inspector"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {source.type === "url" && source.meta?.url && (
              <a href={source.meta.url} target="_blank" rel="noreferrer">
                <IconButton title="Open Original URL">
                  <ExternalLink size={15} />
                </IconButton>
              </a>
            )}
            <IconButton onClick={onClose} title="Close Inspector">
              <X size={17} />
            </IconButton>
          </div>
        </div>

        {/* Drawer Content */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* PDF Viewer Mode */}
          {source.type === "pdf" && (
            <div className="flex flex-col items-center">
              {/* PDF Control Bar */}
              <div className="mb-4 flex items-center justify-between w-full rounded-xl bg-[var(--color-raised)] border border-[var(--color-hairline)] px-4 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 disabled:opacity-40 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-mono text-slate-300">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 disabled:opacity-40 cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPdfScale((s) => Math.max(0.8, s - 0.2))}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="font-mono text-[11px] text-slate-400">
                    {Math.round(pdfScale * 100)}%
                  </span>
                  <button
                    onClick={() => setPdfScale((s) => Math.min(2.2, s + 0.2))}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {!pageError ? (
                <div className="w-full flex justify-center overflow-x-auto rounded-xl bg-slate-950/40 p-2 border border-[var(--color-hairline)] shadow-inner">
                  <canvas
                    ref={canvasRef}
                    className="rounded-lg shadow-xl"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
                    Showing extracted text for page {currentPage}:
                  </div>
                  {citation?.text && (
                    <div
                      data-highlight="true"
                      className="rounded-xl bg-[var(--color-raised-2)] border border-amber-500/40 p-4 text-xs text-slate-200 leading-relaxed shadow-lg"
                    >
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2">
                        <Sparkles size={13} />
                        <span>Cited Excerpt</span>
                      </div>
                      {citation.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* YouTube Video Viewer Mode */}
          {source.type === "youtube" && source.meta?.videoId && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-2)] shadow-xl bg-black">
                <iframe
                  title="youtube player"
                  width="100%"
                  height="320"
                  src={`https://www.youtube.com/embed/${source.meta.videoId}?start=${Math.floor(citation?.startTime || 0)}&autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full"
                />
              </div>

              {citation?.startTime != null && (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <span>Timestamp jump: {formatTime(citation.startTime)}</span>
                </div>
              )}

              {citation?.text && (
                <div
                  data-highlight="true"
                  className="rounded-xl bg-[var(--color-raised-2)] border border-amber-500/40 p-4 text-xs text-slate-200 leading-relaxed shadow-lg"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5">
                    <Sparkles size={13} />
                    <span>Cited Speech Transcript</span>
                  </div>
                  {citation.text}
                </div>
              )}
            </div>
          )}

          {/* VTT Transcript Mode */}
          {source.type === "vtt" && source.meta?.fullTranscript && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Transcript Cues ({source.meta.fullTranscript.length} lines)
              </div>
              <div className="space-y-1.5">
                {source.meta.fullTranscript.map((cue, i) => {
                  const isHit =
                    citation?.startTime != null &&
                    cue.start >= citation.startTime - 0.01 &&
                    cue.start < (citation.endTime || Infinity);
                  return (
                    <div
                      key={i}
                      data-highlight={isHit ? "true" : undefined}
                      className={`flex gap-3 rounded-xl p-3 text-xs leading-relaxed transition-all ${isHit ? "bg-amber-500/15 border border-amber-500/40 text-white shadow-md" : "bg-[var(--color-raised)] border border-[var(--color-hairline)] text-slate-300"}`}
                    >
                      <span className="font-mono text-[11px] text-amber-400/90 flex-shrink-0">
                        {formatTime(cue.start)}
                      </span>
                      <span>{cue.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text / Webpage Mode */}
          {(source.type === "text" || source.type === "url") && source.meta?.fullText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Full Document Text
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {source.meta.fullText.length} characters
                </span>
              </div>

              <div className="rounded-2xl bg-[var(--color-raised)] border border-[var(--color-hairline)] p-5 leading-relaxed shadow-inner">
                <FullTextHighlight
                  fullText={source.meta.fullText}
                  start={citation?.charStart}
                  end={citation?.charEnd}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
