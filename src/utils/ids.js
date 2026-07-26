/* =========================================================================
   UTIL — ids, time formatting
   ========================================================================= */
let idCounter = 0;
export function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}
