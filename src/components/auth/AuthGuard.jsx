import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = '/login' 
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(`${fallbackUrl}?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user?.user_type !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, loading, requiredRole, user, router, fallbackUrl]);
  
  if (loading) {
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