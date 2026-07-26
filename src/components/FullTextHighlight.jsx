
export function FullTextHighlight({ fullText, start, end }) {
  if (start == null || end == null) {
    return <p className="fulltext">{fullText}</p>;
  }
  const before = fullText.slice(0, start);
  const mid = fullText.slice(start, end);
  const after = fullText.slice(end);
  return (
    <p className="fulltext">
      <span className="fulltext-dim">{before}</span>
      <mark data-highlight="true" className="fulltext-mark">
        {mid}
      </mark>
      <span className="fulltext-dim">{after}</span>
    </p>
  );
}
