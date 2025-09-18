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
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const step2Schema = z.object({
  psychological_test_conducted: z.boolean().default(false),
  learning_problem: z.enum(['none', 'reading', 'writing', 'math', 'other'], {
    required_error: '학습 문제를 선택해주세요',
  }),
  learning_problem_detail: z.string().optional(),
  sensory_processing_problem: z.enum(['none', 'sound', 'touch', 'other'], {
    required_error: '감각 처리 문제를 선택해주세요',
  }),
  sensory_processing_detail: z.string().optional(),
  emotional_anxiety_problem: z.enum(['obsession', 'tic', 'social_anxiety', 'other'], {
    required_error: '정서 및 불안 문제를 선택해주세요',
  }),
  family_similar_symptoms: z.boolean().default(false),
  medication_usage: z.boolean().default(false),
}).refine((data) => {
  if (data.learning_problem === 'other' && !data.learning_problem_detail) {
    return false;
  }
  return true;
}, {
  message: "기타를 선택한 경우 상세 내용을 입력해주세요",
  path: ["learning_problem_detail"],
}).refine((data) => {
  if (data.sensory_processing_problem === 'other' && !data.sensory_processing_detail) {
    return false;
  }
  return true;
}, {
  message: "기타를 선택한 경우 상세 내용을 입력해주세요",
  path: ["sensory_processing_detail"],
});

export default function ClientSignupStep2Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      psychological_test_conducted: false,
      family_similar_symptoms: false,
      medication_usage: false,
    }
  });

  const watchLearningProblem = watch('learning_problem');
  const watchSensoryProcessingProblem = watch('sensory_processing_problem');
  const watchEmotionalAnxietyProblem = watch('emotional_anxiety_problem');
  const watchPsychologicalTestConducted = watch('psychological_test_conducted');
  const watchFamilySimilarSymptoms = watch('family_similar_symptoms');
  const watchMedicationUsage = watch('medication_usage');

  const handleStep2Submit = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
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

      const response = await fetch(`${API_BASE_URL}/auth/client/signup/step2/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        toast.error(`[${response.status}] 백엔드 응답: ${JSON.stringify(responseData)}`);
        
        if (response.status === 409) {
          toast.error('이미 등록된 정보가 있습니다.');
        } else if (responseData.errors) {
          Object.entries(responseData.errors).forEach(([key, value]) => {
            toast.error(`${key}: ${Array.isArray(value) ? value[0] : value}`);
          });
        } else if (responseData.detail) {
          toast.error(`상세 오류: ${responseData.detail}`);
        } else {
          toast.error('등록 중 오류가 발생했습니다');
        }
        return;
      }
      
      toast.success('아이 세부 정보가 저장되었습니다. 회원가입이 완료되었습니다!');
      router.push('/signup/client/step3');
      
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">아이 세부 정보</CardTitle>
            <CardDescription>
              아이의 세부 정보를 입력해주세요 (필수)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupProgress currentStep={2} />
            
            <form onSubmit={handleSubmit(handleStep2Submit)} className="mt-12 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="psychological_test_conducted"
                    checked={watchPsychologicalTestConducted}
                    onCheckedChange={(checked) => setValue('psychological_test_conducted', checked)}
                  />
                  <Label htmlFor="psychological_test_conducted" className="font-normal cursor-pointer">
                    웩슬러 검사 등 관련 검사를 시행한 적이 있나요?
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>학습 문제 *</Label>
                <RadioGroup
                  value={watchLearningProblem}
                  onValueChange={(value) => setValue('learning_problem', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="learning_none" />
                    <Label htmlFor="learning_none" className="font-normal cursor-pointer">
                      없음
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reading" id="reading" />
                    <Label htmlFor="reading" className="font-normal cursor-pointer">
                      읽기
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="writing" id="writing" />
                    <Label htmlFor="writing" className="font-normal cursor-pointer">
                      쓰기
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="math" id="math" />
                    <Label htmlFor="math" className="font-normal cursor-pointer">
                      수학
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="learning_other" />
                    <Label htmlFor="learning_other" className="font-normal cursor-pointer">
                      기타
                    </Label>
                  </div>
                </RadioGroup>
                {errors.learning_problem && (
                  <p className="text-sm text-red-500">{errors.learning_problem.message}</p>
                )}
                
                {watchLearningProblem === 'other' && (
                  <div className="mt-2">
                    <Input
                      placeholder="기타 학습 문제를 입력해주세요"
                      {...register('learning_problem_detail')}
                      className={errors.learning_problem_detail ? 'border-red-500' : ''}
                    />
                    {errors.learning_problem_detail && (
                      <p className="text-sm text-red-500 mt-1">{errors.learning_problem_detail.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>감각 처리 문제 *</Label>
                <RadioGroup
                  value={watchSensoryProcessingProblem}
                  onValueChange={(value) => setValue('sensory_processing_problem', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="sensory_none" />
                    <Label htmlFor="sensory_none" className="font-normal cursor-pointer">
                      없음
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sound" id="sound" />
                    <Label htmlFor="sound" className="font-normal cursor-pointer">
                      소리
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="touch" id="touch" />
                    <Label htmlFor="touch" className="font-normal cursor-pointer">
                      촉감
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="sensory_other" />
                    <Label htmlFor="sensory_other" className="font-normal cursor-pointer">
                      기타
                    </Label>
                  </div>
                </RadioGroup>
                {errors.sensory_processing_problem && (
                  <p className="text-sm text-red-500">{errors.sensory_processing_problem.message}</p>
                )}
                
                {watchSensoryProcessingProblem === 'other' && (
                  <div className="mt-2">
                    <Input
                      placeholder="기타 감각 처리 문제를 입력해주세요"
                      {...register('sensory_processing_detail')}
                      className={errors.sensory_processing_detail ? 'border-red-500' : ''}
                    />
                    {errors.sensory_processing_detail && (
                      <p className="text-sm text-red-500 mt-1">{errors.sensory_processing_detail.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>정서 및 불안 문제 *</Label>
                <RadioGroup
                  value={watchEmotionalAnxietyProblem}
                  onValueChange={(value) => setValue('emotional_anxiety_problem', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="obsession" id="obsession" />
                    <Label htmlFor="obsession" className="font-normal cursor-pointer">
                      강박
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tic" id="tic" />
                    <Label htmlFor="tic" className="font-normal cursor-pointer">
                      틱
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="social_anxiety" id="social_anxiety" />
                    <Label htmlFor="social_anxiety" className="font-normal cursor-pointer">
                      사회불안
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="emotional_other" />
                    <Label htmlFor="emotional_other" className="font-normal cursor-pointer">
                      기타
                    </Label>
                  </div>
                </RadioGroup>
                {errors.emotional_anxiety_problem && (
                  <p className="text-sm text-red-500">{errors.emotional_anxiety_problem.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="family_similar_symptoms"
                    checked={watchFamilySimilarSymptoms}
                    onCheckedChange={(checked) => setValue('family_similar_symptoms', checked)}
                  />
                  <Label htmlFor="family_similar_symptoms" className="font-normal cursor-pointer">
                    가족 중 유사한 증상을 경험한 분이 있나요?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medication_usage"
                    checked={watchMedicationUsage}
                    onCheckedChange={(checked) => setValue('medication_usage', checked)}
                  />
                  <Label htmlFor="medication_usage" className="font-normal cursor-pointer">
                    현재 복용 중인 약물이 있나요?
                  </Label>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/signup/client/step1')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전 단계
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
                      완료하기
                      <ArrowRight className="ml-2 h-4 w-4" />
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