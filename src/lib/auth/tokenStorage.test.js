import { TokenStorage } from './tokenStorage';

function makeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('TokenStorage.isTokenExpired', () => {
  it('returns false for a token whose exp is in the future', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(TokenStorage.isTokenExpired(token)).toBe(false);
  });

  it('returns true for a token whose exp is in the past', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    expect(TokenStorage.isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token at the exact expiry boundary', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: nowSeconds });
    expect(TokenStorage.isTokenExpired(token)).toBe(true);
  });

  it('returns true for a malformed token instead of throwing', () => {
    expect(TokenStorage.isTokenExpired('not-a-jwt')).toBe(true);
  });

  it('returns true for an empty string', () => {
    expect(TokenStorage.isTokenExpired('')).toBe(true);
  });

  it('returns true when the payload has no exp field', () => {
    const token = makeJwt({ sub: 'user-1' });
    expect(TokenStorage.isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token with invalid base64 in the payload segment', () => {
    const token = 'aGVhZGVy.%%%not-base64%%%.signature';
    expect(TokenStorage.isTokenExpired(token)).toBe(true);
  });
});

describe('TokenStorage.getTokenStatus', () => {
  afterEach(() => {
    TokenStorage.clearTokens();
  });

  it('reports no tokens when nothing is stored', () => {
    const status = TokenStorage.getTokenStatus();
    expect(status).toEqual({
      hasAccessToken: false,
      hasRefreshToken: false,
      accessTokenExpired: true,
      refreshTokenExpired: true,
    });
  });

  it('reports a valid access token as present and unexpired', () => {
    const access = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const refresh = makeJwt({ exp: Math.floor(Date.now() / 1000) + 86400 });
    TokenStorage.setTokens(access, refresh);

    const status = TokenStorage.getTokenStatus();
    expect(status.hasAccessToken).toBe(true);
    expect(status.hasRefreshToken).toBe(true);
    expect(status.accessTokenExpired).toBe(false);
    expect(status.refreshTokenExpired).toBe(false);
  });
});

describe('TokenStorage.setTokens / clearTokens', () => {
  afterEach(() => {
    TokenStorage.clearTokens();
  });

  it('round-trips access and refresh tokens through cookies', () => {
    TokenStorage.setTokens('access-123', 'refresh-456');
    expect(TokenStorage.getAccessToken()).toBe('access-123');
    expect(TokenStorage.getRefreshToken()).toBe('refresh-456');
  });

  it('clears both tokens', () => {
    TokenStorage.setTokens('access-123', 'refresh-456');
    TokenStorage.clearTokens();
    expect(TokenStorage.getAccessToken()).toBeUndefined();
    expect(TokenStorage.getRefreshToken()).toBeUndefined();
  });
});
