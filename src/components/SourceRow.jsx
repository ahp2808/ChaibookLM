import { IconButton } from "./IconButton";
import { TYPE_CONFIG } from "../constants/sourceTypes";
import { StatusBadge } from "./StatusBadge";
import {
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
} from "lucide-react";

export function SourceRow({ source, onRemove, onReindex, onOpen, isActive = false }) {
  const cfg = TYPE_CONFIG[source.type] || TYPE_CONFIG.text;
  const Icon = cfg.icon;

  const tagClassMap = {
    pdf: "source-tag-pdf",
    url: "source-tag-url",
    youtube: "source-tag-youtube",
    text: "source-tag-text",
    vtt: "source-tag-vtt",
  };

  const tagClass = tagClassMap[source.type] || "source-tag-text";

  return (
    <div
      className={`source-row ${isActive ? "active-inspect" : ""} group relative flex flex-col gap-2 rounded-xl p-3 cursor-pointer`}
      onClick={() => source.status === "ready" && onOpen(source)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Source Type Icon Pill */}
          <div
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${tagClass}`}
            title={cfg.label}
          >
            <Icon size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="text-xs font-semibold text-slate-200 truncate leading-snug hover:text-amber-400 transition-colors"
              title={source.name}
            >
              {source.name}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={source.status} />
              {source.status === "ready" && (
                <span className="font-mono text-[10px] text-slate-400">
                  {source.chunks?.length || 0} chunks
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons (always clean and reachable on hover) */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {source.status === "ready" && (
            <IconButton
              title="Inspect source"
              size="sm"
              onClick={() => onOpen(source)}
            >
              <Eye size={13} />
            </IconButton>
          )}
          <IconButton
            title="Re-index"
            size="sm"
            onClick={() => onReindex(source)}
          >
            <RefreshCw size={13} />
          </IconButton>
          <IconButton
            title="Remove source"
            danger
            size="sm"
            onClick={() => onRemove(source.id)}
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      </div>

      {source.status === "error" && (
        <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 p-2 text-[11px] text-rose-300">
          <AlertTriangle size={13} className="flex-shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-tight">{source.error || "Failed to process source."}</span>
        </div>
      )}
    </div>
  );
}
