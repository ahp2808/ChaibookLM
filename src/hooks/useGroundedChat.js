import { useState, useCallback } from "react";
import { uid } from "../utils/ids";
import { rankRelevantChunks, queryGemini } from "../services/ai";

/**
 * Custom hook to manage grounded chat conversation and RAG query flow.
 *
 * @param {object} options
 * @param {Function} [options.onNotify] - Callback for notifications
 */
export function useGroundedChat({ onNotify } = {}) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);

  const sendMessage = useCallback(
    async (question, sources) => {
      const userMsg = { id: uid("m"), role: "user", text: question };
      setMessages((prev) => [...prev, userMsg]);
      setBusy(true);

      try {
        const rankedChunks = await rankRelevantChunks(question, sources);

        if (!rankedChunks.length) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid("m"),
              role: "assistant",
              text: "None of the indexed sources in this notebook appear relevant to this question. Please try rephrasing or add a new source covering this topic.",
              error: true,
            },
          ]);
          setBusy(false);
          return;
        }

        const answer = await queryGemini(question, rankedChunks);

        setMessages((prev) => [
          ...prev,
          {
            id: uid("m"),
            role: "assistant",
            text:
              answer ||
              "I couldn't generate an answer just now — please try again.",
            citedChunks: rankedChunks,
          },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid("m"),
            role: "assistant",
            text: `${e?.message || e}`,
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    onNotify?.("Chat cleared", "info");
  }, [onNotify]);

  return {
    messages,
    setMessages,
    busy,
    sendMessage,
    clearChat,
  };
}
