import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IoChatbubbleEllipses, IoHeart, IoEye, IoTime } from 'react-icons/io5';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: '셸메이트 커뮤니티',
  description: '일상 육아에서 생긴 궁금증과 고민. 누군가에게 털어놓고 답변받기 힘들었던 많은 지점들에 대해 셸메이트에서는 직접 물어보고 검증된 전문가의 답변을 받아보세요.',
};

export default function CommunityPage() {
  // 예시 데이터
  const posts = [
    {
      id: 1,
      title: '7살 아이, 읽기는 잘하는데 이해력이 부족한 것 같아요',
      content: '아이가 글은 읽을 수 있는데 내용을 이해하는 데 어려움을 겪고 있어요. 어떤 방법으로 도와줄 수 있을까요?',
      author: '김민지',
      category: '읽기/쓰기',
      views: 234,
      likes: 12,
      answers: 5,
      createdAt: '2시간 전',
      hasExpertAnswer: true,
    },
    {
      id: 2,
      title: '집중력 향상을 위한 일상 루틴 추천 부탁드립니다',
      content: '5살 아이의 집중력을 키워주고 싶은데, 일상에서 할 수 있는 활동이나 루틴이 있을까요?',
      author: '박서연',
      category: '집중력/주의력',
      views: 189,
      likes: 8,
      answers: 3,
      createdAt: '5시간 전',
      hasExpertAnswer: false,
    },
    {
      id: 3,
      title: '수 개념을 어떻게 가르쳐야 할까요?',
      content: '6살 아이에게 숫자와 수 개념을 알려주고 있는데, 효과적인 방법을 알고 싶습니다.',
      author: '이지훈',
      category: '수학/수 개념',
      views: 156,
      likes: 15,
      answers: 7,
      createdAt: '1일 전',
      hasExpertAnswer: true,
    },
    {
      id: 4,
      title: '언어 발달이 느린 아이, 언제부터 전문가 상담을 받아야 할까요?',
      content: '또래에 비해 언어 발달이 느린 것 같아서 걱정이에요. 전문가 상담 시기를 어떻게 판단해야 할까요?',
      author: '최수진',
      category: '언어발달',
      views: 312,
      likes: 23,
      answers: 9,
      createdAt: '2일 전',
      hasExpertAnswer: true,
    },
    {
      id: 5,
      title: '또래와 어울리는 것을 어려워하는 아이',
      content: '사회성 발달이 느린 것 같아요. 친구들과 잘 어울리게 하려면 어떻게 해야 할까요?',
      author: '정민수',
      category: '사회성',
      views: 267,
      likes: 18,
      answers: 6,
      createdAt: '3일 전',
      hasExpertAnswer: true,
    },
  ];

  const categories = [
    '전체',
    '읽기/쓰기',
    '수학/수 개념',
    '집중력/주의력',
    '언어발달',
    '사회성',
    '기타',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* 페이지 헤더 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Q&A 커뮤니티</h1>
              <p className="text-gray-600">전문가에게 궁금한 점을 물어보고 다른 학부모들과 소통하세요</p>
            </div>
            <Link href="/login">
              <Button size="lg">
                <IoChatbubbleEllipses className="mr-2 h-5 w-5" />
                질문하기
              </Button>
            </Link>
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

      {/* 게시글 목록 */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      {post.hasExpertAnswer && (
                        <Badge className="bg-green-100 text-green-800">전문가 답변</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2 hover:text-primary">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.content}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>{post.author}</span>
                    <div className="flex items-center gap-1">
                      <IoTime className="h-4 w-4" />
                      {post.createdAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <IoEye className="h-4 w-4" />
                      {post.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <IoHeart className="h-4 w-4" />
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <IoChatbubbleEllipses className="h-4 w-4" />
                      답변 {post.answers}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
