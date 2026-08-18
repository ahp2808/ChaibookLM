import { useState } from "react";
import { IconButton } from "./IconButton";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  Sparkles,
  Layers,
  Check,
  X,
} from "lucide-react";

export function NotebookRail({
  notebooks,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const startRename = (nb, e) => {
    e?.stopPropagation();
    setEditingId(nb.id);
    setEditVal(nb.name);
  };

  const saveRename = (id) => {
    if (editVal.trim()) {
      onRename(id, editVal.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  return (
    <aside className="nb-rail flex h-full w-64 flex-shrink-0 flex-col select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--color-hairline)]">
        <div className="nb-brand-badge flex h-9 w-9 items-center justify-center rounded-xl p-1.5 flex-shrink-0">
          <img src="/icon1.svg" alt="ChaibookLM" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-semibold text-[17px] text-[var(--color-ink)] tracking-tight">
              ChaibookLM
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--color-chai-400)] font-mono">
            <Sparkles size={10} className="text-amber-400" />
            <span>Research Engine</span>
          </div>
        </div>
      </div>

      {/* Notebook Section Header & Add CTA */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onCreate}
          className="nb-create-btn flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold tracking-wide cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Notebook</span>
        </button>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <span className="text-[11px] font-mono font-medium tracking-wider text-[var(--color-ink-faint)] uppercase">
          Your Notebooks ({notebooks.length})
        </span>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {notebooks.map((nb) => {
          const active = nb.id === activeId;
          const isEditing = editingId === nb.id;
          const isConfirming = confirmDeleteId === nb.id;

          if (isConfirming) {
            return (
              <div
                key={nb.id}
                className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-2.5 text-xs animate-slide-up"
              >
                <p className="text-rose-200 mb-2 font-medium">Delete "{nb.name}"?</p>
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDelete(nb.id);
                      setConfirmDeleteId(null);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={nb.id}
              onClick={() => onSelect(nb.id)}
              onDoubleClick={(e) => startRename(nb, e)}
              className={`nb-item ${active ? "active" : ""} group relative flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5`}
            >
              <BookOpen
                size={15}
                className={`nb-item-icon ${active ? "active text-amber-400" : "text-slate-400"} flex-shrink-0 transition-colors`}
              />

              {isEditing ? (
                <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(nb.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    onBlur={() => saveRename(nb.id)}
                    className="w-full bg-[var(--color-raised-2)] rounded px-1.5 py-0.5 text-xs text-white outline-none border border-amber-500/50"
                  />
                  <IconButton title="Save" size="sm" onClick={() => saveRename(nb.id)}>
                    <Check size={12} className="text-emerald-400" />
                  </IconButton>
                  <IconButton title="Cancel" size="sm" onClick={cancelRename}>
                    <X size={12} className="text-slate-400" />
                  </IconButton>
                </div>
              ) : (
                <span
                  className="nb-item-name flex-1 truncate text-xs font-medium text-slate-300 tracking-normal"
                  title={nb.name}
                >
                  {nb.name}
                </span>
              )}

              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                  <IconButton
                    title="Rename (or double-click)"
                    size="sm"
                    onClick={(e) => startRename(nb, e)}
                  >
                    <Pencil size={12} />
                  </IconButton>
                  {notebooks.length > 1 && (
                    <IconButton
                      title="Delete notebook"
                      danger
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(nb.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Card */}
      <div className="p-3 border-t border-[var(--color-hairline)]">
        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline)] p-3 text-[11px] text-[var(--color-ink-faint)] leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
            <Layers size={13} className="text-amber-400/80" />
            <span>Isolated Notebooks</span>
          </div>
          Sources and grounding context remain private to each notebook.
        </div>
      </div>
    </aside>
  );
}
