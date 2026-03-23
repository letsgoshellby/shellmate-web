'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CurriculumAPI } from '@/lib/api/curriculum';
import { ConsultationsAPI } from '@/lib/api/consultations';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCurriculumPage({ params }) {
  const unwrappedParams = use(params);
  const consultationId = unwrappedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [curriculum, setCurriculum] = useState(null);

  useEffect(() => {
    loadData();
  }, [consultationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 상담 정보 조회
      const consultationData = await ConsultationsAPI.getCounselingRequestDetail(consultationId);
      setConsultation(consultationData);

      // 커리큘럼 조회
      try {
        const curriculumData = await CurriculumAPI.getCurriculumByRequest(consultationId);
        setCurriculum(curriculumData);
      } catch (error) {
        if (error.response?.status === 404) {
          // 커리큘럼이 없는 경우
          setCurriculum(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/client/consultations')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">맞춤 커리큘럼</h1>
              <p className="text-gray-600">전문가가 설계한 맞춤 커리큘럼을 확인하세요</p>
            </div>
          </div>

          {/* 상담 정보 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">전문가</span>
                  <span className="font-medium">
                    {consultation?.expert?.name ||
                     consultation?.expert?.user?.name ||
                     '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">전문 분야</span>
                  <span className="font-medium">
                    {consultation?.expert?.specialty_display || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">상담 유형</span>
                  <span className="font-medium">
                    {consultation?.session_type_display || '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 커리큘럼 내용 */}
          {curriculum ? (
            <>
              {/* 커리큘럼 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {curriculum.title || '커리큘럼'}
                  </CardTitle>
                  {curriculum.description && (
                    <CardDescription className="text-base mt-2">
                      {curriculum.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>총 {curriculum.total_sessions}회차</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>생성일: {formatDate(curriculum.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 세션별 정보 */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">세션별 계획</h2>
                {curriculum.sessions_info && curriculum.sessions_info.length > 0 ? (
                  curriculum.sessions_info.map((session, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {session.session_number}회차
                          </CardTitle>
                          <Badge variant="outline" className="bg-blue-50">
                            {session.duration_minutes || 50}분
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 세션 제목 */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {session.title}
                          </h4>
                        </div>

                        {/* 세션 설명 */}
                        {session.description && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                세션 내용
                              </p>
                              <p className="text-gray-600 whitespace-pre-wrap">
                                {session.description}
                              </p>
                            </div>
                          </>
                        )}

                        {/* 태그 */}
                        {session.tags && session.tags.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                주요 주제
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {session.tags.map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="secondary"
                                    className="bg-gray-100"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">세션별 정보가 없습니다</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            // 커리큘럼이 없을 때
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    아직 작성된 커리큘럼이 없습니다
                  </h3>
                  <p className="text-gray-500">
                    전문가가 커리큘럼을 작성하면 여기에서 확인할 수 있습니다.
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
