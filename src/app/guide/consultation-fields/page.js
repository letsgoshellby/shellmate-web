import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Brain,
  Heart,
  Users,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Target
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: '상담 분야 안내 - 셸메이트',
  description: '학습/발달 지원, 아동 기본 생활 및 양육 상담, 정서 행동 및 사회성 상담, 진로/자립 지도 등 느린학습자 아동과 그 가족을 위한 4가지 전문 상담 분야를 안내합니다. 우리 아이에게 맞는 상담을 찾아보세요.',
  openGraph: {
    title: '상담 분야 안내 - 셸메이트',
    description: '학습 지원, 행동 개선, 정서 상담, 가족 상담, 진로 지도 등 느린학습자 아동과 그 가족을 위한 전문 상담 분야를 안내합니다.',
    url: 'https://shellmate.letsgoshellby.com/guide/consultation-fields',
    type: 'website',
  },
};

export default function ConsultationFieldsPage() {
  const consultationFields = [
    {
      id: 'learning',
      icon: BookOpen,
      title: '학습 지원',
      subtitle: '배움의 즐거움 찾기',
      description: '개별 학습 속도에 맞춘 맞춤형 학습 방법과 전략을 제공합니다',
      services: [
        '아이의 학습 특성을 파악하여 맞춤형 학습 로드맵 제공',
        '효과적인 학습 전략과 기법 지도',
        '지속 가능한 학습 습관 형성 지원',
        '학습에 대한 흥미와 자신감 향상'
      ],
      targetAudience: ['학습 속도가 느린 아이들', '학습 방법을 찾는 학부모', '기초 학력이 부족한 학생들'],
      expectedResults: ['개별 맞춤 학습법 습득', '학습 자신감 향상', '꾸준한 학습 습관 형성']
    },
    {
      id: 'behavior',
      icon: Brain,
      title: '행동 개선',
      subtitle: '긍정적인 변화 만들기',
      description: '일상생활에서의 어려운 행동들을 이해하고 개선할 수 있도록 도와드립니다',
      services: [
        '문제 행동의 원인 파악 및 이해',
        '긍정적 행동으로의 구체적 변화 방법 제시',
        '안정적인 일상 패턴 만들기 지원',
        '행동 변화 과정의 심리적 지지 제공'
      ],
      targetAudience: ['주의집중이 어려운 아이들', '충동적인 행동을 보이는 아이들', '규칙적인 생활이 어려운 가정'],
      expectedResults: ['문제 행동 감소', '자기 조절 능력 향상', '안정적인 일상 루틴 확립']
    },
    {
      id: 'emotional',
      icon: Heart,
      title: '정서 상담',
      subtitle: '마음 건강 돌보기',
      description: '아이와 가족의 정서적 어려움을 함께 나누고 해결책을 찾아갑니다',
      services: [
        '감정을 건강하게 표현하는 방법 교육',
        '아이의 장점 발견 및 자신감 증진',
        '친구 관계와 사회적 상호작용 능력 향상',
        '어려운 상황 대처 방법 습득'
      ],
      targetAudience: ['불안이나 우울감을 보이는 아이들', '자존감이 낮은 아이들', '사회적 관계에 어려움이 있는 아이들'],
      expectedResults: ['정서적 안정감 확보', '자존감과 자신감 향상', '건강한 사회적 관계 형성']
    },
    {
      id: 'family',
      icon: Users,
      title: '가족 상담',
      subtitle: '함께 성장하기',
      description: '가족 전체가 함께 성장할 수 있는 소통 방법과 양육 전략을 제공합니다',
      services: [
        '건강한 가족 대화법과 소통 기술 습득',
        '부모의 양육 스트레스 관리',
        '가족 구성원 간의 조화로운 관계 형성',
        '우리 가족에게 맞는 양육 방침 수립'
      ],
      targetAudience: ['양육에 어려움을 겪는 부모', '가족 갈등이 있는 가정', '형제자매 간 문제가 있는 가족'],
      expectedResults: ['가족 간 소통 개선', '양육 스트레스 감소', '조화로운 가족 관계 형성']
    },
    {
      id: 'career',
      icon: GraduationCap,
      title: '진로 지도',
      subtitle: '미래 설계하기',
      description: '아이의 특성과 흥미를 바탕으로 적합한 진로를 함께 탐색해봅니다',
      services: [
        '아이의 강점과 관심사 발견',
        '구체적이고 실현 가능한 진로 로드맵 수립',
        '다양한 직업 세계 간접 체험 기회 제공',
        '단계별 목표 설정 및 준비 과정 지원'
      ],
      targetAudience: ['진로에 고민이 많은 청소년', '자녀 진로가 걱정인 부모', '특수교육 대상 학생들'],
      expectedResults: ['진로 방향성 확립', '구체적인 진로 계획 수립', '진로에 대한 자신감 향상']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* 페이지 헤더 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto text-center">
          <Target className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상담 분야 안내</h1>
          <p className="text-gray-600">느린학습자와 가족을 위한 전문적이고 따뜻한 상담을 제공합니다</p>
        </div>
      </section>

      {/* 상담 분야 탭 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="learning" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-12 h-auto p-1 bg-white shadow-sm rounded-lg border">
              {consultationFields.map((field) => {
                const IconComponent = field.icon;
                return (
                  <TabsTrigger
                    key={field.id}
                    value={field.id}
                    className="flex flex-col items-center space-y-2 p-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-sm font-medium">{field.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* 선택된 분야 상세 내용 */}
            {consultationFields.map((field) => {
              const IconComponent = field.icon;

              return (
                <TabsContent key={field.id} value={field.id} className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 왼쪽: 분야 소개 */}
                    <div className="lg:col-span-1">
                      <Card className="bg-white border-gray-200 shadow-lg h-full">
                        <CardHeader>
                          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-2xl mb-2">{field.title}</CardTitle>
                          <p className="text-lg font-medium text-gray-600 mb-4">{field.subtitle}</p>
                          <p className="text-gray-700 leading-relaxed">{field.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">이런 분들께 추천해요</h4>
                            <ul className="space-y-1">
                              {field.targetAudience.map((audience, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{audience}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">기대할 수 있는 변화</h4>
                            <ul className="space-y-1">
                              {field.expectedResults.map((result, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{result}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 오른쪽: 서비스 목록 */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="bg-white border-gray-200 shadow-sm">
                        <CardHeader>
                          <CardTitle>제공 서비스</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {field.services.map((service, index) => (
                              <li key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <span className="text-gray-700">{service}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* 상담 신청 CTA */}
                      <Card className="bg-primary border-0 shadow-lg">
                        <CardContent className="p-6 text-white text-center">
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold">
                              {field.title} 상담 받아보기
                            </h4>
                            <p className="text-sm opacity-90">
                              전문가와의 1:1 맞춤 상담으로 구체적인 해결책을 찾아보세요
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Link href="/signup">
                                <Button variant="secondary" className="w-full sm:w-auto">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  상담 신청하기
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </Link>
                              <Link href="/community">
                                <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/20">
                                  커뮤니티에서 물어보기
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* 추가 안내 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardContent className="p-8 lg:p-12">
              <div className="max-w-3xl mx-auto space-y-6">
                <Heart className="w-16 h-16 text-primary mx-auto" />

                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  어떤 상담이 필요할지 모르겠다면?
                </h3>

                <p className="text-lg text-gray-600 leading-relaxed">
                  괜찮아요! 셸메이트의 전문가들이 먼저 상담을 통해<br className="hidden sm:block" />
                  가장 적합한 상담 분야를 찾아드릴게요.
                </p>

                <div className="pt-4">
                  <Link href="/signup">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      종합 상담 신청하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-gray-500">
                  첫 15분 상담으로 어떤 도움이 필요한지 함께 파악해봐요
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
