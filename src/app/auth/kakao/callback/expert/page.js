'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/api/auth';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { exchangeCodeForToken } from '@/lib/auth/kakaoAuth';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function KakaoExpertCallbackPage() {
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

      // CSRF state 검증
      const returnedState = params.get('state');
      const savedState = sessionStorage.getItem('kakao_oauth_state');
      sessionStorage.removeItem('kakao_oauth_state');
      if (!savedState || returnedState !== savedState) {
        toast.error('로그인을 다시 시도해주세요');
        router.push('/login');
        return;
      }

      // 인증 코드를 액세스 토큰으로 교환
      const accessToken = await exchangeCodeForToken(code, 'expert');
      // 백엔드로 액세스 토큰 전달
      try {
        // 액세스 토큰을 백엔드로 전송하여 처리
        const response = await AuthAPI.expertSocialLogin('kakao', accessToken);

        // 토큰 저장
        if (response.access) {
          TokenStorage.setTokens(response.access, response.refresh);
        }

        // AuthContext 업데이트
        if (response.user) {
          setUser(response.user);
        }

        // 신규 회원 - 약관 페이지로
        if (response.is_new) {
          sessionStorage.setItem('kakao_access_token', accessToken);
          sessionStorage.setItem('kakao_provider', 'kakao');
          router.push('/signup/expert/social-terms');
          return;
        }

        // signup_incomplete가 있는 경우 - step으로 라우팅
        if (response.signup_incomplete) {
          if (response.step === 'expert_initial_info') {
            router.push('/signup/expert/step1');
          } else if (response.step === 'verification_pending') {
            toast('심사 대기 중입니다. 승인까지 1-2일 소요됩니다.', { icon: '⏳' });
            router.push('/expert/dashboard');
          } else {
            router.push('/expert/dashboard');
          }
          return;
        }

        // signup_incomplete 없는 경우 - 승인 여부 + current_step 확인
        const verificationStatus = response.user?.expert_profile?.verification_status;

        if (verificationStatus === 'approved') {
          const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/expert/signup/status/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${response.access}` },
          });

          if (statusRes.ok) {
            const { current_step } = await statusRes.json();

            if (current_step === '2') {
              router.push('/signup/expert/contract');
            } else if (current_step === '3') {
              router.push('/signup/expert/bank-account');
            } else if (current_step === '4') {
              // pricing 여부 확인 후 완료 처리
              try {
                const pricings = await ConsultationsAPI.getMyPricing();
                const pricingList = Array.isArray(pricings) ? pricings : (pricings?.results ?? []);
                if (pricingList.length > 0) {
                  localStorage.setItem('expertSignupComplete', 'true');
                  toast.success('로그인되었습니다');
                  router.push('/expert/dashboard');
                  return;
                }
              } catch {}
              router.push('/signup/expert/introduction');
            } else {
              localStorage.setItem('expertSignupComplete', 'true');
              toast.success('로그인되었습니다');
              router.push('/expert/dashboard');
            }
            return;
          }
        }

        // 회원가입 완료
        localStorage.setItem('expertSignupComplete', 'true');
        toast.success('로그인되었습니다');
        router.push('/expert/dashboard');
      } catch (error) {
        if (error.response?.status === 400) {
          sessionStorage.setItem('kakao_access_token', accessToken);
          sessionStorage.setItem('kakao_provider', 'kakao');
          router.push('/signup/expert/social-terms');
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
