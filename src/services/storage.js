
/* =========================================================================
   PERSISTENCE (window.storage) — notebooks list + per-notebook data.
   Raw binaries (PDF bytes, live pdf.js documents) are never persisted —
   only extracted chunk text, metadata and embeddings are, which is all
   retrieval and citation actually need.
   ========================================================================= */
export async function loadNotebooksList() {
  try {
    const r = await window.storage.get("notebooks-list", false);
    return r ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}
export async function saveNotebooksList(list) {
  try {
    await window.storage.set("notebooks-list", JSON.stringify(list), false);
  } catch (e) {}
}
export async function loadNotebookData(id) {
  try {
    const r = await window.storage.get("notebook-data:" + id, false);
    return r ? JSON.parse(r.value) : { sources: [], messages: [] };
  } catch (e) {
    return { sources: [], messages: [] };
  }
}
export async function saveNotebookData(id, data) {
  try {
    await window.storage.set(
      "notebook-data:" + id,
      JSON.stringify(data),
      false,
    );
  } catch (e) {}
}
export async function deleteNotebookData(id) {
  try {
    await window.storage.delete("notebook-data:" + id, false);
  } catch (e) {}
}
