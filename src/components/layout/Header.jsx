'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-bold text-primary cursor-pointer">셸메이트</div>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-6 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/guide/consultation-fields"
              className={isActive('/guide/consultation-fields') ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}
            >
              상담 분야 안내
            </Link>
            <Link
              href="/guide/how-to-use"
              className={isActive('/guide/how-to-use') ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}
            >
              이용 방법
            </Link>
            <Link
              href="/faq"
              className={isActive('/faq') ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}
            >
              자주묻는질문
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>회원가입</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
