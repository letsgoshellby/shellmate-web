'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { CurriculumAPI } from '@/lib/api/curriculum';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { ChatAPI } from '@/lib/api/chat';
import { toPng } from 'html-to-image';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Calendar,
  X,
  Image as ImageIcon
} from 'lucide-react';

export default function CurriculumPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id;
  const curriculumFormRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [existingCurriculum, setExistingCurriculum] = useState(null);

  const [curriculumData, setCurriculumData] = useState({
    title: '',
    description: '',
    total_sessions: 0,
    sessions_info: []
  });

  useEffect(() => {
    loadConsultationData();
  }, [consultationId]);

  const loadConsultationData = async () => {
    try {
      setLoading(true);

      // 상담 정보 조회
      const consultationData = await ConsultationsAPI.getCounselingRequestDetail(consultationId);
      setConsultation(consultationData);

      // 세션 수 설정
      const totalSessions = consultationData.sessions?.length || 0;

      // 기존 커리큘럼이 있는지 확인
      try {
        const existingCurriculumData = await CurriculumAPI.getCurriculumByRequest(consultationId);
        setExistingCurriculum(existingCurriculumData);

        // 기존 커리큘럼 데이터로 폼 채우기
        setCurriculumData({
          title: existingCurriculumData.title || '',
          description: existingCurriculumData.description || '',
          total_sessions: existingCurriculumData.total_sessions || totalSessions,
          sessions_info: existingCurriculumData.sessions_info || []
        });
      } catch (error) {
        // 커리큘럼이 없는 경우 (404) - 새로 생성 모드
        if (error.response?.status === 404) {
          // 기본 세션 정보 생성 (1회차는 이미 완료되었으므로 2회차부터 UI에 표시)
          const defaultSessions = Array.from({ length: totalSessions }, (_, index) => ({
            session_number: index + 1,
            title: '',
            description: '',
            tags: '',
            duration_minutes: 50
          })).filter(session => session.session_number >= 2); // 2회차부터만 필터링

          setCurriculumData({
            title: `${consultationData.client?.name || '내담자'}님 맞춤 커리큘럼`,
            description: '',
            total_sessions: totalSessions,
            sessions_info: defaultSessions
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('상담 정보 로딩 실패:', error);
      toast.error('상담 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionInfoChange = (index, field, value) => {
    const updatedSessions = [...curriculumData.sessions_info];
    updatedSessions[index] = {
      ...updatedSessions[index],
      [field]: value
    };
    setCurriculumData({
      ...curriculumData,
      sessions_info: updatedSessions
    });
  };

  const handleAddSession = () => {
    // 마지막 세션 번호를 찾고 +1 (1회차는 이미 완료되었으므로 최소 2부터 시작)
    const lastSessionNumber = curriculumData.sessions_info.length > 0
      ? curriculumData.sessions_info[curriculumData.sessions_info.length - 1].session_number
      : 1; // 1회차 완료 후이므로 다음은 2회차
    const newSessionNumber = lastSessionNumber + 1;

    setCurriculumData({
      ...curriculumData,
      // total_sessions는 그대로 유지 (전체 세션 수는 상담 신청 시 결정됨)
      sessions_info: [
        ...curriculumData.sessions_info,
        {
          session_number: newSessionNumber,
          title: '',
          description: '',
          tags: '',
          duration_minutes: 50
        }
      ]
    });
  };

  const handleRemoveSession = (index) => {
    const updatedSessions = curriculumData.sessions_info.filter((_, i) => i !== index);
    // 세션 번호 재정렬 (2회차부터 시작)
    const reorderedSessions = updatedSessions.map((session, i) => ({
      ...session,
      session_number: i + 2  // 1회차는 이미 완료되었으므로 2부터 시작
    }));

    setCurriculumData({
      ...curriculumData,
      total_sessions: consultation.sessions?.length || curriculumData.total_sessions,
      sessions_info: reorderedSessions
    });
  };

  const findChatRoomId = async () => {
    try {
      // 채팅방 목록 조회
      const chatRooms = await ChatAPI.getChatRooms();
      console.log('📋 채팅방 목록:', chatRooms);

      // 현재 상담과 연결된 채팅방 찾기
      const chatRoom = Array.isArray(chatRooms)
        ? chatRooms.find(room => room.counseling_request_id === parseInt(consultationId) || room.counseling_request === parseInt(consultationId))
        : chatRooms?.results?.find(room => room.counseling_request_id === parseInt(consultationId) || room.counseling_request === parseInt(consultationId));

      console.log('💬 찾은 채팅방:', chatRoom);
      return chatRoom?.id;
    } catch (error) {
      console.error('채팅방 ID 찾기 실패:', error);
      return null;
    }
  };

  const captureAndSendCurriculum = async (chatRoomId) => {
    if (!curriculumFormRef.current) {
      console.error('커리큘럼 폼 참조를 찾을 수 없습니다');
      return;
    }

    try {
      // 커리큘럼을 이미지로 캡처
      const dataUrl = await toPng(curriculumFormRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      // Data URL을 Blob으로 변환
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Blob을 File 객체로 변환
      const file = new File([blob], 'curriculum.png', { type: 'image/png' });

      // 채팅 메시지로 전송
      await ChatAPI.sendMessage(chatRoomId, {
        message_type: 'CURRICULUM',
        image: file,
        content: `${curriculumData.title} - 커리큘럼이 작성되었습니다.`
      });

      console.log('커리큘럼 이미지가 채팅으로 전송되었습니다');
      toast.success('커리큘럼이 채팅방에 전송되었습니다');
    } catch (error) {
      console.error('커리큘럼 이미지 캡처/전송 실패:', error);
      // 이미지 전송 실패는 경고만 표시하고 계속 진행
      toast.error('커리큘럼 이미지를 채팅으로 전송하는데 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔍 디버깅: 토큰 상태 확인
    const { TokenStorage } = await import('@/lib/auth/tokenStorage');
    const accessToken = TokenStorage.getAccessToken();
    const tokenStatus = TokenStorage.getTokenStatus();
    // console.log('🔑 [인증] Access Token:', accessToken ? '존재함' : '없음');
    // console.log('🔑 [인증] Token Status:', tokenStatus);

    if (!accessToken) {
      toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
      router.push('/auth/login');
      return;
    }

    // 유효성 검사
    if (!curriculumData.title.trim()) {
      toast.error('커리큘럼 제목을 입력해주세요');
      return;
    }

    if (curriculumData.sessions_info.length === 0) {
      toast.error('최소 1개 이상의 세션 정보를 입력해주세요');
      return;
    }

    // 모든 세션에 제목이 있는지 확인
    const hasEmptyTitle = curriculumData.sessions_info.some(session => !session.title.trim());
    if (hasEmptyTitle) {
      toast.error('모든 세션의 제목을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      // 백엔드 API 스키마에 맞춰 데이터 준비
      // 백엔드는 추가 회차(2~N회차)만 받음 (1회차는 이미 완료되었으므로 제외)
      // 회차 번호를 1부터 시작하도록 재정렬
      const sessionsForBackend = curriculumData.sessions_info.map((session, index) => ({
        session_number: index + 1,  // 1부터 시작
        title: session.title,
        description: session.description || '',
        tags: session.tags ? session.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        duration_minutes: session.duration_minutes || 50
      }));

      const submitData = {
        counseling_request_id: parseInt(consultationId),
        title: curriculumData.title,
        description: curriculumData.description,
        total_sessions: sessionsForBackend.length,  // 추가 회차 수 (1회차 제외)
        sessions_info: sessionsForBackend
      };

      if (existingCurriculum) {
        // 수정
        await CurriculumAPI.updateCurriculum(existingCurriculum.id, submitData);
        toast.success('커리큘럼이 수정되었습니다');
      } else {
        // 생성
        await CurriculumAPI.createCurriculum(submitData);
        toast.success('커리큘럼이 생성되었습니다');
      }

      // 커리큘럼 저장 성공 후 이미지 캡처 및 채팅 전송
      let chatRoomId = consultation?.chat_room_id || consultation?.chatRoomId || consultation?.chat_room;

      // consultation 객체에 채팅방 ID가 없으면 채팅방 목록에서 찾기
      if (!chatRoomId) {
        console.log('📋 Consultation 객체에 채팅방 ID가 없어 채팅방 목록에서 검색합니다...');
        chatRoomId = await findChatRoomId();
      }

      console.log('💬 최종 채팅방 ID:', chatRoomId);

      if (chatRoomId) {
        await captureAndSendCurriculum(chatRoomId);
      } else {
        console.warn('채팅방 ID를 찾을 수 없어 커리큘럼 이미지를 전송하지 못했습니다');
        toast.error('채팅방을 찾을 수 없어 이미지를 전송하지 못했습니다');
      }

      router.push('/expert/consultations');
    } catch (error) {
      console.error('커리큘럼 저장 실패:', error);
      console.error('에러 응답:', error.response);
      console.error('에러 데이터:', error.response?.data);

      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          '커리큘럼 저장에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !consultation) {
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

  // 읽기 전용 뷰 (이미 제출된 커리큘럼)
  if (existingCurriculum) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/expert/consultations')}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                상담 목록으로
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">커리큘럼</h1>
              <p className="text-gray-600">
                {consultation?.client?.name || '내담자'}님의 커리큘럼
              </p>
            </div>

            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {existingCurriculum.title}
                </CardTitle>
                {existingCurriculum.description && (
                  <CardDescription className="text-sm text-gray-700 whitespace-pre-wrap">
                    {existingCurriculum.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>총 {existingCurriculum.total_sessions}회차 커리큘럼</span>
                </div>
              </CardContent>
            </Card>

            {/* 세션별 정보 */}
            <div className="space-y-4">
              {(existingCurriculum.sessions_info || []).map((session, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {session.session_number}
                      </span>
                      {session.session_number}회차 — {session.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.description && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {session.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {session.duration_minutes && (
                        <span>소요 시간: {session.duration_minutes}분</span>
                      )}
                      {session.tags && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(session.tags) ? session.tags : session.tags.split(',')).map((tag, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/expert/consultations')}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                상담 목록으로
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">커리큘럼 설계</h1>
              <p className="text-gray-600">
                {consultation?.client?.name || '내담자'}님을 위한 맞춤 커리큘럼을 설계하세요
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 커리큘럼 캡처 영역 */}
            <div ref={curriculumFormRef}>
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  커리큘럼 기본 정보
                </CardTitle>
                <CardDescription>
                  전체 커리큘럼의 제목과 설명을 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">커리큘럼 제목 *</Label>
                  <Input
                    id="title"
                    value={curriculumData.title}
                    onChange={(e) => setCurriculumData({ ...curriculumData, title: e.target.value })}
                    placeholder="예: ADHD 아동을 위한 7주 집중 프로그램"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">커리큘럼 설명</Label>
                  <Textarea
                    id="description"
                    value={curriculumData.description}
                    onChange={(e) => setCurriculumData({ ...curriculumData, description: e.target.value })}
                    placeholder="커리큘럼의 전반적인 목표와 방향성을 설명해주세요"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_sessions">총 세션 수</Label>
                  <Input
                    id="total_sessions"
                    type="number"
                    value={curriculumData.total_sessions}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    현재 상담 신청의 세션 수: {consultation?.sessions?.length || 0}개
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 세션별 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  세션별 상세 계획
                </CardTitle>
                <CardDescription>
                  각 세션의 제목, 목표, 활동 내용을 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {curriculumData.sessions_info.map((session, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {session.session_number}회차
                        </CardTitle>
                        {curriculumData.sessions_info.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSession(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`session-title-${index}`}>세션 제목 *</Label>
                        <Input
                          id={`session-title-${index}`}
                          value={session.title}
                          onChange={(e) => handleSessionInfoChange(index, 'title', e.target.value)}
                          placeholder="예: 감정 인식 및 표현 훈련"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`session-description-${index}`}>세션 설명</Label>
                        <Textarea
                          id={`session-description-${index}`}
                          value={session.description}
                          onChange={(e) => handleSessionInfoChange(index, 'description', e.target.value)}
                          placeholder="이 세션의 목표, 활동 내용, 기대 효과 등을 작성하세요"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`session-tags-${index}`}>태그</Label>
                          <Input
                            id={`session-tags-${index}`}
                            value={session.tags}
                            onChange={(e) => handleSessionInfoChange(index, 'tags', e.target.value)}
                            placeholder="감정조절, 사회성"
                          />
                          <p className="text-xs text-gray-500">쉼표(,)로 구분</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`session-duration-${index}`}>소요 시간 (분)</Label>
                          <Input
                            id={`session-duration-${index}`}
                            type="number"
                            value={session.duration_minutes}
                            onChange={(e) => handleSessionInfoChange(index, 'duration_minutes', parseInt(e.target.value) || 50)}
                            min={30}
                            max={120}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSession}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  세션 추가
                </Button>
              </CardContent>
            </Card>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/expert/consultations')}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {existingCurriculum ? '수정하기' : '생성하기'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
