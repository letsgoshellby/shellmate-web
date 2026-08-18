import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentPage from './page';
import { WalletAPI } from '@/lib/api/wallet';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { toast } from 'react-hot-toast';

const mockPush = jest.fn();
let mockSearchParamsStore = {};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key) => (key in mockSearchParamsStore ? mockSearchParamsStore[key] : null),
  }),
}));

jest.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }) => <>{children}</>,
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }) => <>{children}</>,
}));

jest.mock('@/lib/api/wallet', () => ({
  WalletAPI: { getMyWallet: jest.fn() },
}));

jest.mock('@/lib/api/consultations', () => ({
  ConsultationsAPI: { createCounselingRequest: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

function setSearchParams(overrides = {}) {
  mockSearchParamsStore = {
    expert_id: '7',
    expert_name: '김전문가',
    session_type: 'single',
    session_type_display: '1회 상담',
    tokens_required: '100',
    scheduled_date: '2026-08-10',
    scheduled_time: '14:00',
    client_notes: '',
    ...overrides,
  };
}

function getToggleButton() {
  return screen.getAllByRole('button').find((btn) => btn.textContent.trim() === '');
}

describe('PaymentPage (결제하기)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSearchParams();
  });

  it('shows a loading spinner while wallet info is loading', () => {
    WalletAPI.getMyWallet.mockReturnValue(new Promise(() => {}));
    render(<PaymentPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error toast when the wallet fails to load', async () => {
    WalletAPI.getMyWallet.mockRejectedValue(new Error('network down'));
    render(<PaymentPage />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('지갑 정보를 불러오는데 실패했습니다')
    );
  });

  it('treats an exactly-equal balance as sufficient (>= boundary)', async () => {
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    expect(payButton).not.toBeDisabled();
    expect(screen.queryByText(/에그가 더 필요합니다/)).not.toBeInTheDocument();
  });

  it('disables the pay button and shows the exact shortage amount when balance is insufficient', async () => {
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '50' });
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    expect(payButton).toBeDisabled();
    expect(screen.getByText('에그가 부족합니다. 50 에그가 더 필요합니다.')).toBeInTheDocument();
  });

  it('reveals the price breakdown only after the toggle is expanded', async () => {
    const user = userEvent.setup();
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    render(<PaymentPage />);

    await screen.findByRole('button', { name: '에그 사용하기' });
    expect(screen.queryByText('정가')).not.toBeInTheDocument();

    await user.click(getToggleButton());
    expect(screen.getByText('정가')).toBeInTheDocument();
    expect(screen.getByText('할인')).toBeInTheDocument();
  });

  it('assembles the request from URL params and redirects on a successful payment', async () => {
    const user = userEvent.setup();
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    ConsultationsAPI.createCounselingRequest.mockResolvedValue({ id: 123 });
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    await user.click(payButton);

    await waitFor(() =>
      expect(ConsultationsAPI.createCounselingRequest).toHaveBeenCalledWith({
        expert_id: 7,
        session_type: 'single',
        client_notes: '',
        first_session_schedule: {
          session_number: 1,
          scheduled_at: '2026-08-10T14:00:00',
        },
      })
    );
    expect(toast.success).toHaveBeenCalledWith('상담 예약이 완료되었습니다!');
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/client/consultations?success=true&id=123')
    );
  });

  it('falls back to an empty string for client_notes when the URL param is absent', async () => {
    const user = userEvent.setup();
    setSearchParams({ client_notes: undefined });
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    ConsultationsAPI.createCounselingRequest.mockResolvedValue({ id: 1 });
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    await user.click(payButton);

    await waitFor(() =>
      expect(ConsultationsAPI.createCounselingRequest).toHaveBeenCalledWith(
        expect.objectContaining({ client_notes: '' })
      )
    );
  });

  it('prefers response.data.message over detail/error when a payment fails', async () => {
    const user = userEvent.setup();
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    const error = new Error('failed');
    error.response = { data: { message: '이미 예약된 시간입니다', detail: 'ignored', error: 'ignored' } };
    ConsultationsAPI.createCounselingRequest.mockRejectedValue(error);
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    await user.click(payButton);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 예약된 시간입니다'));
  });

  it('falls back to detail, then error, then a generic message as each field is absent', async () => {
    const user = userEvent.setup();
    WalletAPI.getMyWallet.mockResolvedValue({ balance: '100' });
    ConsultationsAPI.createCounselingRequest.mockRejectedValue(new Error('boom'));
    render(<PaymentPage />);

    const payButton = await screen.findByRole('button', { name: '에그 사용하기' });
    await user.click(payButton);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('결제 중 오류가 발생했습니다'));
  });
});
