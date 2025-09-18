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
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertQuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // 임시 데이터 (실제로는 API에서 가져올 것)
  const mockQuestion = {
    id: 1,
    title: '6세 아이가 집중을 잘 못해요',
    content: `우리 아이가 한 가지 일에 집중하는 시간이 너무 짧습니다. 
    
    상황:
    - 나이: 6세 남아
    - 증상: 숙제나 놀이를 시작해도 5분도 안 되어서 다른 일을 하려고 함
    - 시작 시기: 약 6개월 전부터
    - 어린이집에서도 비슷한 이야기를 들음
    
    지금까지 시도해본 것:
    - 조용한 환경 만들어주기
    - 짧은 시간으로 나누어서 활동하기
    - 보상 시스템 도입
    
    어떻게 도와줄 수 있을까요? 전문적인 도움이 필요한 상황인지도 궁금합니다.`,
    category: 'attention',
    author: {
      id: 1,
      name: '김○○',
      type: 'client',
      profile_image: null,
      children_info: {
        age: 6,
        gender: 'M',
        concerns: ['집중력', '주의력']
      }
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    likes_count: 5,
    is_liked: false,
    is_resolved: false,
    has_accepted_answer: false,
    urgency: 'medium',
    tags: ['집중력', '주의력', '6세', '남아']
  };

  const mockAnswers = [
    {
      id: 2,
      content: `집중력 문제로 고민이 많으시겠어요. 

저희 아이도 비슷한 시기에 같은 문제가 있었는데, 몇 가지 도움이 된 것들을 공유해드릴게요:

**실제로 효과가 있었던 것들:**
- 타이머 사용: 5분씩 시작해서 점차 늘려가기
- 집중 후 충분한 자유시간 주기
- 아이와 함께 집중시간 목표 정하기

**주의할 점:**
- 너무 조용한 환경보다는 적당한 백색소음
- 완벽을 요구하지 말고 작은 발전도 칭찬

지금 6세면 아직 충분히 개선 가능한 시기입니다. 너무 걱정하지 마세요!`,
      author: {
        id: 3,
        name: '박○○',
        type: 'client',
        title: null,
        profile_image: null
      },
      created_at: '2024-01-15T16:45:00Z',
      likes_count: 3,
      is_liked: false,
      is_accepted: false,
      is_expert: false
    }
  ];

  useEffect(() => {
    loadQuestionDetail();
  }, [params.id]);

  const loadQuestionDetail = async () => {
    try {
      // 실제 API 호출 시
      // const questionData = await QnAAPI.getQuestion(params.id);
      // setQuestion(questionData);
      // setAnswers(questionData.answers || []);
      
      // 임시로 목 데이터 사용
      setQuestion(mockQuestion);
      setAnswers(mockAnswers);
    } catch (error) {
      toast.error('질문을 불러오는데 실패했습니다');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      toast.error('답변 내용을 입력해주세요');
      return;
    }

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
          title: '전문가'
        },
        created_at: new Date().toISOString(),
        likes_count: 0,
        is_liked: false,
        is_accepted: false,
        is_expert: true
      };
      
      setAnswers([...answers, newAnswerObj]);
      setNewAnswer('');
      toast.success('전문가 답변이 등록되었습니다');
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
      emotion: '정서발달'
    };
    return categories[category] || category;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  const hasExpertAnswer = answers.some(answer => answer.is_expert);

  if (loading) {
    return (
      <AuthGuard requiredRole="expert">
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
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">질문을 찾을 수 없습니다</h2>
            <Link href="/expert/qna">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/expert/qna">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  목록으로
                </Button>
              </Link>
            </div>
            
            {!hasExpertAnswer && (
              <Badge className="bg-orange-100 text-orange-800">
                <AlertCircle className="mr-1 h-3 w-3" />
                전문가 답변 필요
              </Badge>
            )}
          </div>

          {/* 질문자 정보 카드 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">질문자 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <span className="font-medium">질문자:</span> {question.author.name}
                </div>
                <div>
                  <span className="font-medium">아이 나이:</span> {question.author.children_info?.age || '미상'}세
                </div>
                <div>
                  <span className="font-medium">주요 관심사:</span> {question.author.children_info?.concerns?.join(', ') || '집중력'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 질문 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {getCategoryName(question.category)}
                    </Badge>
                    <Badge className={getUrgencyColor(question.urgency)}>
                      {getUrgencyText(question.urgency)}
                    </Badge>
                    {question.has_accepted_answer && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        해결됨
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-4">{question.title}</CardTitle>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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
                    {question.author.name}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {formatDate(question.created_at)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Heart className="mr-1 h-4 w-4" />
                    {question.likes_count}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    답변 {answers.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기존 답변 목록 */}
          {answers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                기존 답변 {answers.length}개
              </h3>
              
              {answers.map((answer) => (
                <Card key={answer.id} className={answer.is_expert ? 'border-blue-200 bg-blue-50/30' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {answer.author.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{answer.author.name}</span>
                            {answer.is_expert ? (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                <Star className="mr-1 h-3 w-3" />
                                전문가
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">학부모</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(answer.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none mb-4">
                      <p className="whitespace-pre-wrap text-gray-700">{answer.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <ThumbsUp className="mr-1 h-4 w-4" />
                        도움됨 {answer.likes_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 전문가 답변 작성 */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-blue-600" />
                전문가 답변 작성
              </CardTitle>
              <p className="text-sm text-gray-600">
                전문적이고 도움이 되는 답변을 작성해주세요. 구체적인 방법과 조언을 포함해주시면 더욱 좋습니다.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="전문가로서 구체적이고 실용적인 조언을 제공해주세요. 다음 내용을 포함하시면 좋습니다:

1. 현재 상황에 대한 전문적 분석
2. 구체적인 해결 방법이나 개선 방안
3. 주의사항이나 고려할 점
4. 필요시 추가 전문가 도움을 받을 시점

학부모가 실제로 적용할 수 있는 구체적인 방법을 제시해주시기 바랍니다."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={10}
                  className="min-h-[200px]"
                />
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">답변 작성 가이드라인</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 전문적이면서도 이해하기 쉬운 언어로 작성해주세요</li>
                    <li>• 구체적인 방법과 예시를 포함해주세요</li>
                    <li>• 안전하고 검증된 방법만 제안해주세요</li>
                    <li>• 필요시 전문기관 방문을 권유해주세요</li>
                  </ul>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {newAnswer.length}/2000 글자
                  </p>
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || submittingAnswer || newAnswer.length < 50}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submittingAnswer ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        전문가 답변 등록
                      </>
                    )}
                  </Button>
                </div>
                
                {newAnswer.length > 0 && newAnswer.length < 50 && (
                  <p className="text-sm text-red-500">
                    최소 50자 이상 작성해주세요. (현재 {newAnswer.length}자)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}