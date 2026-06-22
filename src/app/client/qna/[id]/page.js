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
        is_sympathized_by_user: result.is_sympathized,
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
      concentration: '집중력',
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
                    {question.author?.nickname || question.author?.name || question.author_nickname || '익명'}
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
                    className={question.is_sympathized_by_user ? 'text-red-500' : ''}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${question.is_sympathized_by_user ? 'fill-current' : ''}`} />
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
              const isExpert = !!answer.expert;
              const authorName = isExpert ? (answer.expert.name || '전문가') : '익명';
              const profileImage = answer.expert?.profile_image;
              return (
              <Card key={answer.id} className={isExpert ? 'border-blue-200 bg-blue-50/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {isExpert && answer.id ? (
                        <Link href={`/client/experts/${answer.id}`}>
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={authorName}
                              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity">
                              {authorName.charAt(0)}
                            </div>
                          )}
                        </Link>
                      ) : profileImage ? (
                        <img
                          src={profileImage}
                          alt={authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{authorName}</span>
                          {isExpert && (
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
                      도움됨
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