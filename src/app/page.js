import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IoChatbubbleEllipses, IoDocumentText, IoVideocam, IoPeople, IoHeart, IoShield } from 'react-icons/io5';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* 히어로 섹션 */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            느린학습자 아이의 성장을 위한
            <br />
            <span className="text-primary">전문가 상담 플랫폼</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            셸메이트는 느린학습자 아이를 둔 학부모와 전문가를 연결하여<br></br>
            체계적이고 전문적인 도움을 제공합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                지금 시작하기
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                서비스 알아보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            셸메이트의 주요 서비스
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <IoChatbubbleEllipses className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Q&A 커뮤니티</CardTitle>
                <CardDescription>
                  전문가에게 궁금한 점을 언제든지 질문하고 빠른 답변을 받아보세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <IoDocumentText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>전문가 칼럼</CardTitle>
                <CardDescription>
                  각 분야 전문가들이 작성한 유익한 정보와 육아 팁을 확인하세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <IoVideocam className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>비대면 상담</CardTitle>
                <CardDescription>
                  1:1 화상 상담을 통해 개인 맞춤형 전문 상담을 받아보세요
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            많은 가정이 셸메이트와 함께하고 있습니다
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <IoPeople className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">1,000+</h3>
              <p className="text-gray-600">등록된 가정 수</p>
            </div>
            <div>
              <IoHeart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">50+</h3>
              <p className="text-gray-600">검증된 전문가</p>
            </div>
            <div>
              <IoShield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">4.8</h3>
              <p className="text-gray-600">만족도 평점</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            지금 바로 전문가의 도움을 받아보세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            셸메이트의 검증된 전문가들이 여러분을 기다리고 있습니다.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
