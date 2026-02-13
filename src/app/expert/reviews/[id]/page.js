'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReviewAPI } from '@/lib/api/review';
import { ArrowLeft, Loader2, Calendar, User } from 'lucide-react';
import { IoStar } from 'react-icons/io5';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const data = await ReviewAPI.getReview(reviewId);
      setReview(data);
    } catch (error) {
      console.error('리뷰 로딩 실패:', error);
      toast.error('리뷰를 불러오는데 실패했습니다');
      router.push('/expert/reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <IoStar
            key={star}
            className={`h-6 w-6 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 5:
        return '매우 만족';
      case 4:
        return '만족';
      case 3:
        return '보통';
      case 2:
        return '불만족';
      case 1:
        return '매우 불만족';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!review) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">리뷰를 찾을 수 없습니다</p>
            <Link href="/expert/reviews">
              <Button className="mt-4">리뷰 목록으로</Button>
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 뒤로가기 버튼 */}
          <div>
            <Link href="/expert/reviews">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                리뷰 목록으로
              </Button>
            </Link>
          </div>

          {/* 리뷰 상세 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    <Badge variant="secondary" className="text-sm">
                      {getRatingText(review.rating)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-4">
                    {review.title}
                  </CardTitle>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{review.client_name || '익명'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(review.created_at)}</span>
                </div>
                {review.counseling_request_id && (
                  <Badge variant="outline">
                    상담 ID: {review.counseling_request_id}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* 리뷰 내용 */}
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {review.content}
                  </p>
                </div>
              </div>

              {/* 수정 시간 표시 */}
              {review.updated_at && review.updated_at !== review.created_at && (
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  마지막 수정: {formatDate(review.updated_at)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>리뷰 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">작성자</p>
                  <p className="font-medium">{review.client_name || '익명'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">평점</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{review.rating}</span>
                    <span className="text-muted-foreground">/ 5.0</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">작성일</p>
                  <p className="font-medium">{formatDate(review.created_at)}</p>
                </div>
                {review.counseling_request_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">관련 상담</p>
                    <p className="font-medium">상담 #{review.counseling_request_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 하단 액션 버튼 */}
          <div className="flex justify-between">
            <Link href="/expert/reviews">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
