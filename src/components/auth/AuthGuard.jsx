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

            console.log('🔍 [AuthGuard] 회원가입 단계:', currentStep);

            // current_step에 따라 리다이렉트
            // current_step: 진행이 끝난 마지막 단계 (완료된 단계)
            const currentPath = window.location.pathname;

            if (currentStep === 1) {
              const targetPath = '/signup/expert/step2';
              if (currentPath !== targetPath) {
                console.log('⚠️ [AuthGuard] Step 1까지 완료 - step2 페이지로 리다이렉트');
                router.replace(targetPath);
              }
            } else if (currentStep === 2) {
              console.log('⚠️ [AuthGuard] Step 2까지 완료 - 심사 대기 중');
              // 심사 대기 중이므로 추가 단계 진행 안 함
            } else if (currentStep === 3) {
              const targetPath = '/signup/expert/bank-account';
              if (currentPath !== targetPath) {
                console.log('⚠️ [AuthGuard] Step 3까지 완료 - bank-account 페이지로 리다이렉트');
                console.log('   현재 경로:', currentPath);
                console.log('   목표 경로:', targetPath);
                router.replace(targetPath);
              }
            } else if (currentStep === 4) {
              console.log('✅ [AuthGuard] Step 4까지 완료 - 회원가입 완료, 대시보드 접근 허용');
              // 회원가입 완료, 대시보드 접근 허용
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