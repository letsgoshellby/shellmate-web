import { getQuillTextLength } from './quillText';

function delta(ops) {
  return JSON.stringify({ ops });
}

describe('getQuillTextLength', () => {
  it('returns 0 for null/undefined/empty input', () => {
    expect(getQuillTextLength(null)).toBe(0);
    expect(getQuillTextLength(undefined)).toBe(0);
    expect(getQuillTextLength('')).toBe(0);
  });

  it('counts the length of a single text insert, minus the trailing newline', () => {
    // Quill always appends a trailing "\n" insert, hence the -1
    const value = delta([{ insert: 'hello\n' }]);
    expect(getQuillTextLength(value)).toBe(5);
  });

  it('sums multiple text inserts across formatting boundaries', () => {
    const value = delta([
      { insert: 'hello ' },
      { insert: 'world', attributes: { bold: true } },
      { insert: '\n' },
    ]);
    expect(getQuillTextLength(value)).toBe(11); // "hello " (6) + "world" (5) + "\n" (1) - 1
  });

  it('ignores non-string inserts such as embedded images', () => {
    const value = delta([
      { insert: 'caption' },
      { insert: { image: 'https://example.com/a.png' } },
      { insert: '\n' },
    ]);
    expect(getQuillTextLength(value)).toBe(7); // "caption" (7) + "\n" (1) - 1
  });

  it('returns 0 (not negative) for content that is just the trailing newline', () => {
    const value = delta([{ insert: '\n' }]);
    expect(getQuillTextLength(value)).toBe(0);
  });

  it('returns 0 for malformed JSON instead of throwing', () => {
    expect(getQuillTextLength('not json')).toBe(0);
  });

  it('returns -1 when ops is missing text entirely (documents current raw behavior)', () => {
    // NOTE: callers apply Math.max(0, ...) around this function to guard
    // against this case; the raw function itself can return negative values.
    const value = JSON.stringify({ ops: [] });
    expect(getQuillTextLength(value)).toBe(-1);
  });
});
