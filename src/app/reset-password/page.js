'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthAPI } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import Link from 'next/link';

const schema = z
  .object({
    new_password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    new_password2: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  })
  .refine((data) => data.new_password === data.new_password2, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['new_password2'],
  });

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!uid || !token) {
      toast.error('유효하지 않은 링크입니다.');
    }
  }, [uid, token]);

  const onSubmit = async (data) => {
    if (!uid || !token) {
      toast.error('유효하지 않은 링크입니다. 비밀번호 찾기를 다시 시도해주세요.');
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.confirmPasswordReset(uid, token, data.new_password, data.new_password2);
      setDone(true);
    } catch (error) {
      const detail = error?.response?.data?.error || error?.response?.data?.detail;
      toast.error(detail || '비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-gray-600">유효하지 않은 링크입니다.</p>
            <Link href="/forgot-password">
              <Button className="w-full">비밀번호 찾기로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {done ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">비밀번호 재설정 완료</CardTitle>
              <CardDescription>새 비밀번호로 로그인하세요.</CardDescription>
            </div>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">새 비밀번호 설정</CardTitle>
              <CardDescription>새로 사용할 비밀번호를 입력하세요.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {done ? (
            <Link href="/login">
              <Button className="w-full">로그인하러 가기</Button>
            </Link>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">새 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상 입력하세요"
                    {...register('new_password')}
                    className={errors.new_password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <IoEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <IoEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-sm text-red-500">{errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password2">새 비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="new_password2"
                    type={showPassword2 ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    {...register('new_password2')}
                    className={errors.new_password2 ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword2(!showPassword2)}
                  >
                    {showPassword2 ? (
                      <IoEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <IoEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.new_password2 && (
                  <p className="text-sm text-red-500">{errors.new_password2.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  로그인으로 돌아가기
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
