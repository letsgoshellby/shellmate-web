'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CounselingLogAPI } from '@/lib/api/counselingLog';
import { AgoraAPI } from '@/lib/api/agora';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertCounselLogPage({ params }) {
  const unwrappedParams = use(params);
  const sessionId = parseInt(unwrappedParams.id);
  const router = useRouter();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [existingLogId, setExistingLogId] = useState(null);

  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionContent, setSessionContent] = useState('');
  const [counselorOpinion, setCounselorOpinion] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadSessionAndLog();
  }, []);

  const loadSessionAndLog = async () => {
    try {
      // 세션 정보 로드
      const session = await AgoraAPI.getSession(sessionId);
      setSessionInfo(session);

      // 기존 일지 확인
      const logs = await CounselingLogAPI.getCounselingLogs({ session_id: sessionId });

      if (logs && logs.length > 0) {
        const log = logs[0];

        // PUBLISHED 상태면 상세 페이지로 리다이렉트
        if (log.status === 'PUBLISHED') {
          router.replace(`/expert/consultations/${sessionId}/log/${log.id}`);
          return;
        }

        // DRAFT 상태면 기존 내용 불러오기
        setExistingLogId(log.id);
        setSessionGoal(log.session_goal || '');
        setSessionContent(log.session_content || '');
        setCounselorOpinion(log.counselor_opinion || '');
      }
    } catch (error) {
      console.error('세션/일지 로딩 실패:', error);
      toast.error('정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!sessionGoal.trim() && !sessionContent.trim() && !counselorOpinion.trim()) {
      toast.error('최소 한 항목 이상 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const data = {
        session_goal: sessionGoal.trim(),
        session_content: sessionContent.trim(),
        counselor_opinion: counselorOpinion.trim(),
        status: 'DRAFT',
      };

      if (existingLogId) {
        // 기존 일지 수정
        await CounselingLogAPI.updateLog(existingLogId, data);
      } else {
        // 새 일지 임시저장
        data.session_id = sessionId;
        const newLog = await CounselingLogAPI.createLog(data);
        setExistingLogId(newLog.id);
      }

      toast.success('임시저장되었습니다');
    } catch (error) {
      console.error('임시저장 실패:', error);
      toast.error('임시저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!sessionGoal.trim() || !sessionContent.trim() || !counselorOpinion.trim()) {
      toast.error('모든 항목을 입력해주세요');
      return;
    }

    const confirmed = window.confirm('저장 후에는 수정할 수 없습니다.\n저장하시겠습니까?');
    if (!confirmed) return;

    setPublishing(true);
    try {
      let publishedLog;

      if (existingLogId) {
        // 기존 DRAFT를 먼저 업데이트하고 발행
        const updateData = {
          session_goal: sessionGoal.trim(),
          session_content: sessionContent.trim(),
          counselor_opinion: counselorOpinion.trim(),
        };
        await CounselingLogAPI.updateLog(existingLogId, updateData);
        publishedLog = await CounselingLogAPI.publishLog(existingLogId);
      } else {
        // 새로 생성 (바로 PUBLISHED 상태로)
        const data = {
          session_id: sessionId,
          session_goal: sessionGoal.trim(),
          session_content: sessionContent.trim(),
          counselor_opinion: counselorOpinion.trim(),
          status: 'PUBLISHED',
        };
        publishedLog = await CounselingLogAPI.createLog(data);
      }

      toast.success('상담 일지가 저장되었습니다');

      // 상세 페이지로 이동
      router.push(`/expert/consultations/${sessionId}/log/${publishedLog.id}`);
    } catch (error) {
      console.error('발행 실패:', error);
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/expert/consultations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상담 일지 작성</h1>
              <p className="text-gray-600">상담 내용을 기록하고 저장하세요</p>
            </div>
          </div>

          {/* 세션 정보 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">회차</span>
                  <span className="font-medium">{sessionInfo?.session_number || '-'}회차</span>
                </div>
                <div>
                  <span className="text-gray-600 block">내담자</span>
                  <span className="font-medium">
                    {sessionInfo?.counseling_request?.client?.name ||
                     sessionInfo?.counseling_request?.client?.user?.name ||
                     sessionInfo?.client_name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">전문가</span>
                  <span className="font-medium">
                    {sessionInfo?.counseling_request?.expert?.name ||
                     sessionInfo?.counseling_request?.expert?.user?.name ||
                     sessionInfo?.expert_name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">상담일</span>
                  <span className="font-medium">
                    {formatDate(sessionInfo?.scheduled_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일지 작성 폼 */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* 회기 목표 */}
              <div className="space-y-2">
                <Label htmlFor="sessionGoal" className="text-base font-semibold">
                  회기 목표 *
                </Label>
                <Textarea
                  id="sessionGoal"
                  placeholder="이번 회기의 목표를 작성해주세요"
                  value={sessionGoal}
                  onChange={(e) => setSessionGoal(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* 회기 내용 */}
              <div className="space-y-2">
                <Label htmlFor="sessionContent" className="text-base font-semibold">
                  회기 내용 *
                </Label>
                <Textarea
                  id="sessionContent"
                  placeholder="상담 진행 내용을 상세히 기록해주세요"
                  value={sessionContent}
                  onChange={(e) => setSessionContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* 전문가 의견 */}
              <div className="space-y-2">
                <Label htmlFor="counselorOpinion" className="text-base font-semibold">
                  전문가 의견 *
                </Label>
                <Textarea
                  id="counselorOpinion"
                  placeholder="전문가로서의 의견과 다음 회기 계획을 작성해주세요"
                  value={counselorOpinion}
                  onChange={(e) => setCounselorOpinion(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* 하단 버튼 */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  임시저장
                </>
              )}
            </Button>

            <Button
              onClick={handlePublish}
              disabled={saving || publishing}
              className="flex-[1.5]"
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  작성 완료
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
