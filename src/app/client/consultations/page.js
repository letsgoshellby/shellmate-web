'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsultationsAPI } from '@/lib/api/consultations';
import {
  Calendar,
  Clock,
  User,
  Video,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  FileText,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  

  useEffect(() => {
    loadConsultations();
  }, [filter]);

  const loadConsultations = async () => {
    try {
      // 실제 API 호출
      const params = {};

      // 필터에 따라 상태값 설정
      if (filter === 'upcoming') {
        params.status = 'CONFIRMED';
      } else if (filter === 'completed') {
        params.status = 'COMPLETED';
      } else if (filter === 'cancelled') {
        params.status = 'CANCELLED';
      }

      const data = await ConsultationsAPI.getMyConsultations(params);
      const consultationList = Array.isArray(data) ? data : data.results || [];

      // 각 상담에 대해 상세 정보 조회 (sessions 데이터 포함)
      const detailedConsultations = await Promise.all(
        consultationList.map(async (consultation) => {
          try {
            const detail = await ConsultationsAPI.getCounselingRequestDetail(consultation.id);
            return detail;
          } catch (error) {
            console.error(`상담 ${consultation.id} 상세 조회 실패:`, error);
            return consultation; // 실패 시 원본 데이터 사용
          }
        })
      );

      setConsultations(detailedConsultations);
    } catch (error) {
      console.error('상담 목록 로딩 실패:', error);
      toast.error('상담 목록을 불러오는데 실패했습니다');
      // API 실패 시 빈 배열
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (consultationId) => {
    setSelectedConsultationId(consultationId);
    setCancellationReason('');
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedConsultationId(null);
    setCancellationReason('');
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('취소 사유를 입력해주세요');
      return;
    }

    try {
      await ConsultationsAPI.cancelConsultation(selectedConsultationId, cancellationReason);
      toast.success('상담이 취소되었습니다');
      closeCancelModal();
      loadConsultations();
    } catch (error) {
      console.error('상담 취소 실패:', error);
      toast.error('상담 취소에 실패했습니다');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'string') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === 'string') return '-';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (consultation) => {
    // status_display 우선 사용, 없으면 status 기반 변환
    return consultation.status_display || consultation.status || '알 수 없음';
  };

  const getStatusIcon = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return <AlertCircle className="h-4 w-4" />;
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isUpcoming = (scheduledAt) => {
    if (!scheduledAt) return false;
    const scheduledTime = new Date(scheduledAt).getTime();
    const now = Date.now();
    const fifteenMinutesAfter = scheduledTime + (15 * 60 * 1000);
    return now <= fifteenMinutesAfter;
  };

  const getSessionStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusText = (session) => {
    return session.status_display || session.status || '알 수 없음';
  };

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
              <h1 className="text-2xl font-bold text-gray-900">내 상담 관리</h1>
              <p className="text-gray-600">예약한 상담을 확인하고 관리하세요</p>
            </div>
            <Link href="/client/consultations/book">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 상담 예약
              </Button>
            </Link>
          </div>

          {/* 필터 탭 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'upcoming', label: '예정된 상담' },
                  { key: 'completed', label: '완료된 상담' },
                  { key: 'cancelled', label: '취소된 상담' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === key
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 상담 목록 */}
          <div className="space-y-4">
            {consultations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    상담 내역이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    전문가와의 첫 상담을 예약해보세요
                  </p>
                  <Link href="/client/consultations/book">
                    <Button>상담 예약하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              consultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* 상단: 상태 + 전문가 정보 */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(consultation.status)}>
                            {getStatusIcon(consultation.status)}
                            <span className="ml-1">{getStatusText(consultation)}</span>
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.session_type_display || '상담'}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{consultation.expert?.name || '-'}</span>
                          {consultation.expert?.specialty_display && (
                            <span className="text-gray-400">· {consultation.expert.specialty_display}</span>
                          )}
                        </div>
                      </div>
                      {/* <div className="text-sm font-medium text-gray-600">
                        {consultation.paid_amount?.toLocaleString() || 0} 에그
                      </div> */}
                    </div>

                    {/* 세션별 카드 */}
                    {consultation.sessions && consultation.sessions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">회차별 상담</h4>
                        {consultation.sessions.map((session, index) => (
                          <div key={session.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    {session.session_number || index + 1}회차 상담
                                  </h5>
                                  <Badge className={getSessionStatusColor(session.status)}>
                                    {getSessionStatusText(session)}
                                  </Badge>
                                </div>
                                {session.scheduled_at && (
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(session.scheduled_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatTime(session.scheduled_at)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                {/* 예정된 세션 - 상담 참여 버튼 */}
                                {session.status?.toUpperCase() === 'SCHEDULED' && isUpcoming(session.scheduled_at) && (
                                  <Link href={`/video-call/${session.id}`}>
                                    <Button size="sm" className="w-24">
                                      <Video className="mr-1 h-3.5 w-3.5" />
                                      상담 입장
                                    </Button>
                                  </Link>
                                )}

                                {/* 완료된 세션 - 상담 일지 + 커리큘럼 + 리뷰 */}
                                {session.status?.toUpperCase() === 'COMPLETED' && (
                                  <>
                                    <Link href={`/client/consultations/${consultation.id}/log?session=${session.id}`}>
                                      <Button size="sm" variant="outline" className="w-24">
                                        <FileText className="mr-1 h-3.5 w-3.5" />
                                        상담일지
                                      </Button>
                                    </Link>
                                    {/* 1회차 완료 + 다회성 상담 - 커리큘럼 버튼 */}
                                    {session.session_number === 1 && consultation.session_type !== 'SINGLE' && (
                                      <Link href={`/client/consultations/${consultation.id}/curriculum`}>
                                        <Button size="sm" variant="outline" className="w-24">
                                          <BookOpen className="mr-1 h-3.5 w-3.5" />
                                          커리큘럼
                                        </Button>
                                      </Link>
                                    )}
                                    {/* 마지막 세션 완료 시 리뷰 버튼 */}
                                    {index === consultation.sessions.length - 1 && !consultation.rating && (
                                      <Link href={`/client/consultations/${consultation.id}/review`}>
                                        <Button size="sm" variant="outline" className="w-24">
                                          <Star className="mr-1 h-3.5 w-3.5" />
                                          리뷰
                                        </Button>
                                      </Link>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 취소 버튼 */}
                    {['PENDING', 'CONFIRMED'].includes(consultation.status?.toUpperCase()) && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCancelModal(consultation.id)}
                        >
                          상담 취소
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* 상담 취소 모달 */}
        {cancelModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">상담 취소</h3>
              <p className="text-sm text-gray-600 mb-4">
                상담을 취소하시는 이유를 입력해주세요.
              </p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={closeCancelModal}
                >
                  닫기
                </Button>
                <Button
                  onClick={handleCancel}
                  className="bg-red-600 hover:bg-red-700"
                >
                  취소하기
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}