import { cn } from './utils';

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('resolves conflicting tailwind classes to the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('applies conditional classes from an object', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  it('merges conflicting classes coming from separate arguments in order', () => {
    expect(cn('text-sm text-black', 'text-lg')).toBe('text-black text-lg');
  });
});
