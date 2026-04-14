'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IoChatbubbleEllipses, IoDocumentText, IoVideocam, IoPeople, IoTrendingUp, IoTime, IoStar } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { ReviewAPI } from '@/lib/api/review';
import { AuthAPI } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingModal } from '@/components/expert/OnboardingModal';

export default function ExpertDashboard() {
  const { user } = useAuth();
  const [todayConsultations, setTodayConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    loadTodayConsultations();
    loadRecentReviews();
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    // localStorage에서 온보딩 완료 여부 확인
    const onboardingCompleted = localStorage.getItem('expert_onboarding_completed');
    if (onboardingCompleted === 'true') {
      return; // 이미 완료됨
    }

    try {
      // 1. user/me에서 자기소개 작성 여부 확인
      const userData = await AuthAPI.getCurrentUser();
      const expertProfile = userData.expert_profile || {};

      const hasIntroduction = expertProfile.introduction && expertProfile.introduction.trim() !== '';
      const hasEducation = Array.isArray(expertProfile.education) && expertProfile.education.length > 0;
      const hasCareer = Array.isArray(expertProfile.career) && expertProfile.career.length > 0;
      const profileCompleted = hasIntroduction && hasEducation && hasCareer;

      // 2. 가격 설정 여부 확인
      const pricings = await ConsultationsAPI.getMyPricing();
      const hasPricing = Array.isArray(pricings) && pricings.length > 0;

      // 3. 둘 다 완료되었으면 localStorage에 저장
      if (profileCompleted && hasPricing) {
        localStorage.setItem('expert_onboarding_completed', 'true');
        return;
      }

      // 4. 완료되지 않았으면 팝업 표시
      setShowOnboardingModal(true);
    } catch (error) {
      console.error('온보딩 상태 확인 실패:', error);
    }
  };

  const loadTodayConsultations = async () => {
    try {
      // CONFIRMED 상태의 상담 가져오기
      const data = await ConsultationsAPI.getMyConsultations();
      const consultationList = Array.isArray(data) ? data : data.results || [];

      // 오늘 날짜 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // CONFIRMED 상태이거나 next_session이 SCHEDULED인 경우, 오늘 예정된 상담만 필터링
      const todaySessions = consultationList.filter(c => {
        const isRelevant =
          c.status?.toUpperCase() === 'CONFIRMED' ||
          c.next_session?.status?.toUpperCase() === 'SCHEDULED';
        if (!isRelevant) return false;
        if (!c.next_session?.scheduled_at) return false;

        const sessionDate = new Date(c.next_session.scheduled_at);
        return sessionDate >= today && sessionDate < tomorrow;
      });

      // 시간순 정렬
      const sorted = todaySessions.sort((a, b) =>
        new Date(a.next_session.scheduled_at) - new Date(b.next_session.scheduled_at)
      );

      setTodayConsultations(sorted);
    } catch (error) {
      console.error('오늘의 상담 로딩 실패:', error);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const loadRecentReviews = async () => {
    if (!user?.id) return;

    try {
      // 현재 전문가에게 작성된 리뷰 가져오기
      const data = await ReviewAPI.getReviews({ expert_id: user.id });
      const reviewList = Array.isArray(data) ? data : data.results || [];

      // 최신순 정렬 후 최대 3개만
      const sorted = reviewList
        .filter(r => !r.is_deleted)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);

      setRecentReviews(sorted);
    } catch (error) {
      console.error('리뷰 로딩 실패:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
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
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        {/* 온보딩 모달 */}
        {showOnboardingModal && (
          <OnboardingModal onClose={() => setShowOnboardingModal(false)} />
        )}

        <div className="space-y-6">
          {/* 환영 메시지 */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">안녕하세요, 전문가님!</h1>
            <p className="opacity-90">
              오늘도 많은 가정에 도움을 주시는 소중한 활동을 해주셔서 감사합니다.
            </p>
          </div>
          
          {/* 통계 카드들
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">대기 중인 질문</CardTitle>
                <IoChatbubbleEllipses className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-muted-foreground">
                  답변을 기다리는 질문
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 상담</CardTitle>
                <IoVideocam className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-muted-foreground">
                  완료된 상담 세션
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">도움받은 가정</CardTitle>
                <IoPeople className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">23</div>
                <p className="text-xs text-muted-foreground">
                  이번 달 상담한 가정 수
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">만족도 평균</CardTitle>
                <IoTrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">4.8</div>
                <p className="text-xs text-muted-foreground">
                  5점 만점 기준
                </p>
              </CardContent>
            </Card>
          </div>
           */}
          {/* 빠른 액션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/qna">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoChatbubbleEllipses className="mr-2 h-5 w-5" />
                    Q&A 답변하기
                  </CardTitle>
                  <CardDescription>
                    대기 중인 질문에 답변해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">답변하러 가기</Button>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/columns">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoDocumentText className="mr-2 h-5 w-5" />
                    칼럼 작성하기
                  </CardTitle>
                  <CardDescription>
                    유익한 정보를 칼럼으로 공유해보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">칼럼 작성</Button>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/consultations">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoVideocam className="mr-2 h-5 w-5" />
                    상담 일정 관리
                  </CardTitle>
                  <CardDescription>
                    상담 예약과 일정을 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">일정 관리</Button>
                </CardContent>
              </Link>
            </Card>
          </div>
          
          {/* 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>최근 리뷰 확인</CardTitle>
                <CardDescription>최근에 작성된 리뷰를 확인해보세요</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-4 flex-1">
                  {loadingReviews ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentReviews.length > 0 ? (
                    recentReviews.map((review) => (
                      <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium line-clamp-1 flex-1">
                            {review.title}
                          </h4>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                          {review.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {review.client_name || '익명'} • {formatRelativeTime(review.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground">
                        아직 작성된 리뷰가 없습니다
                      </p>
                    </div>
                  )}
                </div>
                <Link href="/expert/reviews" className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    모든 리뷰 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>오늘의 상담 일정</CardTitle>
                <CardDescription>오늘 예정된 상담 세션입니다</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-4 flex-1">
                  {loadingConsultations ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : todayConsultations.length > 0 ? (
                    todayConsultations.map((consultation, index) => {
                      const now = Date.now();
                      const sessionTime = new Date(consultation.next_session.scheduled_at).getTime();
                      const fifteenMinutesAfter = sessionTime + (15 * 60 * 1000);
                      const canJoin = now <= fifteenMinutesAfter; // 시작 시간 15분 후까지 참여 가능
                      const isPast = now > fifteenMinutesAfter;

                      return (
                        <div key={consultation.id} className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            isPast ? 'bg-gray-400' : index === 0 ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">
                              {consultation.client?.name || '내담자'} 상담
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              <IoTime className="w-3 h-3 inline mr-1" />
                              {formatTime(consultation.next_session.scheduled_at)}
                            </p>
                          </div>
                          {canJoin && consultation.next_session?.id && (
                            <Link href={`/video-call/${consultation.next_session.id}`}>
                              <Button size="sm" variant="outline">참여</Button>
                            </Link>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground">
                        오늘 예정된 상담이 없습니다
                      </p>
                    </div>
                  )}
                </div>
                <Link href="/expert/consultations" className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    전체 일정 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}