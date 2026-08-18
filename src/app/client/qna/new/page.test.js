import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewQuestionPage from './page';
import { QnAAPI } from '@/lib/api/qna';
import { toast } from 'react-hot-toast';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }) => <>{children}</>,
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }) => <>{children}</>,
}));

jest.mock('@/lib/api/qna', () => ({
  QnAAPI: { createQuestion: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const VALID_TITLE = '집중력이 부족한 아이 어떻게 도와줄까요';
const VALID_CONTENT = '5살 아이가 놀이할 때 5분도 집중을 못 하고 계속 자리를 옮겨다녀요. 어떻게 도와줄 수 있을까요?';

async function fillValidForm(user) {
  await user.selectOptions(screen.getByLabelText('카테고리 *'), 'learning_disability');
  await user.type(screen.getByLabelText('제목 *'), VALID_TITLE);
  await user.type(screen.getByLabelText('질문 내용 *'), VALID_CONTENT);
}

describe('NewQuestionPage (QnA 질문 작성)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows all three validation errors when submitting a completely empty form', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    expect(await screen.findByText('카테고리를 선택해주세요', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('제목은 10자 이상이어야 합니다')).toBeInTheDocument();
    expect(screen.getByText('내용은 20자 이상이어야 합니다')).toBeInTheDocument();
    expect(QnAAPI.createQuestion).not.toHaveBeenCalled();
  });

  it('rejects a title shorter than 10 characters', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    await user.selectOptions(screen.getByLabelText('카테고리 *'), 'learning_disability');
    await user.type(screen.getByLabelText('제목 *'), '너무 짧음');
    await user.type(screen.getByLabelText('질문 내용 *'), VALID_CONTENT);
    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    expect(await screen.findByText('제목은 10자 이상이어야 합니다')).toBeInTheDocument();
  });

  it('rejects content shorter than 20 characters', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    await user.selectOptions(screen.getByLabelText('카테고리 *'), 'learning_disability');
    await user.type(screen.getByLabelText('제목 *'), VALID_TITLE);
    await user.type(screen.getByLabelText('질문 내용 *'), '너무 짧은 내용');
    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    expect(await screen.findByText('내용은 20자 이상이어야 합니다')).toBeInTheDocument();
  });

  it('updates the live character counters as the user types', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByText('0/200')).toBeInTheDocument();

    await user.type(screen.getByLabelText('제목 *'), VALID_TITLE);
    await user.type(screen.getByLabelText('질문 내용 *'), VALID_CONTENT);

    expect(screen.getByText(`${VALID_TITLE.length}/100`)).toBeInTheDocument();
    expect(screen.getByText(`${VALID_CONTENT.length}/200`)).toBeInTheDocument();
  });

  it('adds a tag with the Add button and removes it via the x button', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter 또는 추가 버튼을 클릭하세요');
    await user.type(tagInput, '집중력');
    await user.click(tagInput.parentElement.querySelector('button')); // Plus icon button next to tag input

    expect(await screen.findByText('집중력')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    const removeButton = screen.getByText('집중력').closest('div').querySelector('button');
    await user.click(removeButton);
    expect(screen.queryByText('집중력')).not.toBeInTheDocument();
  });

  it('adds a tag when pressing Enter, and blocks duplicates', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter 또는 추가 버튼을 클릭하세요');
    await user.type(tagInput, '언어발달{Enter}');
    expect(await screen.findByText('언어발달')).toBeInTheDocument();

    await user.type(tagInput, '언어발달{Enter}');
    expect(screen.getAllByText('언어발달')).toHaveLength(1);
  });

  it('disables tag input once 5 tags have been added', async () => {
    const user = userEvent.setup();
    render(<NewQuestionPage />);

    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter 또는 추가 버튼을 클릭하세요');
    for (const tag of ['a', 'b', 'c', 'd', 'e']) {
      await user.type(tagInput, `${tag}{Enter}`);
    }

    expect(screen.getByText('최대 5개까지 태그를 추가할 수 있습니다 (5/5)')).toBeInTheDocument();
    expect(tagInput).toBeDisabled();
  });

  it('submits successfully and redirects to the new question detail page', async () => {
    const user = userEvent.setup();
    QnAAPI.createQuestion.mockResolvedValue({ id: 42 });
    render(<NewQuestionPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    await waitFor(() =>
      expect(QnAAPI.createQuestion).toHaveBeenCalledWith({
        title: VALID_TITLE,
        content: VALID_CONTENT,
        category: 'learning_disability',
        is_anonymous: false,
      })
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/client/qna/42'));
    expect(toast.success).toHaveBeenCalledWith('질문이 성공적으로 등록되었습니다');
  });

  it('shows the server-provided error message when submission fails', async () => {
    const user = userEvent.setup();
    const error = new Error('bad request');
    error.response = { data: { detail: '이미 유사한 질문이 존재합니다' } };
    QnAAPI.createQuestion.mockRejectedValue(error);
    render(<NewQuestionPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이미 유사한 질문이 존재합니다')
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the server sends none', async () => {
    const user = userEvent.setup();
    QnAAPI.createQuestion.mockRejectedValue(new Error('network down'));
    render(<NewQuestionPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '질문 등록' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('질문 등록에 실패했습니다'));
  });
});
