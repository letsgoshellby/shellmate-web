import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  rememberMe: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const response = await login(data.email, data.password, data.rememberMe);
      
      // 사용자 타입에 따라 리다이렉트
      if (response.user.user_type === 'expert') {
        router.push('/expert/dashboard');
      } else if (response.user.user_type === 'client') {
        router.push('/client/dashboard');
      } else {
        router.push('/dashboard');
      }
      
      toast.success('로그인되었습니다');
    } catch (error) {
      if (error.response?.status === 401) {
        setError('password', {
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        });
      } else {
        toast.error('로그인 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        <CardDescription>
          셸메이트에 오신 것을 환영합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              className="h-4 w-4"
            />
            <Label htmlFor="rememberMe" className="text-sm">
              로그인 상태 유지
            </Label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>
          
          <div className="text-center text-sm space-x-4">
            <a href="/forgot-password" className="text-primary hover:underline">
              비밀번호 찾기
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="/signup" className="text-primary hover:underline">
              회원가입
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}