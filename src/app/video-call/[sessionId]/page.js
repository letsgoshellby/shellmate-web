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
import { useAuth } from '@/contexts/AuthContext';

export default function VideoCallPage({ params }) {
  const unwrappedParams = use(params);
  const sessionId = parseInt(unwrappedParams.sessionId);
  const router = useRouter();
  const { isExpert } = useAuth();

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
  const [showLogPromptModal, setShowLogPromptModal] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [userType, setUserType] = useState(null);
  const [scheduledStartTime, setScheduledStartTime] = useState(null);
  const [sessionNumber, setSessionNumber] = useState(null);

  const timeWarningShownRef = useRef(false);
  const timeWarningTimerRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingRemoteTrackRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const agoraServiceRef = useRef(null);
  const isInitializedRef = useRef(false);
  const tokenRefreshTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
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

  // isRemoteVideoOn이 true로 바뀐 후 div가 visible해진 시점에 play
  // 화면 공유는 contain(전체 표시), 카메라는 cover(꽉 채움)
  useEffect(() => {
    if (isRemoteVideoOn && pendingRemoteTrackRef.current && remoteVideoRef.current) {
      pendingRemoteTrackRef.current.play(remoteVideoRef.current, {
        fit: isRemoteScreenSharing ? 'contain' : 'cover',
      });
      pendingRemoteTrackRef.current = null;
    }
  }, [isRemoteVideoOn, isRemoteScreenSharing]);

  useEffect(() => {
    if (callDuration >= 45 * 60 && !timeWarningShownRef.current) {
      timeWarningShownRef.current = true;
      setShowTimeWarning(true);
      timeWarningTimerRef.current = setTimeout(() => {
        setShowTimeWarning(false);
      }, 10000);
    }
    return () => {
      if (timeWarningTimerRef.current) {
        clearTimeout(timeWarningTimerRef.current);
      }
    };
  }, [callDuration]);

  const initializeCall = async () => {
    try {
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }

      // 1. 세션 기본 정보 조회
      const sessionData = await AgoraAPI.getSession(sessionId);

      const counselingRequest = sessionData.counseling_request || {};

      // 2. 역할 판별 로직 - AuthContext 사용
      const currentUserType = isExpert ? 'expert' : 'client';
      setUserType(currentUserType);

      // 이름 설정
      const expertName = counselingRequest.expert?.user?.name || counselingRequest.expert?.name || counselingRequest.expert_name;
      const clientName = counselingRequest.client?.user?.name || counselingRequest.client?.name || counselingRequest.client_name;

      if (currentUserType === 'client') {
        setParticipantName(`${expertName || '전문가'} 전문가`);
      } else {
        setParticipantName(`${clientName || '학부모'} 학부모`);
      }

      // 3. 전문가이고 '예정' 상태라면 상담 활성화(Start API) 호출
      if (currentUserType === 'expert' && sessionData.status === 'SCHEDULED') {
        try {
          await AgoraAPI.startSession(sessionId);
        } catch (startErr) {
          console.warn('⚠️ 상담 시작 처리 건너뜀:', startErr.message);
        }
      }

      // 4. 화상 상담방 정보 조회 (Start 이후 호출해야 400 방지)
      const videoRoomData = await AgoraAPI.getVideoRoom(sessionId);

      setSessionInfo(`${sessionData.session_number || 1}회차`);
      setSessionNumber(sessionData.session_number || 1);
      const scheduledTime = sessionData.scheduled_time || sessionData.scheduled_at;
      if (scheduledTime) setScheduledStartTime(new Date(scheduledTime));

      // 5. Agora 서비스 세팅 (동적 임포트)
      const AgoraServiceModule = await import('@/lib/services/agoraService');
      const AgoraService = AgoraServiceModule.default;
      agoraServiceRef.current = new AgoraService();

      agoraServiceRef.current.setOnRemoteUserJoined((user, mediaType) => {
        setRemoteUid(user.uid);
        if (mediaType === 'video') {
          const trackLabel = user.videoTrack?.getMediaStreamTrack()?.label || '';
          setIsRemoteScreenSharing(trackLabel.includes('screen') || trackLabel.includes('window'));
          pendingRemoteTrackRef.current = user.videoTrack;
          setIsRemoteVideoOn(true);
        } else if (mediaType === 'audio') {
          // iOS에서 WebRTC 오디오가 이어피스로 라우팅되는 문제 방지
          // AudioContext를 통해 스피커(playback) 모드로 강제 전환
          try {
            const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const gain = ctx.createGain();
              gain.gain.value = 0;
              gain.connect(ctx.destination);
              const buf = ctx.createBuffer(1, 1, 22050);
              const src = ctx.createBufferSource();
              src.buffer = buf;
              src.connect(gain);
              src.start(0);
            }
          } catch (e) {}
          user.audioTrack?.setVolume(100);
          user.audioTrack?.play();
        }
      });

      agoraServiceRef.current.setOnRemoteUserLeft(async (_user, mediaType) => {
        if (mediaType === 'left') {
          setRemoteUid(null);
          setIsRemoteVideoOn(false);
          setIsRemoteScreenSharing(false);

          // 상대방이 나갔을 때 세션 완료 상태면 자동 이동
          try {
            const latestSession = await AgoraAPI.getSession(sessionId);
            if (latestSession.status === 'COMPLETED') {
              toast('상담이 종료되었습니다. 상담 목록으로 이동합니다.', { icon: '📋' });
              const destination = isExpert ? '/expert/consultations' : '/client/consultations';
              setTimeout(() => releaseMediaAndNavigate(destination), 2000);
            }
          } catch (e) {
            console.error('세션 상태 확인 실패:', e);
          }
        } else if (mediaType === 'video') {
          // 화면공유 중지 또는 카메라 끔 — 잠시 비디오 숨김 (user-published 오면 다시 표시됨)
          setIsRemoteVideoOn(false);
          setIsRemoteScreenSharing(false);
        }
      });

      agoraServiceRef.current.setOnScreenShareStatusChanged((uid, isSharing) => {
        setIsRemoteScreenSharing(isSharing);
      });

      // 브라우저 "공유 중지" 버튼으로 종료됐을 때 state 동기화
      agoraServiceRef.current.setOnScreenShareStopped(() => {
        setIsScreenSharing(false);
        if (localVideoRef.current) {
          agoraServiceRef.current?.playLocalVideo(localVideoRef.current);
        }
      });

      // 6. 채널 입장
      await agoraServiceRef.current.joinChannel(
        videoRoomData.app_id,
        videoRoomData.channel_name,
        videoRoomData.user_token || videoRoomData.token,
        videoRoomData.user_uid || videoRoomData.uid
      );

      // 7. 입장 로그
      try {
        await AgoraAPI.joinVideoRoom(sessionId);
      } catch (e) { console.error('로깅 실패:', e); }

      startTokenRefreshTimer();
      if (localVideoRef.current) {
        agoraServiceRef.current.playLocalVideo(localVideoRef.current);
      }

      // 화상 통화 중 화면 자동 꺼짐 방지
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          // 탭이 백그라운드에서 돌아올 때 wake lock 재요청
          document.addEventListener('visibilitychange', reacquireWakeLock);
        }
      } catch (e) {}

      setIsConnected(true);
      toast.success('화상 상담에 연결되었습니다');

    } catch (error) {
      console.error('🔴 초기화 실패:', error);
      const mediaErrors = {
        MEDIA_PERMISSION_DENIED: '카메라/마이크 권한이 거부되었습니다.\n브라우저 설정에서 권한을 허용해주세요.',
        MEDIA_DEVICE_NOT_FOUND: '카메라 또는 마이크를 찾을 수 없습니다.\n장치 연결을 확인해주세요.',
        MEDIA_DEVICE_IN_USE: '카메라 또는 마이크가 다른 앱에서 사용 중입니다.\n다른 앱을 종료 후 다시 시도해주세요.',
      };
      const message = mediaErrors[error.message] || error.response?.data?.message || '연결에 실패했습니다.';
      toast.error(message);
      setTimeout(() => router.back(), 2000);
    }
  };

  const reacquireWakeLock = async () => {
    if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (e) {}
    }
  };

  const cleanup = async () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
    if (timeWarningTimerRef.current) clearTimeout(timeWarningTimerRef.current);
    document.removeEventListener('visibilitychange', reacquireWakeLock);
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
    if (agoraServiceRef.current) {
      await agoraServiceRef.current.leaveChannel();
      agoraServiceRef.current = null;
    }
  };

  const startDurationTimer = () => {
    if (!scheduledStartTime) {
      console.warn('⚠️ 예약 시간 정보가 없어 타이머를 시작할 수 없습니다.');
      return;
    }
    const getElapsed = () => {
      const diff = Math.floor((Date.now() - scheduledStartTime.getTime()) / 1000);
      return diff < 0 ? 0 : diff;
    };
    setCallDuration(getElapsed());
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(getElapsed());
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startTokenRefreshTimer = () => {
    tokenRefreshTimerRef.current = setInterval(async () => {
      try {
        const tokenData = await AgoraAPI.refreshToken(sessionId);
        if (tokenData.user_token && agoraServiceRef.current) {
          await agoraServiceRef.current.renewToken(tokenData.user_token);
        }
      } catch (error) { console.error('토큰 갱신 실패:', error); }
    }, 25 * 60 * 1000);
  };

  const toggleMute = async () => {
    if (agoraServiceRef.current) {
      const enabled = await agoraServiceRef.current.toggleMic();
      setIsMuted(!enabled);
    }
  };

  const toggleCamera = async () => {
    if (agoraServiceRef.current) {
      const enabled = await agoraServiceRef.current.toggleCamera();
      setIsCameraOff(!enabled);
      setIsLocalVideoOn(enabled);
    }
  };

  const toggleSpeaker = () => {
    if (agoraServiceRef.current) {
      const newVolume = isSpeakerOn ? 0 : 100;
      agoraServiceRef.current.setVolume(newVolume);
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const switchCamera = async () => {
    if (agoraServiceRef.current) {
      try {
        await agoraServiceRef.current.switchCamera();
        toast.success('카메라 전환 완료');
      } catch (e) { toast.error('전환 실패'); }
    }
  };

  const toggleScreenShare = async () => {
    if (agoraServiceRef.current) {
      try {
        const isSharing = await agoraServiceRef.current.toggleScreenShare();
        setIsScreenSharing(isSharing);
        if (isSharing && localVideoRef.current) {
          // 로컬 미리보기 실패는 화면공유 자체와 무관하므로 격리
          try {
            agoraServiceRef.current.screenTrack?.play(localVideoRef.current);
          } catch {}
        } else if (localVideoRef.current) {
          agoraServiceRef.current.playLocalVideo(localVideoRef.current);
        }
      } catch (e) {
        if (e.name !== 'NotAllowedError') toast.error('화면 공유 실패');
        setIsScreenSharing(false);
        // publish까지 된 경우 정리
        if (agoraServiceRef.current?.isScreenSharing) {
          agoraServiceRef.current.stopScreenShare().catch(() => {});
        }
      }
    }
  };

  const releaseMediaAndNavigate = async (destination) => {
    try {
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }
    } catch (e) {
      console.error('leaveChannel 실패:', e);
    }
    router.push(destination);
  };

  const leaveOnly = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    const destination = userType === 'client' ? '/client/consultations' : '/expert/consultations';
    try {
      await AgoraAPI.leaveVideoRoom(sessionId);
    } catch (e) {
      console.error('leaveVideoRoom 실패:', e);
    }
    await releaseMediaAndNavigate(destination);
  };

  const completeSessionAndLeave = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    try {
      if (sessionNumber === 1) await AgoraAPI.completeInitialSession(sessionId);
      else await AgoraAPI.completeSession(sessionId);
      await AgoraAPI.leaveVideoRoom(sessionId);
    } catch (e) {
      console.error('상담 종료 API 실패:', e);
    }

    // 미디어 해제 후 전문가는 일지 작성 팝업, 내담자는 바로 이동
    if (agoraServiceRef.current) {
      await agoraServiceRef.current.leaveChannel();
      agoraServiceRef.current = null;
    }

    if (isExpert) {
      setShowEndCallModal(false);
      setShowLogPromptModal(true);
    } else {
      router.push('/client/consultations');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="relative w-full h-full">
        {remoteUid ? (
          <div className="w-full h-full">
            <div
              ref={remoteVideoRef}
              className="w-full h-full"
              style={{ display: isRemoteVideoOn ? 'block' : 'none' }}
            />
            {!isRemoteVideoOn && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-5xl font-bold">{participantName[0]}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mb-6">
                <span className="text-white text-5xl font-bold">{participantName[0]}</span>
              </div>
              <h2 className="text-white text-2xl font-bold mb-3">{participantName}</h2>
              <p className="text-gray-400 mb-6">상대방 대기 중...</p>
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          </div>
        )}

        {isScreenSharing && (
          <div className="absolute top-24 left-0 right-0 flex justify-center z-10">
            <div className="bg-primary px-4 py-2 rounded-full flex items-center gap-2">
              <MonitorUp className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-semibold">화면 공유 중</span>
            </div>
          </div>
        )}

        <div className="absolute top-24 right-4 w-32 h-44 rounded-xl border-2 border-white overflow-hidden shadow-lg bg-gray-800">
          <div
            ref={localVideoRef}
            className="w-full h-full"
            style={{ display: isLocalVideoOn ? 'block' : 'none' }}
          />
          {!isLocalVideoOn && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">나</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTimeWarning && (
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
          <div className="bg-orange-500 text-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-4 w-full max-w-sm">
            <span className="text-sm font-semibold flex-1">⏰ 상담 종료까지 5분 남았습니다.</span>
            <button
              onClick={() => {
                setShowTimeWarning(false);
                if (timeWarningTimerRef.current) clearTimeout(timeWarningTimerRef.current);
              }}
              className="bg-white text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white text-lg font-medium">{formatDuration(callDuration)}</p>
            <p className="text-gray-300 text-sm">{participantName}</p>
            <p className="text-gray-400 text-xs">{sessionInfo}</p>
          </div>
          <Button onClick={switchCamera} variant="ghost" size="icon" className="text-white"><SwitchCamera /></Button>
        </div>
      </div>

      <div className="absolute bottom-10 left-5 right-5">
        <div className="bg-black/80 rounded-full px-6 py-4 flex justify-evenly items-center shadow-xl">
          <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-gray-700' : 'bg-white'}`}>
            {isMuted ? <MicOff className="text-white" /> : <Mic className="text-black" />}
          </button>
          <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-gray-700' : 'bg-white'}`}>
            {isCameraOff ? <VideoOff className="text-white" /> : <Video className="text-black" />}
          </button>
          <button onClick={toggleScreenShare} className={`w-14 h-14 rounded-full flex items-center justify-center ${isScreenSharing ? 'bg-blue-600' : 'bg-white'}`}>
            {isScreenSharing ? <MonitorStop className="text-white" /> : <MonitorUp className="text-black" />}
          </button>
          <button onClick={toggleSpeaker} className={`w-14 h-14 rounded-full flex items-center justify-center ${!isSpeakerOn ? 'bg-gray-700' : 'bg-white'}`}>
            {isSpeakerOn ? <Volume2 className="text-black" /> : <VolumeX className="text-white" />}
          </button>
          <button onClick={() => setShowEndCallModal(true)} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
            <PhoneOff className="text-white" />
          </button>
        </div>
      </div>

      {showEndCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-center mb-6">상담방을 나가시겠습니까?</h3>
            <div className="space-y-3">
              <Button onClick={leaveOnly} variant="outline" className="w-full py-6" disabled={isEndingCall}>나만 나가기</Button>
              {isExpert && (
                <Button onClick={completeSessionAndLeave} className="w-full py-6 bg-red-600 text-white" disabled={isEndingCall}>상담 종료</Button>
              )}
              <Button onClick={() => setShowEndCallModal(false)} variant="ghost" className="w-full py-6" disabled={isEndingCall}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {showLogPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">상담이 끝났습니다</h3>
            <p className="text-gray-600 text-center text-sm">상담일지를 작성하시겠습니까?</p>
            <p className="text-gray-400 text-center text-xs">작성하여 제출하신 상담일지 내용은 내담자에게 공개됩니다.</p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/expert/consultations/${sessionId}/log`)}
              >
                작성하기
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/expert/consultations')}
              >
                나중에 하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}