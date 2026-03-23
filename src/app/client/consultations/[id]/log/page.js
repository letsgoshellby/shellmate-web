'use client';

import { useState, useEffect, use } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CounselingLogAPI } from '@/lib/api/counselingLog';
import { AgoraAPI } from '@/lib/api/agora';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientCounselLogPage({ params }) {
  const unwrappedParams = use(params);
  const sessionId = parseInt(unwrappedParams.id);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [counselingLog, setCounselingLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionAndLog();
  }, []);

  const loadSessionAndLog = async () => {
    try {
      // 세션 정보 로드
      const session = await AgoraAPI.getSession(sessionId);
      setSessionInfo(session);

      // 상담 일지 조회 (PUBLISHED 상태만)
      const response = await CounselingLogAPI.getCounselingLogs({
        session_id: sessionId,
        status: 'PUBLISHED'
      });

      // 페이지네이션된 응답에서 results 배열 추출
      const logs = response?.results || response;

      if (logs && logs.length > 0) {
        setCounselingLog(logs[0]);
      }
    } catch (error) {
      console.error('세션/일지 로딩 실패:', error);
      toast.error('정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
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
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/consultations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상담 일지</h1>
              <p className="text-gray-600">전문가가 작성한 상담 일지를 확인하세요</p>
            </div>
          </div>

          {/* 세션 정보 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">회차</span>
                  <span className="font-medium">
                    {counselingLog?.session_number || sessionInfo?.session_number || '-'}회차
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">전문가</span>
                  <span className="font-medium">
                    {counselingLog?.counselor_name ||
                     sessionInfo?.counseling_request?.expert?.user?.name ||
                     '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">전문 분야</span>
                  <span className="font-medium">
                    {sessionInfo?.counseling_request?.expert?.specialty_display || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">상담일</span>
                  <span className="font-medium">
                    {formatDate(counselingLog?.counseling_date || sessionInfo?.scheduled_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상담 일지 내용 */}
          {counselingLog ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* 회기 목표 */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">회기 목표</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {counselingLog.session_goal || '-'}
                    </p>
                  </div>
                </div>

                {/* 회기 내용 */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">회기 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {counselingLog.session_content || '-'}
                    </p>
                  </div>
                </div>

                {/* 전문가 의견 */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">전문가 의견</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {counselingLog.counselor_opinion || '-'}
                    </p>
                  </div>
                </div>

                {/* 작성 정보 */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    작성일: {formatDate(counselingLog.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // 일지가 없을 때
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    아직 작성된 상담 일지가 없습니다
                  </h3>
                  <p className="text-gray-500">
                    전문가가 상담 일지를 작성하면 여기에서 확인할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
