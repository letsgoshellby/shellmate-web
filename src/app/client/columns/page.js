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
  Clock, 
  User, 
  Eye, 
  Heart,
  BookOpen,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [featuredColumns, setFeaturedColumns] = useState([]);
  
  // 임시 데이터
  const mockColumns = [
    {
      id: 1,
      title: '6세 아이의 집중력 향상을 위한 5가지 방법',
      excerpt: '집중력이 부족한 아이들을 위한 실용적인 해결책을 소개합니다. 가정에서 쉽게 적용할 수 있는 방법들을 전문가의 시각에서 설명드립니다.',
      content: '...',
      category: 'attention',
      author: {
        id: 2,
        name: '김전문가',
        title: '아동발달 전문가',
        profile_image: null,
        expertise: ['집중력', '주의력', 'ADHD']
      },
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      views_count: 1250,
      likes_count: 45,
      is_liked: false,
      is_featured: true,
      reading_time: 5,
      tags: ['집중력', '육아팁', 'ADHD', '아동발달'],
      thumbnail: null
    },
    {
      id: 2,
      title: '언어 발달 지연, 언제 전문가를 찾아야 할까?',
      excerpt: '아이의 언어 발달이 걱정되시나요? 정상 발달과 지연을 구분하는 기준과 전문가 상담 시기에 대해 알아보세요.',
      content: '...',
      category: 'language',
      author: {
        id: 3,
        name: '이언어치료사',
        title: '언어치료사',
        profile_image: null,
        expertise: ['언어발달', '언어치료', '의사소통']
      },
      created_at: '2024-01-14T14:20:00Z',
      updated_at: '2024-01-14T14:20:00Z',
      views_count: 890,
      likes_count: 32,
      is_liked: false,
      is_featured: false,
      reading_time: 7,
      tags: ['언어발달', '언어치료', '전문가상담'],
      thumbnail: null
    },
    {
      id: 3,
      title: '사회성 발달을 위한 놀이 활동 추천',
      excerpt: '또래와 어울리기 어려워하는 아이들을 위한 사회성 발달 놀이를 소개합니다. 집에서도 쉽게 할 수 있는 활동들입니다.',
      content: '...',
      category: 'social',
      author: {
        id: 4,
        name: '박놀이치료사',
        title: '놀이치료사',
        profile_image: null,
        expertise: ['사회성', '놀이치료', '또래관계']
      },
      created_at: '2024-01-13T16:45:00Z',
      updated_at: '2024-01-13T16:45:00Z',
      views_count: 670,
      likes_count: 28,
      is_liked: true,
      is_featured: false,
      reading_time: 6,
      tags: ['사회성', '놀이활동', '또래관계'],
      thumbnail: null
    }
  ];

  useEffect(() => {
    loadColumns();
    loadFeaturedColumns();
  }, [sortBy, selectedCategory]);

  const loadColumns = async () => {
    try {
      // 실제 API 호출 시
      // const data = await ColumnsAPI.getColumns({
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

  const loadFeaturedColumns = async () => {
    try {
      // const data = await ColumnsAPI.getPopularColumns({ limit: 3 });
      // setFeaturedColumns(data.results);
      
      setFeaturedColumns(mockColumns.filter(col => col.is_featured));
    } catch (error) {
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
      development: '발달전반',
      parenting: '육아정보',
      all: '전체'
    };
    return categories[category] || category;
  };

  const filteredColumns = columns.filter(column => 
    column.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    column.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-gray-900">전문가 칼럼</h1>
              <p className="text-gray-600">전문가들이 작성한 유익한 정보와 팁을 확인하세요</p>
            </div>
          </div>

          {/* 추천 칼럼 섹션 */}
          {featuredColumns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                이주의 추천 칼럼
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredColumns.map((column) => (
                  <Card key={column.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                      <Badge className="bg-blue-100 text-blue-800 mb-3">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        추천
                      </Badge>
                      <Link href={`/client/columns/${column.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer mb-2 line-clamp-2">
                          {column.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {column.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{column.author.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            {column.views_count.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Heart className="mr-1 h-3 w-3" />
                            {column.likes_count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
                  <p className="text-gray-600">
                    다른 카테고리를 선택하거나 검색어를 변경해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredColumns.map((column) => (
                <Card key={column.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* 썸네일 영역 (나중에 이미지 추가) */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                {getCategoryName(column.category)}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {column.reading_time}분 읽기
                              </span>
                            </div>
                            
                            <Link href={`/client/columns/${column.id}`}>
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-primary cursor-pointer mb-2">
                                {column.title}
                              </h3>
                            </Link>
                            
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
                                  <User className="mr-1 h-4 w-4" />
                                  <span className="font-medium">{column.author.name}</span>
                                  <span className="ml-1">({column.author.title})</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  {formatDate(column.created_at)}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Eye className="mr-1 h-4 w-4" />
                                  {column.views_count.toLocaleString()}
                                </div>
                                <div className="flex items-center">
                                  <Heart className={`mr-1 h-4 w-4 ${column.is_liked ? 'fill-current text-red-500' : ''}`} />
                                  {column.likes_count}
                                </div>
                              </div>
                            </div>
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
              더 많은 칼럼을 보려면 페이지네이션을 구현해야 합니다
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}