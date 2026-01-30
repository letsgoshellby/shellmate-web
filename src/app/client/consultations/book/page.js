'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { ExpertAPI } from '@/lib/api/expert';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Award,
  CheckCircle,
  Loader2,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const bookingSchema = z.object({
  expert_id: z.number().min(1, '전문가를 선택해주세요'),
  pricing_id: z.number().min(1, '상담 유형을 선택해주세요'),
  scheduled_date: z.string().min(1, '상담 날짜를 선택해주세요'),
  scheduled_time: z.string().min(1, '상담 시간을 선택해주세요'),
  client_notes: z.string().min(10, '상담 내용은 10자 이상이어야 합니다').max(500, '상담 내용은 500자를 초과할 수 없습니다'),
});

export default function BookConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 전문가 선택, 2: 상담 유형 선택, 3: 날짜 시간 선택, 4: 상담 정보 입력
  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  // 임시 전문가 데이터
  const mockExperts = [
    {
      id: 1,
      name: '김전문가',
      title: '아동발달 전문가',
      specialties: ['집중력', 'ADHD', '학습장애'],
      experience_years: 10,
      rating: 4.8,
      reviews_count: 127,
      profile_image: null,
      introduction: '10년간 아동발달 분야에서 활동해온 전문가입니다. 특히 집중력 문제와 ADHD 아동들을 많이 도와왔습니다.',
      certifications: ['아동발달전문가', '임상심리사 1급'],
    },
    {
      id: 2,
      name: '이언어치료사',
      title: '언어치료사',
      specialties: ['언어발달', '언어치료', '의사소통'],
      experience_years: 8,
      rating: 4.9,
      reviews_count: 89,
      profile_image: null,
      introduction: '언어발달 지연 아동들을 위한 맞춤형 치료를 제공합니다. 부모 상담과 가정에서의 언어 자극 방법도 함께 안내드립니다.',
      certifications: ['언어치료사 1급', '특수교육전문가'],
    },
    {
      id: 3,
      name: '박놀이치료사',
      title: '놀이치료사',
      specialties: ['놀이치료', '사회성', '정서발달'],
      experience_years: 12,
      rating: 4.7,
      reviews_count: 156,
      profile_image: null,
      introduction: '놀이를 통한 아동의 정서 발달과 사회성 향상을 도와드립니다. 부모님과 함께하는 놀이 방법도 제안드립니다.',
      certifications: ['놀이치료사', '상담심리사 2급'],
    }
  ];

  // 임시 가격 데이터
  const mockPricingOptions = [
    {
      id: 1,
      session_type: 'SINGLE',
      session_type_display: '1회 상담',
      total_sessions: 1,
      additional_sessions: 0,
      tokens_required: 10,
      is_active: true,
    },
    {
      id: 2,
      session_type: 'PACKAGE_4',
      session_type_display: '4회 패키지',
      total_sessions: 4,
      additional_sessions: 0,
      tokens_required: 36,
      is_active: true,
    },
    {
      id: 3,
      session_type: 'PACKAGE_8',
      session_type_display: '8회 패키지',
      total_sessions: 8,
      additional_sessions: 1,
      tokens_required: 68,
      is_active: true,
    }
  ];

  // 임시 가능한 시간 슬롯
  const mockTimeSlots = [
    { slot_number: 1, start_time: '09:00', end_time: '10:00' },
    { slot_number: 2, start_time: '10:00', end_time: '11:00' },
    { slot_number: 3, start_time: '11:00', end_time: '12:00' },
    { slot_number: 4, start_time: '14:00', end_time: '15:00' },
    { slot_number: 5, start_time: '15:00', end_time: '16:00' },
    { slot_number: 6, start_time: '16:00', end_time: '17:00' },
    { slot_number: 7, start_time: '17:00', end_time: '18:00' },
  ];

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      // 실제 API 호출
      const data = await ExpertAPI.getExperts();
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
        certifications: [],
        institution: expert.institution,
        workplace: expert.workplace,
      }));

      setExperts(mappedExperts.length > 0 ? mappedExperts : mockExperts);

      // 임시로 목 데이터 사용
      // setExperts(mockExperts);
    } catch (error) {
      console.error('전문가 목록 로딩 실패:', error);
      toast.error('전문가 목록을 불러오는데 실패했습니다');
      // API 실패 시 목 데이터 사용
      setExperts(mockExperts);
    } finally {
      setExpertsLoading(false);
    }
  };

  const loadPricingOptions = async (expertId) => {
    setPricingLoading(true);
    try {
      // 실제 API 호출
      const data = await ConsultationsAPI.getExpertPricing(expertId);
      const pricingList = Array.isArray(data) ? data : [];

      if (pricingList.length > 0) {
        setPricingOptions(pricingList.filter((p) => p.is_active));
      } else {
        // API 응답이 비어있으면 목 데이터 사용
        setPricingOptions(mockPricingOptions);
      }

      // 임시로 목 데이터 사용
      // setPricingOptions(mockPricingOptions);
    } catch (error) {
      console.error('가격 정보 로딩 실패:', error);
      // API 실패 시 목 데이터 사용
      setPricingOptions(mockPricingOptions);
    } finally {
      setPricingLoading(false);
    }
  };

  const loadAvailableSlots = async (expertId, date) => {
    setSlotsLoading(true);
    try {
      // 실제 API 호출
      const data = await ConsultationsAPI.getExpertAvailableSlots(expertId, date);
      const slots = data.available_time_ranges || [];

      if (slots.length > 0) {
        setAvailableSlots(slots);
      } else {
        // API 응답이 비어있으면 목 데이터 사용
        setAvailableSlots(mockTimeSlots);
      }

      // 임시로 목 데이터 사용
      // setAvailableSlots(mockTimeSlots);
    } catch (error) {
      console.error('가능 시간 로딩 실패:', error);
      // API 실패 시 목 데이터 사용
      setAvailableSlots(mockTimeSlots);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleExpertSelect = (expert) => {
    setSelectedExpert(expert);
    setValue('expert_id', expert.id);
    loadPricingOptions(expert.id);
    setStep(2);
  };

  const handlePricingSelect = (pricing) => {
    setSelectedPricing(pricing);
    setValue('pricing_id', pricing.id);
    setStep(3);
  };

  const handleDateChange = (date) => {
    setValue('scheduled_date', date);
    setValue('scheduled_time', ''); // 시간 초기화
    if (selectedExpert) {
      loadAvailableSlots(selectedExpert.id, date);
    }
  };

  const handleTimeSelect = (slot) => {
    const timeString = typeof slot === 'string' ? slot : slot.start_time;
    setValue('scheduled_time', timeString);
    setStep(4);
  };

  const onSubmit = async (data) => {
    // 결제 페이지로 이동 (결제 정보를 쿼리 파라미터로 전달)
    const paymentParams = new URLSearchParams({
      expert_id: data.expert_id.toString(),
      expert_name: selectedExpert?.name || '',
      session_type: selectedPricing?.session_type || 'SINGLE',
      session_type_display: selectedPricing?.session_type_display || '1회 상담',
      tokens_required: (selectedPricing?.tokens_required || 0).toString(),
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      client_notes: data.client_notes || '',
    });

    router.push(`/client/consultations/book/payment?${paymentParams.toString()}`);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // "08:44:01.001Z" 형식이나 "09:00" 형식 모두 처리
    return timeString.substring(0, 5);
  };

  if (expertsLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">상담 예약</h1>
              <p className="text-gray-600">전문가와 1:1 비대면 상담을 예약하세요</p>
            </div>
          </div>

          {/* 진행 단계 표시 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, title: '전문가 선택' },
                  { step: 2, title: '상담 유형 선택' },
                  { step: 3, title: '날짜/시간 선택' },
                  { step: 4, title: '상담 정보 입력' }
                ].map(({ step: stepNum, title }, index) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
                    </div>
                    <span className={`ml-2 text-sm hidden sm:inline ${
                      step >= stepNum ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                    {index < 3 && (
                      <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 ${
                        step > stepNum ? 'bg-primary' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 1: 전문가 선택 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">전문가를 선택해주세요</h2>
              <div className="grid grid-cols-1 gap-6">
                {experts.map((expert) => (
                  <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                          {expert.profile_image ? (
                            <img src={expert.profile_image} alt={expert.name} className="w-full h-full rounded-full object-cover" />
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
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{expert.rating}</span>
                              <span className="text-sm text-gray-500 ml-1">({expert.reviews_count})</span>
                            </div>
                            <span className="text-sm text-gray-600">경력 {expert.experience_years}년</span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {expert.introduction}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {expert.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <Button onClick={() => handleExpertSelect(expert)} className="w-full sm:w-auto">
                            이 전문가 선택하기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 상담 유형 선택 */}
          {step === 2 && selectedExpert && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">상담 유형을 선택해주세요</h2>
                <Button variant="outline" onClick={() => setStep(1)}>
                  전문가 다시 선택
                </Button>
              </div>

              {/* 선택한 전문가 정보 */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedExpert.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedExpert.name}</h3>
                      <p className="text-sm text-blue-800">{selectedExpert.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {pricingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {pricingOptions.map((pricing) => (
                    <Card
                      key={pricing.id}
                      className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary"
                      onClick={() => handlePricingSelect(pricing)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{pricing.session_type_display}</h3>
                              {pricing.additional_sessions > 0 && (
                                <Badge className="bg-green-100 text-green-800">
                                  +{pricing.additional_sessions}회 추가 제공
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              총 {pricing.total_sessions + (pricing.additional_sessions || 0)}회 상담
                              {pricing.additional_sessions > 0 && ` (기본 ${pricing.total_sessions}회 + 보너스 ${pricing.additional_sessions}회)`}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center text-xl font-bold text-primary">
                                <Coins className="h-5 w-5 mr-1" />
                                {pricing.tokens_required.toLocaleString()} 토큰
                              </div>
                              <p className="text-xs text-gray-500">
                                회당 {Math.round(pricing.tokens_required / (pricing.total_sessions + (pricing.additional_sessions || 0))).toLocaleString()} 토큰
                              </p>
                            </div>
                            <Button>선택하기</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: 날짜/시간 선택 */}
          {step === 3 && selectedExpert && selectedPricing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">날짜와 시간을 선택해주세요</h2>
                <Button variant="outline" onClick={() => setStep(2)}>
                  상담 유형 다시 선택
                </Button>
              </div>

              {/* 선택한 정보 요약 */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedExpert.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedExpert.name}</h3>
                        <p className="text-sm text-blue-800">{selectedExpert.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{selectedPricing.session_type_display}</p>
                      <p className="text-sm text-blue-800">{selectedPricing.tokens_required.toLocaleString()} 토큰</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      날짜 선택
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={watch('scheduled_date') || ''}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      최소 하루 전부터 최대 30일 후까지 예약 가능합니다
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      시간 선택
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!watch('scheduled_date') ? (
                      <p className="text-sm text-gray-500">먼저 날짜를 선택해주세요</p>
                    ) : slotsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500">해당 날짜에 가능한 시간이 없습니다</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot, index) => {
                          const startTime = formatTime(slot.start_time);
                          const endTime = formatTime(slot.end_time);
                          return (
                            <Button
                              key={slot.slot_number || index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleTimeSelect(slot)}
                              className="h-10"
                            >
                              {startTime}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 4: 상담 정보 입력 */}
          {step === 4 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">상담 정보를 입력해주세요</h2>
                <Button variant="outline" onClick={() => setStep(3)}>
                  날짜/시간 다시 선택
                </Button>
              </div>

              {/* 선택한 정보 요약 */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">예약 정보</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 block">전문가</span>
                      <span className="font-medium">{selectedExpert?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">상담 유형</span>
                      <span className="font-medium">{selectedPricing?.session_type_display}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">날짜</span>
                      <span className="font-medium">{watch('scheduled_date')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">시간</span>
                      <span className="font-medium">{watch('scheduled_time')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_notes">상담 내용 *</Label>
                    <Textarea
                      id="client_notes"
                      placeholder="아이의 상황과 궁금한 점을 자세히 적어주세요. 나이, 성별, 현재 상황 등을 포함해서 작성해주시면 더 정확한 상담을 받을 수 있습니다."
                      rows={6}
                      {...register('client_notes')}
                      className={errors.client_notes ? 'border-red-500' : ''}
                    />
                    {errors.client_notes && (
                      <p className="text-sm text-red-500">{errors.client_notes.message}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {watch('client_notes')?.length || 0}/500
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">상담 전 안내사항</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 상담은 화상 통화로 진행됩니다</li>
                      <li>• 상담 시간은 회당 50분입니다</li>
                      <li>• 필요 토큰: {selectedPricing?.tokens_required.toLocaleString()}개</li>
                      <li>• 상담 24시간 전까지 취소 가능합니다</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)}>
                      이전
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          예약 중...
                        </>
                      ) : (
                        '상담 예약하기'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
