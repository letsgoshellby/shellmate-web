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
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings
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
  const [expandedChildInfo, setExpandedChildInfo] = useState({});
  const [childInfoData, setChildInfoData] = useState({});

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
      } else if (filter === 'cancelled') {
        params.status = 'CANCELLED';
      }
      // completed 필터는 COMPLETED와 WAITING_CURRICULUM 모두 포함

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

      // completed 필터인 경우 COMPLETED와 WAITING_CURRICULUM 상태만 필터링
      let filteredConsultations = detailedConsultations;
      if (filter === 'completed') {
        filteredConsultations = detailedConsultations.filter(consultation => {
          const status = consultation.status?.toUpperCase();
          return status === 'COMPLETED' || status === 'WAITING_CURRICULUM';
        });
      }

      setConsultations(filteredConsultations);
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

  const toggleChildInfo = async (consultationId) => {
    // 이미 펼쳐져 있으면 닫기
    if (expandedChildInfo[consultationId]) {
      setExpandedChildInfo(prev => ({ ...prev, [consultationId]: false }));
      return;
    }

    // 데이터가 없으면 API 호출
    if (!childInfoData[consultationId]) {
      try {
        const data = await ConsultationsAPI.getChildInfo(consultationId);
        setChildInfoData(prev => ({ ...prev, [consultationId]: data }));
      } catch (error) {
        console.error('아이 정보 조회 실패:', error);
        if (error.response?.status === 404) {
          toast.error('등록된 아이 정보가 없습니다');
        } else {
          toast.error('아이 정보를 불러오는데 실패했습니다');
        }
        return;
      }
    }

    // 펼치기
    setExpandedChildInfo(prev => ({ ...prev, [consultationId]: true }));
  };

  // 한글 매핑 함수들 (Dart 코드와 동일한 매핑)
  const getGenderText = (gender) => {
    switch (gender) {
      case 'male': return '남';
      case 'female': return '여';
      default: return gender || '-';
    }
  };

  const getChildOrderText = (order) => {
    switch (order) {
      case 'first': return '첫째';
      case 'second': return '둘째';
      case 'third_or_more': return '셋째 이상';
      default: return order || '-';
    }
  };

  const getLearningProblemText = (problems) => {
    if (!problems || problems.length === 0) return '없음';
    return problems.map(e => {
      switch (e) {
        case 'none': return '없음';
        case 'reading': return '읽기';
        case 'writing': return '쓰기';
        case 'math': return '수학';
        case 'other': return '기타';
        default: return e;
      }
    }).join(', ');
  };

  const getSensoryProcessingText = (problems) => {
    if (!problems || problems.length === 0) return '없음';
    return problems.map(e => {
      switch (e) {
        case 'none': return '없음';
        case 'sound': return '소리';
        case 'touch': return '촉각';
        case 'other': return '기타';
        default: return e;
      }
    }).join(', ');
  };

  const getEmotionalAnxietyText = (problems) => {
    if (!problems || problems.length === 0) return '없음';
    return problems.map(e => {
      switch (e) {
        case 'obsessive_compulsive': return '강박';
        case 'tic': return '틱';
        case 'social_anxiety': return '사회불안';
        case 'other': return '기타';
        default: return e;
      }
    }).join(', ');
  };

  const formatBirthDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      case 'WAITING_CURRICULUM': return 'bg-yellow-100 text-yellow-800';
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

  // 세션 상태 관련 함수
  const getSessionStatusColor = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
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

          {/* 일정 관리 버튼 */}
          <div className="flex justify-end">
            <Link href="/expert/consultations/availability">
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                상담 일정 관리
              </Button>
            </Link>
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
                          {consultation.sessions?.[0] ? (
                            <span>세션 상태: <span className={`font-medium ${
                              consultation.sessions[0].status?.toUpperCase() === 'COMPLETED' ? 'text-green-600' :
                              consultation.sessions[0].status?.toUpperCase() === 'NO_SHOW' ? 'text-orange-600' :
                              consultation.sessions[0].status?.toUpperCase() === 'CANCELLED' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>{getSessionStatusText(consultation.sessions[0])}</span></span>
                          ) : '상담 시작 전'}
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

                          {/* <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              상담 금액: {consultation.paid_amount?.toLocaleString() || 0} 에그
                            </span>
                          </div> */}
                        </div>

                        {consultation.client_notes && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-900">내담자 메모:</span>
                            </div>
                            <p className="text-sm text-blue-800">{consultation.client_notes}</p>
                          </div>
                        )}

                        {/* 아이 정보 아코디언 */}
                        <div className="border rounded-lg mb-4">
                          <button
                            onClick={() => toggleChildInfo(consultation.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              아이 정보
                            </span>
                            {expandedChildInfo[consultation.id] ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>

                          {expandedChildInfo[consultation.id] && childInfoData[consultation.id] && (
                            <div className="border-t p-4 bg-gray-50">
                              {childInfoData[consultation.id].child_info ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-xs text-gray-500">성별</span>
                                      <p className="text-sm font-medium">{getGenderText(childInfoData[consultation.id].child_info.gender)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">출생일</span>
                                      <p className="text-sm font-medium">{formatBirthDate(childInfoData[consultation.id].child_info.birth_date)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">형재자매</span>
                                      <p className="text-sm font-medium">{getChildOrderText(childInfoData[consultation.id].child_info.child_order)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">관련검사 실행 여부</span>
                                      <p className="text-sm font-medium">{childInfoData[consultation.id].child_info.psychological_test_conducted ? '예' : '아니오'}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-xs text-gray-500">학습 문제</span>
                                    <p className="text-sm font-medium">{getLearningProblemText(childInfoData[consultation.id].child_info.learning_problem)}</p>
                                    {childInfoData[consultation.id].child_info.learning_problem_detail && (
                                      <p className="text-xs text-gray-600 mt-1">{childInfoData[consultation.id].child_info.learning_problem_detail}</p>
                                    )}
                                  </div>

                                  <div>
                                    <span className="text-xs text-gray-500">감각처리 문제</span>
                                    <p className="text-sm font-medium">{getSensoryProcessingText(childInfoData[consultation.id].child_info.sensory_processing_problem)}</p>
                                    {childInfoData[consultation.id].child_info.sensory_processing_detail && (
                                      <p className="text-xs text-gray-600 mt-1">{childInfoData[consultation.id].child_info.sensory_processing_detail}</p>
                                    )}
                                  </div>

                                  <div>
                                    <span className="text-xs text-gray-500">정서/불안 문제</span>
                                    <p className="text-sm font-medium">{getEmotionalAnxietyText(childInfoData[consultation.id].child_info.emotional_anxiety_problem)}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-xs text-gray-500">가족 유사 증상</span>
                                      <p className="text-sm font-medium">{childInfoData[consultation.id].child_info.family_similar_symptoms ? '있음' : '없음'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">약물 복용</span>
                                      <p className="text-sm font-medium">{childInfoData[consultation.id].child_info.medication_usage ? '예' : '아니오'}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">등록된 아이 정보가 없습니다.</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 세션별 카드 */}
                        {consultation.sessions && consultation.sessions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">회차별 상담</h4>
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

                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(session.scheduled_at)}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatTime(session.scheduled_at)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col space-y-2 ml-4">
                                    {/* 확정된 상담 - 상담 참여 버튼 (PENDING 상태가 아닐 때만 표시) */}
                                    {consultation.status?.toUpperCase() !== 'PENDING' && session.status?.toUpperCase() === 'SCHEDULED' && isUpcoming(session.scheduled_at) && (
                                      <Link href={`/video-call/${session.id}`} className="w-24">
                                        <Button size="sm" className="w-full">
                                          <Video className="mr-1 h-4 w-4" />
                                          상담 참여
                                        </Button>
                                      </Link>
                                    )}

                                    {/* 접수된 상담 (PENDING) - 승인/취소 버튼 */}
                                    {consultation.status?.toUpperCase() === 'PENDING' && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprove(consultation.id)}
                                          className="bg-green-600 hover:bg-green-700 w-24"
                                        >
                                          <CheckCircle className="mr-1 h-4 w-4" />
                                          승인
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openCancelModal(consultation.id)}
                                          className="w-24"
                                        >
                                          취소
                                        </Button>
                                      </>
                                    )}

                                    {/* 진행중 상담 - 상담일지 버튼 */}
                                    {session.status?.toUpperCase() === 'IN_PROGRESS' && (
                                      <Link href={`/expert/consultations/${consultation.id}/log?session=${session.id}`}>
                                        <Button size="sm" variant="outline">
                                          <FileText className="mr-1 h-4 w-4" />
                                          상담일지
                                        </Button>
                                      </Link>
                                    )}

                                    {/* 완료된 세션 - 상담일지 버튼 */}
                                    {session.status?.toUpperCase() === 'COMPLETED' && (
                                      <>
                                        <Link href={`/expert/consultations/${consultation.id}/log?session=${session.id}`}>
                                          <Button size="sm" variant="outline">
                                            <FileText className="mr-1 h-4 w-4" />
                                            상담일지
                                          </Button>
                                        </Link>
                                        {/* 1회차 완료 시에만 커리큘럼 버튼 표시 (다회성 상담만) */}
                                        {session.session_number === 1 && consultation.session_type !== 'SINGLE' && (
                                          <Link href={`/expert/consultations/${consultation.id}/curriculum`}>
                                            <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                                              <BookOpen className="mr-1 h-4 w-4" />
                                              커리큘럼
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
