import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "셸메이트 - 느린학습자 상담 플랫폼",
  description: "느린학습자 아이의 학부모와 전문가를 연결하는 비대면 상담 서비스, 셸메이트",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
        {/* PortOne V2 결제 SDK */}
        <script src="https://cdn.portone.io/v2/browser-sdk.js"></script>
      </head>
      <body className="antialiased font-sans">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
