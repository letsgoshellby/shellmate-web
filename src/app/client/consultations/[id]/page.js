'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Phone, 
  Video, 
  MessageCircle,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { consultationAPI } from '@/lib/api/consultation';

const statusConfig = {
  pending: { label: '예약 대기', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  confirmed: { label: '예약 확정', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  in_progress: { label: '상담 진행중', color: 'bg-green-100 text-green-800', icon: Video },
  completed: { label: '상담 완료', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function ConsultationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultationDetail();
  }, [id]);

  const fetchConsultationDetail = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getConsultationDetail(id);
      setConsultation(data);
    } catch (err) {
      setError('상담 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConsultation = async () => {
    if (!confirm('정말로 상담을 취소하시겠습니까?')) return;
    
    try {
      await consultationAPI.cancelConsultation(id);
      await fetchConsultationDetail();
    } catch (err) {
      toast.error('상담 취소에 실패했습니다.');
    }
  };

  const handleJoinConsultation = () => {
    // 실제로는 화상상담 플랫폼으로 연결
    router.push(`/client/consultations/${id}/video`);
  };

  const handleWriteReview = () => {
    router.push(`/client/consultations/${id}/review`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">상담 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg text-red-600">{error || '상담 정보를 찾을 수 없습니다.'}</p>
            <Button 
              onClick={() => router.push('/client/consultations')}
              className="mt-4"
            >
              상담 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[consultation.status]?.icon || AlertCircle;
  const canCancel = ['pending', 'confirmed'].includes(consultation.status);
  const canJoin = consultation.status === 'confirmed' && new Date(consultation.scheduled_at) <= new Date();
  const canReview = consultation.status === 'completed' && !consultation.review;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/client/consultations')}
          className="mb-4"
        >
          ← 상담 목록으로
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">상담 상세 정보</h1>
          <Badge className={statusConfig[consultation.status]?.color}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusConfig[consultation.status]?.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 전문가 정보 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              담당 전문가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={consultation.expert.profile_image} />
                <AvatarFallback>{consultation.expert.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{consultation.expert.name}</h3>
                <p className="text-sm text-muted-foreground">{consultation.expert.title}</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm ml-1">{consultation.expert.rating}</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    ({consultation.expert.review_count}개 리뷰)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium">전문분야:</span>
                <span className="ml-2">{consultation.expert.specialties.join(', ')}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium">경력:</span>
                <span className="ml-2">{consultation.expert.experience_years}년</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium">학력:</span>
                <span className="ml-2">{consultation.expert.education}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상담 정보 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>상담 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 일정 정보 */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                일정
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">날짜:</span>
                  <p className="font-medium">
                    {new Date(consultation.scheduled_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">시간:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(consultation.scheduled_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} ({consultation.duration}분)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">상담 방식:</span>
                  <p className="font-medium flex items-center gap-1">
                    {consultation.consultation_type === 'video' ? (
                      <>
                        <Video className="w-4 h-4" />
                        화상 상담
                      </>
                    ) : consultation.consultation_type === 'phone' ? (
                      <>
                        <Phone className="w-4 h-4" />
                        전화 상담
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        채팅 상담
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">상담료:</span>
                  <p className="font-medium">{consultation.price.toLocaleString()}원</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 상담 내용 */}
            <div>
              <h4 className="font-semibold mb-3">상담 주제</h4>
              <p className="text-lg font-medium mb-2">{consultation.topic}</p>
              {consultation.description && (
                <div>
                  <span className="text-muted-foreground text-sm">상세 내용:</span>
                  <p className="mt-1 whitespace-pre-wrap">{consultation.description}</p>
                </div>
              )}
            </div>

            {/* 추가 정보 */}
            {consultation.child_info && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">아이 정보</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">나이:</span> {consultation.child_info.age}세</p>
                    <p><span className="font-medium">성별:</span> {consultation.child_info.gender}</p>
                    {consultation.child_info.concerns && (
                      <p><span className="font-medium">주요 고민:</span> {consultation.child_info.concerns}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* 액션 버튼들 */}
            <div className="flex gap-3 pt-4">
              {canJoin && (
                <Button onClick={handleJoinConsultation} className="flex-1">
                  <Video className="w-4 h-4 mr-2" />
                  상담 참여하기
                </Button>
              )}
              
              {canReview && (
                <Button onClick={handleWriteReview} variant="outline" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  리뷰 작성하기
                </Button>
              )}
              
              {canCancel && (
                <Button 
                  onClick={handleCancelConsultation} 
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  상담 취소하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 리뷰 표시 (이미 작성된 경우) */}
      {consultation.review && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              내가 작성한 리뷰
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= consultation.review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(consultation.review.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{consultation.review.content}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}