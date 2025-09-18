import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  MessageSquare, 
  FileText, 
  Video, 
  User, 
  LogOut,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isExpert, isClient } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      toast.success('로그아웃되었습니다');
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다');
    }
  };
  
  // 사용자 타입에 따른 네비게이션 메뉴
  const getNavigationItems = () => {
    const baseItems = [
      { name: '대시보드', href: `/${user?.user_type}/dashboard`, icon: Home },
    ];
    
    if (isClient) {
      return [
        ...baseItems,
        { name: 'Q&A 커뮤니티', href: '/client/qna', icon: MessageSquare },
        { name: '전문가 칼럼', href: '/client/columns', icon: FileText },
        { name: '상담 예약', href: '/client/consultations', icon: Video },
        { name: '내 정보', href: '/client/profile', icon: User },
      ];
    }
    n 
    if (isExpert) {
      return [
        ...baseItems,
        { name: 'Q&A 답변', href: '/expert/qna', icon: MessageSquare },
        { name: '칼럼 작성', href: '/expert/columns', icon: FileText },
        { name: '상담 관리', href: '/expert/consultations', icon: Video },
        { name: '통계', href: '/expert/analytics', icon: BarChart3 },
        { name: '내 정보', href: '/expert/profile', icon: User },
      ];
    }
    
    return baseItems;
  };
  
  const navigationItems = getNavigationItems();
  
  return (
    <div className="h-screen flex bg-gray-100">
      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary">셸메이트</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {isExpert ? '전문가' : isClient ? '내담자' : '사용자'}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              안녕하세요, {user?.name}님!
            </span>
          </div>
        </header>
        
        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}