import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthAPI } from '@/lib/api/auth';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Users, GraduationCap } from 'lucide-react';

const basicInfoSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone_number: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  terms_agreed: z.boolean().refine(val => val === true, '이용약관에 동의해야 합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState('basic'); // 'basic', 'type', 'profile', 'verification', 'complete'
  const [signupData, setSignupData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(basicInfoSchema),
  });
  
  // Step 1: 기본 정보 입력
  const handleBasicInfo = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;
      const response = await AuthAPI.basicSignup(submitData);
      
      // 토큰 저장
      TokenStorage.setTokens(response.access, response.refresh);
      
      // 다음 단계로
      setSignupData({ ...signupData, ...submitData });
      setStep('type');
      toast.success('기본 정보 등록이 완료되었습니다');
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key, { message: value[0] });
        });
      } else {
        toast.error('회원가입 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: 사용자 타입 선택
  const handleTypeSelection = async (userType) => {
    setLoading(true);
    try {
      await AuthAPI.selectUserType(userType);
      
      setSignupData({ ...signupData, user_type: userType });
      
      if (userType === 'client') {
        setStep('complete');
        toast.success('회원가입이 완료되었습니다');
        router.push('/client/dashboard');
      } else {
        setStep('profile');
        toast.success('사용자 타입이 선택되었습니다');
      }
    } catch (error) {
      toast.error('사용자 타입 선택 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  if (step === 'basic') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            셸메이트 계정을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleBasicInfo)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
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
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">전화번호</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="010-1234-5678"
                {...register('phone_number')}
                className={errors.phone_number ? 'border-red-500' : ''}
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms_agreed"
                {...register('terms_agreed')}
                className="h-4 w-4"
              />
              <Label htmlFor="terms_agreed" className="text-sm">
                <a href="/terms" className="text-primary hover:underline">이용약관</a>에 동의합니다
              </Label>
            </div>
            {errors.terms_agreed && (
              <p className="text-sm text-red-500">{errors.terms_agreed.message}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                '다음 단계'
              )}
            </Button>
            
            <div className="text-center text-sm">
              이미 계정이 있으신가요?{' '}
              <a href="/login" className="text-primary hover:underline">
                로그인
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
  
  if (step === 'type') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">사용자 유형 선택</CardTitle>
          <CardDescription>
            귀하의 역할을 선택해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelection('client')}
              disabled={loading}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">내담자 (학부모)</h3>
              <p className="text-sm text-gray-600">
                느린학습자 아이의 학부모로서 전문가의 도움을 받고 싶어요
              </p>
            </button>
            
            <button
              onClick={() => handleTypeSelection('expert')}
              disabled={loading}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">전문가</h3>
              <p className="text-sm text-gray-600">
                느린학습자를 도울 수 있는 전문가로서 상담을 제공하고 싶어요
              </p>
            </button>
          </div>
          
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (step === 'profile') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">전문가 인증 대기</CardTitle>
          <CardDescription>
            전문가 자격 심사가 진행 중입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="py-8">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-gray-600">
              전문가 자격 심사가 완료되면 이메일로 알려드리겠습니다.
              <br />
              보통 1-3일 정도 소요됩니다.
            </p>
          </div>
          
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            홈으로 이동
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}