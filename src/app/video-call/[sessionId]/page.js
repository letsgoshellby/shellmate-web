'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  SwitchCamera,
  Loader2,
  MonitorUp,
  MonitorStop
} from 'lucide-react';
import { AgoraAPI } from '@/lib/api/agora';
import { toast } from 'react-hot-toast';
import AgoraService from '@/lib/services/agoraService';

export default function VideoCallPage({ params }) {
  const unwrappedParams = use(params);
  const sessionId = parseInt(unwrappedParams.sessionId);
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(true);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participantName, setParticipantName] = useState('상대방');
  const [sessionInfo, setSessionInfo] = useState('');
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [userType, setUserType] = useState(null); // 'client' or 'expert'
  const [scheduledStartTime, setScheduledStartTime] = useState(null); // 예약된 상담 시작 시간

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const agoraServiceRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // 이미 초기화되었으면 중복 실행 방지
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      startDurationTimer();
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('🎬 [VideoCallPage] 초기화 시작');
    // console.log('   sessionId:', sessionId);

    try {
      // 이미 연결되어 있으면 종료
      if (agoraServiceRef.current) {
        // console.log('⚠️ [VideoCallPage] 기존 연결 종료 중...');
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }

      // console.log('🔵 [VideoCallPage] 세션 정보 조회 중...');
      const sessionData = await AgoraAPI.getSession(sessionId);
      // console.log('✅ [VideoCallPage] 세션 정보:', sessionData);

      // 상대방 이름 설정 (client는 expert 이름, expert는 client 이름)
      const counselingRequest = sessionData.counseling_request || {};

      // 여러 경로에서 이름 정보 추출 시도
      const expertName = counselingRequest.expert?.user?.name
        || counselingRequest.expert?.name
        || counselingRequest.expert_name;

      const clientName = counselingRequest.client?.user?.name
        || counselingRequest.client?.name
        || counselingRequest.client_name;

      if (expertName) {
        // Client 입장 - 전문가 이름 표시
        setParticipantName(`${expertName} 전문가`);
        setUserType('client');
      } else if (clientName) {
        // Expert 입장 - 내담자 이름 표시
        setParticipantName(`${clientName} 학부모`);
        setUserType('expert');
      }

      // 디버깅을 위한 로그 (개발 중에만 사용)
      console.log('세션 데이터:', {
        counselingRequest,
        expertName,
        clientName,
        participantName: expertName || clientName || '상대방',
        userType: expertName ? 'client' : 'expert'
      });

      // 회차 정보 설정
      const sessionNumber = sessionData.session_number || 1;
      setSessionInfo(`${sessionNumber}회차`);

      // 예약된 상담 시작 시간 설정
      // 백엔드에서 오는 필드명에 따라 scheduled_time, scheduled_at, start_time 등을 시도
      const scheduledTime = sessionData.scheduled_time
        || sessionData.scheduled_at
        || counselingRequest.scheduled_time
        || counselingRequest.scheduled_at;

      if (scheduledTime) {
        // ISO 8601 형식의 날짜/시간 문자열을 Date 객체로 변환
        setScheduledStartTime(new Date(scheduledTime));
        console.log('예약된 상담 시작 시간:', scheduledTime);
      }

      // console.log('🔵 [VideoCallPage] Agora 화상방 정보 조회 중...');
      const videoRoomData = await AgoraAPI.getVideoRoom(sessionId);
      // console.log('✅ [VideoCallPage] 화상방 정보:', videoRoomData);

      // Agora 서비스 생성
      agoraServiceRef.current = new AgoraService();

      // 원격 사용자 입장 이벤트 핸들러
      agoraServiceRef.current.setOnRemoteUserJoined((user, mediaType) => {
        console.log('✅ [VideoCallPage] 원격 사용자 입장:', user.uid, mediaType);
        setRemoteUid(user.uid);

        if (mediaType === 'video') {
          // 화면공유 트랙인지 확인
          const trackLabel = user.videoTrack?.getMediaStreamTrack()?.label || '';
          const isScreenShare = trackLabel.includes('screen') || trackLabel.includes('window');

          console.log('📺 비디오 트랙 정보:', {
            label: trackLabel,
            isScreenShare,
            hasVideoTrack: !!user.videoTrack
          });

          setIsRemoteVideoOn(true);
          setIsRemoteScreenSharing(isScreenShare);

          // 원격 비디오/화면공유 재생
          setTimeout(() => {
            if (remoteVideoRef.current && user.videoTrack) {
              user.videoTrack.play(remoteVideoRef.current);
              console.log('✅ 원격 비디오 재생 완료:', user.uid);
            }
          }, 100);
        } else if (mediaType === 'audio') {
          if (user.audioTrack) {
            user.audioTrack.play();
            console.log('✅ 원격 오디오 재생 완료:', user.uid);
          }
        }
      });

      // 원격 사용자 퇴장 이벤트 핸들러
      agoraServiceRef.current.setOnRemoteUserLeft((user, mediaType) => {
        console.log('🔴 [VideoCallPage] 원격 사용자 퇴장:', user.uid, mediaType);
        if (mediaType === 'left') {
          // 완전히 퇴장
          setRemoteUid(null);
          setIsRemoteVideoOn(false);
          setIsRemoteScreenSharing(false);
        } else if (mediaType === 'video') {
          // 비디오만 중지 (오디오는 유지)
          setIsRemoteVideoOn(false);
          setIsRemoteScreenSharing(false);
        }
      });

      // Agora 채널 입장
      await agoraServiceRef.current.joinChannel(
        videoRoomData.app_id,
        videoRoomData.channel_name,
        videoRoomData.user_token || null,
        videoRoomData.user_uid || null
      );

      // 로컬 비디오 재생
      if (localVideoRef.current) {
        agoraServiceRef.current.playLocalVideo(localVideoRef.current);
      }

      setIsConnected(true);
      toast.success('화상 상담에 연결되었습니다');
    } catch (error) {
      // console.error('🔴 [VideoCallPage] 초기화 실패:', error);
      toast.error('화상 상담 연결에 실패했습니다');
      setTimeout(() => {
        router.back();
      }, 2000);
    }
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };

  const cleanup = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Agora SDK cleanup
    if (agoraServiceRef.current) {
      await agoraServiceRef.current.leaveChannel();
      agoraServiceRef.current = null;
    }
  };

  const startDurationTimer = () => {
    // 예약된 시작 시간이 있으면, 그 시간 기준으로 경과 시간 계산
    if (scheduledStartTime) {
      const now = new Date();
      const elapsedSeconds = Math.max(0, Math.floor((now - scheduledStartTime) / 1000));

      console.log('타이머 시작 - 예약 시간:', scheduledStartTime);
      console.log('타이머 시작 - 현재 시간:', now);
      console.log('타이머 시작 - 초기 경과 시간:', elapsedSeconds, '초');

      // 초기 경과 시간 설정
      setCallDuration(elapsedSeconds);

      // 1초마다 증가
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      // 예약 시간 정보가 없으면 입장 시점부터 카운트 (기존 방식)
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const toggleMute = async () => {
    if (agoraServiceRef.current) {
      const enabled = await agoraServiceRef.current.toggleMic();
      setIsMuted(!enabled);
      toast.success(enabled ? '마이크가 켜졌습니다' : '마이크가 꺼졌습니다');
    }
  };

  const toggleCamera = async () => {
    if (agoraServiceRef.current) {
      const enabled = await agoraServiceRef.current.toggleCamera();
      setIsCameraOff(!enabled);
      setIsLocalVideoOn(enabled);
      toast.success(enabled ? '카메라가 켜졌습니다' : '카메라가 꺼졌습니다');
    }
  };

  const toggleSpeaker = () => {
    if (agoraServiceRef.current) {
      const newVolume = isSpeakerOn ? 0 : 100;
      agoraServiceRef.current.setVolume(newVolume);
      setIsSpeakerOn(!isSpeakerOn);
      toast.success(isSpeakerOn ? '스피커가 꺼졌습니다' : '스피커가 켜졌습니다');
    }
  };

  const switchCamera = async () => {
    if (agoraServiceRef.current) {
      try {
        await agoraServiceRef.current.switchCamera();
        toast.success('카메라를 전환했습니다');
      } catch (error) {
        console.error('카메라 전환 실패:', error);
        toast.error('카메라 전환에 실패했습니다');
      }
    }
  };

  const toggleScreenShare = async () => {
    if (agoraServiceRef.current) {
      try {
        const isSharing = await agoraServiceRef.current.toggleScreenShare();
        setIsScreenSharing(isSharing);

        // 화면공유 시작 시 로컬 비디오를 화면공유 트랙으로 교체
        if (isSharing && localVideoRef.current) {
          const screenTrack = agoraServiceRef.current.screenTrack;
          if (screenTrack) {
            // 배열 형태인지 단일 트랙인지 확인
            const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
            track.play(localVideoRef.current);
            console.log('✅ 로컬 화면공유 재생');
          }
        } else if (!isSharing && localVideoRef.current) {
          // 화면공유 종료 시 다시 카메라 트랙으로 교체
          agoraServiceRef.current.playLocalVideo(localVideoRef.current);
        }

        toast.success(isSharing ? '화면 공유가 시작되었습니다' : '화면 공유가 중지되었습니다');
      } catch (error) {
        console.error('화면 공유 토글 실패:', error);
        // 사용자가 화면 공유를 취소한 경우는 에러로 표시하지 않음
        if (error.name !== 'NotAllowedError') {
          toast.error('화면 공유에 실패했습니다');
        }
        setIsScreenSharing(false);
      }
    }
  };

  const leaveOnly = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);

    try {
      // Agora SDK - 통화 종료
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }

      await AgoraAPI.leaveVideoRoom(sessionId);
      toast.success('상담방에서 나갔습니다');

      // 사용자 타입에 따라 적절한 페이지로 이동
      const redirectPath = userType === 'client'
        ? '/client/consultations'
        : '/expert/consultations';
      router.push(redirectPath);
    } catch (error) {
      console.error('🔴 나가기 실패:', error);
      // 에러 발생 시에도 적절한 페이지로 이동
      const redirectPath = userType === 'client'
        ? '/client/consultations'
        : '/expert/consultations';
      router.push(redirectPath);
    }
  };

  const completeSessionAndLeave = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);

    try {
      // console.log('🔵 [VideoCallPage] 상담 완료 처리 중...');
      // console.log('🔵 [VideoCallPage] Session ID:', sessionId);

      // Agora SDK - 통화 종료
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }

      // TODO: 상담 완료 API 호출 (백엔드에 완료 상태 업데이트)
      await AgoraAPI.leaveVideoRoom(sessionId);
      toast.success('상담이 종료되었습니다');

      // 사용자 타입에 따라 적절한 페이지로 이동
      const redirectPath = userType === 'client'
        ? '/client/consultations'
        : '/expert/consultations';
      router.push(redirectPath);
    } catch (error) {
      console.error('🔴 상담 종료 실패:', error);
      console.error('🔴 에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.response?.config?.url,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 404) {
        toast.error('상담 세션을 찾을 수 없습니다');
      } else {
        toast.error('상담 종료에 실패했습니다');
      }

      // 에러 발생 시에도 적절한 페이지로 이동
      const redirectPath = userType === 'client'
        ? '/client/consultations'
        : '/expert/consultations';
      router.push(redirectPath);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 비디오 영역 */}
      <div className="relative w-full h-full">
        {/* 원격 비디오 (전체 화면) */}
        {remoteUid ? (
          <div className="w-full h-full">
            {isRemoteVideoOn ? (
              <div ref={remoteVideoRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                    <span className="text-white text-5xl font-bold">
                      {participantName[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 대기 화면
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mb-6">
                <span className="text-white text-5xl font-bold">
                  {participantName[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-white text-2xl font-bold mb-3">{participantName}</h2>
              <p className="text-gray-400 text-lg mb-6">상대방 입장을 기다리는 중...</p>
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

        {/* 로컬 비디오 (작은 창) */}
        <div className="absolute top-24 right-4 w-32 h-44 rounded-xl border-2 border-white overflow-hidden shadow-lg">
          {isLocalVideoOn ? (
            <div ref={localVideoRef} className="w-full h-full bg-gray-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">나</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 상단 바 */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white text-lg font-medium">
              {isConnected ? formatDuration(callDuration) : '연결 중...'}
            </p>
            <p className="text-gray-300 text-sm">{participantName}</p>
            <p className="text-gray-400 text-xs">{sessionInfo}</p>
          </div>
          <Button
            onClick={switchCamera}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <SwitchCamera className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-10 left-5 right-5">
        <div className="bg-black/80 rounded-full px-6 py-4 shadow-xl">
          <div className="flex justify-evenly items-center">
            {/* 마이크 */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-gray-700 border-2 border-gray-600'
                  : 'bg-white/90 border-2 border-white'
              }`}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-black" />
              )}
            </button>

            {/* 카메라 */}
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isCameraOff
                  ? 'bg-gray-700 border-2 border-gray-600'
                  : 'bg-white/90 border-2 border-white'
              }`}
            >
              {isCameraOff ? (
                <VideoOff className="h-6 w-6 text-white" />
              ) : (
                <Video className="h-6 w-6 text-black" />
              )}
            </button>

            {/* 화면 공유 */}
            <button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing
                  ? 'bg-blue-600 border-2 border-blue-500'
                  : 'bg-white/90 border-2 border-white'
              }`}
            >
              {isScreenSharing ? (
                <MonitorStop className="h-6 w-6 text-white" />
              ) : (
                <MonitorUp className="h-6 w-6 text-black" />
              )}
            </button>

            {/* 스피커 */}
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                !isSpeakerOn
                  ? 'bg-gray-700 border-2 border-gray-600'
                  : 'bg-white/90 border-2 border-white'
              }`}
            >
              {isSpeakerOn ? (
                <Volume2 className="h-6 w-6 text-black" />
              ) : (
                <VolumeX className="h-6 w-6 text-white" />
              )}
            </button>

            {/* 종료 */}
            <button
              onClick={() => setShowEndCallModal(true)}
              className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center border-2 border-transparent shadow-lg"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 통화 종료 모달 */}
      {showEndCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-center mb-2">
              상담방을 나가시겠습니까?
            </h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              나만 나가기를 선택하면 다시 입장할 수 있습니다.
            </p>

            <div className="space-y-3">
              <Button
                onClick={leaveOnly}
                variant="outline"
                className="w-full py-6 text-base font-semibold border-2 border-primary text-primary hover:bg-primary/10"
                disabled={isEndingCall}
              >
                나만 나가기
              </Button>

              <Button
                onClick={completeSessionAndLeave}
                className="w-full py-6 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
                disabled={isEndingCall}
              >
                {isEndingCall ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '상담 종료'
                )}
              </Button>

              <Button
                onClick={() => setShowEndCallModal(false)}
                variant="ghost"
                className="w-full py-6 text-base font-medium text-gray-600"
                disabled={isEndingCall}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
