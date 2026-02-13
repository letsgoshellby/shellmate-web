'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ReviewAPI } from '@/lib/api/review';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';
import { IoStar } from 'react-icons/io5';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadReviews();
  }, [user]);

  const loadReviews = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await ReviewAPI.getReviews({ expert_id: user.id });
      const reviewList = Array.isArray(data) ? data : data.results || [];

      // 삭제되지 않은 리뷰만 필터링하고 최신순 정렬
      const filtered = reviewList
        .filter(r => !r.is_deleted)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setReviews(filtered);
    } catch (error) {
      console.error('리뷰 로딩 실패:', error);
      toast.error('리뷰를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <IoStar
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 필터링된 리뷰
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
  });

  // 페이지네이션
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 평균 별점 계산
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // 별점별 개수
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">리뷰 관리</h1>
            <p className="text-gray-600 mt-2">
              내담자들이 작성한 리뷰를 확인하세요
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">총 리뷰</p>
                  <p className="text-3xl font-bold">{reviews.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">평균 별점</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold text-yellow-500">{averageRating}</p>
                    <IoStar className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">5점 리뷰</p>
                  <p className="text-3xl font-bold text-green-600">{ratingCounts[5]}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">이번 달</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {reviews.filter(r => {
                      const reviewDate = new Date(r.created_at);
                      const now = new Date();
                      return reviewDate.getMonth() === now.getMonth() &&
                             reviewDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 검색 및 필터 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="리뷰 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md bg-white"
                  >
                    <option value="all">모든 별점</option>
                    <option value="5">⭐ 5점</option>
                    <option value="4">⭐ 4점</option>
                    <option value="3">⭐ 3점</option>
                    <option value="2">⭐ 2점</option>
                    <option value="1">⭐ 1점</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 리뷰 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>리뷰 목록 ({filteredReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : currentReviews.length > 0 ? (
                <div className="space-y-4">
                  {currentReviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/expert/reviews/${review.id}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                              {review.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-2 mb-3">
                              {review.content}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {review.client_name || '익명'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || ratingFilter !== 'all'
                      ? '검색 결과가 없습니다'
                      : '아직 작성된 리뷰가 없습니다'}
                  </p>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
