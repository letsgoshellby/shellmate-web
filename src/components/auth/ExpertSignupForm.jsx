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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { IoEye, IoEyeOff, IoArrowBack } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const expertSignupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  password2: z.string(),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone_number: z.string().regex(/^01[0-9][0-9]{8}$/, '올바른 전화번호를 입력해주세요 (11자리 숫자)'),
  service_terms: z.boolean().refine(val => val === true, '전문가 이용약관에 동의해야 합니다'),
  privacy_policy: z.boolean().refine(val => val === true, '개인정보 처리방침에 동의해야 합니다'),
}).refine((data) => data.password === data.password2, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["password2"],
});

export function ExpertSignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(expertSignupSchema),
    defaultValues: {
      service_terms: false,
      privacy_policy: false,
    }
  });

  const watchServiceTerms = watch('service_terms');
  const watchPrivacyPolicy = watch('privacy_policy');
  
  const handleSignup = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/expert/signup/basic/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors) {
          Object.entries(responseData.errors).forEach(([key, value]) => {
            toast.error(Array.isArray(value) ? value[0] : value);
          });
        } else {
          toast.error(responseData.detail || '회원가입 중 오류가 발생했습니다');
        }
        return;
      }
      
      // TokenStorage 사용
      if (responseData.access && responseData.refresh) {
        const { TokenStorage } = await import('@/lib/auth/tokenStorage');
        TokenStorage.setTokens(responseData.access, responseData.refresh);
      }
      
      toast.success('기본 정보 등록이 완료되었습니다. 전문가 정보를 입력해주세요.');
      
      // 다음 단계로 이동 (전문가 초기 정보 입력)
      router.push('/signup/expert/step1');
      
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // 숫자만 추출하고 최대 11자리까지만 허용
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.slice(0, 11);
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center relative">
        <button
          onClick={() => router.push('/signup')}
          className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <CardTitle className="text-2xl font-bold">전문가 회원가입</CardTitle>
        <CardDescription>
          느린학습자를 위한 전문 상담 서비스 제공
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8자 이상 입력해주세요"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IoEyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <IoEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password2">비밀번호 확인 *</Label>
            <div className="relative">
              <Input
                id="password2"
                type={showPassword2 ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력해주세요"
                {...register('password2')}
                className={errors.password2 ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword2(!showPassword2)}
              >
                {showPassword2 ? (
                  <IoEyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <IoEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password2 && (
              <p className="text-sm text-red-500">{errors.password2.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="실명을 입력해주세요"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone_number">전화번호 *</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="01012345678"
              maxLength={11}
              {...register('phone_number', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  e.target.value = formatted;
                }
              })}
              className={errors.phone_number ? 'border-red-500' : ''}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500">{errors.phone_number.message}</p>
            )}
          </div>
          
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="service_terms"
                checked={watchServiceTerms}
                onCheckedChange={(checked) => setValue('service_terms', checked)}
              />
              <Label htmlFor="service_terms" className="text-sm font-normal cursor-pointer">
                (필수) 셸메이트 전문가 이용약관에 동의합니다
              </Label>
            </div>
            {errors.service_terms && (
              <p className="text-sm text-red-500 ml-6">{errors.service_terms.message}</p>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy_policy"
                checked={watchPrivacyPolicy}
                onCheckedChange={(checked) => setValue('privacy_policy', checked)}
              />
              <Label htmlFor="privacy_policy" className="text-sm font-normal cursor-pointer">
                (필수) 개인정보 처리방침에 동의합니다
              </Label>
            </div>
            {errors.privacy_policy && (
              <p className="text-sm text-red-500 ml-6">{errors.privacy_policy.message}</p>
            )}
            
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              전문가 회원가입은 추가 정보 입력 및 자격 심사가 필요합니다.
              심사는 보통 1-3일 소요됩니다.
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                회원가입 중...
              </>
            ) : (
              '다음 단계'
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-primary font-medium hover:underline">
              로그인
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}