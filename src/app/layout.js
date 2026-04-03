import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { ScriptLoader } from "@/components/ScriptLoader";

export const metadata = {
  title: "셸메이트 - 느린아이 비대면 상담 플랫폼",
  description: "느린 아이를 둔 학부모와 전문가를 연결하는 비대면 코칭 서비스. 검증된 전문가와의 1:1 화상 코칭, 전문가에게 직접 답변받는 커뮤니티, 전문성 있는 칼럼을 통해 아이의 성장을 지원하는 셸메이트입니다.",
  metadataBase: new URL('https://shellmate.letsgoshellby.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "셸메이트 - 느린아이 비대면 상담 플랫폼",
    description: "느린 아이를 둔 학부모와 전문가를 연결하는 비대면 코칭 서비스. 검증된 전문가와의 1:1 화상 코칭, 전문가에게 직접 답변받는 커뮤니티, 전문성 있는 칼럼을 통해 아이의 성장을 지원하는 셸메이트입니다.",
    url: 'https://shellmate.letsgoshellby.com',
    siteName: '셸메이트',
    images: [
      {
        url: '/shellmate_logo.png',
        alt: '셸메이트 로고',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "셸메이트 - 느린아이 비대면 상담 플랫폼",
    description: "느린 아이를 둔 학부모와 전문가를 연결하는 비대면 코칭 서비스",
    images: ['/shellmate_logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
      </head>
      <body className="antialiased font-sans">
        <ScriptLoader />
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
