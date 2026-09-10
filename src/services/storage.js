import { APP_CONFIG } from "../constants/config";

const { STORAGE_KEYS } = APP_CONFIG;

/**
 * Loads the list of all notebooks from storage
 * @returns {Promise<Array<{id: string, name: string, createdAt: number}>>}
 */
export async function loadNotebooksList() {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get(STORAGE_KEYS.NOTEBOOKS_LIST, false);
      return r ? JSON.parse(r.value) : [];
    }
    const local = localStorage.getItem(STORAGE_KEYS.LOCAL_NOTEBOOKS);
    return local ? JSON.parse(local) : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Saves the list of notebooks to storage
 * @param {Array} list
 * @returns {Promise<void>}
 */
export async function saveNotebooksList(list) {
  try {
    if (window.storage?.set) {
      await window.storage.set(
        STORAGE_KEYS.NOTEBOOKS_LIST,
        JSON.stringify(list),
        false,
      );
    } else {
      localStorage.setItem(
        STORAGE_KEYS.LOCAL_NOTEBOOKS,
        JSON.stringify(list),
      );
    }
  } catch (_e) {
    // Ignore storage quota errors
  }
}

/**
 * Loads notebook sources and messages by notebook ID
 * @param {string} id
 * @returns {Promise<{sources: Array, messages: Array}>}
 */
export async function loadNotebookData(id) {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get(
        `${STORAGE_KEYS.NOTEBOOK_DATA_PREFIX}${id}`,
        false,
      );
      return r ? JSON.parse(r.value) : { sources: [], messages: [] };
    }
    const local = localStorage.getItem(`${STORAGE_KEYS.LOCAL_DATA_PREFIX}${id}`);
    return local ? JSON.parse(local) : { sources: [], messages: [] };
  } catch (_e) {
    return { sources: [], messages: [] };
  }
}

/**
 * Persists notebook sources and messages by notebook ID
 * @param {string} id
 * @param {{sources: Array, messages: Array}} data
 * @returns {Promise<void>}
 */
export async function saveNotebookData(id, data) {
  try {
    if (window.storage?.set) {
      await window.storage.set(
        `${STORAGE_KEYS.NOTEBOOK_DATA_PREFIX}${id}`,
        JSON.stringify(data),
        false,
      );
    } else {
      localStorage.setItem(
        `${STORAGE_KEYS.LOCAL_DATA_PREFIX}${id}`,
        JSON.stringify(data),
      );
    }
  } catch (_e) {
    // Ignore storage quota errors
  }
}

/**
 * Deletes notebook data by notebook ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNotebookData(id) {
  try {
    if (window.storage?.delete) {
      await window.storage.delete(
        `${STORAGE_KEYS.NOTEBOOK_DATA_PREFIX}${id}`,
        false,
      );
    } else {
      localStorage.removeItem(`${STORAGE_KEYS.LOCAL_DATA_PREFIX}${id}`);
    }
  } catch (_e) {
    // Ignore deletion errors
  }
}
