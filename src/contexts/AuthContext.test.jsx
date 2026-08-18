import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthAPI } from '@/lib/api/auth';
import { TokenStorage } from '@/lib/auth/tokenStorage';

jest.mock('@/lib/api/auth', () => ({
  AuthAPI: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

jest.mock('@/lib/auth/tokenStorage', () => ({
  TokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

function Consumer() {
  const { user, loading, error, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user ? user.email : 'none'}</div>
      <div data-testid="error">{error ? error.message : 'none'}</div>
      <button onClick={() => login('user@example.com', 'password123').catch(() => {})}>
        login
      </button>
      <button onClick={() => logout().catch(() => {})}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('finishes loading with no user when no tokens are stored', async () => {
    TokenStorage.getAccessToken.mockReturnValue(undefined);
    TokenStorage.getRefreshToken.mockReturnValue(undefined);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(AuthAPI.getCurrentUser).not.toHaveBeenCalled();
  });

  it('loads the current user when a valid access token exists', async () => {
    TokenStorage.getAccessToken.mockReturnValue('access-token');
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    AuthAPI.getCurrentUser.mockResolvedValue({ email: 'user@example.com' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user@example.com'));
    expect(sessionStorage.getItem('user_cache')).toBe(JSON.stringify({ email: 'user@example.com' }));
  });

  it('refreshes the access token when only a refresh token is present', async () => {
    TokenStorage.getAccessToken.mockReturnValue(undefined);
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    AuthAPI.refreshToken.mockResolvedValue('new-access-token');
    AuthAPI.getCurrentUser.mockResolvedValue({ email: 'refreshed@example.com' });

    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('refreshed@example.com')
    );
    expect(AuthAPI.refreshToken).toHaveBeenCalledWith('refresh-token');
    expect(TokenStorage.setTokens).toHaveBeenCalledWith('new-access-token', 'refresh-token');
  });

  it('clears tokens when the refresh-only path fails to refresh', async () => {
    TokenStorage.getAccessToken.mockReturnValue(undefined);
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    AuthAPI.refreshToken.mockRejectedValue(new Error('refresh failed'));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(TokenStorage.clearTokens).toHaveBeenCalled();
    expect(AuthAPI.getCurrentUser).not.toHaveBeenCalled();
  });

  it('retries getCurrentUser after a 401 by refreshing the token', async () => {
    TokenStorage.getAccessToken.mockReturnValue('stale-access-token');
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    const unauthorized = new Error('unauthorized');
    unauthorized.response = { status: 401 };
    AuthAPI.getCurrentUser
      .mockRejectedValueOnce(unauthorized)
      .mockResolvedValueOnce({ email: 'retried@example.com' });
    AuthAPI.refreshToken.mockResolvedValue('new-access-token');

    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('retried@example.com')
    );
    expect(TokenStorage.setTokens).toHaveBeenCalledWith('new-access-token', 'refresh-token');
  });

  it('clears tokens and cache when the 401 retry refresh also fails', async () => {
    TokenStorage.getAccessToken.mockReturnValue('stale-access-token');
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    sessionStorage.setItem('user_cache', JSON.stringify({ email: 'stale@example.com' }));
    const unauthorized = new Error('unauthorized');
    unauthorized.response = { status: 401 };
    AuthAPI.getCurrentUser.mockRejectedValue(unauthorized);
    AuthAPI.refreshToken.mockRejectedValue(new Error('refresh failed'));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(TokenStorage.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(sessionStorage.getItem('user_cache')).toBeNull();
  });

  it('falls back to the cached user on a non-401 (network) error', async () => {
    TokenStorage.getAccessToken.mockReturnValue('access-token');
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    sessionStorage.setItem('user_cache', JSON.stringify({ email: 'cached@example.com' }));
    AuthAPI.getCurrentUser.mockRejectedValue(new Error('network error'));

    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('cached@example.com')
    );
    expect(TokenStorage.clearTokens).not.toHaveBeenCalled();
  });

  it('logs in successfully and exposes the returned user', async () => {
    TokenStorage.getAccessToken.mockReturnValue(undefined);
    TokenStorage.getRefreshToken.mockReturnValue(undefined);
    AuthAPI.login.mockResolvedValue({ user: { email: 'user@example.com' } });

    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user@example.com'));
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('surfaces a login error without setting a user', async () => {
    TokenStorage.getAccessToken.mockReturnValue(undefined);
    TokenStorage.getRefreshToken.mockReturnValue(undefined);
    AuthAPI.login.mockRejectedValue(new Error('bad credentials'));

    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('bad credentials'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('clears user, tokens, and cached data on logout even if the API call fails', async () => {
    TokenStorage.getAccessToken.mockReturnValue('access-token');
    TokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    AuthAPI.getCurrentUser.mockResolvedValue({ email: 'user@example.com' });
    AuthAPI.logout.mockRejectedValue(new Error('logout endpoint down'));
    localStorage.setItem('expertSignupComplete', 'true');

    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user@example.com'));

    await user.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(TokenStorage.clearTokens).toHaveBeenCalled();
    expect(sessionStorage.getItem('user_cache')).toBeNull();
    expect(localStorage.getItem('expertSignupComplete')).toBeNull();
  });
});
