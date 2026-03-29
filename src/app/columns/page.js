'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IoDocumentText, IoEye, IoTime, IoPerson } from 'react-icons/io5';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: '셸메이트 칼럼',
  description: ' 언어치료사, 심리상담사 등 각 분야 전문가들이 전하는 느린 아이 육아와 교육 노하우. 아이의 학습 및 발달부터 진로, 자립, 사회성까지 다양한 분야에 대한 전문적이고 실용적인 조언을 만나보세요.',
};

export default function ColumnsPage() {
  // 예시 데이터
  const columns = [
    {
      id: 1,
      title: '느린학습자 아이의 읽기 능력, 이렇게 키워주세요',
      excerpt: '읽기는 모든 학습의 기초입니다. 느린학습자 아이들의 특성에 맞춘 읽기 지도 방법을 소개합니다.',
      content: '읽기 능력 향상을 위한 단계별 접근법과 실제 적용 사례를 통해 부모님들이 가정에서 실천할 수 있는 방법들을 알려드립니다...',
      author: '김소연 전문가',
      authorRole: '언어치료사',
      category: '읽기/쓰기',
      views: 1234,
      publishedAt: '2024.03.15',
      imageUrl: null,
    },
    {
      id: 2,
      title: '수 개념 발달, 놀이로 자연스럽게 배우는 방법',
      excerpt: '일상생활 속 놀이를 통해 자연스럽게 수 개념을 익히는 방법을 알려드립니다.',
      content: '아이들은 놀이를 통해 가장 효과적으로 학습합니다. 수 개념도 마찬가지입니다...',
      author: '박지훈 전문가',
      authorRole: '특수교육 전문가',
      category: '수학/수 개념',
      views: 987,
      publishedAt: '2024.03.12',
      imageUrl: null,
    },
    {
      id: 3,
      title: '집중력이 부족한 아이, 어떻게 도와줄 수 있을까요?',
      excerpt: '집중력 향상을 위한 실질적인 방법과 가정에서 실천할 수 있는 활동들을 소개합니다.',
      content: '집중력은 학습의 기본이지만, 느린학습자 아이들은 특히 집중하는 것을 어려워합니다...',
      author: '이민지 전문가',
      authorRole: '임상심리사',
      category: '집중력/주의력',
      views: 1456,
      publishedAt: '2024.03.10',
      imageUrl: null,
    },
    {
      id: 4,
      title: '느린학습자 아이의 사회성 발달을 돕는 방법',
      excerpt: '또래 관계와 사회적 기술 향상을 위한 구체적인 전략을 제시합니다.',
      content: '사회성은 아이의 행복과 직결되는 중요한 능력입니다. 느린학습자 아이들의 사회성 발달을 돕는 방법...',
      author: '최서연 전문가',
      authorRole: '발달심리 전문가',
      category: '사회성',
      views: 876,
      publishedAt: '2024.03.08',
      imageUrl: null,
    },
    {
      id: 5,
      title: '언어 발달이 느린 아이, 가정에서 할 수 있는 언어 자극 활동',
      excerpt: '일상생활 속에서 쉽게 실천할 수 있는 언어 자극 방법들을 알려드립니다.',
      content: '언어 발달은 시간이 걸리지만, 꾸준한 자극과 노력으로 충분히 향상될 수 있습니다...',
      author: '정유진 전문가',
      authorRole: '언어재활사',
      category: '언어발달',
      views: 1123,
      publishedAt: '2024.03.05',
      imageUrl: null,
    },
    {
      id: 6,
      title: '느린학습자 부모를 위한 마음 관리법',
      excerpt: '아이를 돕기 위해서는 먼저 부모 자신의 마음을 돌보는 것이 중요합니다.',
      content: '느린학습자 아이를 키우는 부모님들의 심리적 어려움과 이를 극복하는 방법...',
      author: '강민수 전문가',
      authorRole: '상담심리사',
      category: '부모 심리',
      views: 1567,
      publishedAt: '2024.03.01',
      imageUrl: null,
    },
  ];

  const categories = [
    '전체',
    '읽기/쓰기',
    '수학/수 개념',
    '집중력/주의력',
    '언어발달',
    '사회성',
    '부모 심리',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* 페이지 헤더 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <IoDocumentText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">셸메이트 칼럼</h1>
            <p className="text-gray-600">각 분야 전문가들이 전하는 육아와 교육 이야기</p>
          </div>
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === '전체' ? 'default' : 'outline'}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* 칼럼 목록 */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.map((column) => (
              <Card key={column.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                {column.imageUrl && (
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={column.imageUrl}
                      alt={column.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{column.category}</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2 hover:text-primary line-clamp-2">
                    {column.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {column.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <IoPerson className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">{column.author}</span>
                        <span className="text-xs">{column.authorRole}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <IoTime className="h-4 w-4" />
                        {column.publishedAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <IoEye className="h-4 w-4" />
                        {column.views}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 페이지네이션 */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex justify-center gap-2">
          <Button variant="outline" size="sm">이전</Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
