import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, Video, Users, Heart, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">셸메이트</h1>
            </div>
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

      {/* 히어로 섹션 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            느린학습자 아이의 성장을 위한
            <br />
            <span className="text-primary">전문가 상담 플랫폼</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            셸메이트는 느린학습자 아이를 둔 학부모와 전문가를 연결하여
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
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Q&A 커뮤니티</CardTitle>
                <CardDescription>
                  전문가에게 궁금한 점을 언제든지 질문하고 빠른 답변을 받아보세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>전문가 칼럼</CardTitle>
                <CardDescription>
                  각 분야 전문가들이 작성한 유익한 정보와 육아 팁을 확인하세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Video className="h-12 w-12 text-primary mx-auto mb-4" />
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
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">1,000+</h3>
              <p className="text-gray-600">등록된 가정 수</p>
            </div>
            <div>
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">50+</h3>
              <p className="text-gray-600">검증된 전문가</p>
            </div>
            <div>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
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

      {/* 푸터 */}
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
                <li>Q&A 커뮤니티</li>
                <li>전문가 칼럼</li>
                <li>비대면 상담</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">고객지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li>FAQ</li>
                <li>문의하기</li>
                <li>이용약관</li>
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
    </div>
  );
}
