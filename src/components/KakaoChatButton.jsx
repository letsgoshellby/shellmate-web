'use client';

import { usePathname } from 'next/navigation';

const KAKAO_OPEN_CHAT_URL = 'https://pf.kakao.com/_gPdPn';

export function KakaoChatButton() {
  const pathname = usePathname();

  // 화상 상담 화면에서는 하단 컨트롤 바 위쪽(우측)에 위치
  const isVideoCall = pathname?.startsWith('/video-call');
  const positionClass = isVideoCall ? 'bottom-36 right-6' : 'bottom-6 right-6';

  return (
    <a
      href={KAKAO_OPEN_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 상담 문의"
      className={`fixed ${positionClass} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] shadow-lg transition-transform hover:scale-105 active:scale-95`}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3C6.477 3 2 6.463 2 10.734c0 2.742 1.85 5.146 4.63 6.512-.153.522-.986 3.4-1.02 3.626 0 0-.02.17.09.235a.31.31 0 0 0 .26.02c.34-.048 3.94-2.58 4.56-2.99.48.067.973.102 1.48.102 5.523 0 10-3.463 10-7.735S17.523 3 12 3Z"
          fill="#3C1E1E"
        />
      </svg>
    </a>
  );
}
