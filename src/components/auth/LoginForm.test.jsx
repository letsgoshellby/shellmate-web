import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/auth/kakaoAuth', () => ({
  initKakaoSDK: jest.fn(),
  loginWithKakao: jest.fn(),
}));

function setup(loginImpl) {
  const login = jest.fn(loginImpl);
  useAuth.mockReturnValue({ login });
  render(<LoginForm />);
  return { login };
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('올바른 이메일을 입력해주세요')).toBeInTheDocument();
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email format', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText('이메일'), 'not-an-email');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('올바른 이메일을 입력해주세요')).toBeInTheDocument();
  });

  it('shows a validation error for a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'short');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  it('logs in and redirects to the expert dashboard for expert users', async () => {
    const user = userEvent.setup();
    const { login } = setup(async () => ({ user: { user_type: 'expert' } }));

    await user.type(screen.getByLabelText('이메일'), 'expert@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('expert@example.com', 'password123', false));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/expert/dashboard'));
    expect(toast.success).toHaveBeenCalledWith('로그인되었습니다');
  });

  it('logs in and redirects to the client dashboard for client users', async () => {
    const user = userEvent.setup();
    setup(async () => ({ user: { user_type: 'client' } }));

    await user.type(screen.getByLabelText('이메일'), 'client@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/client/dashboard'));
  });

  it('shows a credential error toast on a 401 response without redirecting', async () => {
    const user = userEvent.setup();
    setup(async () => {
      const error = new Error('unauthorized');
      error.response = { status: 401 };
      throw error;
    });

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이메일 또는 비밀번호를 다시 확인해주세요.')
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows a generic error toast for non-401/400 failures', async () => {
    const user = userEvent.setup();
    setup(async () => {
      throw new Error('network down');
    });

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('로그인 중 오류가 발생했습니다')
    );
  });

  it('re-enables the submit button after a failed login', async () => {
    const user = userEvent.setup();
    setup(async () => {
      throw new Error('network down');
    });

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    const submitButton = screen.getByRole('button', { name: '로그인' });
    await user.click(submitButton);

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it('toggles password visibility when the eye icon is clicked', async () => {
    const user = userEvent.setup();
    setup();

    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = passwordInput.parentElement.querySelector('button[type="button"]');
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
