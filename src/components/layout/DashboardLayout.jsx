import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChatAPI } from '@/lib/api/chat';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IoMenu,
  IoClose,
  IoHome,
  IoChatbubbleEllipses,
  IoChatbubbles,
  IoDocumentText,
  IoVideocam,
  IoPerson,
  IoLogOut,
  IoSettings,
  IoBarChart,
  IoChevronUp,
  IoAdd
} from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export function DashboardLayout({ children, tourActive = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const { user, logout, isExpert, isClient } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const fetchUnread = async () => {
    try {
      const data = await ChatAPI.getChatRooms();
      const rooms = Array.isArray(data) ? data : data.results || [];
      const total = rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
      setTotalUnread(total);
    } catch {
      // 실패 시 무시
    }
  };

  // 30초마다 폴링
  useEffect(() => {
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 채팅방 진입 시 즉시 재조회
  useEffect(() => {
    if (user && pathname) {
      fetchUnread();
    }
  }, [pathname]);
  
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
      { name: '대시보드', href: `/${user?.user_type}/dashboard`, icon: IoHome },
    ];
    
    if (isClient) {
      return [
        ...baseItems,
        { name: 'Q&A 커뮤니티', href: '/client/qna', icon: IoChatbubbleEllipses },
        { name: '전문가 칼럼', href: '/client/columns', icon: IoDocumentText },
        { name: '상담 예약', href: '/client/consultations', icon: IoVideocam },
        { name: '채팅', href: '/client/chat', icon: IoChatbubbles },
        { name: '내 지갑', href: '/client/wallet', icon: IoAdd },
      ];
    }
    
    if (isExpert) {
      return [
        ...baseItems,
        { name: 'Q&A 답변', href: '/expert/qna', icon: IoChatbubbleEllipses },
        { name: '칼럼 작성', href: '/expert/columns', icon: IoDocumentText },
        { name: '상담 관리', href: '/expert/consultations', icon: IoVideocam },
        { name: '채팅', href: '/expert/chat', icon: IoChatbubbles },
          // { name: '통계', href: '/expert/analytics', icon: IoBarChart },
      ];
    }
    
    return baseItems;
  };
  
  const navigationItems = getNavigationItems();
  
  return (
    <div className="h-screen flex bg-gray-100">
      {/* 사이드바 */}
      <div style={{ pointerEvents: tourActive ? 'none' : 'auto' }} className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center gap-2 h-16 px-6 border-b">
          <Image
            src="/shellmate_logo.png"
            alt="셸메이트 로고"
            width={128}
            height={128}
            className=' w-8'
          />
          <h1 className="text-xl font-bold text-primary">셸메이트</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  id={item.name === '채팅' ? 'tour-chat' : undefined}
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.name === '채팅' && totalUnread > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="ml-3 text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {isExpert ? '전문가' : isClient ? '내담자' : '사용자'}
                    </p>
                  </div>
                  <IoChevronUp className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${user?.user_type}/profile`} className="flex items-center w-full">
                  <IoPerson className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${user?.user_type}/settings`} className="flex items-center w-full">
                  <IoSettings className="mr-2 h-4 w-4" />
                  계정 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <IoLogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <IoMenu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              안녕하세요, {user?.name}님!
            </span>
          </div>
        </header>
        */}
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