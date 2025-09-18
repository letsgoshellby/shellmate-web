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
import { IoArrowBack, IoArrowForward, IoCheckmarkCircle } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const step1Schema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female'], {
    required_error: '성별을 선택해주세요',
  }),
  child_order: z.enum(['first', 'second', 'third_or_more'], {
    required_error: '몇째 아이인지 선택해주세요',
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
  });

  const watchGender = watch('gender');
  const watchChildOrder = watch('child_order');

  const handleStep1Submit = async (data) => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      if (!token) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/client/signup/step1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
      
      toast.success('아이 기본 정보가 저장되었습니다.');
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
            <CardTitle className="text-2xl font-bold">아이 기본 정보</CardTitle>
            <CardDescription>
              아이의 기본 정보를 입력해주세요 (필수)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupProgress currentStep={1} />
            
            <form onSubmit={handleSubmit(handleStep1Submit)} className="mt-12 space-y-6">
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">
                      남자
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">
                      여자
                    </Label>
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first" id="first" />
                    <Label htmlFor="first" className="font-normal cursor-pointer">
                      첫째
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="second" id="second" />
                    <Label htmlFor="second" className="font-normal cursor-pointer">
                      둘째
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="third_or_more" id="third_or_more" />
                    <Label htmlFor="third_or_more" className="font-normal cursor-pointer">
                      셋째 이상
                    </Label>
                  </div>
                </RadioGroup>
                {errors.child_order && (
                  <p className="text-sm text-red-500">{errors.child_order.message}</p>
                )}
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