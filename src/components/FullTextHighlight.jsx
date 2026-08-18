export function FullTextHighlight({ fullText, start, end }) {
  if (!fullText) return null;

  if (start == null || end == null || start < 0 || end <= start) {
    return (
      <div className="font-body text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
        {fullText}
      </div>
    );
  }

  const before = fullText.slice(0, start);
  const mid = fullText.slice(start, end);
  const after = fullText.slice(end);

  return (
    <div className="font-body text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
      <span className="text-slate-500">{before}</span>
      <mark
        data-highlight="true"
        className="fulltext-mark inline-block my-0.5"
      >
        {mid}
      </mark>
      <span className="text-slate-500">{after}</span>
    </div>
  );
}
