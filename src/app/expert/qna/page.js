'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QnAAPI } from '@/lib/api/qna';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertQnAPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unanswered, answered
  
  // 임시 데이터 (주석 처리)
  // const mockQuestions = [
  //   {
  //     id: 1,
  //     title: '6세 아이가 집중을 잘 못해요',
  //     content: '우리 아이가 한 가지 일에 집중하는 시간이 너무 짧습니다. 어떻게 도와줄 수 있을까요?',
  //     category: 'attention',
  //     author: {
  //       name: '김○○',
  //       type: 'client'
  //     },
  //     created_at: '2024-01-15T10:30:00Z',
  //     answers_count: 2,
  //     likes_count: 5,
  //     is_resolved: false,
  //     has_accepted_answer: false,
  //     has_expert_answer: true,
  //     urgency: 'medium',
  //     tags: ['집중력', '주의력', '6세']
  //   },
  //   {
  //     id: 2,
  //     title: '언어 발달이 또래보다 늦는 것 같아요',
  //     content: '5세인데 아직 문장을 완전히 만들어서 말하지 못합니다. 언어치료를 받아야 할까요?',
  //     category: 'language',
  //     author: {
  //       name: '이○○',
  //       type: 'client'
  //     },
  //     created_at: '2024-01-14T15:20:00Z',
  //     answers_count: 0,
  //     likes_count: 8,
  //     is_resolved: false,
  //     has_accepted_answer: false,
  //     has_expert_answer: false,
  //     urgency: 'high',
  //     tags: ['언어발달', '언어치료', '5세']
  //   },
  //   {
  //     id: 3,
  //     title: '친구들과 어울리지 못하는 아이',
  //     content: '어린이집에서 혼자 노는 경우가 많다고 합니다. 사회성 발달을 위해 어떤 도움을 줄 수 있을까요?',
  //     category: 'social',
  //     author: {
  //       name: '박○○',
  //       type: 'client'
  //     },
  //     created_at: '2024-01-13T09:15:00Z',
  //     answers_count: 1,
  //     likes_count: 3,
  //     is_resolved: false,
  //     has_accepted_answer: false,
  //     has_expert_answer: false,
  //     urgency: 'medium',
  //     tags: ['사회성', '친구관계', '어린이집']
  //   },
  //   {
  //     id: 4,
  //     title: '감정 조절이 어려운 7세 아이',
  //     content: '작은 일에도 크게 화를 내고 진정하는데 시간이 오래 걸립니다.',
  //     category: 'emotion',
  //     author: {
  //       name: '최○○',
  //       type: 'client'
  //     },
  //     created_at: '2024-01-12T16:45:00Z',
  //     answers_count: 0,
  //     likes_count: 12,
  //     is_resolved: false,
  //     has_accepted_answer: false,
  //     has_expert_answer: false,
  //     urgency: 'high',
  //     tags: ['감정조절', '화', '7세']
  //   }
  // ];

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, statusFilter]);

  // 검색어 입력 시 디바운스 적용
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadQuestions();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Enter 키로 즉시 검색
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadQuestions();
    }
  };

  const loadQuestions = async () => {
    try {
      // 실제 API 호출 (Expert도 같은 API 사용)
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const data = await QnAAPI.getQuestions(params);
      setQuestions(data.results || data);

      // 임시로 목 데이터 사용
      // setQuestions(mockQuestions);
    } catch (error) {
      console.error('질문 목록 로딩 실패:', error);
      toast.error('질문 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '어제';
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
      emotion: '정서발달',
      all: '전체'
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

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unanswered' && !question.has_expert_answer) ||
                         (statusFilter === 'answered' && question.has_expert_answer);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 우선순위별로 정렬 (답변이 없는 긴급한 질문 우선)
  const sortedQuestions = filteredQuestions.sort((a, b) => {
    if (!a.has_expert_answer && b.has_expert_answer) return -1;
    if (a.has_expert_answer && !b.has_expert_answer) return 1;
    
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });

  if (loading) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Q&A 답변하기</h1>
              <p className="text-gray-600">학부모들의 질문에 전문적인 답변을 제공해주세요</p>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">대기 중인 질문</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {questions.filter(q => !q.has_expert_answer).length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">긴급 질문</p>
                    <p className="text-2xl font-bold text-red-600">
                      {questions.filter(q => q.urgency === 'high' && !q.has_expert_answer).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">답변한 질문</p>
                    <p className="text-2xl font-bold text-green-600">
                      {questions.filter(q => q.has_expert_answer).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 질문</p>
                    <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 검색 및 필터 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="질문 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">전체 상태</option>
                    <option value="unanswered">답변 대기</option>
                    <option value="answered">답변 완료</option>
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">전체 카테고리</option>
                    <option value="attention">집중력</option>
                    <option value="language">언어발달</option>
                    <option value="social">사회성</option>
                    <option value="behavior">행동</option>
                    <option value="learning">학습</option>
                    <option value="emotion">정서발달</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 질문 목록 */}
          <div className="space-y-4">
            {sortedQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    해당하는 질문이 없습니다
                  </h3>
                  <p className="text-gray-600">
                    검색 조건을 변경해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedQuestions.map((question) => (
                <Card key={question.id} className={`hover:shadow-md transition-shadow ${!question.has_expert_answer ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {getCategoryName(question.category)}
                          </Badge>
                          <Badge className={getUrgencyColor(question.urgency)}>
                            {getUrgencyText(question.urgency)}
                          </Badge>
                          {!question.has_expert_answer && (
                            <Badge className="bg-orange-100 text-orange-800">
                              답변 대기
                            </Badge>
                          )}
                          {question.has_expert_answer && (
                            <Badge className="bg-green-100 text-green-800">
                              답변 완료
                            </Badge>
                          )}
                        </div>
                        
                        <Link href={`/expert/qna/${question.id}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer mb-2">
                            {question.title}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {question.content}
                        </p>
                        
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {question.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
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
                            <div className="flex items-center">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              답변 {question.answers_count}
                            </div>
                          </div>
                          
                          <Link href={`/expert/qna/${question.id}`}>
                            <Button size="sm" variant={question.has_expert_answer ? "outline" : "default"}>
                              {question.has_expert_answer ? '답변 보기' : '답변하기'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}