import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Users,
  Calendar,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: '이용 방법 - 셸메이트',
  description: '셸메이트에서 전문가 상담을 신청하는 것부터 완료하기까지 크게 4단계의 서비스 이용 방법을 안내합니다. 회원가입부터 전문가 선택, 상담 예약, 화상 상담, 마무리까지 비대면으로 간단하게 시작할 수 있습니다.',
  openGraph: {
    title: '이용 방법 - 셸메이트',
    description: '회원가입부터 전문가 선택, 상담 예약, 화상 상담까지 4단계로 이루어진 체계적인 상담을 경험해보세요',
    url: 'https://shellmate.letsgoshellby.com/guide/how-to-use',
    type: 'website',
  },
};

export default function HowToUsePage() {
  const processSteps = [
    {
      step: '01',
      icon: UserPlus,
      title: '회원가입',
      subtitle: '간편하게 시작하기',
      description: '셸메이트 웹사이트에서 회원가입을 하고 시작해주세요.',
      details: [
        '무료 회원가입',
        '간단한 본인 인증',
        '개인정보는 안전하게 보호됩니다'
      ],
      time: '2분 소요'
    },
    {
      step: '02',
      icon: Users,
      title: '전문가 선택',
      subtitle: '나에게 맞는 전문가 찾기',
      description: '다양한 분야의 전문가 프로필을 확인하고 선택해주세요.',
      details: [
        '전문 분야별 전문가 검색',
        '전문가 프로필과 후기 확인',
        '경력과 자격증 검증'
      ],
      time: '5분 소요'
    },
    {
      step: '03',
      icon: Calendar,
      title: '상담 예약',
      subtitle: '원하는 시간에 예약하기',
      description: '전문가의 일정을 확인하고 편한 시간에 상담을 예약하세요.',
      details: [
        '실시간 일정 확인',
        '원하는 날짜와 시간 선택',
        '상담 분야와 내용 사전 작성'
      ],
      time: '즉시 예약'
    },
    {
      step: '04',
      icon: MessageCircle,
      title: '상담 시작',
      subtitle: '따뜻한 만남',
      description: '예약한 시간에 전문가와 1:1 상담을 시작해요. 편안한 마음으로 대화해보세요.',
      details: [
        '화상 상담으로 진행',
        '50분간 충분한 상담 시간',
        '상담 후 피드백과 다음 계획 수립'
      ],
      time: '50분 상담'
    }
  ];

  const features = [
    {
      icon: Clock,
      title: '자유로운 상담 시간 선택',
      description: '내가 원하는 시간에 맞춰서 예약할 수 있어요'
    },
    {
      icon: CheckCircle,
      title: '검증된 전문가',
      description: '자격증과 경력이 확인된 전문가들이 상담합니다'
    },
    {
      icon: MessageCircle,
      title: '맞춤형 상담',
      description: '개별 상황에 특화된 1:1 솔루션을 제공합니다'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* 페이지 헤더 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto text-center">
          <Play className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">이용 방법</h1>
          <p className="text-gray-600">4단계로 간단하게 전문가 상담을 시작할 수 있습니다</p>
        </div>
      </section>

      {/* 프로세스 단계들 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;

              return (
                <Card key={index} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="relative mb-4">
                      <div className={`w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{step.step}</span>
                      </div>
                    </div>
                    <CardTitle className="text-center text-xl mb-2">{step.title}</CardTitle>
                    <p className="text-sm font-medium text-gray-600 text-center">{step.subtitle}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed text-center">
                      {step.description}
                    </p>

                    <div className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {step.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              셸메이트의 특별함
            </h2>
            <p className="text-gray-600">
              안전하고 전문적인 상담 시스템을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="bg-white border-gray-200 text-center">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-primary border-0 shadow-xl">
            <CardContent className="p-8 lg:p-12 text-white text-center">
              <div className="max-w-3xl mx-auto space-y-6">
                <h3 className="text-2xl lg:text-3xl font-bold">
                  지금 바로 시작해보세요
                </h3>

                <p className="text-lg opacity-90 leading-relaxed">
                  첫 번째 단계는 회원가입부터 시작해요.<br className="hidden sm:block" />
                  셸메이트와 함께 새로운 시작을 해보세요!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link href="/signup">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      <UserPlus className="w-4 h-4 mr-2" />
                      회원가입
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  {/* <Link href="/community">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/20">
                      커뮤니티 둘러보기
                    </Button>
                  </Link> */}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
