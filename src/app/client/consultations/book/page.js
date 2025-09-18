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
import { 
  ArrowLeft, 
  Calendar,
  Clock, 
  User, 
  Star,
  Award,
  CheckCircle,
  Loader2,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const bookingSchema = z.object({
  expert_id: z.number().min(1, '전문가를 선택해주세요'),
  scheduled_date: z.string().min(1, '상담 날짜를 선택해주세요'),
  scheduled_time: z.string().min(1, '상담 시간을 선택해주세요'),
  topic: z.string().min(5, '상담 주제는 5자 이상이어야 합니다').max(100, '상담 주제는 100자를 초과할 수 없습니다'),
  description: z.string().min(10, '상담 내용은 10자 이상이어야 합니다').max(500, '상담 내용은 500자를 초과할 수 없습니다'),
});

export default function BookConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 전문가 선택, 2: 날짜 시간 선택, 3: 상담 정보 입력, 4: 확인
  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expertsLoading, setExpertsLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
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
      price_per_hour: 50000,
      profile_image: null,
      introduction: '10년간 아동발달 분야에서 활동해온 전문가입니다. 특히 집중력 문제와 ADHD 아동들을 많이 도와왔습니다.',
      certifications: ['아동발달전문가', '임상심리사 1급'],
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    {
      id: 2,
      name: '이언어치료사',
      title: '언어치료사',
      specialties: ['언어발달', '언어치료', '의사소통'],
      experience_years: 8,
      rating: 4.9,
      reviews_count: 89,
      price_per_hour: 60000,
      profile_image: null,
      introduction: '언어발달 지연 아동들을 위한 맞춤형 치료를 제공합니다. 부모 상담과 가정에서의 언어 자극 방법도 함께 안내드립니다.',
      certifications: ['언어치료사 1급', '특수교육전문가'],
      available_days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    {
      id: 3,
      name: '박놀이치료사',
      title: '놀이치료사',
      specialties: ['놀이치료', '사회성', '정서발달'],
      experience_years: 12,
      rating: 4.7,
      reviews_count: 156,
      price_per_hour: 55000,
      profile_image: null,
      introduction: '놀이를 통한 아동의 정서 발달과 사회성 향상을 도와드립니다. 부모님과 함께하는 놀이 방법도 제안드립니다.',
      certifications: ['놀이치료사', '상담심리사 2급'],
      available_days: ['monday', 'wednesday', 'thursday', 'friday', 'saturday']
    }
  ];

  // 임시 가능한 시간 슬롯
  const mockTimeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      // 실제 API 호출 시
      // const data = await ConsultationsAPI.getExperts();
      // setExperts(data.results);
      
      // 임시로 목 데이터 사용
      setExperts(mockExperts);
    } catch (error) {
      toast.error('전문가 목록을 불러오는데 실패했습니다');
    } finally {
      setExpertsLoading(false);
    }
  };

  const loadAvailableSlots = async (expertId, date) => {
    try {
      // 실제 API 호출 시
      // const data = await ConsultationsAPI.getExpertAvailability(expertId, date);
      // setAvailableSlots(data.available_times);
      
      // 임시로 목 데이터 사용
      setAvailableSlots(mockTimeSlots);
    } catch (error) {
      toast.error('가능한 시간을 불러오는데 실패했습니다');
    }
  };

  const handleExpertSelect = (expert) => {
    setSelectedExpert(expert);
    setValue('expert_id', expert.id);
    setStep(2);
  };

  const handleDateChange = (date) => {
    setValue('scheduled_date', date);
    if (selectedExpert) {
      loadAvailableSlots(selectedExpert.id, date);
    }
  };

  const handleTimeSelect = (time) => {
    setValue('scheduled_time', time);
    setStep(3);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // 실제 API 호출 시
      // const result = await ConsultationsAPI.createConsultation(data);
      
      // 임시로 성공 처리
      toast.success('상담 예약이 완료되었습니다');
      router.push('/client/consultations');
    } catch (error) {
      toast.error('상담 예약에 실패했습니다');
    } finally {
      setLoading(false);
    }
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
                  { step: 2, title: '날짜/시간 선택' },
                  { step: 3, title: '상담 정보 입력' },
                  { step: 4, title: '예약 완료' }
                ].map(({ step: stepNum, title }, index) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
                    </div>
                    <span className={`ml-2 text-sm ${
                      step >= stepNum ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                    {index < 3 && (
                      <div className={`w-12 h-0.5 mx-4 ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {experts.map((expert) => (
                  <Card key={expert.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleExpertSelect(expert)}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {expert.name.charAt(0)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
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
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {expert.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-lg font-semibold text-primary">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {expert.price_per_hour.toLocaleString()}원/시간
                            </div>
                            <Button size="sm">선택하기</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 날짜/시간 선택 */}
          {step === 2 && selectedExpert && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">날짜와 시간을 선택해주세요</h2>
                <Button variant="outline" onClick={() => setStep(1)}>
                  전문가 다시 선택
                </Button>
              </div>
              
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
                    {watch('scheduled_date') ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((time) => (
                          <Button
                            key={time}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTimeSelect(time)}
                            className="h-10"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">먼저 날짜를 선택해주세요</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: 상담 정보 입력 */}
          {step === 3 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">상담 정보를 입력해주세요</h2>
                <Button variant="outline" onClick={() => setStep(2)}>
                  날짜/시간 다시 선택
                </Button>
              </div>
              
              {/* 선택한 정보 요약 */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">예약 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">전문가:</span>
                      <span className="ml-2 font-medium">{selectedExpert?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">날짜:</span>
                      <span className="ml-2 font-medium">{watch('scheduled_date')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">시간:</span>
                      <span className="ml-2 font-medium">{watch('scheduled_time')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">상담 주제 *</Label>
                    <Input
                      id="topic"
                      placeholder="예: 6세 아이 집중력 문제 상담"
                      {...register('topic')}
                      className={errors.topic ? 'border-red-500' : ''}
                    />
                    {errors.topic && (
                      <p className="text-sm text-red-500">{errors.topic.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">상담 내용 *</Label>
                    <Textarea
                      id="description"
                      placeholder="아이의 상황과 궁금한 점을 자세히 적어주세요. 나이, 성별, 현재 상황 등을 포함해서 작성해주시면 더 정확한 상담을 받을 수 있습니다."
                      rows={6}
                      {...register('description')}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {watch('description')?.length || 0}/500
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">상담 전 안내사항</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 상담은 화상 통화로 진행됩니다</li>
                      <li>• 상담 시간은 1시간입니다</li>
                      <li>• 상담료는 {selectedExpert?.price_per_hour.toLocaleString()}원입니다</li>
                      <li>• 상담 24시간 전까지 취소 가능합니다</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
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