/* =========================================================================
   PERSISTENCE (window.storage / localStorage fallback)
   ========================================================================= */
export async function loadNotebooksList() {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get("notebooks-list", false);
      return r ? JSON.parse(r.value) : [];
    }
    const local = localStorage.getItem("chaibooklm_notebooks");
    return local ? JSON.parse(local) : [];
  } catch (_e) {
    return [];
  }
}

export async function saveNotebooksList(list) {
  try {
    if (window.storage?.set) {
      await window.storage.set("notebooks-list", JSON.stringify(list), false);
    } else {
      localStorage.setItem("chaibooklm_notebooks", JSON.stringify(list));
    }
  } catch (_e) {
    // Ignore storage quota errors
  }
}

export async function loadNotebookData(id) {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get("notebook-data:" + id, false);
      return r ? JSON.parse(r.value) : { sources: [], messages: [] };
    }
    const local = localStorage.getItem("chaibooklm_data_" + id);
    return local ? JSON.parse(local) : { sources: [], messages: [] };
  } catch (_e) {
    return { sources: [], messages: [] };
  }
}

export async function saveNotebookData(id, data) {
  try {
    if (window.storage?.set) {
      await window.storage.set(
        "notebook-data:" + id,
        JSON.stringify(data),
        false,
      );
    } else {
      localStorage.setItem("chaibooklm_data_" + id, JSON.stringify(data));
    }
  } catch (_e) {
    // Ignore storage quota errors
  }
}

export async function deleteNotebookData(id) {
  try {
    if (window.storage?.delete) {
      await window.storage.delete("notebook-data:" + id, false);
    } else {
      localStorage.removeItem("chaibooklm_data_" + id);
    }
  } catch (_e) {
    // Ignore deletion errors
  }
}
