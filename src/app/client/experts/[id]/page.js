'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpertsAPI } from '@/lib/api/experts';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { ReviewAPI } from '@/lib/api/review';
import {
  ArrowLeft,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Building,
  CheckCircle,
  Calendar,
  Loader2,
  FileText,
  Coins,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertDetailPage({ params }) {
  const unwrappedParams = use(params);
  const expertId = unwrappedParams.id;
  const router = useRouter();
  const [expert, setExpert] = useState(null);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (expertId) {
      loadExpertDetail();
      loadPricingOptions();
      loadReviews();
    }
  }, [expertId]);

  const loadExpertDetail = async () => {
    try {
      const data = await ExpertsAPI.getExpertDetail(expertId);
      setExpert(data);
    } catch (error) {
      console.error('전문가 상세 정보 로딩 실패:', error);
      toast.error('전문가 정보를 불러오는데 실패했습니다');
      router.push('/client/experts');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingOptions = async () => {
    try {
      const data = await ConsultationsAPI.getExpertPricing(expertId);
      const pricingList = Array.isArray(data) ? data : [];
      setPricingOptions(pricingList.filter((p) => p.is_active));
    } catch (error) {
      console.error('가격 정보 로딩 실패:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await ReviewAPI.getReviews({ expert_id: expertId });
      const reviewList = Array.isArray(data) ? data : data.results || [];
      setReviews(reviewList.slice(0, 3)); // Show only first 3
    } catch (error) {
      console.error('리뷰 로딩 실패:', error);
    }
  };

  const handleBookConsultation = () => {
    router.push('/client/consultations/book');
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

  if (!expert) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">전문가 정보를 찾을 수 없습니다.</p>
            <Button className="mt-4" onClick={() => router.push('/client/experts')}>
              목록으로 돌아가기
            </Button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const parseListField = (field) => {
    if (!field) return [];

    // 이미 배열인 경우 그대로 반환
    if (Array.isArray(field)) {
      return field.filter(item => {
        if (!item) return false;
        const str = typeof item === 'string' ? item : String(item);
        return str.trim().length > 0;
      });
    }

    // 문자열인 경우 파싱
    try {
      const fieldStr = String(field);

      // JSON 배열 형식인 경우
      if (fieldStr.startsWith('[')) {
        const parsed = JSON.parse(fieldStr);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => {
            if (!item) return false;
            const str = typeof item === 'string' ? item : String(item);
            return str.trim().length > 0;
          });
        }
        return [fieldStr];
      }

      // 이스케이프된 줄바꿈을 실제 줄바꿈으로 변환
      const unescaped = fieldStr.replace(/\\n/g, '\n');
      // 줄바꿈으로 구분된 경우 (\n, \r\n 모두 처리)
      const lines = unescaped.split(/\r?\n/).filter(item => item.trim().length > 0);
      // 결과가 없으면 원본 문자열 반환
      return lines.length > 0 ? lines : [fieldStr];
    } catch {
      // 파싱 실패 시 원본 문자열을 배열로 반환
      return [String(field)];
    }
  };

  const educationList = parseListField(expert.education_list);
  const careerList = parseListField(expert.career_list);
  const certificatesList = parseListField(expert.certificates);

  const verificationStatus = expert.verification_status === 'approved'
    ? { label: '검증 완료', color: 'bg-green-100 text-green-800' }
    : { label: '검증 대기', color: 'bg-yellow-100 text-yellow-800' };

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/experts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">전문가 상세 정보</h1>
            </div>
          </div>

          {/* 전문가 기본 정보 */}
          <Card>
            <CardContent className="p-3 py-2">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
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

                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <h2 className="text-2xl font-bold">{expert.name}</h2>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Award className="mr-1 h-3 w-3" />
                      {expert.specialty_display || expert.specialty}
                    </Badge>
                    <Badge className={verificationStatus.color}>
                      {verificationStatus.label}
                    </Badge>
                    {!expert.is_available && (
                      <Badge variant="secondary">상담 불가</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                      <span className="font-medium text-lg">{expert.rating}</span>
                      <span className="text-sm ml-1">({expert.review_count}개 리뷰)</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-5 w-5 mr-2" />
                      <span>경력 {expert.experience_years}년</span>
                    </div>
                    {expert.institution && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-5 w-5 mr-2" />
                        <span>{expert.institution}</span>
                      </div>
                    )}
                    {expert.workplace && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-5 w-5 mr-2" />
                        <span>{expert.workplace}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-sm line-clamp-2">{review.title}</h4>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="h-full flex items-center justify-center w-10"
                    onClick={() => router.push(`/client/experts/${expertId}/reviews`)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </CardContent>
          </Card>

          {/* 상담 유형 및 가격 */}
          {pricingOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  상담 유형 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingOptions.map((pricing) => (
                    <div
                      key={pricing.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{pricing.session_type_display}</h3>
                            {(pricing?.additional_sessions || 0) > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                +{pricing.additional_sessions}회 추가 제공
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            총 {pricing.total_sessions}회 상담
                            {(pricing?.additional_sessions || 0) > 0 && (
                              <span className="text-green-600">
                                {' '}(기본 {pricing.total_sessions - (pricing?.additional_sessions || 0)}회 + 보너스 {pricing.additional_sessions}회)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-1 mb-1">
                            <Coins className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold text-black">
                              {pricing.tokens_required.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600">토큰</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            회당 {Math.round(pricing.tokens_required / pricing.total_sessions)} 토큰
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {expert.is_available && (
                  <Button onClick={handleBookConsultation} className="w-full mt-4" size="lg">
                    <Calendar className="mr-2 h-5 w-5" />
                    상담 예약하기
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* 소개 */}
          {expert.introduction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  소개
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{expert.introduction}</p>
              </CardContent>
            </Card>
          )}

          {/* 학력 */}
          {educationList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  학력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {educationList.map((education, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{education}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 경력 */}
          {careerList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  경력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {careerList.map((career, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{career}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}


        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
