'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpertsAPI } from '@/lib/api/experts';
import { Star, Award, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ExpertsListPage() {
  const router = useRouter();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      const data = await ExpertsAPI.getExperts();
      const expertList = Array.isArray(data) ? data : data.results || [];

      // API 응답을 UI에 맞게 매핑
      const mappedExperts = expertList.map((expert) => ({
        id: expert.id,
        name: expert.name,
        title: expert.specialty_display || expert.specialty,
        specialties: expert.specialty ? [expert.specialty_display || expert.specialty] : [],
        experience_years: expert.experience_years || 0,
        rating: parseFloat(expert.rating) || 0,
        reviews_count: expert.review_count || 0,
        profile_image: expert.profile_image,
        introduction: expert.introduction || '',
        institution: expert.institution,
        workplace: expert.workplace,
        is_available: expert.is_available,
      }));

      setExperts(mappedExperts);
    } catch (error) {
      console.error('전문가 목록 로딩 실패:', error);
      toast.error('전문가 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleExpertClick = (expertId) => {
    router.push(`/client/experts/${expertId}`);
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">전문가 찾기</h1>
            <p className="text-gray-600 mt-2">우리 아이에게 맞는 전문가를 찾아보세요</p>
          </div>

          {/* 전문가 목록 */}
          <div className="grid grid-cols-1 gap-6">
            {experts.length > 0 ? (
              experts.map((expert) => (
                <Card
                  key={expert.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleExpertClick(expert.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {expert.profile_image ? (
                          <img
                            src={expert.profile_image}
                            alt={expert.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          expert.name.charAt(0)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{expert.name}</h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            <Award className="mr-1 h-3 w-3" />
                            {expert.title}
                          </Badge>
                          {!expert.is_available && (
                            <Badge variant="secondary">상담 불가</Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500 ml-1">({expert.reviews_count})</span>
                          </div>
                          <span className="text-sm text-gray-600">경력 {expert.experience_years}년</span>
                          {expert.institution && (
                            <span className="text-sm text-gray-600">{expert.institution}</span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {expert.introduction || '전문가 소개가 없습니다.'}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {expert.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">등록된 전문가가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
