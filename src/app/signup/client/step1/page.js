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
import { SignupProgress } from '@/components/auth/SignupProgress';
import { toast } from 'react-hot-toast';
import { IoArrowForward } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 필드명 한국어 매핑
const fieldNameMap = {
  birth_date: '생년월일',
  gender: '성별',
  child_order: '몇째 아이',
  psychological_test_conducted: '심리검사 여부',
  learning_problem: '학습 문제',
  sensory_processing_problem: '감각 처리 문제',
  emotional_anxiety_problem: '정서 및 불안 문제',
  family_similar_symptoms: '가족 유사 증상',
  medication_usage: '약물 복용 여부',
};

const step1Schema = z.object({
  // 기본 정보
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female'], {
    required_error: '성별을 선택해주세요',
    invalid_type_error: '성별을 선택해주세요',
  }),
  child_order: z.enum(['first', 'second', 'third_or_more'], {
    required_error: '몇째 아이인지 선택해주세요',
    invalid_type_error: '몇째 아이인지 선택해주세요',
  }),
  // 세부 정보
  psychological_test_conducted: z.boolean({
    required_error: '심리검사 여부를 선택해주세요',
    invalid_type_error: '심리검사 여부를 선택해주세요',
  }),
  learning_problem: z.enum(['none', 'reading', 'writing', 'math', 'other'], {
    required_error: '학습 문제를 선택해주세요',
    invalid_type_error: '학습 문제를 선택해주세요',
  }),
  sensory_processing_problem: z.enum(['none', 'sound', 'touch', 'other'], {
    required_error: '감각 처리 문제를 선택해주세요',
    invalid_type_error: '감각 처리 문제를 선택해주세요',
  }),
  emotional_anxiety_problem: z.enum(['none', 'obsessive_compulsive', 'tic', 'social_anxiety', 'other'], {
    required_error: '정서 및 불안 문제를 선택해주세요',
    invalid_type_error: '정서 및 불안 문제를 선택해주세요',
  }),
  family_similar_symptoms: z.boolean({
    required_error: '가족 유사 증상 여부를 선택해주세요',
    invalid_type_error: '가족 유사 증상 여부를 선택해주세요',
  }),
  medication_usage: z.boolean({
    required_error: '약물 복용 여부를 선택해주세요',
    invalid_type_error: '약물 복용 여부를 선택해주세요',
  }),
});

