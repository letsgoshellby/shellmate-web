'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { SignupProgress } from '@/components/auth/SignupProgress';
import { toast } from 'react-hot-toast';
import { IoArrowForward } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const step1Schema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female'], {
    required_error: '성별을 선택해주세요',
    invalid_type_error: '성별을 선택해주세요',
  }),
  child_order: z.enum(['first', 'second', 'third_or_more'], {
    required_error: '몇째 아이인지 선택해주세요',
    invalid_type_error: '몇째 아이인지 선택해주세요',
  }),
  psychological_test_conducted: z.boolean({
    required_error: '심리검사 여부를 선택해주세요',
    invalid_type_error: '심리검사 여부를 선택해주세요',
  }),
  learning_problem: z.array(z.string()).min(1, '학습 문제를 하나 이상 선택해주세요'),
  learning_problem_detail: z.string().optional(),
  worries: z.array(z.string()).min(1, '고민/걱정을 하나 이상 선택해주세요'),
  worries_detail: z.string().optional(),
  emotional_anxiety_problem: z.array(z.string()).min(1, '정서 및 불안 문제를 하나 이상 선택해주세요'),
  family_similar_symptoms: z.boolean({
    required_error: '가족 유사 증상 여부를 선택해주세요',
    invalid_type_error: '가족 유사 증상 여부를 선택해주세요',
  }),
  medication_usage: z.boolean({
    required_error: '약물 복용 여부를 선택해주세요',
    invalid_type_error: '약물 복용 여부를 선택해주세요',
  }),
});

const LEARNING_PROBLEM_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'reading', label: '읽기' },
  { value: 'writing', label: '쓰기' },
  { value: 'math', label: '수학' },
  { value: 'speaking', label: '말하기' },
  { value: 'concentration', label: '집중력' },
  { value: 'comprehension', label: '이해력' },
  { value: 'memory', label: '기억력' },
  { value: 'other', label: '기타' },
];

const WORRIES_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'sociality', label: '사회성' },
  { value: 'school_adjustment', label: '학교적응' },
  { value: 'interpersonal_relationships', label: '대인관계' },
  { value: 'other', label: '기타' },
];

const EMOTIONAL_ANXIETY_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'obsessive_compulsive', label: '강박' },
  { value: 'tic', label: '틱' },
  { value: 'social_anxiety', label: '사회불안' },
  { value: 'other', label: '기타' },
];

export default function ClientSignupStep1Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedLearningProblems, setSelectedLearningProblems] = useState([]);
  const [selectedWorries, setSelectedWorries] = useState([]);
  const [selectedEmotionalProblems, setSelectedEmotionalProblems] = useState([]);

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
      learning_problem: [],
      worries: [],
      emotional_anxiety_problem: [],
    }
  });

  const watchGender = watch('gender');
  const watchChildOrder = watch('child_order');
  const watchPsychologicalTestConducted = watch('psychological_test_conducted');
  const watchFamilySimilarSymptoms = watch('family_similar_symptoms');
  const watchMedicationUsage = watch('medication_usage');

  const handleCheckboxChange = (value, selected, setSelected, fieldName) => {
    let next;
    if (selected.includes(value)) {
      next = selected.filter(v => v !== value);
    } else {
      next = [...selected, value];
    }
    setSelected(next);
    setValue(fieldName, next);
  };

  const handleStep1Submit = async (data) => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      if (!token) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/me/client/child/`, {
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
          const firstError = Object.values(responseData)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : '입력 내용을 확인해주세요.');
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
              {/* 기본 정보 */}
              <div className="space-y-8">
                <h3 className="font-semibold text-lg border-b pb-2">기본 정보</h3>

                <div className="space-y-4">
                  <Label htmlFor="birth_date">생년월일 *</Label>
                  <Input
                    id="birth_date"
                    type="text"
                    placeholder="2010-01-01"
                    maxLength={10}
                    {...register('birth_date', {
                      onChange: (e) => {
                        e.target.value = formatDate(e.target.value);
                      }
                    })}
                    className={errors.birth_date ? 'border-red-500' : ''}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-500">{errors.birth_date.message}</p>
                  )}
                </div>

                <div className="space-y-4">
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

                <div className="space-y-4">
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

              {/* 세부 정보 */}
              <div className="space-y-8">
                <h3 className="font-semibold text-lg border-b pb-2">세부 정보</h3>

                {/* 심리검사 여부 */}
                <div className="space-y-4">
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

                {/* 학습 문제 - 복수선택 */}
                <div className="space-y-4">
                  <Label>학습 문제 * (복수 선택 가능)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LEARNING_PROBLEM_OPTIONS.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`learning_${value}`}
                          checked={selectedLearningProblems.includes(value)}
                          onCheckedChange={() =>
                            handleCheckboxChange(value, selectedLearningProblems, setSelectedLearningProblems, 'learning_problem')
                          }
                        />
                        <Label htmlFor={`learning_${value}`} className="font-normal cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.learning_problem && (
                    <p className="text-sm text-red-500">{errors.learning_problem.message}</p>
                  )}
                  {selectedLearningProblems.includes('other') && (
                    <Textarea
                      placeholder="기타 학습 문제를 입력해주세요"
                      {...register('learning_problem_detail')}
                      rows={3}
                    />
                  )}
                </div>

                {/* 고민/걱정 - 복수선택 */}
                <div className="space-y-4">
                  <Label>고민/걱정 * (복수 선택 가능)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WORRIES_OPTIONS.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`worries_${value}`}
                          checked={selectedWorries.includes(value)}
                          onCheckedChange={() =>
                            handleCheckboxChange(value, selectedWorries, setSelectedWorries, 'worries')
                          }
                        />
                        <Label htmlFor={`worries_${value}`} className="font-normal cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.worries && (
                    <p className="text-sm text-red-500">{errors.worries.message}</p>
                  )}
                  {selectedWorries.includes('other') && (
                    <Textarea
                      placeholder="기타 고민/걱정을 입력해주세요"
                      {...register('worries_detail')}
                      rows={3}
                    />
                  )}
                </div>

                {/* 정서 및 불안 문제 - 복수선택 */}
                <div className="space-y-4">
                  <Label>정서 및 불안 문제 * (복수 선택 가능)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EMOTIONAL_ANXIETY_OPTIONS.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`emotional_${value}`}
                          checked={selectedEmotionalProblems.includes(value)}
                          onCheckedChange={() =>
                            handleCheckboxChange(value, selectedEmotionalProblems, setSelectedEmotionalProblems, 'emotional_anxiety_problem')
                          }
                        />
                        <Label htmlFor={`emotional_${value}`} className="font-normal cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.emotional_anxiety_problem && (
                    <p className="text-sm text-red-500">{errors.emotional_anxiety_problem.message}</p>
                  )}
                </div>

                {/* 가족력 */}
                <div className="space-y-4">
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

                {/* 약물 복용 */}
                <div className="space-y-4">
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
                <Button type="submit" disabled={loading}>
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
