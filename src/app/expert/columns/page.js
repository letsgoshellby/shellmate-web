'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ColumnsAPI } from '@/lib/api/columns';
import { 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye, 
  Heart,
  Clock,
  BookOpen,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState({
    total_columns: 0,
    total_views: 0,
    total_likes: 0,
    avg_reading_time: 0
  });
  
  // 임시 데이터
  const mockColumns = [
    {
      id: 1,
      title: '6세 아이의 집중력 향상을 위한 5가지 방법',
      excerpt: '집중력이 부족한 아이들을 위한 실용적인 해결책을 소개합니다. 가정에서 쉽게 적용할 수 있는 방법들을 전문가의 시각에서 설명드립니다.',
      category: 'attention',
      status: 'published', // draft, published, archived
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      published_at: '2024-01-15T10:30:00Z',
      views_count: 1250,
      likes_count: 45,
      comments_count: 12,
      reading_time: 5,
      tags: ['집중력', '육아팁', 'ADHD', '아동발달'],
      is_featured: true
    },
    {
      id: 2,
      title: 'ADHD 아동을 위한 학습 환경 조성법',
      excerpt: 'ADHD 진단을 받은 아이들이 효과적으로 학습할 수 있는 환경을 만드는 구체적인 방법들을 알아보세요.',
      category: 'attention',
      status: 'published',
      created_at: '2024-01-12T14:20:00Z',
      updated_at: '2024-01-12T14:20:00Z',
      published_at: '2024-01-12T14:20:00Z',
      views_count: 890,
      likes_count: 32,
      comments_count: 8,
      reading_time: 7,
      tags: ['ADHD', '학습환경', '특수교육'],
      is_featured: false
    },
    {
      id: 3,
      title: '감정 조절 능력 기르기',
      excerpt: '아이의 감정 조절 능력을 키우는 방법에 대해 설명합니다.',
      category: 'emotion',
      status: 'draft',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-14T16:45:00Z',
      published_at: null,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      reading_time: 6,
      tags: ['감정조절', '정서발달'],
      is_featured: false
    }
  ];

  const mockStats = {
    total_columns: 15,
    total_views: 12450,
    total_likes: 340,
    avg_reading_time: 6
  };

  useEffect(() => {
    loadMyColumns();
    loadStats();
  }, [sortBy, selectedCategory]);

  const loadMyColumns = async () => {
    try {
      // 실제 API 호출 시
      // const data = await ColumnsAPI.getMyColumns({
      //   category: selectedCategory !== 'all' ? selectedCategory : undefined,
      //   ordering: sortBy === 'recent' ? '-created_at' : sortBy === 'popular' ? '-views_count' : '-likes_count'
      // });
      // setColumns(data.results);
      
      // 임시로 목 데이터 사용
      let filteredData = [...mockColumns];
      
      if (selectedCategory !== 'all') {
        filteredData = filteredData.filter(col => col.category === selectedCategory);
      }
      
      if (sortBy === 'popular') {
        filteredData.sort((a, b) => b.views_count - a.views_count);
      } else if (sortBy === 'liked') {
        filteredData.sort((a, b) => b.likes_count - a.likes_count);
      }
      
      setColumns(filteredData);
    } catch (error) {
      toast.error('칼럼 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // const data = await ColumnsAPI.getMyStats();
      // setStats(data);
      
      setStats(mockStats);
    } catch (error) {
    }
  };

  const handleDelete = async (columnId) => {
    if (!confirm('정말로 이 칼럼을 삭제하시겠습니까?')) return;
    
    try {
      // await ColumnsAPI.deleteColumn(columnId);
      setColumns(columns.filter(col => col.id !== columnId));
      toast.success('칼럼이 삭제되었습니다');
    } catch (error) {
      toast.error('칼럼 삭제에 실패했습니다');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
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
      development: '발달전반',
      parenting: '육아정보',
      all: '전체'
    };
    return categories[category] || category;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return '게시됨';
      case 'draft': return '초안';
      case 'archived': return '보관됨';
      default: return '알 수 없음';
    }
  };

  const filteredColumns = columns.filter(column => 
    column.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    column.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-gray-900">내 칼럼 관리</h1>
              <p className="text-gray-600">작성한 칼럼을 관리하고 새로운 칼럼을 작성하세요</p>
            </div>
            <Link href="/expert/columns/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 칼럼 작성
              </Button>
            </Link>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 칼럼 수</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total_columns}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 조회수</p>
                    <p className="text-2xl font-bold text-green-600">{stats.total_views.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 좋아요</p>
                    <p className="text-2xl font-bold text-red-600">{stats.total_likes}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 읽기 시간</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.avg_reading_time}분</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
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
                      placeholder="칼럼 검색..."
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
                    <option value="emotion">정서발달</option>
                    <option value="development">발달전반</option>
                    <option value="parenting">육아정보</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="recent">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="liked">좋아요순</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 칼럼 목록 */}
          <div className="space-y-4">
            {filteredColumns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    칼럼이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    첫 번째 칼럼을 작성해보세요!
                  </p>
                  <Link href="/expert/columns/new">
                    <Button>칼럼 작성하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredColumns.map((column) => (
                <Card key={column.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {getCategoryName(column.category)}
                          </Badge>
                          <Badge className={getStatusColor(column.status)}>
                            {getStatusText(column.status)}
                          </Badge>
                          {column.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              추천
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {column.reading_time}분 읽기
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {column.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {column.excerpt}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {column.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {column.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{column.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              작성: {formatDate(column.created_at)}
                            </div>
                            {column.published_at && (
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                발행: {formatDate(column.published_at)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Eye className="mr-1 h-4 w-4" />
                              {column.views_count.toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <Heart className="mr-1 h-4 w-4" />
                              {column.likes_count}
                            </div>
                            <div className="flex items-center">
                              <BarChart3 className="mr-1 h-4 w-4" />
                              {column.comments_count}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {column.status === 'published' && (
                          <Link href={`/client/columns/${column.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1 h-4 w-4" />
                              보기
                            </Button>
                          </Link>
                        )}
                        <Link href={`/expert/columns/${column.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="mr-1 h-4 w-4" />
                            수정
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(column.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          삭제
                        </Button>
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