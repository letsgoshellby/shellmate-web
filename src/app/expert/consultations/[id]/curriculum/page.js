'use client';

import { useState, useEffect } from 'react';
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
