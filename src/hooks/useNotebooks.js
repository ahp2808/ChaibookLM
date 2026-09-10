import { useState, useEffect, useCallback } from "react";
import { uid } from "../utils/ids";
import {
  loadNotebooksList,
  saveNotebooksList,
  deleteNotebookData,
} from "../services/storage";

/**
 * Custom hook to manage notebook list, active notebook selection, and persistence.
 * @param {object} options
 * @param {Function} [options.onNotify] - Callback for notifications/toasts
 */
export function useNotebooks({ onNotify } = {}) {
  const [loaded, setLoaded] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      let list = await loadNotebooksList();
      if (!list.length) {
        list = [
          { id: uid("nb"), name: "Untitled Notebook", createdAt: Date.now() },
        ];
        await saveNotebooksList(list);
      }
      if (isMounted) {
        setNotebooks(list);
        setActiveId(list[0].id);
        setLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const createNotebook = useCallback(async () => {
    const nb = {
      id: uid("nb"),
      name: `Research Notebook ${notebooks.length + 1}`,
      createdAt: Date.now(),
    };
    const list = [...notebooks, nb];
    setNotebooks(list);
    await saveNotebooksList(list);
    setActiveId(nb.id);
    onNotify?.(`Created new notebook "${nb.name}"`, "success");
    return nb;
  }, [notebooks, onNotify]);

  const renameNotebook = useCallback(
    async (id, name) => {
      const list = notebooks.map((n) => (n.id === id ? { ...n, name } : n));
      setNotebooks(list);
      await saveNotebooksList(list);
      onNotify?.("Notebook renamed", "success");
    },
    [notebooks, onNotify],
  );

  const deleteNotebook = useCallback(
    async (id) => {
      const nbToDelete = notebooks.find((n) => n.id === id);
      const list = notebooks.filter((n) => n.id !== id);
      setNotebooks(list);
      await saveNotebooksList(list);
      await deleteNotebookData(id);
      if (activeId === id && list.length) {
        setActiveId(list[0].id);
      }
      onNotify?.(`Deleted "${nbToDelete?.name || "Notebook"}"`, "info");
    },
    [notebooks, activeId, onNotify],
  );

  const activeNotebook = notebooks.find((n) => n.id === activeId) || null;

  return {
    notebooks,
    activeId,
    activeNotebook,
    setActiveId,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    loaded,
  };
}
