'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReviewAPI } from '@/lib/api/review';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function NewReviewPage({ params }) {
  const unwrappedParams = use(params);
  const expertId = parseInt(unwrappedParams.id);
  const router = useRouter();

  const [completedConsultations, setCompletedConsultations] = useState([]);
  const [selectedCounselingRequest, setSelectedCounselingRequest] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompletedConsultations();
  }, []);

  const loadCompletedConsultations = async () => {
    try {
      const data = await ConsultationsAPI.getMyConsultations({ status: 'COMPLETED' });
      const list = Array.isArray(data) ? data : data.results || [];
      const filtered = list.filter(c => c.expert?.id === expertId || c.expert === expertId);
      setCompletedConsultations(filtered);
      if (filtered.length === 1) {
        setSelectedCounselingRequest(String(filtered[0].id));
      }
    } catch (error) {
      console.error('상담 목록 로딩 실패:', error);
      toast.error('상담 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCounselingRequest) {
      toast.error('리뷰를 작성할 상담을 선택해주세요');
      return;
    }
    if (rating === 0) {
      toast.error('별점을 선택해주세요');
      return;
    }
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      await ReviewAPI.createReview({
        counseling_request: parseInt(selectedCounselingRequest),
        title: title.trim(),
        content: content.trim(),
        rating,
      });
      toast.success('리뷰가 등록되었습니다');
      router.push(`/client/experts/${expertId}/reviews`);
    } catch (error) {
      const msg = error.response?.data?.detail || '리뷰 등록에 실패했습니다';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href={`/client/experts/${expertId}/reviews`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">리뷰 작성</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상담 리뷰 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 상담 선택 */}
              {completedConsultations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>리뷰를 작성할 수 있는 완료된 상담이 없습니다.</p>
                </div>
              ) : (
                <>
                  {completedConsultations.length > 1 && (
                    <div className="space-y-2">
                      <Label>상담 선택 *</Label>
                      <select
                        value={selectedCounselingRequest}
                        onChange={(e) => setSelectedCounselingRequest(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">상담을 선택해주세요</option>
                        {completedConsultations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title || `상담 #${c.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 별점 */}
                  <div className="space-y-2">
                    <Label>별점 *</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                          {['', '별로예요', '아쉬워요', '괜찮아요', '좋아요', '최고예요'][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      placeholder="리뷰 제목을 입력해주세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* 내용 */}
                  <div className="space-y-2">
                    <Label htmlFor="content">내용 *</Label>
                    <Textarea
                      id="content"
                      placeholder="상담 경험을 자세히 작성해주세요"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right">{content.length}자</p>
                  </div>

                  {/* 제출 */}
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      '리뷰 등록하기'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
