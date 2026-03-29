import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">셸메이트</h3>
            <p className="text-gray-400">
              느린학습자 아이의 성장을 위한 전문가 상담 플랫폼
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-gray-400">
              {/* <li><Link href="/community">커뮤니티</Link></li>
              <li><Link href="/columns">셸메이트 칼럼</Link></li> */}
              <li><Link href="/faq">자주묻는질문</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">가이드</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/guide/consultation-fields" className="hover:text-white transition-colors">상담 분야 안내</Link></li>
              <li><Link href="/guide/how-to-use" className="hover:text-white transition-colors">이용 방법</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">연락처</h4>
            <p className="text-gray-400">
              이메일: support@shellmate.co.kr
              <br />
              전화: 1588-0000
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 셸메이트. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
