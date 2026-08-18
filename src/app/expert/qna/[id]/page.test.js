import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpertQuestionDetailPage from './page';
import { QnAAPI, QnAExpertAPI } from '@/lib/api/qna';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const pushMock = jest.fn();
const backMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: pushMock, back: backMock }),
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

jest.mock('@/lib/api/qna', () => ({
  QnAAPI: { getQuestion: jest.fn() },
  QnAExpertAPI: { createAnswer: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const baseQuestion = {
  id: 1,
  title: '5살 아이 집중력이 부족해요',
  content: '집에서 놀이할 때 5분도 집중을 못 합니다.',
  tags: [],
  author: { name: '학부모A' },
  created_at: '2026-08-01T00:00:00Z',
  likes_count: 0,
};

const LONG_ANSWER =
  '먼저 아이의 발달 단계를 확인하고, 하루 15분씩 정해진 시간에 집중 놀이를 반복하는 루틴을 만들어보세요. 충분히 도움이 될 거예요.';

function mockLoadedQuestion(answers = []) {
  QnAAPI.getQuestion.mockResolvedValue({ ...baseQuestion, answers });
}

describe('ExpertQuestionDetailPage (전문가 답변 작성)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 99, name: '전문가A' } });
  });

  it('shows a loading spinner before the question loads', () => {
    QnAAPI.getQuestion.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ExpertQuestionDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the question once loaded', async () => {
    mockLoadedQuestion();
    render(<ExpertQuestionDetailPage />);

    expect(await screen.findByText(baseQuestion.title)).toBeInTheDocument();
    expect(screen.getByText(baseQuestion.content)).toBeInTheDocument();
  });

  it('shows an error toast and navigates back when loading the question fails', async () => {
    QnAAPI.getQuestion.mockRejectedValue(new Error('not found'));
    render(<ExpertQuestionDetailPage />);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('질문을 불러오는데 실패했습니다'));
    expect(backMock).toHaveBeenCalled();
  });

  it('keeps the submit button disabled while the answer field is empty', async () => {
    mockLoadedQuestion();
    render(<ExpertQuestionDetailPage />);
    await screen.findByText(baseQuestion.title);

    expect(screen.getByRole('button', { name: /전문가 답변 등록/ })).toBeDisabled();
    expect(QnAExpertAPI.createAnswer).not.toHaveBeenCalled();
  });

  it('keeps the submit button disabled while the answer is under 50 characters', async () => {
    const user = userEvent.setup();
    mockLoadedQuestion();
    render(<ExpertQuestionDetailPage />);
    await screen.findByText(baseQuestion.title);

    const textarea = screen.getByPlaceholderText(/전문가로서 구체적이고 실용적인 조언/);
    await user.type(textarea, '짧은 답변입니다');

    expect(screen.getByRole('button', { name: /전문가 답변 등록/ })).toBeDisabled();
  });

  it('enables submission once the answer reaches 50 characters and posts it', async () => {
    const user = userEvent.setup();
    mockLoadedQuestion();
    QnAExpertAPI.createAnswer.mockResolvedValue({
      id: 500,
      content: LONG_ANSWER,
      is_expert: true,
      expert: { name: '전문가A' },
      created_at: '2026-08-02T00:00:00Z',
      likes_count: 0,
    });
    render(<ExpertQuestionDetailPage />);
    await screen.findByText(baseQuestion.title);

    const textarea = screen.getByPlaceholderText(/전문가로서 구체적이고 실용적인 조언/);
    await user.type(textarea, LONG_ANSWER);

    const submitButton = screen.getByRole('button', { name: /전문가 답변 등록/ });
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);

    await waitFor(() =>
      expect(QnAExpertAPI.createAnswer).toHaveBeenCalledWith(1, { content: LONG_ANSWER })
    );
    expect(toast.success).toHaveBeenCalledWith('전문가 답변이 등록되었습니다');
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('shows an error toast and keeps the draft answer when submission fails', async () => {
    const user = userEvent.setup();
    mockLoadedQuestion();
    const error = new Error('failed');
    error.response = { data: { detail: '이미 답변을 작성했습니다' } };
    QnAExpertAPI.createAnswer.mockRejectedValue(error);
    render(<ExpertQuestionDetailPage />);
    await screen.findByText(baseQuestion.title);

    const textarea = screen.getByPlaceholderText(/전문가로서 구체적이고 실용적인 조언/);
    await user.type(textarea, LONG_ANSWER);
    await user.click(screen.getByRole('button', { name: /전문가 답변 등록/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 답변을 작성했습니다'));
    expect(textarea).toHaveValue(LONG_ANSWER);
  });

  it('renders existing answers, marking expert answers distinctly', async () => {
    mockLoadedQuestion([
      {
        id: 10,
        content: '기존 답변입니다',
        is_expert: true,
        expert: { name: '김전문가' },
        created_at: '2026-08-01T01:00:00Z',
        likes_count: 3,
      },
    ]);
    render(<ExpertQuestionDetailPage />);

    expect(await screen.findByText('기존 답변입니다')).toBeInTheDocument();
    expect(screen.getByText('전문가')).toBeInTheDocument();
    expect(screen.getByText('김전문가')).toBeInTheDocument();
  });
});
