'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/api/auth';
import { exchangeCodeForToken } from '@/lib/auth/kakaoAuth';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function KakaoClientCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    handleKakaoCallback();
  }, []);

  const handleKakaoCallback = async () => {
    try {
      // URL에서 인증 코드 추출
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        throw new Error(`카카오 로그인 실패: ${error}`);
      }

      if (!code) {
        throw new Error('인증 코드가 없습니다');
      }
      // 인증 코드를 액세스 토큰으로 교환
      const accessToken = await exchangeCodeForToken(code, 'client');
      // 백엔드로 액세스 토큰 전달
      try {
        // 액세스 토큰을 백엔드로 전송하여 처리
        const response = await AuthAPI.clientSocialLogin('kakao', accessToken);

        // 기존 회원인 경우
        if (!response.is_new && response.access) {
          // JWT 토큰 저장
          TokenStorage.setTokens(response.access, response.refresh);

          // AuthContext 업데이트
          if (response.user) {
            setUser(response.user);
            localStorage.setItem('user_data', JSON.stringify(response.user));
          }
          toast.success('로그인되었습니다');
          router.push('/client/dashboard');
          return;
        }

        // 신규 회원인 경우 - 약관 페이지로
        localStorage.setItem('kakao_access_token', accessToken);
        localStorage.setItem('kakao_provider', 'kakao');
        router.push('/signup/client/social-terms');
      } catch (error) {
        // 약관 미동의 에러 처리
        if (error.response?.status === 400) {
          // 액세스 토큰 저장 후 약관 페이지로
          localStorage.setItem('kakao_access_token', accessToken);
          localStorage.setItem('kakao_provider', 'kakao');
          router.push('/signup/client/social-terms');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('카카오 콜백 처리 실패:', error);
      setStatus('error');
      toast.error('로그인 처리 중 오류가 발생했습니다');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">카카오 로그인 처리 중...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">로그인에 실패했습니다</p>
            <p className="text-sm text-gray-500 mt-2">로그인 페이지로 돌아갑니다...</p>
          </>
        )}
      </div>
    </div>
  );
}
