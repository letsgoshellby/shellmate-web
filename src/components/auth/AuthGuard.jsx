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
            if (currentStep === '1') {
              console.log('⚠️ [AuthGuard] Step 1 미완료 - step1 페이지로 리다이렉트');
              router.push('/signup/expert/step1');
            } else if (currentStep === '2') {
              console.log('⚠️ [AuthGuard] Step 2 심사 대기 중');
              // 심사 대기 중이므로 추가 단계 진행 안 함
            } else if (currentStep === '3') {
              console.log('⚠️ [AuthGuard] Step 3 미완료 - contract 페이지로 리다이렉트');
              router.push('/signup/expert/contract');
            } else if (currentStep === '4') {
              // Step 4인 경우, 계좌 등록 여부 확인
              const expertProfile = user.expert_profile;
              const hasBankAccount = expertProfile?.bank_name && expertProfile?.account_number;

              if (!hasBankAccount) {
                console.log('⚠️ [AuthGuard] 계좌 미등록 - bank-account 페이지로 리다이렉트');
                router.push('/signup/expert/bank-account');
              }
              // 계좌 등록 완료된 경우 아무 것도 하지 않음 (대시보드 접근 허용)
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