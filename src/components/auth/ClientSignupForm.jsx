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

const clientSignupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  password2: z.string(),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다'),
  phone_number: z.string().regex(/^01[0-9][0-9]{8}$/, '올바른 전화번호를 입력해주세요 (11자리 숫자)'),
  service_terms: z.boolean().refine(val => val === true, '이용약관에 동의해야 합니다'),
  privacy_policy: z.boolean().refine(val => val === true, '개인정보 처리방침에 동의해야 합니다'),
  legal_guardian_consent: z.boolean().refine(val => val === true, '법정대리인 동의가 필요합니다'),
  third_party_info: z.boolean().refine(val => val === true, '제3자 정보 제공에 동의해야 합니다'),
  sensitive_info: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
}).refine((data) => data.password === data.password2, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["password2"],
});

export function ClientSignupForm() {
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
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      service_terms: false,
      privacy_policy: false,
      legal_guardian_consent: false,
      third_party_info: false,
      sensitive_info: false,
      marketing_consent: false,
    }
  });

  const watchServiceTerms = watch('service_terms');
  const watchPrivacyPolicy = watch('privacy_policy');
  const watchLegalGuardianConsent = watch('legal_guardian_consent');
  const watchThirdPartyInfo = watch('third_party_info');
  const watchSensitiveInfo = watch('sensitive_info');
  const watchMarketingConsent = watch('marketing_consent');
  
  const handleSignup = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/client/signup/basic/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.detail) {
          toast.error(responseData.detail);
        } else {
          toast.error('회원가입 중 오류가 발생했습니다');
        }
        return;
      }
      
      // TokenStorage 사용
      if (responseData.access && responseData.refresh) {
        const { TokenStorage } = await import('@/lib/auth/tokenStorage');
        TokenStorage.setTokens(responseData.access, responseData.refresh);
      }
      
      toast.success('회원가입이 완료되었습니다. 다음 단계를 진행해주세요.');
      
      // 다음 단계로 이동 (아이 정보 입력)
      router.push('/signup/client/step1');
      
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
          <IoArrowBack className="h-5 w-5" />
        </button>
        <CardTitle className="text-2xl font-bold">학부모 회원가입</CardTitle>
        <CardDescription>
          느린학습자 자녀를 위한 전문가 상담 서비스
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
            <Label htmlFor="nickname">닉네임 *</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="서비스에서 사용할 닉네임"
              {...register('nickname')}
              className={errors.nickname ? 'border-red-500' : ''}
            />
            {errors.nickname && (
              <p className="text-sm text-red-500">{errors.nickname.message}</p>
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
                (필수) 셸메이트 이용약관에 동의합니다
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="legal_guardian_consent"
                checked={watchLegalGuardianConsent}
                onCheckedChange={(checked) => setValue('legal_guardian_consent', checked)}
              />
              <Label htmlFor="legal_guardian_consent" className="text-sm font-normal cursor-pointer">
                (필수) 법정대리인 동의합니다
              </Label>
            </div>
            {errors.legal_guardian_consent && (
              <p className="text-sm text-red-500 ml-6">{errors.legal_guardian_consent.message}</p>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="third_party_info"
                checked={watchThirdPartyInfo}
                onCheckedChange={(checked) => setValue('third_party_info', checked)}
              />
              <Label htmlFor="third_party_info" className="text-sm font-normal cursor-pointer">
                (필수) 제3자 정보 제공에 동의합니다
              </Label>
            </div>
            {errors.third_party_info && (
              <p className="text-sm text-red-500 ml-6">{errors.third_party_info.message}</p>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sensitive_info"
                checked={watchSensitiveInfo}
                onCheckedChange={(checked) => setValue('sensitive_info', checked)}
              />
              <Label htmlFor="sensitive_info" className="text-sm font-normal cursor-pointer">
                (선택) 민감정보 처리에 동의합니다
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="marketing_consent"
                checked={watchMarketingConsent}
                onCheckedChange={(checked) => setValue('marketing_consent', checked)}
              />
              <Label htmlFor="marketing_consent" className="text-sm font-normal cursor-pointer">
                (선택) 마케팅 정보 수신에 동의합니다
              </Label>
            </div>
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
              '회원가입'
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