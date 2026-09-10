export function renderAnswerWithCitations(answer, citedChunks = [], onOpenCitation) {
  if (!answer) return null;

  // Split text by lines to preserve paragraph breaks cleanly
  const lines = answer.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={`empty-${lineIdx}`} className="h-1" />;
        }

        const parts = [];
        const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
        let lastIndex = 0;
        let match;
        let key = 0;

        while ((match = regex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(
              <span key={`text-${lineIdx}-${key++}`}>
                {line.slice(lastIndex, match.index)}
              </span>,
            );
          }

          const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));

          parts.push(
            <span
              key={`cite-group-${lineIdx}-${key++}`}
              className="inline-flex items-center gap-1 mx-1 align-baseline"
            >
              {nums.map((n) => {
                const chunk = citedChunks[n - 1];
                if (!chunk) {
                  return (
                    <span
                      key={`cite-unknown-${n}`}
                      className="font-mono text-xs text-amber-500/70"
                    >
                      [{n}]
                    </span>
                  );
                }

                return (
                  <button
                    key={`cite-${n}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCitation?.(chunk);
                    }}
                    className="citation-badge"
                    title={`Source [${n}]: ${chunk.sourceName || "Source"}${chunk.page ? ` (Page ${chunk.page})` : ""}`}
                  >
                    {n}
                  </button>
                );
              })}
            </span>,
          );

          lastIndex = regex.lastIndex;
        }

        if (lastIndex < line.length) {
          parts.push(
            <span key={`text-end-${lineIdx}-${key++}`}>
              {line.slice(lastIndex)}
            </span>,
          );
        }

        // Check if line starts with a list bullet
        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");

        return (
          <p
            key={`line-${lineIdx}`}
            className={`leading-relaxed ${isBullet ? "pl-4 text-slate-200" : "text-slate-100"}`}
          >
            {parts}
          </p>
        );
      })}
    </div>
  );
}
