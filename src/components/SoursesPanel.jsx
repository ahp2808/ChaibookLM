import {
  Plus,
  BookOpen,
} from "lucide-react";
import {SourceRow} from "../components/SourceRow"

export function SourcesPanel({ sources, onAddClick, onRemove, onReindex, onOpen }) {
  const readyCount = sources.filter((s) => s.status === "ready").length;
  return (
    <div className="sources-panel flex h-full w-80 flex-shrink-0 flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <div className="sources-panel-title">Sources</div>
          <div className="sources-panel-count">
            {readyCount}/{sources.length} indexed
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="add-btn flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {sources.length === 0 && (
          <div className="empty-state mt-6 flex flex-col items-center gap-2 rounded-lg px-4 py-10 text-center">
            <BookOpen size={20} style={{ color: "var(--color-ink-faint)" }} />
            <p className="empty-state-text">
              No sources yet. Add a PDF, page, video, or transcript to start
              grounding answers.
            </p>
          </div>
        )}
        {sources.map((s) => (
          <SourceRow
            key={s.id}
            source={s}
            onRemove={onRemove}
            onReindex={onReindex}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}
