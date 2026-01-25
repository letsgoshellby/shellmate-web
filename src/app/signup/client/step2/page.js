'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
  treatment_status: z.enum(['treatment_only', 'counseling_only', 'both', 'none'], {
    required_error: '현재 치료/상담 여부를 선택해주세요',
  }),
  treatment_year: z.string().optional(),
  medical_records: z.string().max(300, '최대 300자까지 입력할 수 있습니다').optional(),
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

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

            <form onSubmit={handleSubmit(handleStep2Submit)} className="space-y-6">
              <div className="space-y-2">
                <Label>공식 진단 여부 * (복수 선택 가능)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hospital"
                      checked={selectedDiagnosis.includes('hospital')}
                      onCheckedChange={(checked) => handleDiagnosisChange('hospital', checked)}
                    />
                    <Label htmlFor="hospital" className="font-normal cursor-pointer">
                      병원 진단
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="school"
                      checked={selectedDiagnosis.includes('school')}
                      onCheckedChange={(checked) => handleDiagnosisChange('school', checked)}
                    />
                    <Label htmlFor="school" className="font-normal cursor-pointer">
                      학교 평가
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="other"
                      checked={selectedDiagnosis.includes('other')}
                      onCheckedChange={(checked) => handleDiagnosisChange('other', checked)}
                    />
                    <Label htmlFor="other" className="font-normal cursor-pointer">
                      기타
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="none"
                      checked={selectedDiagnosis.includes('none')}
                      onCheckedChange={(checked) => handleDiagnosisChange('none', checked)}
                    />
                    <Label htmlFor="none" className="font-normal cursor-pointer">
                      없음
                    </Label>
                  </div>
                </div>
                {errors.official_diagnosis && (
                  <p className="text-sm text-red-500">{errors.official_diagnosis.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>현재 치료/상담 여부 *</Label>
                <RadioGroup
                  value={watchTreatmentStatus}
                  onValueChange={(value) => setValue('treatment_status', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="treatment_only" id="treatment_only" />
                    <Label htmlFor="treatment_only" className="font-normal cursor-pointer">
                      치료만
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="counseling_only" id="counseling_only" />
                    <Label htmlFor="counseling_only" className="font-normal cursor-pointer">
                      상담만
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      치료와 상담 모두
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="treatment_none" />
                    <Label htmlFor="treatment_none" className="font-normal cursor-pointer">
                      안 함
                    </Label>
                  </div>
                </RadioGroup>
                {errors.treatment_status && (
                  <p className="text-sm text-red-500">{errors.treatment_status.message}</p>
                )}
              </div>

              {watchTreatmentStatus && watchTreatmentStatus !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="treatment_year">진단/평가 시행 연도</Label>
                  <select
                    id="treatment_year"
                    {...register('treatment_year')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">연도를 선택해주세요</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="medical_records">병원 또는 학교 기록 (최대 300자)</Label>
                <Textarea
                  id="medical_records"
                  placeholder="관련 기록이나 특이사항을 자유롭게 입력해주세요"
                  {...register('medical_records')}
                  rows={4}
                />
                {errors.medical_records && (
                  <p className="text-sm text-red-500">{errors.medical_records.message}</p>
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