export default function ClientSignupStep1Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      psychological_test_conducted: undefined,
      family_similar_symptoms: undefined,
      medication_usage: undefined,
    }
  });

  const watchGender = watch('gender');
  const watchChildOrder = watch('child_order');
  const watchLearningProblem = watch('learning_problem');
  const watchSensoryProcessingProblem = watch('sensory_processing_problem');
  const watchEmotionalAnxietyProblem = watch('emotional_anxiety_problem');
  const watchPsychologicalTestConducted = watch('psychological_test_conducted');
  const watchFamilySimilarSymptoms = watch('family_similar_symptoms');
  const watchMedicationUsage = watch('medication_usage');

  const handleStep1Submit = async (data) => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      if (!token) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      // 백엔드에서 배열로 기대하는 필드들을 배열로 변환
      const submitData = {
        ...data,
        learning_problem: data.learning_problem ? [data.learning_problem] : [],
        sensory_processing_problem: data.sensory_processing_problem ? [data.sensory_processing_problem] : [],
        emotional_anxiety_problem: data.emotional_anxiety_problem ? [data.emotional_anxiety_problem] : [],
      };

      const response = await fetch(`${API_BASE_URL}/me/client/child/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('이미 등록된 정보가 있습니다.');
        } else if (responseData.detail) {
          toast.error(responseData.detail);
        } else {
          // 필드별 에러 메시지를 한국어로 표시
          const errorFields = Object.keys(responseData);
          if (errorFields.length > 0) {
            const fieldNames = errorFields
              .map(key => fieldNameMap[key] || key)
              .join(', ');
            toast.error(`오류가 발생했습니다.\n${fieldNames} 필드를 확인해주세요.`);
          } else {
            toast.error('오류가 발생했습니다. 입력 내용을 확인해주세요.');
          }
        }
        return;
      }

      toast.success('아이 정보가 저장되었습니다.');
      router.push('/signup/client/step2');

    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">아이 정보 입력</CardTitle>
            <CardDescription>
              아이의 정보를 입력해주세요 (필수)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupProgress currentStep={1} />

            <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-6">
              {/* 기본 정보 섹션 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">기본 정보</h3>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">생년월일 *</Label>
                  <Input
                    id="birth_date"
                    type="text"
                    placeholder="2010-01-01"
                    maxLength={10}
                    {...register('birth_date', {
                      onChange: (e) => {
                        const formatted = formatDate(e.target.value);
                        e.target.value = formatted;
                      }
                    })}
                    className={errors.birth_date ? 'border-red-500' : ''}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-500">{errors.birth_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>성별 *</Label>
                  <RadioGroup
                    value={watchGender}
                    onValueChange={(value) => setValue('gender', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal cursor-pointer">남자</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal cursor-pointer">여자</Label>
                    </div>
                  </RadioGroup>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>몇째 아이인가요? *</Label>
                  <RadioGroup
                    value={watchChildOrder}
                    onValueChange={(value) => setValue('child_order', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="first" id="first" />
                      <Label htmlFor="first" className="font-normal cursor-pointer">첫째</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="second" id="second" />
                      <Label htmlFor="second" className="font-normal cursor-pointer">둘째</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="third_or_more" id="third_or_more" />
                      <Label htmlFor="third_or_more" className="font-normal cursor-pointer">셋째 이상</Label>
                    </div>
                  </RadioGroup>
                  {errors.child_order && (
                    <p className="text-sm text-red-500">{errors.child_order.message}</p>
                  )}
                </div>
              </div>

              {/* 세부 정보 섹션 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">세부 정보</h3>

                <div className="space-y-2">
                  <Label>웩슬러 검사 등 관련 검사를 시행한 적이 있나요? *</Label>
                  <RadioGroup
                    value={watchPsychologicalTestConducted === true ? 'yes' : watchPsychologicalTestConducted === false ? 'no' : undefined}
                    onValueChange={(value) => setValue('psychological_test_conducted', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="psychological_yes" />
                      <Label htmlFor="psychological_yes" className="font-normal cursor-pointer">네</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="psychological_no" />
                      <Label htmlFor="psychological_no" className="font-normal cursor-pointer">아니오</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>학습 문제 *</Label>
                  <RadioGroup
                    value={watchLearningProblem}
                    onValueChange={(value) => setValue('learning_problem', value)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="learning_none" />
                      <Label htmlFor="learning_none" className="font-normal cursor-pointer">없음</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reading" id="reading" />
                      <Label htmlFor="reading" className="font-normal cursor-pointer">읽기</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="writing" id="writing" />
                      <Label htmlFor="writing" className="font-normal cursor-pointer">쓰기</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="math" id="math" />
                      <Label htmlFor="math" className="font-normal cursor-pointer">수학</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="learning_other" />
                      <Label htmlFor="learning_other" className="font-normal cursor-pointer">기타</Label>
                    </div>
                  </RadioGroup>
                  {errors.learning_problem && (
                    <p className="text-sm text-red-500">{errors.learning_problem.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>감각 처리 문제 *</Label>
                  <RadioGroup
                    value={watchSensoryProcessingProblem}
                    onValueChange={(value) => setValue('sensory_processing_problem', value)}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="sensory_none" />
                      <Label htmlFor="sensory_none" className="font-normal cursor-pointer">없음</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sound" id="sound" />
                      <Label htmlFor="sound" className="font-normal cursor-pointer">소리</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="touch" id="touch" />
                      <Label htmlFor="touch" className="font-normal cursor-pointer">촉감</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="sensory_other" />
                      <Label htmlFor="sensory_other" className="font-normal cursor-pointer">기타</Label>
                    </div>
                  </RadioGroup>
                  {errors.sensory_processing_problem && (
                    <p className="text-sm text-red-500">{errors.sensory_processing_problem.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>정서 및 불안 문제 *</Label>
                  <RadioGroup
                    value={watchEmotionalAnxietyProblem}
                    onValueChange={(value) => setValue('emotional_anxiety_problem', value)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="emotional_none" />
                      <Label htmlFor="emotional_none" className="font-normal cursor-pointer">없음</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="obsessive_compulsive" id="obsessive_compulsive" />
                      <Label htmlFor="obsessive_compulsive" className="font-normal cursor-pointer">강박</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tic" id="tic" />
                      <Label htmlFor="tic" className="font-normal cursor-pointer">틱</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="social_anxiety" id="social_anxiety" />
                      <Label htmlFor="social_anxiety" className="font-normal cursor-pointer">사회불안</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="emotional_other" />
                      <Label htmlFor="emotional_other" className="font-normal cursor-pointer">기타</Label>
                    </div>
                  </RadioGroup>
                  {errors.emotional_anxiety_problem && (
                    <p className="text-sm text-red-500">{errors.emotional_anxiety_problem.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>가족 중 유사한 증상을 경험한 분이 있나요? *</Label>
                  <RadioGroup
                    value={watchFamilySimilarSymptoms === true ? 'yes' : watchFamilySimilarSymptoms === false ? 'no' : undefined}
                    onValueChange={(value) => setValue('family_similar_symptoms', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="family_yes" />
                      <Label htmlFor="family_yes" className="font-normal cursor-pointer">네</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="family_no" />
                      <Label htmlFor="family_no" className="font-normal cursor-pointer">아니오</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>현재 복용 중인 약물이 있나요? *</Label>
                  <RadioGroup
                    value={watchMedicationUsage === true ? 'yes' : watchMedicationUsage === false ? 'no' : undefined}
                    onValueChange={(value) => setValue('medication_usage', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="medication_yes" />
                      <Label htmlFor="medication_yes" className="font-normal cursor-pointer">네</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="medication_no" />
                      <Label htmlFor="medication_no" className="font-normal cursor-pointer">아니오</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/client/dashboard')}
                >
                  나중에 하기
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
