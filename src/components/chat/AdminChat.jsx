import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  FileText,
  BookOpen,
  ClipboardList,
  PenSquare
} from 'lucide-react';
import Link from 'next/link';

/**
 * 관리자/시스템이 보내는 예약 관련 메시지 컴포넌트
 */
export function AdminChat({
  messageType,
  metadata = {},
  onButtonPressed,
  sessionId,
  participantName,
  sessionNumber,
  chatRoomId,
  counselorName,
  counselingDate,
  counselingLogId,
  onCounselingLogPublished,
  imageUrl,
  userType
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getTitle = () => {
    switch (messageType) {
      case 'reservation_request':
      case 'RESERVATION_REQUEST':
        return '상담 예약을 요청합니다.';
      case 'reservation_accept':
      case 'SCHEDULE_CONFIRM':
        return '예약이 확정되었습니다';
      case 'reservation_imminent':
      case 'SESSION_REMINDER':
        return '상담 시간에 임박하였습니다.';
      case 'reservation_complete':
      case 'SESSION_COMPLETE':
        return '상담은 잘 마무리하셨나요?';
      case 'SCHEDULE_CHANGE':
        return '일정이 변경되었습니다';
      case 'PAYMENT_NOTICE':
        return '결제 안내';
      case 'counseling_log_complete':
      case 'COUNSELING_LOG_COMPLETE':
        return '상담 일지가 작성되었습니다';
      case 'CURRICULUM':
        return '커리큘럼이 작성되었습니다';
      case 'SYSTEM':
        // SYSTEM 메시지 중 커리큘럼 작성 요청인지 확인
        return '커리큘럼 작성 요청';
      default:
        return '상담 안내';
    }
  };

  const getContent = () => {
    switch (messageType) {
      case 'reservation_request':
      case 'RESERVATION_REQUEST':
        return '학부모님께서 상담을 요청하셨습니다.\n3일 이내 수락을 하지 않을 시 상담은 거절됩니다.';
      case 'reservation_accept':
      case 'SCHEDULE_CONFIRM':
        return '상담 예정 시각 10분 전 한번 더 알려드리겠습니다.';
      case 'reservation_imminent':
      case 'SESSION_REMINDER':
        return '상담 예정 시각이 10분 남았으니 아래 버튼을 통해 입장해주세요.';
      case 'reservation_complete':
      case 'SESSION_COMPLETE':
        return '상담 결과 일지를 작성해주세요.\n작성하신 일지는 학부모님께도 공유됩니다.';
      case 'SCHEDULE_CHANGE':
        return '일정 변경 사항을 확인해주세요.';
      case 'PAYMENT_NOTICE':
        return '결제 관련 안내사항입니다.';
      case 'counseling_log_complete':
      case 'COUNSELING_LOG_COMPLETE':
        return `${sessionNumber || ''}회차 상담 일지가 작성 완료되었습니다.\n아래 버튼을 눌러 상담 일지를 확인하세요.`;
      case 'CURRICULUM':
        return '1회차 상담이 완료되었습니다.\n추가 회차 진행을 위해 커리큘럼(상담일지)을 작성해 주세요.';
      case 'SYSTEM':
        // SYSTEM 메시지 중 커리큘럼 작성 요청
        return '📝 1회차 상담이 완료되었습니다.\n추가 회차 진행을 위해 커리큘럼 및 상담일지를 작성해 주세요.';
      default:
        return '상담 안내';
    }
  };

  const shouldShowButton = () => {
    return ['reservation_imminent', 'SESSION_REMINDER', 'reservation_complete', 'SESSION_COMPLETE', 'counseling_log_complete', 'COUNSELING_LOG_COMPLETE', 'SYSTEM', 'CURRICULUM'].includes(messageType);
  };

  const getButtonText = () => {
    switch (messageType) {
      case 'reservation_complete':
      case 'SESSION_COMPLETE':
        return '상담 일지 작성';
      case 'counseling_log_complete':
      case 'COUNSELING_LOG_COMPLETE':
        return '상담 일지 확인';
      case 'reservation_imminent':
      case 'SESSION_REMINDER':
        return '상담방 입장';
      default:
        return '상담 하러가기';
    }
  };

  const isStepActive = (step) => {
    switch (messageType) {
      case 'reservation_request':
      case 'RESERVATION_REQUEST':
        return step === 0;
      case 'reservation_accept':
      case 'SCHEDULE_CONFIRM':
        return step === 1;
      case 'reservation_imminent':
      case 'SESSION_REMINDER':
        return step === 2;
      case 'reservation_complete':
      case 'SESSION_COMPLETE':
        return step === 3;
      case 'counseling_log_complete':
      case 'COUNSELING_LOG_COMPLETE':
        return step === 3;
      case 'CURRICULUM':
        return step === 3;
      default:
        return false;
    }
  };

  const isStepCompleted = (step) => {
    switch (messageType) {
      case 'reservation_request':
      case 'RESERVATION_REQUEST':
        return false;
      case 'reservation_accept':
      case 'SCHEDULE_CONFIRM':
        return step < 1;
      case 'reservation_imminent':
      case 'SESSION_REMINDER':
        return step < 2;
      case 'reservation_complete':
      case 'SESSION_COMPLETE':
        return step < 3;
      case 'counseling_log_complete':
      case 'COUNSELING_LOG_COMPLETE':
        return step <= 3;
      case 'CURRICULUM':
        return step <= 3;
      default:
        return false;
    }
  };

  const convertToKST = (timeStr) => {
    if (!timeStr) return timeStr;
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hour = parseInt(parts[0]);
        const minute = parts[1];
        hour = (hour + 9) % 24;
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }
    } catch (e) {
      console.error('시간 변환 실패:', e);
    }
    return timeStr;
  };

  return (
    <div className="max-w-sm">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* 제목 */}
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {getTitle()}
        </h3>

        {/* 내용 */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
          {getContent()}
        </p>

        {/* 커리큘럼 이미지 */}
        {messageType === 'CURRICULUM' && imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="커리큘럼"
              className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(imageUrl)}
            />
          </div>
        )}

        {/* 이미지 확대 모달 */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="원본 이미지"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* 메타데이터 정보 */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            {metadata.consultation_date && (
              <div className="flex items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 mr-2">날짜:</span>
                <span className="text-xs text-gray-900">{metadata.consultation_date}</span>
              </div>
            )}
            {metadata.consultation_time && (
              <div className="flex items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 mr-2">시간:</span>
                <span className="text-xs text-gray-900">{convertToKST(metadata.consultation_time)}</span>
              </div>
            )}
            {metadata.consultation_type && (
              <div className="flex items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 mr-2">유형:</span>
                <span className="text-xs text-gray-900">{metadata.consultation_type}</span>
              </div>
            )}
            {metadata.duration && (
              <div className="flex items-center">
                <span className="text-xs font-semibold text-gray-700 mr-2">소요시간:</span>
                <span className="text-xs text-gray-900">{metadata.duration}분</span>
              </div>
            )}
          </div>
        )}

        {/* 버튼 영역 */}
        {shouldShowButton() && (
          <div className="mb-4">
            {(messageType === 'CURRICULUM') && userType === 'client' ? (
              // 커리큘럼 완료 메시지 - 내담자에게 다음 상담 예약 버튼
              <Link href="/client/consultations/book">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl">
                  <Calendar className="mr-2 h-4 w-4" />
                  다음 상담 예약하기
                </Button>
              </Link>
            ) : messageType === 'SYSTEM' && userType !== 'client' ? (
              // 1. SYSTEM 메시지 (커리큘럼 작성 요청)
              chatRoomId && (
                <div className="space-y-2">
                  <Link href={`/expert/consultations/${chatRoomId}/curriculum`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl">
                      <FileText className="mr-2 h-4 w-4" />
                      커리큘럼 작성하기
                    </Button>
                  </Link>
                </div>
              )
            ) : (messageType === 'reservation_imminent' || messageType === 'SESSION_REMINDER') ? (
              // 2. 상담 임박 - 화상 상담 시작하기 + 상담방 입장 (두 개의 버튼)
              <div className="space-y-2">
                {sessionId && (
                  <Link href={`/video-call/${sessionId}`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl shadow-sm">
                      <Video className="mr-2 h-4 w-4" />
                      화상 상담 시작하기
                    </Button>
                  </Link>
                )}
                {chatRoomId && (
                  <Link href={`/expert/chat/${chatRoomId}`}>
                    <Button variant="outline" className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium py-5 rounded-xl">
                      상담방 입장
                    </Button>
                  </Link>
                )}
              </div>
            ) : (messageType === 'counseling_log_complete' || messageType === 'COUNSELING_LOG_COMPLETE') ? (
              // 3. 일지 완료 시
              counselingLogId && (
                <Link href={`/expert/consultations/${counselingLogId}/log?session=${sessionId}`}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl">
                    <FileText className="mr-2 h-4 w-4" />
                    {getButtonText()}
                  </Button>
                </Link>
              )
            ) : (messageType === 'reservation_complete' || messageType === 'SESSION_COMPLETE') ? (
              // 4. 상담 완료(일지 작성 대기) 시
              sessionId && (
                <Link href={`/expert/consultations/${sessionId}/log?session=${sessionId}`}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl">
                    <PenSquare className="mr-2 h-4 w-4" />
                    {getButtonText()}
                  </Button>
                </Link>
              )
            ) : sessionId ? (
              // 5. 그 외 일반적인 입장 케이스
              <Link href={`/video-call/${sessionId}`}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl">
                  <Video className="mr-2 h-4 w-4" />
                  {getButtonText()}
                </Button>
              </Link>
            ) : null}
          </div>
        )}

        {/* 구분선 - SYSTEM 메시지가 아닐 때만 표시 */}
        {messageType !== 'SYSTEM' && <div className="border-t border-gray-200 mb-4"></div>}

        {/* 상담 플로우 스텝 - SYSTEM 메시지가 아닐 때만 표시 */}
        {messageType !== 'SYSTEM' && (
          <div className="flex items-center justify-between">
            <Step
              icon={<ClipboardList className="h-5 w-5" />}
              label="상담예약"
              isActive={isStepActive(0)}
              isCompleted={isStepCompleted(0)}
            />
            <StepDivider isCompleted={isStepCompleted(0)} />
            <Step
              icon={<CheckCircle className="h-5 w-5" />}
              label="예약확정"
              isActive={isStepActive(1)}
              isCompleted={isStepCompleted(1)}
            />
            <StepDivider isCompleted={isStepCompleted(1)} />
            <Step
              icon={<Video className="h-5 w-5" />}
              label="상담"
              isActive={isStepActive(2)}
              isCompleted={isStepCompleted(2)}
            />
            <StepDivider isCompleted={isStepCompleted(2)} />
            <Step
              icon={<PenSquare className="h-5 w-5" />}
              label="일지작성"
              isActive={isStepActive(3)}
              isCompleted={isStepCompleted(3)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ icon, label, isActive, isCompleted }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isCompleted || isActive
            ? 'bg-green-100 text-primary'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[9px] mt-1.5 font-medium text-center max-w-[50px] overflow-hidden text-ellipsis ${
          isActive ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepDivider({ isCompleted }) {
  return (
    <div className="flex-1 mx-1 mb-6">
      <div
        className={`h-0.5 rounded ${
          isCompleted ? 'bg-primary' : 'bg-gray-200'
        }`}
      />
    </div>
  );
}
