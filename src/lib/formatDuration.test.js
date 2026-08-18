import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('pads single-digit minutes and seconds with a leading zero', () => {
    expect(formatDuration(65)).toBe('01:05');
  });

  it('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('01:00');
  });

  it('does not pad minutes beyond two digits when the call runs long', () => {
    expect(formatDuration(3600)).toBe('60:00');
  });

  it('formats 45 minutes (the time-warning threshold) correctly', () => {
    expect(formatDuration(45 * 60)).toBe('45:00');
  });
});
