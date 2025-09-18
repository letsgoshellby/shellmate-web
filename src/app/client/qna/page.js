'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QnAAPI } from '@/lib/api/qna';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle,
  Heart,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientQnAPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  // 임시 데이터 (실제로는 API에서 가져올 데이터)
  const mockQuestions = [
    {
      id: 1,
      title: '6세 아이가 집중을 잘 못해요',
      content: '우리 아이가 한 가지 일에 집중하는 시간이 너무 짧습니다. 어떻게 도와줄 수 있을까요?',
      category: 'attention',
      author: {
        name: '김○○',
        type: 'client'
      },
      created_at: '2024-01-15T10:30:00Z',
      answers_count: 3,
      likes_count: 5,
      is_resolved: false,
      has_accepted_answer: false,
      tags: ['집중력', '주의력', '6세']
    },
    {
      id: 2,
      title: '언어 발달이 또래보다 늦는 것 같아요',
      content: '5세인데 아직 문장을 완전히 만들어서 말하지 못합니다. 언어치료를 받아야 할까요?',
      category: 'language',
      author: {
        name: '이○○',
        type: 'client'
      },
      created_at: '2024-01-14T15:20:00Z',
      answers_count: 2,
      likes_count: 8,
      is_resolved: true,
      has_accepted_answer: true,
      tags: ['언어발달', '언어치료', '5세']
    },
    {
      id: 3,
      title: '친구들과 어울리지 못하는 아이',
      content: '어린이집에서 혼자 노는 경우가 많다고 합니다. 사회성 발달을 위해 어떤 도움을 줄 수 있을까요?',
      category: 'social',
      author: {
        name: '박○○',
        type: 'client'
      },
      created_at: '2024-01-13T09:15:00Z',
      answers_count: 1,
      likes_count: 3,
      is_resolved: false,
      has_accepted_answer: false,
      tags: ['사회성', '친구관계', '어린이집']
    }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // 실제 API 호출 시
      // const data = await QnAAPI.getQuestions();
      // setQuestions(data.results);
      
      // 임시로 목 데이터 사용
      setQuestions(mockQuestions);
    } catch (error) {
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
      all: '전체'
    };
    return categories[category] || category;
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Q&A 커뮤니티</h1>
              <p className="text-gray-600">전문가에게 궁금한 점을 질문해보세요</p>
            </div>
            <Link href="/client/qna/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                질문하기
              </Button>
            </Link>
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
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
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
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="recent">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="answered">답변순</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 질문 목록 */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    질문이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    첫 번째 질문을 올려보세요!
                  </p>
                  <Link href="/client/qna/new">
                    <Button>질문하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                        
                        <Link href={`/client/qna/${question.id}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer mb-2">
                            {question.title}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {question.content}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {question.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <User className="mr-1 h-4 w-4" />
                            {question.author.name}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatDate(question.created_at)}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="mr-1 h-4 w-4" />
                            답변 {question.answers_count}
                          </div>
                          <div className="flex items-center">
                            <Heart className="mr-1 h-4 w-4" />
                            {question.likes_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* 페이지네이션 (나중에 구현) */}
          <div className="flex justify-center">
            <div className="text-sm text-gray-500">
              더 많은 질문을 보려면 페이지네이션을 구현해야 합니다
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}