'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { CurriculumAPI } from '@/lib/api/curriculum';
import { ArrowLeft, Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ScheduleAdditionalSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const counselingRequestId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [expertId, setExpertId] = useState(null);

  // 각 세션별 선택 상태: { [session_number]: { date, time } }
  const [sessionSchedules, setSessionSchedules] = useState({});
  const [availableSlots, setAvailableSlots] = useState({});
  const [slotsLoading, setSlotsLoading] = useState({});

  useEffect(() => {
    loadData();
  }, [counselingRequestId]);

  const loadData = async () => {
    try {
      const [consultationData, curriculumData] = await Promise.all([
        ConsultationsAPI.getCounselingRequestDetail(counselingRequestId),
        CurriculumAPI.getCurriculumByRequest(counselingRequestId)
      ]);
      setConsultation(consultationData);
      setCurriculum(curriculumData);
      setExpertId(consultationData.expert?.id || consultationData.expert_id);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      toast.error('정보를 불러오는데 실패했습니다');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // 커리큘럼 sessions_info 기반으로 예약이 필요한 세션 목록 생성
  // 이미 consultation.sessions에 scheduled_at이 있는 건 제외
  const unscheduledSessions = () => {
    if (!curriculum?.sessions_info) return [];
    const scheduledNumbers = new Set(
      (consultation?.sessions || [])
        .filter((s) => s.session_number >= 2 && s.scheduled_at)
        .map((s) => s.session_number)
    );
    return curriculum.sessions_info.filter(
      (s) => !scheduledNumbers.has(s.session_number)
    );
  };

  const loadSlots = async (sessionNumber, date) => {
    if (!expertId || !date) return;
    setSlotsLoading((prev) => ({ ...prev, [sessionNumber]: true }));
    try {
      const data = await ConsultationsAPI.getExpertAvailableSlots(expertId, date);
      const slots = data.available_time_ranges || [];

      // 오늘이면 현재 시간 이후 슬롯만
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      let filteredSlots = slots;
      if (selectedDate.getTime() === today.getTime()) {
        const now = new Date();
        filteredSlots = slots.filter((slot) => {
          const startTime = typeof slot === 'string' ? slot : slot.start_time;
          const [h, m] = startTime.split(':').map(Number);
          return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
        });
      }

      setAvailableSlots((prev) => ({ ...prev, [sessionNumber]: filteredSlots }));
    } catch {
      setAvailableSlots((prev) => ({ ...prev, [sessionNumber]: [] }));
    } finally {
      setSlotsLoading((prev) => ({ ...prev, [sessionNumber]: false }));
    }
  };

  const handleDateChange = (sessionNumber, date) => {
    setSessionSchedules((prev) => ({
      ...prev,
      [sessionNumber]: { date, time: '' }
    }));
    setAvailableSlots((prev) => ({ ...prev, [sessionNumber]: [] }));
    loadSlots(sessionNumber, date);
  };

  const handleTimeSelect = (sessionNumber, time) => {
    setSessionSchedules((prev) => ({
      ...prev,
      [sessionNumber]: { ...prev[sessionNumber], time }
    }));
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const allScheduled = () => {
    const sessions = unscheduledSessions();
    return sessions.length > 0 && sessions.every(
      (s) => sessionSchedules[s.session_number]?.date && sessionSchedules[s.session_number]?.time
    );
  };

  const handleSubmit = async () => {
    if (!allScheduled()) {
      toast.error('모든 회차의 날짜와 시간을 선택해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const sessions = unscheduledSessions().map((s) => {
        const { date, time } = sessionSchedules[s.session_number];
        const [hours, minutes] = time.split(':');
        const scheduled_at = new Date(`${date}T${hours.padStart(2,'0')}:${minutes.padStart(2,'0')}:00`).toISOString();
        return { session_number: s.session_number + 1, scheduled_at };
      });

      await ConsultationsAPI.scheduleAdditionalSessions(counselingRequestId, sessions);
      toast.success('추가 회차 일정이 예약되었습니다');
      router.push('/client/consultations');
    } catch (error) {
      console.error('일정 예약 실패:', error);
      const data = error.response?.data;
      const msg = data?.error || data?.detail || data?.message || '일정 예약에 실패했습니다';
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const sessions = unscheduledSessions();

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* 헤더 */}
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">추가 회차 일정 예약</h1>
            <p className="text-gray-600 mt-1">
              {consultation?.expert?.name || '전문가'}님과의 나머지 상담 일정을 선택해주세요
            </p>
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">모든 회차 일정이 예약되었습니다</h3>
              </CardContent>
            </Card>
          ) : (
            <>
              {sessions.map((session) => {
                const schedule = sessionSchedules[session.session_number];
                const slots = availableSlots[session.session_number] || [];
                const isLoadingSlots = slotsLoading[session.session_number];

                return (
                  <Card key={session.session_number}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {session.session_number}
                        </span>
                        {session.session_number}회차 상담
                      </CardTitle>
                      {schedule?.date && schedule?.time && (
                        <Badge className="bg-green-100 text-green-800 w-fit">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {schedule.date} {schedule.time}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 날짜 선택 */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                          <Calendar className="h-4 w-4" />
                          날짜 선택
                        </label>
                        <input
                          type="date"
                          min={getMinDate()}
                          value={schedule?.date || ''}
                          onChange={(e) => handleDateChange(session.session_number, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* 시간 선택 */}
                      {schedule?.date && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                            <Clock className="h-4 w-4" />
                            시간 선택
                          </label>
                          {isLoadingSlots ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              가능한 시간 조회 중...
                            </div>
                          ) : slots.length === 0 ? (
                            <p className="text-sm text-gray-500">해당 날짜에 가능한 시간이 없습니다</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {slots.map((slot) => {
                                const time = typeof slot === 'string' ? slot : slot.start_time;
                                const isSelected = schedule?.time === time;
                                return (
                                  <button
                                    key={time}
                                    onClick={() => handleTimeSelect(session.session_number, time)}
                                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                                      isSelected
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <Button
                onClick={handleSubmit}
                disabled={!allScheduled() || submitting}
                className="w-full py-6 text-base font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    예약 중...
                  </>
                ) : (
                  `${sessions.length}회차 일정 모두 예약하기`
                )}
              </Button>
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
