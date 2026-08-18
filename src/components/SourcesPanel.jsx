import { useState } from "react";
import {
  Plus,
  FileText,
  Globe,
  Video,
  Search,
  BookOpen,
} from "lucide-react";
import { SourceRow } from "./SourceRow";

export function SourcesPanel({
  sources,
  onAddClick,
  onRemove,
  onReindex,
  onOpen,
  activeCitationSourceId,
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const readyCount = sources.filter((s) => s.status === "ready").length;

  const filteredSources = sources.filter((s) =>
    s.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <div className="sources-panel flex h-full w-80 flex-shrink-0 flex-col select-none">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-[var(--color-hairline)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display text-[16px] font-semibold text-[var(--color-ink)]">
              Sources
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                {readyCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${readyCount > 0 ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              </span>
              <span className="font-mono text-[11px] text-[var(--color-ink-mute)]">
                {readyCount} of {sources.length} indexed
              </span>
            </div>
          </div>

          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-gold-soft)] hover:bg-[var(--color-gold-soft-hover)] text-[var(--color-gold)] border border-[var(--color-gold-border)] px-3 py-1.5 text-xs font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Source</span>
          </button>
        </div>

        {/* Search filter if there are several sources */}
        {sources.length > 2 && (
          <div className="relative flex items-center mt-2">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search sources..."
              className="w-full rounded-lg bg-[var(--color-raised)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder-slate-500 border border-[var(--color-hairline)] focus:border-amber-500/50 outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sources.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-hairline-2)] p-6 text-center bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No sources added yet</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Add documents, links, or media to ground AI answers in your own research.
              </p>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 w-full">
              <button
                onClick={onAddClick}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] hover:bg-white/[0.08] p-2.5 text-xs text-slate-300 border border-white/5 transition-all text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Upload PDF document</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">.pdf</span>
              </button>

              <button
                onClick={onAddClick}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] hover:bg-white/[0.08] p-2.5 text-xs text-slate-300 border border-white/5 transition-all text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe size={14} className="text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Fetch website or article</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">URL</span>
              </button>

              <button
                onClick={onAddClick}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] hover:bg-white/[0.08] p-2.5 text-xs text-slate-300 border border-white/5 transition-all text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Video size={14} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <span>Add YouTube video transcript</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Video</span>
              </button>
            </div>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No sources match "{filterQuery}"
          </div>
        ) : (
          filteredSources.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              onRemove={onRemove}
              onReindex={onReindex}
              onOpen={onOpen}
              isActive={activeCitationSourceId === s.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
