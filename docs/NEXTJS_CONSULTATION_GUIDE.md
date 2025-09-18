# 상담 라이프사이클 구현 가이드

## 목차
1. [상담 시스템 개요](#상담-시스템-개요)
2. [상담 예약 프로세스](#상담-예약-프로세스)
3. [상담 준비 단계](#상담-준비-단계)
4. [실시간 화상 상담](#실시간-화상-상담)
5. [상담 진행 관리](#상담-진행-관리)
6. [상담 종료 및 보고서](#상담-종료-및-보고서)
7. [결제 및 정산](#결제-및-정산)
8. [자동화 시스템](#자동화-시스템)
9. [예외 처리](#예외-처리)
10. [모니터링 대시보드](#모니터링-대시보드)

## 상담 시스템 개요

### 상담 플로우 다이어그램
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   상담 요청   │────▶│   전문가 승인  │────▶│   예약 확정   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  상담 보고서  │◀────│   상담 진행   │◀────│   상담 준비   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   평가/리뷰   │────▶│   정산 처리   │────▶│   완료       │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 상담 상태 (Status)
```typescript
type ConsultationStatus = 
  | 'requested'     // 상담 요청됨
  | 'confirmed'     // 전문가 승인
  | 'preparing'     // 준비 중 (5분 전)
  | 'ready'         // 입장 가능
  | 'in_progress'   // 진행 중
  | 'completed'     // 완료
  | 'cancelled'     // 취소
  | 'no_show'       // 노쇼
  | 'expired';      // 만료
```

## 상담 예약 프로세스

### 1. 전문가 검색 및 선택

```typescript
// pages/experts/index.tsx
import { useState, useEffect } from 'react';
import { ExpertAPI } from '@/lib/api/expert';
import { ExpertCard } from '@/components/expert/ExpertCard';
import { ExpertFilter } from '@/components/expert/ExpertFilter';

interface ExpertSearchParams {
  specialty?: string[];
  priceRange?: [number, number];
  rating?: number;
  availability?: string;
  sortBy?: 'rating' | 'price' | 'experience';
}

export default function ExpertListPage() {
  const [experts, setExperts] = useState([]);
  const [filters, setFilters] = useState<ExpertSearchParams>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchExperts();
  }, [filters]);
  
  const fetchExperts = async () => {
    setLoading(true);
    try {
      const data = await ExpertAPI.searchExperts(filters);
      setExperts(data.results);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="expert-list-page">
      <ExpertFilter 
        filters={filters}
        onFilterChange={setFilters}
      />
      
      <div className="expert-grid">
        {experts.map(expert => (
          <ExpertCard
            key={expert.id}
            expert={expert}
            onSelect={() => router.push(`/experts/${expert.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. 전문가 상세 및 시간 선택

```typescript
// components/consultation/BookingCalendar.tsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { ConsultationAPI } from '@/lib/api/consultation';
import { format, addDays } from 'date-fns';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export function BookingCalendar({ expertId }: { expertId: number }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, expertId]);
  
  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const slots = await ConsultationAPI.getExpertAvailability(expertId, {
        date: format(date, 'yyyy-MM-dd'),
      });
      setAvailableSlots(slots);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };
  
  const tileDisabled = ({ date }: { date: Date }) => {
    // 과거 날짜와 30일 이후 비활성화
    return date < new Date() || date > addDays(new Date(), 30);
  };
  
  return (
    <div className="booking-calendar">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileDisabled={tileDisabled}
        minDate={new Date()}
        maxDate={addDays(new Date(), 30)}
      />
      
      {loading ? (
        <div>시간대를 불러오는 중...</div>
      ) : (
        <div className="time-slots">
          {availableSlots.map(slot => (
            <button
              key={slot.id}
              className={`time-slot ${
                selectedSlot?.id === slot.id ? 'selected' : ''
              } ${!slot.is_available ? 'disabled' : ''}`}
              onClick={() => setSelectedSlot(slot)}
              disabled={!slot.is_available}
            >
              {slot.start_time} - {slot.end_time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. 상담 신청 폼

```typescript
// components/consultation/BookingForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConsultationAPI } from '@/lib/api/consultation';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';

interface BookingFormData {
  child_profile_id: string;
  concern_summary: string;
  previous_therapy: string[];
  specific_requests?: string;
  emergency_contact?: string;
}

export function BookingForm({ 
  expertId, 
  slotId,
  onSuccess 
}: BookingFormProps) {
  const { user } = useAuth();
  const { children } = useChildren();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>();
  
  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    
    try {
      // 1. 상담 신청
      const consultation = await ConsultationAPI.requestConsultation({
        expert_id: expertId,
        availability_slot_id: slotId,
        child_profile_id: data.child_profile_id,
        concern_summary: data.concern_summary,
        duration: 30,
        additional_info: {
          previous_therapy: data.previous_therapy,
          specific_requests: data.specific_requests,
          emergency_contact: data.emergency_contact,
        },
      });
      
      // 2. 결제 페이지로 이동 또는 성공 처리
      if (consultation.status === 'payment_required') {
        router.push(`/payment?consultation_id=${consultation.id}`);
      } else {
        onSuccess(consultation);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '상담 신청 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
      <div className="form-section">
        <h3>상담 받을 아이 선택</h3>
        <select 
          {...register('child_profile_id', { required: '아이를 선택해주세요' })}
          className={errors.child_profile_id ? 'error' : ''}
        >
          <option value="">선택하세요</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.name} ({child.birth_date})
            </option>
          ))}
        </select>
        {errors.child_profile_id && (
          <span className="error-message">{errors.child_profile_id.message}</span>
        )}
      </div>
      
      <div className="form-section">
        <h3>상담 주요 고민</h3>
        <textarea
          {...register('concern_summary', {
            required: '상담 내용을 입력해주세요',
            minLength: {
              value: 20,
              message: '최소 20자 이상 입력해주세요',
            },
          })}
          placeholder="아이의 현재 상황과 궁금한 점을 자세히 적어주세요"
          rows={5}
        />
        {errors.concern_summary && (
          <span className="error-message">{errors.concern_summary.message}</span>
        )}
      </div>
      
      <div className="form-section">
        <h3>현재 받고 있는 치료</h3>
        <div className="checkbox-group">
          {['언어치료', '작업치료', '감각통합', '행동치료', '놀이치료'].map(therapy => (
            <label key={therapy}>
              <input
                type="checkbox"
                value={therapy}
                {...register('previous_therapy')}
              />
              <span>{therapy}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="form-section">
        <h3>특별 요청사항 (선택)</h3>
        <textarea
          {...register('specific_requests')}
          placeholder="전문가에게 특별히 요청하고 싶은 사항이 있다면 적어주세요"
          rows={3}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="submit-button"
      >
        {loading ? '신청 중...' : '상담 신청하기'}
      </button>
    </form>
  );
}
```

## 상담 준비 단계

### 상담 대기실

```typescript
// pages/consultation/waiting-room/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ConsultationAPI } from '@/lib/api/consultation';
import { useConsultationWebSocket } from '@/hooks/useConsultationWebSocket';
import { CountdownTimer } from '@/components/consultation/CountdownTimer';

export default function WaitingRoom() {
  const router = useRouter();
  const { id: consultationId } = router.query;
  const [consultation, setConsultation] = useState(null);
  const [canEnter, setCanEnter] = useState(false);
  
  const { status, isConnected } = useConsultationWebSocket(consultationId as string);
  
  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);
  
  useEffect(() => {
    // 상담 5분 전부터 입장 가능
    const checkEntryTime = setInterval(() => {
      if (consultation) {
        const now = new Date();
        const consultTime = new Date(consultation.scheduled_at);
        const diff = consultTime.getTime() - now.getTime();
        const minutesUntil = diff / (1000 * 60);
        
        if (minutesUntil <= 5) {
          setCanEnter(true);
          clearInterval(checkEntryTime);
        }
      }
    }, 10000); // 10초마다 확인
    
    return () => clearInterval(checkEntryTime);
  }, [consultation]);
  
  const fetchConsultation = async () => {
    try {
      const data = await ConsultationAPI.getConsultation(consultationId as string);
      setConsultation(data);
    } catch (error) {
      console.error('Failed to fetch consultation:', error);
    }
  };
  
  const handleEnterRoom = () => {
    if (canEnter && consultation?.agora_token) {
      router.push(`/consultation/room/${consultationId}`);
    }
  };
  
  return (
    <div className="waiting-room">
      <div className="waiting-room-header">
        <h1>상담 대기실</h1>
        <div className="connection-status">
          {isConnected ? '연결됨' : '연결 중...'}
        </div>
      </div>
      
      {consultation && (
        <div className="consultation-info">
          <div className="expert-info">
            <img src={consultation.expert.profile_image} alt={consultation.expert.name} />
            <div>
              <h3>{consultation.expert.name} 전문가</h3>
              <p>{consultation.expert.specialty.join(', ')}</p>
            </div>
          </div>
          
          <CountdownTimer 
            targetTime={consultation.scheduled_at}
            onTimeReached={() => setCanEnter(true)}
          />
          
          <div className="entry-section">
            {canEnter ? (
              <button 
                onClick={handleEnterRoom}
                className="enter-button"
              >
                상담방 입장하기
              </button>
            ) : (
              <p>상담 시작 5분 전부터 입장 가능합니다</p>
            )}
          </div>
          
          <PreConsultationChecklist />
        </div>
      )}
    </div>
  );
}
```

### 사전 체크리스트

```typescript
// components/consultation/PreConsultationChecklist.tsx
import { useState, useEffect } from 'react';
import { Camera, Mic, Wifi } from 'lucide-react';

export function PreConsultationChecklist() {
  const [checklist, setChecklist] = useState({
    camera: false,
    microphone: false,
    internet: false,
    browser: false,
  });
  
  useEffect(() => {
    performSystemCheck();
  }, []);
  
  const performSystemCheck = async () => {
    // 카메라 체크
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setChecklist(prev => ({ ...prev, camera: true }));
    } catch {
      setChecklist(prev => ({ ...prev, camera: false }));
    }
    
    // 마이크 체크
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setChecklist(prev => ({ ...prev, microphone: true }));
    } catch {
      setChecklist(prev => ({ ...prev, microphone: false }));
    }
    
    // 인터넷 속도 체크
    const connection = (navigator as any).connection;
    if (connection) {
      const downlink = connection.downlink;
      setChecklist(prev => ({ ...prev, internet: downlink > 2 }));
    }
    
    // 브라우저 호환성
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent);
    setChecklist(prev => ({ 
      ...prev, 
      browser: isChrome || isFirefox || isSafari 
    }));
  };
  
  return (
    <div className="checklist">
      <h3>상담 전 체크리스트</h3>
      
      <div className="checklist-item">
        <Camera className={checklist.camera ? 'success' : 'error'} />
        <span>카메라 {checklist.camera ? '정상' : '확인 필요'}</span>
      </div>
      
      <div className="checklist-item">
        <Mic className={checklist.microphone ? 'success' : 'error'} />
        <span>마이크 {checklist.microphone ? '정상' : '확인 필요'}</span>
      </div>
      
      <div className="checklist-item">
        <Wifi className={checklist.internet ? 'success' : 'error'} />
        <span>인터넷 연결 {checklist.internet ? '양호' : '불안정'}</span>
      </div>
      
      {!checklist.camera && (
        <button onClick={() => requestCameraPermission()}>
          카메라 권한 요청
        </button>
      )}
      
      {!checklist.microphone && (
        <button onClick={() => requestMicrophonePermission()}>
          마이크 권한 요청
        </button>
      )}
    </div>
  );
}
```

## 실시간 화상 상담

### Agora 통합

```typescript
// hooks/useAgoraClient.ts
import { useEffect, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
  ILocalAudioTrack,
} from 'agora-rtc-sdk-ng';

export function useAgoraClient() {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  useEffect(() => {
    const agoraClient = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });
    
    // 이벤트 핸들러 설정
    agoraClient.on('user-published', async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers(users => [...users, user]);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });
    
    agoraClient.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers(users => users.filter(u => u.uid !== user.uid));
      }
    });
    
    agoraClient.on('user-left', (user) => {
      setRemoteUsers(users => users.filter(u => u.uid !== user.uid));
    });
    
    setClient(agoraClient);
    
    return () => {
      agoraClient.removeAllListeners();
    };
  }, []);
  
  const join = useCallback(async (channel: string, token: string, uid?: number) => {
    if (!client) return;
    
    try {
      // Agora 채널 참가
      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channel,
        token,
        uid
      );
      
      // 로컬 트랙 생성
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      // 트랙 발행
      await client.publish([audioTrack, videoTrack]);
      
      setIsJoined(true);
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  }, [client]);
  
  const leave = useCallback(async () => {
    if (!client) return;
    
    try {
      // 트랙 정리
      localAudioTrack?.close();
      localVideoTrack?.close();
      
      // 채널 나가기
      await client.leave();
      
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers([]);
      setIsJoined(false);
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  }, [client, localAudioTrack, localVideoTrack]);
  
  const toggleMute = useCallback(() => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localAudioTrack, isMuted]);
  
  const toggleVideo = useCallback(() => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  }, [localVideoTrack, isVideoOff]);
  
  return {
    client,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isMuted,
    isVideoOff,
    join,
    leave,
    toggleMute,
    toggleVideo,
  };
}
```

### 상담방 UI

```typescript
// pages/consultation/room/[id].tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAgoraClient } from '@/hooks/useAgoraClient';
import { useConsultationWebSocket } from '@/hooks/useConsultationWebSocket';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { VideoControls } from '@/components/consultation/VideoControls';
import { ChatPanel } from '@/components/consultation/ChatPanel';
import { Timer } from '@/components/consultation/Timer';

