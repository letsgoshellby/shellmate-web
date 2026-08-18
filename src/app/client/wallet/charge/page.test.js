import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChargeEggPage from './page';
import { WalletAPI } from '@/lib/api/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }) => <>{children}</>,
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }) => <>{children}</>,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api/wallet', () => ({
  WalletAPI: {
    getMyWallet: jest.fn(),
    getTokenPackages: jest.fn(),
    prepareTokenPurchase: jest.fn(),
    confirmTokenPurchase: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const SAMPLE_PACKAGE = { id: 1, product_id: 'pkg_1', name: '스타터 팩', tokens: 50, price_krw: 50000 };

async function renderWithPackages(packages = [SAMPLE_PACKAGE], balance = '0') {
  WalletAPI.getMyWallet.mockResolvedValue({ balance });
  WalletAPI.getTokenPackages.mockResolvedValue(packages);
  render(<ChargeEggPage />);
  await screen.findByText('충전 패키지 선택');
}

describe('ChargeEggPage (에그 충전)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { email: 'user@example.com', name: '홍길동' } });
    delete window.PortOne;
  });

  it('shows a loading spinner while wallet + package data is loading', () => {
    WalletAPI.getMyWallet.mockReturnValue(new Promise(() => {}));
    WalletAPI.getTokenPackages.mockReturnValue(new Promise(() => {}));
    render(<ChargeEggPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error toast when loading wallet/package data fails', async () => {
    WalletAPI.getMyWallet.mockRejectedValue(new Error('network down'));
    WalletAPI.getTokenPackages.mockResolvedValue([]);
    render(<ChargeEggPage />);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('데이터를 불러오는데 실패했습니다'));
  });

  it('shows an empty state when there are no packages available', async () => {
    await renderWithPackages([]);
    expect(screen.getByText('사용 가능한 패키지가 없습니다')).toBeInTheDocument();
  });

  it('does not show the purchase section until a package is selected', async () => {
    await renderWithPackages();
    expect(screen.queryByText('결제 완료 후 즉시 에그가 충전됩니다.')).not.toBeInTheDocument();
  });

  it('reveals the purchase button with the correct price after selecting a package', async () => {
    const user = userEvent.setup();
    await renderWithPackages();

    await user.click(screen.getByText('스타터 팩'));

    expect(await screen.findByRole('button', { name: '₩50,000 결제하기' })).toBeInTheDocument();
  });

  it('shows an error toast if PortOne has not finished loading', async () => {
    const user = userEvent.setup();
    await renderWithPackages();
    await user.click(screen.getByText('스타터 팩'));

    await user.click(screen.getByRole('button', { name: '₩50,000 결제하기' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
    );
    expect(WalletAPI.prepareTokenPurchase).toHaveBeenCalled();
  });

  it('shows the PortOne failure message when the payment sheet reports an error code', async () => {
    const user = userEvent.setup();
    WalletAPI.prepareTokenPurchase.mockResolvedValue({ order_id: 'order_1' });
    window.PortOne = {
      requestPayment: jest.fn().mockResolvedValue({ code: 'FAILURE_TYPE_PG', message: '카드 승인이 거절되었습니다' }),
    };
    await renderWithPackages();
    await user.click(screen.getByText('스타터 팩'));
    await user.click(screen.getByRole('button', { name: '₩50,000 결제하기' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('결제 실패: 카드 승인이 거절되었습니다')
    );
    expect(WalletAPI.confirmTokenPurchase).not.toHaveBeenCalled();
  });

  it('confirms the purchase and redirects to the wallet page on a successful payment', async () => {
    const user = userEvent.setup();
    WalletAPI.prepareTokenPurchase.mockResolvedValue({ order_id: 'order_1' });
    WalletAPI.confirmTokenPurchase.mockResolvedValue({});
    window.PortOne = {
      requestPayment: jest.fn().mockResolvedValue({ paymentId: 'pay_1' }),
    };
    await renderWithPackages();
    await user.click(screen.getByText('스타터 팩'));
    await user.click(screen.getByRole('button', { name: '₩50,000 결제하기' }));

    await waitFor(() =>
      expect(WalletAPI.confirmTokenPurchase).toHaveBeenCalledWith('order_1', 'pay_1')
    );
    expect(toast.success).toHaveBeenCalledWith('에그 충전이 완료되었습니다!');
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/client/wallet'));
  });

  it('warns the user to contact support if payment succeeds but server-side confirmation fails', async () => {
    const user = userEvent.setup();
    WalletAPI.prepareTokenPurchase.mockResolvedValue({ order_id: 'order_1' });
    WalletAPI.confirmTokenPurchase.mockRejectedValue(new Error('confirm failed'));
    window.PortOne = {
      requestPayment: jest.fn().mockResolvedValue({ paymentId: 'pay_1' }),
    };
    await renderWithPackages();
    await user.click(screen.getByText('스타터 팩'));
    await user.click(screen.getByRole('button', { name: '₩50,000 결제하기' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.')
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a preparation-failure toast when prepareTokenPurchase itself rejects', async () => {
    const user = userEvent.setup();
    WalletAPI.prepareTokenPurchase.mockRejectedValue(new Error('prepare failed'));
    window.PortOne = { requestPayment: jest.fn() };
    await renderWithPackages();
    await user.click(screen.getByText('스타터 팩'));
    await user.click(screen.getByRole('button', { name: '₩50,000 결제하기' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('결제 준비 중 오류가 발생했습니다'));
    expect(window.PortOne.requestPayment).not.toHaveBeenCalled();
  });
});
