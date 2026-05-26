'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnsAPI } from '@/lib/api/columns';
import { Search, Eye, Heart, BookOpen, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    loadColumns(1, sortBy, true);
  }, [sortBy]);

  const loadColumns = async (pageNum, ordering, reset = false) => {
    try {
      const data = await ColumnsAPI.getColumns({
        ordering,
        page: pageNum,
        page_size: 10,
        search: searchTerm || undefined,
      });
      const results = data.results ?? data;
      setColumns(reset ? results : (prev) => [...prev, ...results]);
      setHasMore(!!data.next);
    } catch (error) {
      toast.error('칼럼 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadColumns(1, sortBy, true);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadColumns(next, sortBy);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">전문가 칼럼</h1>
            <p className="text-gray-600">전문가들이 작성한 유익한 정보와 팁을 확인하세요</p>
          </div>

          {/* 검색 및 정렬 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="칼럼 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={handleSearch}>검색</Button>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="-created_at">최신순</option>
                  <option value="-view_count">조회순</option>
                  <option value="-sympathy_count">공감순</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 칼럼 목록 */}
          <div className="space-y-4">
            {columns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">칼럼이 없습니다</h3>
                  <p className="text-gray-600">다른 검색어를 입력해보세요</p>
                </CardContent>
              </Card>
            ) : (
              columns.map((column) => (
                <Card key={column.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/client/columns/${column.id}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer mb-1 truncate">
                            {column.title}
                          </h3>
                        </Link>
                        {column.content_preview && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {column.content_preview}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <User className="mr-1 h-4 w-4" />
                              {column.author?.nickname || column.author?.name}
                              {column.author?.specialty_display && (
                                <span className="ml-1 text-gray-400">({column.author.specialty_display})</span>
                              )}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDate(column.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Eye className="mr-1 h-4 w-4" />
                              {(column.view_count ?? 0).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <Heart className="mr-1 h-4 w-4" />
                              {column.sympathy_count ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore}>
                더 보기
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
