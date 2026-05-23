'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { SignupProgress } from '@/components/auth/SignupProgress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const step2Schema = z.object({
  official_diagnosis: z.array(z.string()).min(1, '공식 진단 여부를 하나 이상 선택해주세요'),
  official_diagnosis_detail: z.string().max(100, '최대 100자까지 입력할 수 있습니다').optional(),
  diagnosis_test_name: z.string().optional(),
  diagnosis_result: z.string().optional(),
  diagnosis_date: z.string().optional(),
  treatment_status: z.enum(['treatment', 'none'], {
    required_error: '치료 여부를 선택해주세요',
  }),
  treatment_detail: z.string().max(200, '최대 200자까지 입력할 수 있습니다').optional(),
  counseling_status: z.enum(['counseling', 'none'], {
    required_error: '상담 여부를 선택해주세요',
  }),
  counseling_detail: z.string().max(200, '최대 200자까지 입력할 수 있습니다').optional(),
  learning_characteristics: z.string().max(100, '최대 100자까지 입력할 수 있습니다').optional(),
  lifestyle_characteristics: z.string().max(100, '최대 100자까지 입력할 수 있습니다').optional(),
});

export default function ClientSignupStep2Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      official_diagnosis: [],
    }
  });

  const watchTreatmentStatus = watch('treatment_status');
  const watchCounselingStatus = watch('counseling_status');

  const handleDiagnosisChange = (value, checked) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedDiagnosis, value];
    } else {
      newSelection = selectedDiagnosis.filter(item => item !== value);
    }
    setSelectedDiagnosis(newSelection);
    setValue('official_diagnosis', newSelection);
  };

  const handleStep2Submit = async (data) => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      if (!token) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/me/client/child/additional-info/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('이미 등록된 정보가 있습니다.');
        } else if (responseData.detail) {
          toast.error(responseData.detail);
        } else {
          Object.entries(responseData).forEach(([key, value]) => {
            toast.error(`${key}: ${Array.isArray(value) ? value[0] : value}`);
          });
        }
        return;
      }

      toast.success('추가 정보가 저장되었습니다.');
      router.push('/signup/client/step3');

    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/signup/client/step3');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">추가 진단 및 치료 정보</CardTitle>
            <CardDescription>
              아이의 진단 및 치료 정보를 입력해주세요 (선택사항)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupProgress currentStep={2} />

            <form onSubmit={handleSubmit(handleStep2Submit)} className="space-y-8">
              {/* 공식 진단 여부 */}
              <div className="space-y-4">
                <Label>공식 진단 여부 * (복수 선택 가능)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hospital"
                      checked={selectedDiagnosis.includes('hospital')}
                      onCheckedChange={(checked) => handleDiagnosisChange('hospital', checked)}
                    />
                    <Label htmlFor="hospital" className="font-normal cursor-pointer">병원 진단</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="school"
                      checked={selectedDiagnosis.includes('school')}
                      onCheckedChange={(checked) => handleDiagnosisChange('school', checked)}
                    />
                    <Label htmlFor="school" className="font-normal cursor-pointer">학교 평가</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="other"
                      checked={selectedDiagnosis.includes('other')}
                      onCheckedChange={(checked) => handleDiagnosisChange('other', checked)}
                    />
                    <Label htmlFor="other" className="font-normal cursor-pointer">기타</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="none"
                      checked={selectedDiagnosis.includes('none')}
                      onCheckedChange={(checked) => handleDiagnosisChange('none', checked)}
                    />
                    <Label htmlFor="none" className="font-normal cursor-pointer">없음</Label>
                  </div>
                </div>
                {errors.official_diagnosis && (
                  <p className="text-sm text-red-500">{errors.official_diagnosis.message}</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="official_diagnosis_detail">진단 상세 메모 (최대 100자)</Label>
                  <Textarea
                    id="official_diagnosis_detail"
                    placeholder="진단 관련 추가 내용을 입력해주세요"
                    {...register('official_diagnosis_detail')}
                    maxLength={100}
                    rows={2}
                  />
                  {errors.official_diagnosis_detail && (
                    <p className="text-sm text-red-500">{errors.official_diagnosis_detail.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis_test_name">공식 진단명</Label>
                    <Input
                      id="diagnosis_test_name"
                      placeholder="공식 진단명"
                      {...register('diagnosis_test_name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis_date">진단 일자</Label>
                    <Input
                      id="diagnosis_date"
                      placeholder="예: 2024-03-15"
                      {...register('diagnosis_date')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis_result">검사 결과</Label>
                  <Textarea
                    id="diagnosis_result"
                    placeholder="검사 결과를 입력해주세요"
                    {...register('diagnosis_result')}
                    rows={2}
                  />
                </div>
              </div>

              {/* 치료 여부 */}
              <div className="space-y-4">
                <Label>현재 치료 여부 *</Label>
                <RadioGroup
                  value={watchTreatmentStatus}
                  onValueChange={(value) => setValue('treatment_status', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="treatment" id="treatment_yes" />
                    <Label htmlFor="treatment_yes" className="font-normal cursor-pointer">치료</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="treatment_none" />
                    <Label htmlFor="treatment_none" className="font-normal cursor-pointer">안 함</Label>
                  </div>
                </RadioGroup>
                {errors.treatment_status && (
                  <p className="text-sm text-red-500">{errors.treatment_status.message}</p>
                )}
                {watchTreatmentStatus === 'treatment' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="치료 관련 내용을 입력해주세요 (최대 200자)"
                      {...register('treatment_detail')}
                      maxLength={200}
                      rows={3}
                    />
                    {errors.treatment_detail && (
                      <p className="text-sm text-red-500">{errors.treatment_detail.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 상담 여부 */}
              <div className="space-y-4">
                <Label>현재 상담 여부 *</Label>
                <RadioGroup
                  value={watchCounselingStatus}
                  onValueChange={(value) => setValue('counseling_status', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="counseling" id="counseling_yes" />
                    <Label htmlFor="counseling_yes" className="font-normal cursor-pointer">상담</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="counseling_none" />
                    <Label htmlFor="counseling_none" className="font-normal cursor-pointer">안 함</Label>
                  </div>
                </RadioGroup>
                {errors.counseling_status && (
                  <p className="text-sm text-red-500">{errors.counseling_status.message}</p>
                )}
                {watchCounselingStatus === 'counseling' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="상담 관련 내용을 입력해주세요 (최대 200자)"
                      {...register('counseling_detail')}
                      maxLength={200}
                      rows={3}
                    />
                    {errors.counseling_detail && (
                      <p className="text-sm text-red-500">{errors.counseling_detail.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 아동 학습 특성 */}
              <div className="space-y-4">
                <Label htmlFor="learning_characteristics">아동 학습 특성 (최대 100자)</Label>
                <Textarea
                  id="learning_characteristics"
                  placeholder="아동의 학습 특성을 입력해주세요"
                  {...register('learning_characteristics')}
                  maxLength={100}
                  rows={3}
                />
                {errors.learning_characteristics && (
                  <p className="text-sm text-red-500">{errors.learning_characteristics.message}</p>
                )}
              </div>

              {/* 생활 특성 */}
              <div className="space-y-4">
                <Label htmlFor="lifestyle_characteristics">생활 특성 (최대 100자)</Label>
                <Textarea
                  id="lifestyle_characteristics"
                  placeholder="아동의 생활 특성을 입력해주세요"
                  {...register('lifestyle_characteristics')}
                  maxLength={100}
                  rows={3}
                />
                {errors.lifestyle_characteristics && (
                  <p className="text-sm text-red-500">{errors.lifestyle_characteristics.message}</p>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/signup/client/step1')}
                >
                  <IoArrowBack className="mr-2 h-4 w-4" />
                  이전 단계
                </Button>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                  >
                    건너뛰기
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        다음 단계
                        <IoArrowForward className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