export default function ConsultationRoom() {
  const router = useRouter();
  const { id: consultationId } = router.query;
  const [consultation, setConsultation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const {
    localVideoTrack,
    remoteUsers,
    isJoined,
    isMuted,
    isVideoOff,
    join,
    leave,
    toggleMute,
    toggleVideo,
  } = useAgoraClient();
  
  const { status, sendPresence } = useConsultationWebSocket(consultationId as string);
  const { messages, sendMessage } = useChatWebSocket(consultationId as string);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchConsultationAndJoin();
    
    // 10초마다 presence 업데이트
    const presenceInterval = setInterval(() => {
      sendPresence();
    }, 10000);
    
    return () => {
      clearInterval(presenceInterval);
      handleLeaveRoom();
    };
  }, [consultationId]);
  
  useEffect(() => {
    // 로컬 비디오 렌더링
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);
  
  const fetchConsultationAndJoin = async () => {
    try {
      const data = await ConsultationAPI.getConsultation(consultationId as string);
      setConsultation(data);
      
      if (data.agora_token && data.agora_channel) {
        await join(data.agora_channel, data.agora_token, data.agora_uid);
      }
    } catch (error) {
      console.error('Failed to join consultation:', error);
      toast.error('상담방 입장에 실패했습니다');
    }
  };
  
  const handleLeaveRoom = async () => {
    await leave();
    router.push(`/consultation/complete/${consultationId}`);
  };
  
  const handleExtendTime = async () => {
    try {
      await ConsultationAPI.extendConsultation(consultationId as string, {
        additional_minutes: 30,
      });
      toast.success('상담 시간이 30분 연장되었습니다');
    } catch (error) {
      toast.error('시간 연장에 실패했습니다');
    }
  };
  
  return (
    <div className="consultation-room">
      <div className="video-section">
        <div className="video-grid">
          <div className="local-video" ref={localVideoRef}>
            {isVideoOff && (
              <div className="video-off-placeholder">
                <span>카메라 꺼짐</span>
              </div>
            )}
          </div>
          
          {remoteUsers.map(user => (
            <RemoteVideo key={user.uid} user={user} />
          ))}
        </div>
        
        <VideoControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onLeave={handleLeaveRoom}
          onToggleChat={() => setShowChat(!showChat)}
        />
      </div>
      
      <div className="info-section">
        <Timer 
          startTime={consultation?.started_at}
          duration={consultation?.duration}
          onExtend={handleExtendTime}
        />
        
        {consultation && (
          <div className="consultation-info">
            <h3>상담 정보</h3>
            <p>아이: {consultation.child_profile.name}</p>
            <p>주요 고민: {consultation.concern_summary}</p>
          </div>
        )}
      </div>
      
      {showChat && (
        <ChatPanel
          messages={messages}
          onSendMessage={sendMessage}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
```

## 상담 진행 관리

### 상담 타이머 및 연장

```typescript
// components/consultation/Timer.tsx
import { useEffect, useState } from 'react';
import { formatDuration } from '@/utils/time';

interface TimerProps {
  startTime?: string;
  duration: number; // minutes
  onExtend: () => void;
}

export function Timer({ startTime, duration, onExtend }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(duration * 60);
  const [showExtendWarning, setShowExtendWarning] = useState(false);
  
  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      
      setElapsed(elapsedSeconds);
      
      const remainingSeconds = (duration * 60) - elapsedSeconds;
      setRemaining(Math.max(0, remainingSeconds));
      
      // 5분 남았을 때 연장 알림
      if (remainingSeconds === 300 && !showExtendWarning) {
        setShowExtendWarning(true);
      }
      
      // 시간 종료
      if (remainingSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, duration]);
  
  return (
    <div className="consultation-timer">
      <div className="timer-display">
        <div className="elapsed">
          <span className="label">진행 시간</span>
          <span className="time">{formatDuration(elapsed)}</span>
        </div>
        
        <div className={`remaining ${remaining < 300 ? 'warning' : ''}`}>
          <span className="label">남은 시간</span>
          <span className="time">{formatDuration(remaining)}</span>
        </div>
      </div>
      
      {showExtendWarning && (
        <div className="extend-warning">
          <p>상담이 5분 후 종료됩니다. 연장하시겠습니까?</p>
          <button onClick={onExtend} className="extend-button">
            30분 연장하기
          </button>
        </div>
      )}
    </div>
  );
}
```

### 실시간 메모 작성 (전문가용)

```typescript
// components/consultation/ExpertNotes.tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { ConsultationAPI } from '@/lib/api/consultation';

export function ExpertNotes({ consultationId }: { consultationId: string }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const debouncedNotes = useDebounce(notes, 1000);
  
  useEffect(() => {
    if (debouncedNotes) {
      saveNotes();
    }
  }, [debouncedNotes]);
  
  const saveNotes = async () => {
    setSaving(true);
    try {
      await ConsultationAPI.updateNotes(consultationId, {
        notes: debouncedNotes,
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="expert-notes">
      <div className="notes-header">
        <h3>상담 메모</h3>
        {saving && <span className="saving">저장 중...</span>}
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="상담 중 중요한 내용을 메모하세요"
        rows={10}
      />
      
      <div className="quick-notes">
        <h4>빠른 메모</h4>
        <div className="quick-note-buttons">
          {[
            '언어 발달 지연',
            '사회성 어려움',
            '감각 예민',
            '행동 조절 어려움',
            '주의력 부족',
          ].map(tag => (
            <button
              key={tag}
              onClick={() => setNotes(prev => `${prev}\n- ${tag}`)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 상담 종료 및 보고서

### 상담 종료 화면

```typescript
// pages/consultation/complete/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ConsultationAPI } from '@/lib/api/consultation';
import { StarRating } from '@/components/common/StarRating';

export default function ConsultationComplete() {
  const router = useRouter();
  const { id: consultationId } = router.query;
  const [consultation, setConsultation] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);
  
  const fetchConsultation = async () => {
    const data = await ConsultationAPI.getConsultation(consultationId as string);
    setConsultation(data);
  };
  
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('별점을 선택해주세요');
      return;
    }
    
    setSubmitting(true);
    try {
      await ConsultationAPI.submitReview(consultationId as string, {
        rating,
        comment: review,
      });
      
      toast.success('리뷰가 등록되었습니다');
      router.push('/consultations');
    } catch (error) {
      toast.error('리뷰 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="consultation-complete">
      <div className="complete-header">
        <CheckCircle size={48} className="success-icon" />
        <h1>상담이 완료되었습니다</h1>
      </div>
      
      {consultation && (
        <>
          <div className="consultation-summary">
            <h2>상담 요약</h2>
            <div className="summary-item">
              <span>전문가:</span>
              <span>{consultation.expert.name}</span>
            </div>
            <div className="summary-item">
              <span>상담 시간:</span>
              <span>{consultation.duration}분</span>
            </div>
            <div className="summary-item">
              <span>상담 날짜:</span>
              <span>{formatDate(consultation.scheduled_at)}</span>
            </div>
          </div>
          
          <div className="review-section">
            <h2>상담은 어떠셨나요?</h2>
            
            <StarRating
              value={rating}
              onChange={setRating}
              size={40}
            />
            
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="상담 경험을 공유해주세요 (선택사항)"
              rows={4}
            />
            
            <button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              className="submit-review-button"
            >
              {submitting ? '제출 중...' : '리뷰 제출'}
            </button>
          </div>
          
          {consultation.report && (
            <div className="report-section">
              <h2>상담 보고서</h2>
              <p>전문가가 작성한 상담 보고서를 확인하실 수 있습니다.</p>
              <button
                onClick={() => router.push(`/consultations/${consultationId}/report`)}
                className="view-report-button"
              >
                보고서 보기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 상담 보고서 작성 (전문가용)

```typescript
// components/consultation/ReportForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConsultationAPI } from '@/lib/api/consultation';
import { ReportTemplate } from '@/components/consultation/ReportTemplate';

interface ReportData {
  overall_assessment: string;
  observed_behaviors: string[];
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string;
  home_activities: string;
  follow_up_needed: boolean;
  next_consultation_recommended?: string;
}

export function ReportForm({ consultationId }: { consultationId: string }) {
  const [useTemplate, setUseTemplate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue } = useForm<ReportData>();
  
  const onSubmit = async (data: ReportData) => {
    setSubmitting(true);
    try {
      await ConsultationAPI.submitReport(consultationId, data);
      toast.success('보고서가 저장되었습니다');
    } catch (error) {
      toast.error('보고서 저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };
  
  const loadTemplate = (template: Partial<ReportData>) => {
    Object.entries(template).forEach(([key, value]) => {
      setValue(key as keyof ReportData, value);
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="report-form">
      {useTemplate && (
        <ReportTemplate onSelectTemplate={loadTemplate} />
      )}
      
      <div className="form-section">
        <h3>전반적 평가</h3>
        <textarea
          {...register('overall_assessment', { required: true })}
          rows={5}
          placeholder="아이의 전반적인 상태와 발달 수준을 평가해주세요"
        />
      </div>
      
      <div className="form-section">
        <h3>관찰된 행동</h3>
        <ObservedBehaviorsInput
          onChange={(behaviors) => setValue('observed_behaviors', behaviors)}
        />
      </div>
      
      <div className="form-section">
        <h3>강점</h3>
        <StrengthsList
          onChange={(strengths) => setValue('strengths', strengths)}
        />
      </div>
      
      <div className="form-section">
        <h3>개선이 필요한 영역</h3>
        <ImprovementAreasList
          onChange={(areas) => setValue('areas_for_improvement', areas)}
        />
      </div>
      
      <div className="form-section">
        <h3>권장사항</h3>
        <textarea
          {...register('recommendations', { required: true })}
          rows={5}
          placeholder="부모님께 권하는 치료나 교육 방향을 작성해주세요"
        />
      </div>
      
      <div className="form-section">
        <h3>가정 활동</h3>
        <textarea
          {...register('home_activities')}
          rows={4}
          placeholder="집에서 할 수 있는 활동을 제안해주세요"
        />
      </div>
      
      <div className="form-section">
        <label>
          <input
            type="checkbox"
            {...register('follow_up_needed')}
          />
          <span>후속 상담 필요</span>
        </label>
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? '저장 중...' : '보고서 저장'}
      </button>
    </form>
  );
}
```

## 결제 및 정산

### 크레딧 차감 시스템

```typescript
// lib/api/payment.ts
export class PaymentAPI {
  // 상담 결제 (크레딧 차감)
  static async payForConsultation(consultationId: string) {
    const response = await apiClient.post(
      `/consultations/${consultationId}/payment/`,
      {
        payment_method: 'credit',
      }
    );
    return response.data;
  }
  
  // 크레딧 잔액 확인
  static async checkBalance() {
    const response = await apiClient.get('/wallet/balance/');
    return response.data;
  }
  
  // 크레딧 구매
  static async purchaseCredits(amount: number, method: string) {
    const response = await apiClient.post('/wallet/purchase/', {
      amount,
      payment_method: method,
    });
    return response.data;
  }
}
```

### 정산 대시보드 (전문가용)

```typescript
// pages/expert/settlement.tsx
import { useEffect, useState } from 'react';
import { SettlementAPI } from '@/lib/api/settlement';
import { SettlementChart } from '@/components/expert/SettlementChart';

export default function SettlementDashboard() {
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  
  useEffect(() => {
    fetchSettlements();
  }, [filter]);
  
  const fetchSettlements = async () => {
    const data = await SettlementAPI.getSettlements(filter);
    setSettlements(data.settlements);
    setSummary(data.summary);
  };
  
  return (
    <div className="settlement-dashboard">
      <h1>정산 관리</h1>
      
      {summary && (
        <div className="summary-cards">
          <div className="card">
            <h3>이번 달 수익</h3>
            <p className="amount">{summary.current_month_revenue.toLocaleString()}원</p>
          </div>
          
          <div className="card">
            <h3>정산 예정 금액</h3>
            <p className="amount">{summary.pending_settlement.toLocaleString()}원</p>
            <small>정산일: 매월 25일</small>
          </div>
          
          <div className="card">
            <h3>완료된 상담</h3>
            <p className="count">{summary.completed_consultations}건</p>
          </div>
        </div>
      )}
      
      <SettlementChart data={settlements} />
      
      <div className="settlement-list">
        <h2>상담 내역</h2>
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>내담자</th>
              <th>상담 시간</th>
              <th>금액</th>
              <th>수수료</th>
              <th>정산액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map(item => (
              <tr key={item.id}>
                <td>{formatDate(item.consultation_date)}</td>
                <td>{item.client_name}</td>
                <td>{item.duration}분</td>
                <td>{item.amount.toLocaleString()}원</td>
                <td>{item.commission.toLocaleString()}원</td>
                <td>{item.settlement_amount.toLocaleString()}원</td>
                <td>
                  <span className={`status ${item.status}`}>
                    {item.status === 'settled' ? '정산완료' : '정산대기'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## 자동화 시스템

### Celery 태스크 모니터링

```typescript
// components/admin/TaskMonitor.tsx
import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api/admin';

export function TaskMonitor() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchTaskStatus();
    const interval = setInterval(fetchTaskStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchTaskStatus = async () => {
    const data = await AdminAPI.getCeleryTasks();
    setTasks(data.tasks);
    setStats(data.stats);
  };
  
  return (
    <div className="task-monitor">
      <h2>백그라운드 작업 모니터</h2>
      
      {stats && (
        <div className="task-stats">
          <div>활성: {stats.active}</div>
          <div>대기: {stats.scheduled}</div>
          <div>실패: {stats.failed}</div>
        </div>
      )}
      
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task ${task.status}`}>
            <span>{task.name}</span>
            <span>{task.status}</span>
            <span>{task.eta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 예외 처리

### 노쇼 처리

```typescript
// utils/consultation.ts
export function handleNoShow(consultation: Consultation) {
  // 상담 시작 10분 후 자동 노쇼 처리
  const startTime = new Date(consultation.scheduled_at);
  const nowTime = new Date();
  const diffMinutes = (nowTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  if (diffMinutes > 10 && consultation.status === 'confirmed') {
    return {
      shouldMarkNoShow: true,
      refundAmount: consultation.price, // 100% 환불
    };
  }
  
  return { shouldMarkNoShow: false };
}
```

### 취소 정책

```typescript
// components/consultation/CancellationPolicy.tsx
export function CancellationPolicy({ consultation }: { consultation: Consultation }) {
  const calculateRefund = () => {
    const now = new Date();
    const consultTime = new Date(consultation.scheduled_at);
    const hoursUntil = (consultTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil >= 24) {
      return { percentage: 100, amount: consultation.price };
    } else if (hoursUntil >= 12) {
      return { percentage: 50, amount: consultation.price * 0.5 };
    } else {
      return { percentage: 0, amount: 0 };
    }
  };
  
  const refund = calculateRefund();
  
  return (
    <div className="cancellation-policy">
      <h3>취소 정책</h3>
      <ul>
        <li>24시간 전: 100% 환불</li>
        <li>12-24시간 전: 50% 환불</li>
        <li>12시간 이내: 환불 불가</li>
      </ul>
      
      <div className="current-refund">
        <p>현재 취소 시 환불액:</p>
        <p className="amount">
          {refund.amount.toLocaleString()}원 ({refund.percentage}%)
        </p>
      </div>
    </div>
  );
}
```

## 모니터링 대시보드

### 실시간 상담 현황

```typescript
// pages/admin/consultation-monitor.tsx
import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api/admin';
import { ConsultationStatusCard } from '@/components/admin/ConsultationStatusCard';

export default function ConsultationMonitor() {
  const [activeConsultations, setActiveConsultations] = useState([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  useEffect(() => {
    fetchConsultationStatus();
    const interval = setInterval(fetchConsultationStatus, 30000); // 30초마다
    return () => clearInterval(interval);
  }, []);
  
  const fetchConsultationStatus = async () => {
    const data = await AdminAPI.getConsultationStatus();
    setActiveConsultations(data.active);
    setUpcomingConsultations(data.upcoming);
    setStatistics(data.statistics);
  };
  
  return (
    <div className="consultation-monitor">
      <h1>상담 모니터링</h1>
      
      {statistics && (
        <div className="statistics">
          <div className="stat-card">
            <h3>오늘 상담</h3>
            <p>{statistics.today_total}</p>
          </div>
          <div className="stat-card">
            <h3>진행 중</h3>
            <p>{statistics.in_progress}</p>
          </div>
          <div className="stat-card">
            <h3>대기 중</h3>
            <p>{statistics.waiting}</p>
          </div>
          <div className="stat-card">
            <h3>완료</h3>
            <p>{statistics.completed}</p>
          </div>
        </div>
      )}
      
      <div className="consultation-sections">
        <div className="section">
          <h2>진행 중인 상담</h2>
          {activeConsultations.map(consultation => (
            <ConsultationStatusCard
              key={consultation.id}
              consultation={consultation}
              showControls
            />
          ))}
        </div>
        
        <div className="section">
          <h2>예정된 상담</h2>
          {upcomingConsultations.map(consultation => (
            <ConsultationStatusCard
              key={consultation.id}
              consultation={consultation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```