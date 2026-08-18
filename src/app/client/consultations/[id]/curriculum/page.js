'use client';

import { useState, useEffect, use } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import CurriculumView from '@/components/curriculum/CurriculumView';
import { CurriculumAPI } from '@/lib/api/curriculum';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCurriculumPage({ params }) {
  const unwrappedParams = use(params);
  const consultationId = unwrappedParams.id;

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
            <BackButton />
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
          <CurriculumView curriculum={curriculum} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
