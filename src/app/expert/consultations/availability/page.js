'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AvailabilityPage() {
  const router = useRouter();
  const [focusedDay, setFocusedDay] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [reservedSlots, setReservedSlots] = useState({});
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [isSelecting, setIsSelecting] = useState(true);
  const [clickStartTime, setClickStartTime] = useState(null);

  // 8:00~21:00 범위의 슬롯 (16~41)
  const displaySlots = Array.from({ length: 26 }, (_, i) => i + 16);

  useEffect(() => {
    fetchExistingSchedule();
  }, []);

  // 날짜 정규화
  const normalizeDate = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // 날짜를 문자열로 포맷 (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 키 생성
  const getDateKey = (date) => {
    return formatDate(normalizeDate(date));
  };

  // 오늘 날짜
  const today = normalizeDate(new Date());

  // 유효한 미래 날짜인지 확인
  const isValidFutureDate = (date) => {
    const normalized = normalizeDate(date);
    return normalized >= today;
  };

  // 버튼 활성화 조건 확인
  const canSubmit = () => {
    return Object.entries(scheduleData).some(([dateStr, slots]) => {
      const date = new Date(dateStr);
      return isValidFutureDate(date) && slots.size > 0;
    });
  };

  // 슬롯 데이터 파싱
  const parseSlots = (slotsData) => {
    const availableSlots = new Set();
    const reserved = new Set();

    if (Array.isArray(slotsData)) {
      for (const item of slotsData) {
        if (typeof item === 'number') {
          availableSlots.add(item);
        } else if (typeof item === 'object' && item !== null) {
          const slotNumber = item.slot_number;
          if (slotNumber == null) continue;

          const isReserved = item.is_reserved === true;
          const isAvailable = item.is_available === true;

          if (isReserved) {
            reserved.add(slotNumber);
          } else if (isAvailable) {
            availableSlots.add(slotNumber);
          }
        }
      }
    }

    return { available: availableSlots, reserved };
  };

  // 기존 스케줄 불러오기
  const fetchExistingSchedule = async () => {
    setIsLoading(true);

    try {
      const now = new Date();
      const dateFrom = normalizeDate(now); // 오늘부터
      const dateTo = new Date(now);
      dateTo.setDate(dateTo.getDate() + 14); // 오늘부터 2주 후까지

      const loadedSchedule = {};
      const loadedReserved = {};

      // 날짜 범위 내의 모든 날짜에 대해 API 호출 (오늘부터 2주치만)
      for (let date = new Date(dateFrom); date <= dateTo; date.setDate(date.getDate() + 1)) {
        try {
          const dateStr = formatDate(date);
          const response = await ConsultationsAPI.getMyAvailability(dateStr);

          if (response.slots) {
            const dateKey = getDateKey(date);
            const { available, reserved } = parseSlots(response.slots);

            if (available.size > 0 || reserved.size > 0) {
              loadedSchedule[dateKey] = available;
              if (reserved.size > 0) {
                loadedReserved[dateKey] = reserved;
              }
            }
          }
        } catch (e) {
          // 개별 날짜 조회 실패는 무시
          console.error(`날짜 ${formatDate(date)} 조회 실패:`, e);
        }
      }

      setScheduleData(loadedSchedule);
      setReservedSlots(loadedReserved);

      // 첫 번째 유효한 날짜를 기본 선택
      const validDates = Object.keys(loadedSchedule)
        .map(dateStr => new Date(dateStr))
        .filter(date => isValidFutureDate(date))
        .sort((a, b) => a - b);

      if (validDates.length > 0) {
        const firstDate = validDates[0];
        setSelectedDay(firstDate);
        setFocusedDay(firstDate);
        const dateKey = getDateKey(firstDate);
        const slots = new Set([
          ...(loadedSchedule[dateKey] || []),
          ...(loadedReserved[dateKey] || [])
        ]);
        setSelectedSlots(slots);
      } else {
        setFocusedDay(today);
      }
    } catch (error) {
      console.error('기존 스케줄 불러오기 실패:', error);
      toast.error('기존 스케줄을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 선택
  const selectDay = (date) => {
    // 현재 선택된 날짜의 슬롯들을 저장
    if (selectedDay) {
      const currentDateKey = getDateKey(selectedDay);
      const currentReserved = reservedSlots[currentDateKey] || new Set();
      const slotsToSave = new Set([...selectedSlots].filter(slot => !currentReserved.has(slot)));
      setScheduleData(prev => ({ ...prev, [currentDateKey]: slotsToSave }));
    }

    // 새로운 날짜 선택 및 해당 날짜의 슬롯 로드
    const dateKey = getDateKey(date);
    const existingSlots = scheduleData[dateKey] || new Set();
    const reserved = reservedSlots[dateKey] || new Set();

    const slots = new Set([...existingSlots, ...reserved]);
    setSelectedSlots(slots);
    setSelectedDay(date);
    setFocusedDay(date);
  };

  // 마우스 다운 처리
  const handleMouseDown = (slot) => {
    // 예약된 슬롯은 수정 불가
    if (selectedDay) {
      const dateKey = getDateKey(selectedDay);
      const reserved = reservedSlots[dateKey] || new Set();
      if (reserved.has(slot)) {
        toast.error('이미 예약된 시간은 수정할 수 없습니다');
        return;
      }
    }

    setClickStartTime(Date.now());
    setDragStartSlot(slot);
    const selecting = !selectedSlots.has(slot);
    setIsSelecting(selecting);

    // 즉시 해당 슬롯 토글
    const newSlots = new Set(selectedSlots);
    if (selecting) {
      newSlots.add(slot);
    } else {
      newSlots.delete(slot);
    }
    setSelectedSlots(newSlots);

    // scheduleData에 반영
    if (selectedDay) {
      const dateKey = getDateKey(selectedDay);
      const reserved = reservedSlots[dateKey] || new Set();
      const slotsToSave = new Set([...newSlots].filter(s => !reserved.has(s)));
      setScheduleData(prev => ({ ...prev, [dateKey]: slotsToSave }));
    }
  };

  // 드래그 업데이트 (마우스 엔터)
  const handleMouseEnter = (slot) => {
    if (!dragStartSlot) return;

    // 드래그 시작 후 일정 시간이 지나면 드래그 모드로 전환
    if (!isDragging && clickStartTime && Date.now() - clickStartTime > 100) {
      setIsDragging(true);
    }

    if (!isDragging) return;

    // 예약된 슬롯은 건너뛰기
    if (selectedDay) {
      const dateKey = getDateKey(selectedDay);
      const reserved = reservedSlots[dateKey] || new Set();
      if (reserved.has(slot)) return;
    }

    const minSlot = Math.min(dragStartSlot, slot);
    const maxSlot = Math.max(dragStartSlot, slot);

    const newSlots = new Set(selectedSlots);
    const displaySlotsSet = new Set(displaySlots);
    const dateKey = selectedDay ? getDateKey(selectedDay) : null;
    const reserved = dateKey ? (reservedSlots[dateKey] || new Set()) : new Set();

    for (let i = minSlot; i <= maxSlot; i++) {
      if (displaySlotsSet.has(i) && !reserved.has(i)) {
        if (isSelecting) {
          newSlots.add(i);
        } else {
          newSlots.delete(i);
        }
      }
    }
    setSelectedSlots(newSlots);

    // scheduleData에 반영
    if (selectedDay) {
      const slotsToSave = new Set([...newSlots].filter(s => !reserved.has(s)));
      setScheduleData(prev => ({ ...prev, [dateKey]: slotsToSave }));
    }
  };

  // 마우스 업 처리
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
    setClickStartTime(null);

    // 드래그 종료 시 현재 날짜의 슬롯을 scheduleData에 반영
    if (selectedDay) {
      const dateKey = getDateKey(selectedDay);
      const reserved = reservedSlots[dateKey] || new Set();
      const slotsToSave = new Set([...selectedSlots].filter(s => !reserved.has(s)));
      setScheduleData(prev => ({ ...prev, [dateKey]: slotsToSave }));
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (!selectedDay) return;

    const dateKey = getDateKey(selectedDay);
    const reserved = reservedSlots[dateKey] || new Set();

    // 예약된 슬롯을 제외한 슬롯들 중 모두 선택되어 있는지 확인
    const selectableSlots = displaySlots.filter(slot => !reserved.has(slot));
    const allSelected = selectableSlots.every(slot => selectedSlots.has(slot));

    let newSlots;
    if (allSelected) {
      // 전체 해제 (예약된 슬롯은 유지)
      newSlots = new Set(reserved);
    } else {
      // 전체 선택
      newSlots = new Set(displaySlots);
    }

    setSelectedSlots(newSlots);

    // scheduleData에 반영
    const slotsToSave = new Set([...newSlots].filter(s => !reserved.has(s)));
    setScheduleData(prev => ({ ...prev, [dateKey]: slotsToSave }));
  };

  // 스케줄 제출
  const submitSchedule = async () => {

    try {
      // 현재 선택된 날짜의 슬롯들을 scheduleData에 먼저 반영
      let finalScheduleData = { ...scheduleData };
      if (selectedDay && selectedSlots.size > 0) {
        const dateKey = getDateKey(selectedDay);
        const reserved = reservedSlots[dateKey] || new Set();
        const slotsToSave = new Set([...selectedSlots].filter(s => !reserved.has(s)));
        finalScheduleData[dateKey] = slotsToSave;
      }


      // 유효한 미래 날짜가 있는지 확인
      const hasValidData = Object.entries(finalScheduleData).some(([dateStr, slots]) => {
        const date = new Date(dateStr);
        return isValidFutureDate(date) && slots.size > 0;
      });

      if (!hasValidData) {
        toast.error('선택된 상담 시간이 없습니다');
        return;
      }

      // 병렬 처리를 위한 Promise 배열 생성
      const savePromises = Object.entries(finalScheduleData).map(async ([dateStr, slots]) => {
        const date = new Date(dateStr);

        // 과거 날짜 제외 및 빈 슬롯 제외
        if (slots.size === 0 || !isValidFutureDate(date)) {
          return null;
        }

        // 유효한 슬롯만 필터링 (16~41)
        const validSlots = [...slots].filter(slot => slot >= 16 && slot <= 41).sort((a, b) => a - b);

        if (validSlots.length === 0) {
          return null;
        }

        try {
          const result = await ConsultationsAPI.setMyAvailability({
            date: dateStr,
            available_slots: validSlots
          });

          return {
            date: dateStr,
            success: true,
            data: result
          };
        } catch (e) {
          console.error(`날짜 ${dateStr} 저장 실패:`, e);
          return {
            date: dateStr,
            success: false,
            error: e.toString()
          };
        }
      });

      // 모든 요청을 동시에 실행하고 결과 대기
      const allResults = await Promise.all(savePromises);
      const results = allResults.filter(r => r !== null);

      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        toast.success('상담 일정이 성공적으로 저장되었습니다');
        setTimeout(() => {
          router.push('/expert/consultations');
        }, 1000);
      } else {
        const failedCount = results.filter(r => !r.success).length;
        toast.error(`${failedCount}개 날짜의 저장에 실패했습니다`);
      }
    } catch (error) {
      console.error('스케줄 등록 중 오류:', error);
      toast.error('스케줄 등록 중 오류가 발생했습니다');
    }
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const year = focusedDay.getFullYear();
    const month = focusedDay.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 13);

    return (
      <div className="space-y-4">
        {/* 달력 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {year}년 {month + 1}월
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(focusedDay);
                newDate.setMonth(newDate.getMonth() - 1);
                setFocusedDay(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(focusedDay);
                newDate.setMonth(newDate.getMonth() + 1);
                setFocusedDay(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = day.getMonth() === month;
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
                const dateKey = getDateKey(day);
                const hasSlots = scheduleData[dateKey]?.size > 0 || reservedSlots[dateKey]?.size > 0;
                const isEnabled = day >= today && day <= twoWeeksLater;

                return (
                  <button
                    key={dayIndex}
                    onClick={() => isEnabled && selectDay(day)}
                    disabled={!isEnabled}
                    className={`
                      relative p-2 rounded-lg text-center transition-colors
                      ${!isCurrentMonth ? 'text-gray-300' : ''}
                      ${isToday ? 'font-bold' : ''}
                      ${isSelected ? 'bg-primary text-white' : ''}
                      ${!isSelected && isEnabled ? 'hover:bg-gray-100' : ''}
                      ${!isEnabled ? 'cursor-not-allowed opacity-40' : ''}
                    `}
                  >
                    <span className="text-sm">{day.getDate()}</span>
                    {hasSlots && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 슬롯을 시간 문자열로 변환
  const slotToTime = (slot) => {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  if (isLoading) {
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
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* 헤더 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상담 일정 정하기</h1>
            <p className="text-gray-600 mt-2">상담 시간을 입력하세요.</p>
            <p className="text-gray-500 text-sm">앞으로 2주간 활동 가능한 상담 시간을 입력해주세요.</p>
          </div>

          {/* 달력 */}
          <Card>
            <CardContent className="p-6">
              {renderCalendar()}
            </CardContent>
          </Card>

          {/* 시간 슬롯 선택 */}
          <Card>
            <CardContent className="p-6">
              {selectedDay ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        선택된 날짜: {formatDate(selectedDay)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        시간대를 선택하세요 (30분 단위, 08:00~21:30)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleSelectAll}
                    >
                      {displaySlots.every(slot => {
                        const dateKey = getDateKey(selectedDay);
                        const reserved = reservedSlots[dateKey] || new Set();
                        return reserved.has(slot) || selectedSlots.has(slot);
                      }) ? '전체 해제' : '전체 선택'}
                    </Button>
                  </div>

                  {/* 시간 슬롯 바 */}
                  <div className="overflow-x-auto">
                    <div className="min-w-max">
                      {/* 시간 레이블 */}
                      <div className="flex mb-2">
                        {Array.from({ length: 13 }, (_, i) => 8 + i).map(hour => (
                          <div key={hour} className="w-[120px] text-sm text-gray-600 font-medium">
                            {String(hour).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>

                      {/* 슬롯 바 */}
                      <div
                        className="flex"
                        onMouseLeave={handleMouseUp}
                        onMouseUp={handleMouseUp}
                      >
                        {displaySlots.map(slot => {
                          const isSelected = selectedSlots.has(slot);
                          const dateKey = getDateKey(selectedDay);
                          const reserved = reservedSlots[dateKey] || new Set();
                          const isReserved = reserved.has(slot);

                          return (
                            <div
                              key={slot}
                              className={`
                                w-[60px] h-[60px] border border-gray-300 transition-colors select-none
                                ${isSelected ? (isReserved ? 'bg-green-950 cursor-not-allowed' : 'bg-green-900 cursor-pointer') : 'bg-white hover:bg-gray-100 cursor-pointer'}
                                ${isReserved ? 'cursor-not-allowed' : ''}
                              `}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleMouseDown(slot);
                              }}
                              onMouseEnter={() => handleMouseEnter(slot)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>날짜를 선택해주세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/expert/consultations')}
            >
              취소
            </Button>
            <Button
              onClick={submitSchedule}
            >
              저장
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
