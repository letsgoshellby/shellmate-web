import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export function AuthGuard({
  children,
  requiredRole,
  fallbackUrl = '/login'
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [checkingSignupStatus, setCheckingSignupStatus] = useState(false);
  
  useEffect(() => {
    const checkSignupStatus = async () => {
      if (!loading && isAuthenticated && requiredRole === 'expert' && user?.user_type === 'expert') {
        const isSignupPage = window.location.pathname.startsWith('/signup/expert');

        if (!isSignupPage) {
          // 가격 설정까지 완료한 경우 (마지막 단계) 리다이렉트 스킵
          if (localStorage.getItem('expertSignupComplete') === 'true') return;

          setCheckingSignupStatus(true);

          try {
            const accessToken = TokenStorage.getAccessToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/expert/signup/status/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              credentials: 'include',
            });

            if (!response.ok) {
              console.error('⚠️ [AuthGuard] 회원가입 상태 조회 실패');
              setCheckingSignupStatus(false);
              return;
            }

            const data = await response.json();
            const currentStep = data.current_step;

            // current_step에 따라 리다이렉트
            // current_step: 진행이 끝난 마지막 단계 (완료된 단계)
            const currentPath = window.location.pathname;

            if (currentStep === '1') {
              const targetPath = '/signup/expert/step1';
              if (currentPath !== targetPath) {
                router.replace(targetPath);
              }
            } else if (currentStep === '2') {
              // 승인된 경우 계약서 페이지로, 심사 대기 중이면 dashboard 유지
              const verificationStatus = user?.expert_profile?.verification_status;
              if (verificationStatus === 'approved') {
                const targetPath = '/signup/expert/contract';
                if (currentPath !== targetPath) {
                  router.replace(targetPath);
                }
              }
            } else if (currentStep === '3') {
              const targetPath = '/signup/expert/bank-account';
              if (currentPath !== targetPath) {
                router.replace(targetPath);
              }
            } else if (currentStep === '4') {
              const targetPath = '/signup/expert/introduction';
              if (currentPath !== targetPath) {
                router.replace(targetPath);
              }
            }

          } catch (error) {
            console.error('⚠️ [AuthGuard] 회원가입 상태 조회 에러:', error);
          } finally {
            setCheckingSignupStatus(false);
          }
        }
      }
    };

    if (!loading) {
      if (!isAuthenticated) {
        router.push(`${fallbackUrl}?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user?.user_type !== requiredRole) {
        router.push('/unauthorized');
      } else if (requiredRole === 'expert' && user?.user_type === 'expert') {
        checkSignupStatus();
      }
    }
  }, [isAuthenticated, loading, requiredRole, user, router, fallbackUrl]);
  
  if (loading || checkingSignupStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (requiredRole && user?.user_type !== requiredRole) {
    return null;
  }
  
  return <>{children}</>;
}