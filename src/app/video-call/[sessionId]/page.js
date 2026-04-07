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
  const [userType, setUserType] = useState(null); 
  const [scheduledStartTime, setScheduledStartTime] = useState(null);
  const [sessionType, setSessionType] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const agoraServiceRef = useRef(null);
  const isInitializedRef = useRef(false);
  const tokenRefreshTimerRef = useRef(null);

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

  const initializeCall = async () => {
    console.log('🎬 [VideoCallPage] 초기화 시작 - ID:', sessionId);

    try {
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.leaveChannel();
        agoraServiceRef.current = null;
      }

      // 1. 세션 기본 정보 조회
      const sessionData = await AgoraAPI.getSession(sessionId);
      console.log('📋 전체 세션 데이터:', sessionData);
      console.log('✅ 세션 상태:', sessionData.status);

      const counselingRequest = sessionData.counseling_request || {};

      // 2. 역할 판별 로직 - AuthContext 사용
      const currentUserType = isExpert ? 'expert' : 'client';
      console.log('👤 사용자 타입 (AuthContext):', currentUserType);
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
          console.log('🚀 전문가: 상담 시작(Start) API 호출...');
          await AgoraAPI.startSession(sessionId);
        } catch (startErr) {
          console.warn('⚠️ 상담 시작 처리 건너뜀:', startErr.message);
        }
      }

      // 4. 화상 상담방 정보 조회 (Start 이후 호출해야 400 방지)
      const videoRoomData = await AgoraAPI.getVideoRoom(sessionId);

      setSessionInfo(`${sessionData.session_number || 1}회차`);
      setSessionType(counselingRequest.session_type || 'SINGLE');
      const scheduledTime = sessionData.scheduled_time || sessionData.scheduled_at;
      if (scheduledTime) setScheduledStartTime(new Date(scheduledTime));

      // 5. Agora 서비스 세팅 (동적 임포트)
      const AgoraServiceModule = await import('@/lib/services/agoraService');
      const AgoraService = AgoraServiceModule.default;
      agoraServiceRef.current = new AgoraService();

      agoraServiceRef.current.setOnRemoteUserJoined((user, mediaType) => {
        setRemoteUid(user.uid);
        if (mediaType === 'video') {
          setIsRemoteVideoOn(true);
          const trackLabel = user.videoTrack?.getMediaStreamTrack()?.label || '';
          setIsRemoteScreenSharing(trackLabel.includes('screen') || trackLabel.includes('window'));
          setTimeout(() => {
            if (remoteVideoRef.current && user.videoTrack) {
              user.videoTrack.play(remoteVideoRef.current);
            }
          }, 100);
        } else if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      agoraServiceRef.current.setOnRemoteUserLeft((user, mediaType) => {
        if (mediaType === 'left') {
          setRemoteUid(null);
          setIsRemoteVideoOn(false);
          setIsRemoteScreenSharing(false);
        }
      });

      agoraServiceRef.current.setOnScreenShareStatusChanged((uid, isSharing) => {
        setIsRemoteScreenSharing(isSharing);
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

      setIsConnected(true);
      toast.success('화상 상담에 연결되었습니다');

    } catch (error) {
      console.error('🔴 초기화 실패:', error);
      toast.error(error.response?.data?.message || '연결에 실패했습니다.');
      setTimeout(() => router.back(), 2000);
    }
  };

  const cleanup = async () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
    if (agoraServiceRef.current) {
      await agoraServiceRef.current.leaveChannel();
      agoraServiceRef.current = null;
    }
  };

  const startDurationTimer = () => {
    if (scheduledStartTime) {
      const now = new Date();
      const elapsedSeconds = Math.max(0, Math.floor((now - scheduledStartTime) / 1000));
      setCallDuration(elapsedSeconds);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
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
          const track = Array.isArray(agoraServiceRef.current.screenTrack) 
            ? agoraServiceRef.current.screenTrack[0] 
            : agoraServiceRef.current.screenTrack;
          track?.play(localVideoRef.current);
        } else if (localVideoRef.current) {
          agoraServiceRef.current.playLocalVideo(localVideoRef.current);
        }
      } catch (e) {
        if (e.name !== 'NotAllowedError') toast.error('화면 공유 실패');
        setIsScreenSharing(false);
      }
    }
  };

  const leaveOnly = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    try {
      await AgoraAPI.leaveVideoRoom(sessionId);
      if (agoraServiceRef.current) await agoraServiceRef.current.leaveChannel();
      router.push(userType === 'client' ? '/client/consultations' : '/expert/consultations');
    } catch (e) { router.back(); }
  };

  const completeSessionAndLeave = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    try {
      if (sessionType === 'SINGLE') await AgoraAPI.completeInitialSession(sessionId);
      else await AgoraAPI.completeSession(sessionId);
      await AgoraAPI.leaveVideoRoom(sessionId);
      if (agoraServiceRef.current) await agoraServiceRef.current.leaveChannel();
      router.push(userType === 'client' ? '/client/consultations' : '/expert/consultations');
    } catch (e) { router.back(); }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="relative w-full h-full">
        {remoteUid ? (
          <div className="w-full h-full">
            {isRemoteVideoOn ? (
              <div ref={remoteVideoRef} className="w-full h-full" />
            ) : (
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
          {isLocalVideoOn ? (
            <div ref={localVideoRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">나</span>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <Button onClick={completeSessionAndLeave} className="w-full py-6 bg-red-600 text-white" disabled={isEndingCall}>상담 종료</Button>
              <Button onClick={() => setShowEndCallModal(false)} variant="ghost" className="w-full py-6" disabled={isEndingCall}>취소</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}