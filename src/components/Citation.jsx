
export function renderAnswerWithCitations(answer, citedChunks, onOpenCitation) {
  const parts = [];
  const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(answer)) !== null) {
    if (match.index > lastIndex)
      parts.push(
        <span key={key++}>{answer.slice(lastIndex, match.index)}</span>,
      );
    const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));
    parts.push(
      <span key={key++} className="inline-flex gap-0.5 align-super">
        {nums.map((n) => {
          const chunk = citedChunks[n - 1];
          if (!chunk) return null;
          return (
            <button
              key={n}
              onClick={() => onOpenCitation(chunk)}
              className="citation-badge mx-0.5 rounded px-1"
              title={`Open source: ${chunk.sourceName}`}
            >
              {n}
            </button>
          );
        })}
      </span>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < answer.length)
    parts.push(<span key={key++}>{answer.slice(lastIndex)}</span>);
  return parts;
}
