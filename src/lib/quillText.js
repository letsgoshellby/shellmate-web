// value: Quill Delta JSON string | null
export function getQuillTextLength(deltaJson) {
  if (!deltaJson) return 0;
  try {
    const delta = JSON.parse(deltaJson);
    return delta.ops.reduce((acc, op) => {
      if (typeof op.insert === 'string') return acc + op.insert.length;
      return acc;
    }, 0) - 1;
  } catch {
    return 0;
  }
}
