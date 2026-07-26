const EMBED_DIM = 160;
const STOPWORDS = new Set(
  "a an the of to in on for and or is are was were be been being this that these those it its as at by with from into over under about than then so if not no do does did can could should would will shall may might i you he she we they them his her our your their what which who whom how when where why".split(
    " ",
  ),
);

export function embedText(text) {
  const vec = new Float32Array(EMBED_DIM);
  const words = (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (w) => w.length > 1 && !STOPWORDS.has(w),
  );
  for (const w of words) {
    let h = 2166136261;
    for (let i = 0; i < w.length; i++) {
      h ^= w.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[Math.abs(h) % EMBED_DIM] += 1;
  }
  let norm = 0;
  for (let i = 0; i < EMBED_DIM; i++) {
    vec[i] = Math.log(1 + vec[i]);
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < EMBED_DIM; i++) vec[i] /= norm;
  return Array.from(vec);
}

export function cosineSim(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
