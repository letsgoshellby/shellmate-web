'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { QnAAPI } from '@/lib/api/qna';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Heart, 
  MessageSquare, 
  CheckCircle,
  ThumbsUp,
  Send,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // 임시 데이터 (주석 처리)
  // const mockQuestion = {
  //   id: 1,
  //   title: '6세 아이가 집중을 잘 못해요',
  //   content: `우리 아이가 한 가지 일에 집중하는 시간이 너무 짧습니다.
  //
  //   상황:
  //   - 나이: 6세 남아
  //   - 증상: 숙제나 놀이를 시작해도 5분도 안 되어서 다른 일을 하려고 함
  //   - 시작 시기: 약 6개월 전부터
  //   - 어린이집에서도 비슷한 이야기를 들음
  //
  //   지금까지 시도해본 것:
  //   - 조용한 환경 만들어주기
  //   - 짧은 시간으로 나누어서 활동하기
  //   - 보상 시스템 도입
  //
  //   어떻게 도와줄 수 있을까요? 전문적인 도움이 필요한 상황인지도 궁금합니다.`,
  //   category: 'attention',
  //   author: {
  //     id: 1,
  //     name: '김○○',
  //     type: 'client',
  //     profile_image: null
  //   },
  //   created_at: '2024-01-15T10:30:00Z',
  //   updated_at: '2024-01-15T10:30:00Z',
  //   likes_count: 5,
  //   is_liked: false,
  //   is_resolved: false,
  //   has_accepted_answer: false,
  //   tags: ['집중력', '주의력', '6세', '남아']
  // };

  // const mockAnswers = [
  //   {
  //     id: 1,
  //     content: `안녕하세요. 아동발달 전문가입니다.
  //
  // 6세 아이의 집중력 문제는 매우 흔한 고민 중 하나입니다. 말씀해주신 증상을 보면 몇 가지 도움이 될 만한 방법들을 제안드릴 수 있을 것 같습니다.
  //
  // **현재 상황 분석:**
  // - 6개월 전부터 시작된 증상
  // - 가정과 어린이집 모두에서 나타나는 패턴
  // - 이미 좋은 시도들을 해보신 것 같습니다
  //
  // **추가로 시도해볼 수 있는 방법들:**
  //
  // 1. **관심사 활용하기**
  //    - 아이가 좋아하는 것들을 집중 훈련에 활용
  //    - 예: 좋아하는 캐릭터가 나오는 워크북 사용
  //
  // 2. **신체 활동 늘리기**
  //    - 집중하기 전에 충분한 신체활동
  //    - 산책, 뛰기, 스트레칭 등
  //
  // 3. **루틴 만들기**
  //    - 일정한 시간에 일정한 활동
  //    - 시각적 스케줄표 활용
  //
  // **전문가 도움이 필요한 경우:**
  // - 3개월 이상 지속적인 노력에도 개선이 없을 때
  // - 일상생활에 현저한 지장이 있을 때
  // - 아이가 스트레스를 많이 받고 있을 때
  //
  // 우선 위 방법들을 2-3개월 정도 꾸준히 시도해보시고, 개선이 없다면 소아정신과나 발달센터 상담을 받아보시는 것을 권합니다.`,
  //     author: {
  //       id: 2,
  //       name: '이전문가',
  //       type: 'expert',
  //       title: '아동발달 전문가',
  //       profile_image: null
  //     },
  //     created_at: '2024-01-15T14:20:00Z',
  //     likes_count: 8,
  //     is_liked: false,
  //     is_accepted: false
  //   },
  //   {
  //     id: 2,
  //     content: `집중력 문제로 고민이 많으시겠어요.
  //
  // 저희 아이도 비슷한 시기에 같은 문제가 있었는데, 몇 가지 도움이 된 것들을 공유해드릴게요:
  //
  // **실제로 효과가 있었던 것들:**
  // - 타이머 사용: 5분씩 시작해서 점차 늘려가기
  // - 집중 후 충분한 자유시간 주기
  // - 아이와 함께 집중시간 목표 정하기
  //
  // **주의할 점:**
  // - 너무 조용한 환경보다는 적당한 백색소음
  // - 완벽을 요구하지 말고 작은 발전도 칭찬
  //
  // 지금 6세면 아직 충분히 개선 가능한 시기입니다. 너무 걱정하지 마세요!`,
  //     author: {
  //       id: 3,
  //       name: '박○○',
  //       type: 'client',
  //       title: null,
  //       profile_image: null
  //     },
  //     created_at: '2024-01-15T16:45:00Z',
  //     likes_count: 3,
  //     is_liked: false,
  //     is_accepted: false
  //   }
  // ];

  useEffect(() => {
    loadQuestionDetail();
  }, [params.id]);

  const loadQuestionDetail = async () => {
    try {
      // 실제 API 호출
      const questionData = await QnAAPI.getQuestion(params.id);
      setQuestion(questionData);
      setAnswers(questionData.answers || []);

      // 임시로 목 데이터 사용
      // setQuestion(mockQuestion);
      // setAnswers(mockAnswers);
    } catch (error) {
      console.error('질문 상세 로딩 실패:', error);
      toast.error('질문을 불러오는데 실패했습니다');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLikeQuestion = async () => {
    try {
      // 실제 API 호출 - toggleSympathy
      const result = await QnAAPI.toggleSympathy(question.id);
      setQuestion({
        ...question,
        is_sympathized: result.sympathized,
        sympathy_count: result.sympathy_count
      });
    } catch (error) {
      console.error('공감 처리 실패:', error);
      toast.error('공감 처리에 실패했습니다');
    }
  };

  const handleLikeAnswer = async (answerId) => {
    try {
      // await QnAAPI.likeAnswer(question.id, answerId);
      setAnswers(answers.map(answer => 
        answer.id === answerId 
          ? {
              ...answer,
              is_liked: !answer.is_liked,
              likes_count: answer.is_liked ? answer.likes_count - 1 : answer.likes_count + 1
            }
          : answer
      ));
    } catch (error) {
      toast.error('좋아요 처리에 실패했습니다');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return;

    setSubmittingAnswer(true);
    try {
      // const answer = await QnAAPI.createAnswer(question.id, { content: newAnswer });
      
      // 임시로 새 답변 추가
      const newAnswerObj = {
        id: Date.now(),
        content: newAnswer,
        author: {
          id: user.id,
          name: user.name,
          type: user.user_type,
          title: user.user_type === 'expert' ? '전문가' : null
        },
        created_at: new Date().toISOString(),
        likes_count: 0,
        is_liked: false,
        is_accepted: false
      };
      
      setAnswers([...answers, newAnswerObj]);
      setNewAnswer('');
      toast.success('답변이 등록되었습니다');
    } catch (error) {
      toast.error('답변 등록에 실패했습니다');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryName = (category) => {
    const categories = {
      attention: '집중력',
      language: '언어발달',
      social: '사회성',
      behavior: '행동',
      learning: '학습',
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!question) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">질문을 찾을 수 없습니다</h2>
            <Link href="/client/qna">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/qna">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Button>
            </Link>
          </div>

          {/* 질문 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {getCategoryName(question.category)}
                    </Badge>
                    {question.has_accepted_answer && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        해결됨
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-4">{question.title}</CardTitle>
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {question.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap text-gray-700">{question.content}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    {question.author?.name || question.author_nickname || '익명'}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {formatDate(question.created_at)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLikeQuestion}
                    className={question.is_sympathized ? 'text-red-500' : ''}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${question.is_sympathized ? 'fill-current' : ''}`} />
                    {question.sympathy_count || 0}
                  </Button>
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    답변 {answers.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 답변 목록 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              답변 {answers.length}개
            </h3>
            
            {answers.map((answer) => {
              const authorName = answer.author?.name || answer.author_nickname || '익명';
              const authorType = answer.author?.type || answer.author?.user_type;
              return (
              <Card key={answer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{authorName}</span>
                          {authorType === 'expert' && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">전문가</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(answer.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {answer.is_accepted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        채택된 답변
                      </Badge>
                    )}
                  </div>
                  
                  <div className="prose max-w-none mb-4">
                    <p className="whitespace-pre-wrap text-gray-700">{answer.content}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLikeAnswer(answer.id)}
                      className={answer.is_liked ? 'text-blue-500' : ''}
                    >
                      <ThumbsUp className={`mr-1 h-4 w-4 ${answer.is_liked ? 'fill-current' : ''}`} />
                      도움됨 {answer.likes_count}
                    </Button>
                    
                    {user?.id === question.author.id && !answer.is_accepted && !question.has_accepted_answer && (
                      <Button size="sm" variant="outline">
                        답변 채택
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>

          {/* 답변 작성
          <Card>
            <CardHeader>
              <CardTitle>답변 작성</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="도움이 되는 답변을 작성해주세요..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={6}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || submittingAnswer}
                  >
                    {submittingAnswer ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        답변 등록
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}