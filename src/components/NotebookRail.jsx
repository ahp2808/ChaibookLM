import React, { useState, useEffect, useRef, useCallback } from "react";

import {IconButton} from "../components/IconButton"
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";
/* =========================================================================
   NOTEBOOK RAIL
   ========================================================================= */
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

  return (
    <div className="nb-rail flex h-full w-64 flex-shrink-0 flex-col">
      <div className="flex items-center gap-2 px-5 pt-6 pb-5">
        <div className="nb-rail-brand-icon flex h-8 w-8 items-center justify-center rounded-lg">
          <img src="/icon1.svg"></img>
        </div>
        <div>
          <div className="nb-rail-title">ChaibookLM</div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-2">
        <span className="nb-rail-section-label">NOTEBOOKS</span>
        <IconButton title="New notebook" onClick={onCreate}>
          <Plus size={15} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {notebooks.map((nb) => {
          const active = nb.id === activeId;
          return (
            <div
              key={nb.id}
              onClick={() => onSelect(nb.id)}
              className={`nb-item ${active ? "active" : ""} group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5`}
            >
              <BookOpen
                size={14}
                className={`nb-item-icon ${active ? "active" : ""} flex-shrink-0`}
              />
              {editingId === nb.id ? (
                <input
                  autoFocus
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRename(nb.id, editVal || "Untitled notebook");
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => {
                    onRename(nb.id, editVal || "Untitled notebook");
                    setEditingId(null);
                  }}
                  className="nb-item-input flex-1 text-sm outline-none"
                />
              ) : (
                <span
                  className={`nb-item-name ${active ? "active" : ""} flex-1 truncate text-sm`}
                >
                  {nb.name}
                </span>
              )}
              <div className="nb-item-actions">
                <IconButton
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(nb.id);
                    setEditVal(nb.name);
                  }}
                >
                  <Pencil size={12} />
                </IconButton>
                {notebooks.length > 1 && (
                  <IconButton
                    title="Delete notebook"
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(nb.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </IconButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="nb-rail-footer px-5 pb-5 pt-3">
        <p className="nb-rail-footer-text">
          Each notebook keeps its own isolated set of sources — nothing crosses
          over when you ask a question.
        </p>
      </div>
    </div>
  );
}
