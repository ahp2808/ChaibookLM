import { useState, useEffect } from "react";

/* =========================================================================
   pdf.js loader
   ========================================================================= */

export function usePdfJs() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.pdfjsLib) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      } catch (_e) {
        // Fallback worker setup
      }
      setReady(true);
    };
    script.onerror = () => setReady(false);
    document.body.appendChild(script);
  }, []);
  return ready;
}
