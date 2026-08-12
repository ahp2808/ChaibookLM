import {IconButton} from "../components/IconButton"
import { TYPE_CONFIG } from "../constants/sourceTypes";
import {StatusBadge} from "../components/StatusBadge"
import {
  Trash2,
  RefreshCw,
} from "lucide-react";

export function SourceRow({ source, onRemove, onReindex, onOpen }) {
  const cfg = TYPE_CONFIG[source.type] || TYPE_CONFIG.text;
  const Icon = cfg.icon;
  return (
    <div className="source-row group flex items-center gap-2.5 rounded-lg px-3 py-2.5 overflow-y-auto">
      <div className="source-icon-wrap flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md">
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <button
          onClick={() => source.status === "ready" && onOpen(source)}
          className="source-name block truncate text-left text-sm"
          style={{ cursor: source.status === "ready" ? "pointer" : "default" }}
          title={source.name}
        >
          {source.name}
        </button>
        <div className="mt-0.5 flex items-center gap-2">
          <StatusBadge status={source.status} />
          {source.status === "ready" && (
            <span className="source-meta">{source.chunks.length} chunks</span>
          )}
        </div>
        {source.status === "error" && (
          <div className="source-error">{source.error}</div>
        )}
      </div>
      <div className="source-actions flex flex-shrink-0 items-center gap-0.5">
        <IconButton title="Re-index" onClick={() => onReindex(source)}>
          <RefreshCw size={13} />
        </IconButton>
        <IconButton title="Remove" danger onClick={() => onRemove(source.id)}>
          <Trash2 size={13} />
        </IconButton>
      </div>
    </div>
  );
}
