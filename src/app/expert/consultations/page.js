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
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, upcoming, completed, cancelled
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    loadConsultations();
  }, [filter]);

  const loadConsultations = async () => {
    try {
      const params = {};

      // 필터에 따라 상태값 설정
      if (filter === 'pending') {
        params.status = 'PENDING';
      } else if (filter === 'upcoming') {
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

  const handleApprove = async (consultationId) => {
    if (!confirm('이 상담을 승인하시겠습니까?')) return;

    try {
      await ConsultationsAPI.approveConsultation(consultationId);
      toast.success('상담이 승인되었습니다');
      loadConsultations();
    } catch (error) {
      console.error('상담 승인 실패:', error);
      toast.error('상담 승인에 실패했습니다');
    }
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
    const fifteenMinutesAfter = scheduledTime + (15 * 60 * 1000); // 시작 시간 + 15분

    // 시작 시간 15분 후까지 참여 가능
    return now <= fifteenMinutesAfter;
  };

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상담 관리</h1>
            <p className="text-gray-600">내담자의 상담 신청을 확인하고 관리하세요</p>
          </div>

          {/* 필터 탭 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'pending', label: '접수된 상담' },
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
                  <p className="text-gray-600">
                    내담자의 상담 신청을 기다려주세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              consultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getStatusColor(consultation.status)}>
                            {getStatusIcon(consultation.status)}
                            <span className="ml-1">{getStatusText(consultation)}</span>
                          </Badge>
                          {consultation.status?.toUpperCase() === 'CONFIRMED' && isUpcoming(consultation.next_session?.scheduled_at) && (
                            <Badge className="bg-green-100 text-green-800">
                              <Calendar className="mr-1 h-3 w-3" />
                              다가오는 상담
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {consultation.session_type_display || '상담'}
                          {consultation.curriculum_title && ` - ${consultation.curriculum_title}`}
                        </h3>

                        <p className="text-gray-600 mb-4 text-sm">
                          {consultation.completed_sessions > 0 ? `${consultation.completed_sessions}/${consultation.pricing?.total_sessions || 0} 회기 완료` : '상담 시작 전'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">{consultation.client?.name || '-'}</span>
                              <span className="text-gray-500 ml-1 text-sm">({consultation.client?.email || '-'})</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {formatDate(
                                consultation.next_session?.scheduled_at ||
                                consultation.sessions?.[0]?.scheduled_at ||
                                consultation.created_at
                              ) || '-'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>
                              {formatTime(
                                consultation.next_session?.scheduled_at ||
                                consultation.sessions?.[0]?.scheduled_at
                              ) || '미정'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              상담 금액: {consultation.paid_amount?.toLocaleString() || 0} 에그
                            </span>
                          </div>
                        </div>

                        {consultation.client_notes && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-900">내담자 요청사항:</span>
                            </div>
                            <p className="text-sm text-blue-800">{consultation.client_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {/* 접수된 상담 (PENDING) - 승인/취소 버튼 */}
                        {consultation.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(consultation.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCancelModal(consultation.id)}
                            >
                              취소
                            </Button>
                          </>
                        )}

                        {/* 예정된 상담 (CONFIRMED) - 참여/취소 버튼 */}
                        {consultation.status?.toUpperCase() === 'CONFIRMED' && (
                          <>
                            {consultation.next_session?.id
                            && consultation.next_session?.scheduled_at
                            && isUpcoming(consultation.next_session.scheduled_at) && (
                              <Link href={`/video-call/${consultation.next_session.id}`}>
                                <Button size="sm">
                                  <Video className="mr-1 h-4 w-4" />
                                  상담 참여
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCancelModal(consultation.id)}
                            >
                              취소
                            </Button>
                          </>
                        )}

                        {/* 완료된 상담 (COMPLETED) - 상담 일지 작성 버튼 */}
                        {consultation.status?.toUpperCase() === 'COMPLETED' && (
                          <Link href={`/expert/consultations/${consultation.id}/log`}>
                            <Button size="sm" variant="outline">
                              <FileText className="mr-1 h-4 w-4" />
                              상담 일지 작성
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
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
