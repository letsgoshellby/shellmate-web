'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/api/auth';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function KakaoExpertCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    handleKakaoCallback();
  }, []);

  const handleKakaoCallback = async () => {
    try {
      // 카카오 SDK에서 Access Token 가져오기
      if (!window.Kakao || !window.Kakao.Auth) {
        throw new Error('카카오 SDK가 로드되지 않았습니다');
      }

      // 카카오 SDK를 통해 Access Token 가져오기
      window.Kakao.Auth.getAccessToken()
        .then(async (accessToken) => {
          if (!accessToken) {
            throw new Error('카카오 Access Token을 가져올 수 없습니다');
          }

          console.log('카카오 Access Token 획득:', accessToken);

          // 백엔드 소셜 로그인 API 호출 (약관 없이)
          try {
            const response = await AuthAPI.expertSocialLogin('kakao', accessToken);

            // 기존 회원인 경우
            if (!response.isNewUser && response.access) {
              toast.success('로그인되었습니다');
              router.push('/expert/dashboard');
              return;
            }

            // 신규 회원인 경우 - Access Token 저장 후 약관 페이지로
            localStorage.setItem('kakao_access_token', accessToken);
            localStorage.setItem('kakao_provider', 'kakao');
            router.push('/signup/expert/social-terms');
          } catch (error) {
            // 약관 미동의 에러 처리
            if (error.response?.status === 400) {
              // Access Token 저장 후 약관 페이지로
              localStorage.setItem('kakao_access_token', accessToken);
              localStorage.setItem('kakao_provider', 'kakao');
              router.push('/signup/expert/social-terms');
            } else {
              throw error;
            }
          }
        })
        .catch((err) => {
          console.error('카카오 로그인 처리 실패:', err);
          setStatus('error');
          toast.error('카카오 로그인에 실패했습니다');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        });
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
