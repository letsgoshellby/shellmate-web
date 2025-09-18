'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IoPeople, IoSchool } from 'react-icons/io5';

export default function SignupSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">회원가입</CardTitle>
          <CardDescription className="text-lg mt-2">
            셸메이트에 오신 것을 환영합니다. 귀하의 역할을 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <button
              onClick={() => router.push('/signup/client')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200"
            >
              <IoPeople className="h-16 w-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">학부모</h3>
              <p className="text-gray-600 text-sm">
                느린학습자 자녀를 둔 학부모로서
                전문가의 도움을 받고 싶으신 분
              </p>
            </button>
            
            <button
              onClick={() => router.push('/signup/expert')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200"
            >
              <IoSchool className="h-16 w-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">전문가</h3>
              <p className="text-gray-600 text-sm">
                느린학습자를 도울 수 있는
                전문가로서 상담을 제공하시는 분
              </p>
            </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-primary font-medium hover:underline">
              로그인하기
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}