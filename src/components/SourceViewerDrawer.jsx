import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ExternalLink,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants/sourceTypes";
import { formatTime } from "../utils/format";
import {FullTextHighlight} from "./FullTextHighlight"
import { IconButton } from "./IconButton";

function locationLabel(chunk) {
  if (chunk.page) return `p. ${chunk.page}`;
  if (chunk.startTime != null) return formatTime(chunk.startTime);
  return null;
}

export function SourceViewerDrawer({ citation, source, pdfDocsRef, onClose }) {
  const canvasRef = useRef(null);
  const [pageError, setPageError] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    setPageError(false);
    if (!citation || !source) return;
    if (source.type === "pdf" && citation.page) {
      const pdf = pdfDocsRef.current[source.id];
      if (!pdf) {
        setPageError(true);
        return;
      }
      (async () => {
        try {
          const page = await pdf.getPage(citation.page);
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (e) {
          setPageError(true);
        }
      })();
    }
    if (bodyRef.current) {
      const el = bodyRef.current.querySelector("[data-highlight='true']");
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [citation, source]);

  if (!citation || !source) return null;
  const cfg = TYPE_CONFIG[source.type] || TYPE_CONFIG.text;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="drawer-overlay"
        style={{ position: "absolute", inset: 0 }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="drawer-panel relative flex h-full w-full max-w-xl flex-col"
      >
        <div className="drawer-header flex items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="drawer-icon-wrap flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md">
              <Icon size={13} />
            </div>
            <div className="min-w-0">
              <div className="drawer-source-name truncate">{source.name}</div>
              <div className="drawer-location">
                {locationLabel(citation)
                  ? `Cited passage · ${locationLabel(citation)}`
                  : "Cited passage"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {source.type === "url" && source.meta && source.meta.url && (
              <a href={source.meta.url} target="_blank" rel="noreferrer">
                <IconButton title="Open original">
                  <ExternalLink size={14} />
                </IconButton>
              </a>
            )}
            <IconButton onClick={onClose} title="Close">
              <X size={16} />
            </IconButton>
          </div>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5">
          {source.type === "pdf" && (
            <div className="flex flex-col items-center">
              {!pageError ? (
                <canvas
                  ref={canvasRef}
                  className="pdf-canvas rounded-md shadow-lg"
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <div className="w-full">
                  <div className="pdf-fallback-note mb-3 rounded-md px-3 py-2">
                    Re-upload this PDF to render page {citation.page} visually —
                    showing the extracted text instead.
                  </div>
                  <p
                    data-highlight="true"
                    className="highlighted-passage rounded-md p-3 text-sm leading-relaxed"
                  >
                    {citation.text}
                  </p>
                </div>
              )}
              <div className="pdf-page-label" style={{ marginTop: 10 }}>
                Page {citation.page} of{" "}
                {(source.meta && source.meta.numPages) || "?"}
              </div>
            </div>
          )}

          {source.type === "youtube" && source.meta && source.meta.videoId && (
            <div>
              <div className="yt-embed-wrap mb-4 overflow-hidden rounded-md">
                <iframe
                  title="youtube"
                  width="100%"
                  height="260"
                  src={`https://www.youtube.com/embed/${source.meta.videoId}?start=${Math.floor(citation.startTime || 0)}&autoplay=0`}
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  style={{ border: "none" }}
                />
              </div>
              <div className="yt-timestamp-label" style={{ marginBottom: 8 }}>
                Jumps to {formatTime(citation.startTime || 0)}
              </div>
              <p
                data-highlight="true"
                className="highlighted-passage rounded-md p-3 text-sm leading-relaxed"
              >
                {citation.text}
              </p>
            </div>
          )}

          {source.type === "vtt" &&
            source.meta &&
            source.meta.fullTranscript && (
              <div className="space-y-2">
                {source.meta.fullTranscript.map((cue, i) => {
                  const isHit =
                    citation.startTime != null &&
                    cue.start >= citation.startTime - 0.01 &&
                    cue.start < (citation.endTime || Infinity);
                  return (
                    <div
                      key={i}
                      data-highlight={isHit ? "true" : undefined}
                      className={`vtt-cue ${isHit ? "hit" : ""} flex gap-3 rounded-md p-2 text-sm`}
                    >
                      <span className="vtt-cue-time flex-shrink-0">
                        {formatTime(cue.start)}
                      </span>
                      <span>{cue.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

          {(source.type === "text" || source.type === "url") &&
            source.meta &&
            source.meta.fullText && (
              <FullTextHighlight
                fullText={source.meta.fullText}
                start={citation.charStart}
                end={citation.charEnd}
              />
            )}
        </div>
      </div>
    </div>
  );
}

