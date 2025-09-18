'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColumnsAPI } from '@/lib/api/columns';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Eye, 
  Heart,
  Calendar,
  Share2,
  BookOpen,
  Award,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ColumnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [column, setColumn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedColumns, setRelatedColumns] = useState([]);

  // 임시 데이터
  const mockColumn = {
    id: 1,
    title: '6세 아이의 집중력 향상을 위한 5가지 방법',
    content: `
# 집중력 부족한 아이, 어떻게 도와줄 수 있을까요?

많은 부모님들이 아이의 집중력 부족으로 고민하고 계십니다. 특히 6세 전후의 아이들은 주의집중 시간이 짧아 학습이나 놀이에 어려움을 겪는 경우가 많습니다.

## 1. 환경 조성하기

### 집중할 수 있는 공간 만들기
- **조용하고 정리된 공간**: 시각적 자극을 최소화한 공간을 마련해주세요
- **적절한 조명**: 너무 밝거나 어둡지 않은 자연광이 좋습니다
- **온도와 습도**: 20-22도의 적절한 온도를 유지해주세요

### 산만함 제거하기
- 책상 위에는 필요한 것만 놓기
- TV나 스마트폰 등 방해 요소 치우기
- 소음 차단하기

## 2. 단계적 시간 늘리기

### 짧은 시간부터 시작
6세 아이의 집중 시간은 보통 **6-12분** 정도입니다. 이를 기준으로:

1. **5분부터 시작**: 아이가 무리 없이 집중할 수 있는 시간
2. **점진적 증가**: 1-2주마다 2-3분씩 늘려가기
3. **성취감 제공**: 목표 달성 시 충분한 칭찬하기

### 타이머 활용법
- 시각적 타이머 사용 (모래시계, 디지털 타이머)
- 아이와 함께 시간 정하기
- 시간 완료 시 작은 보상 제공

## 3. 흥미 유발하기

### 아이의 관심사 활용
- 좋아하는 캐릭터나 주제를 학습에 접목
- 놀이 형태로 집중력 훈련하기
- 다양한 교구와 재료 활용

### 활동의 다양성
- **시각적 활동**: 퍼즐, 색칠하기, 미로찾기
- **청각적 활동**: 음악 듣기, 이야기 들려주기
- **운동 활동**: 집중력을 요하는 간단한 운동

## 4. 루틴 만들기

### 일정한 시간, 일정한 장소
- 매일 같은 시간에 집중 훈련하기
- 동일한 장소에서 활동하기
- 시작과 끝을 명확히 하기

### 준비 과정 만들기
1. 마음의 준비: "지금부터 집중하는 시간이야"
2. 몸의 준비: 바른 자세 취하기
3. 목표 설정: "10분 동안 이 활동을 해보자"

## 5. 적절한 보상과 격려

### 내재적 동기 키우기
- 과정에 대한 칭찬: "열심히 집중했구나"
- 구체적인 피드백: "5분 동안 한 번도 딴 짓 안 했네"
- 성장에 대한 인정: "어제보다 더 오래 집중했어"

### 보상 시스템
- **즉시적 보상**: 집중 완료 후 바로 칭찬
- **누적적 보상**: 일주일 동안 목표 달성 시 특별한 활동
- **내재적 보상**: 성취감과 자신감 향상

## 주의사항

### 피해야 할 것들
- 무리한 시간 연장
- 지나친 압박과 강요
- 부정적인 피드백
- 일관성 없는 규칙

### 전문가 도움이 필요한 경우
다음과 같은 상황에서는 전문가 상담을 받아보시기 바랍니다:

- 3개월 이상 꾸준한 노력에도 개선이 없을 때
- 일상생활에 심각한 지장이 있을 때
- 아이가 심한 스트레스를 받고 있을 때
- 또래에 비해 현저히 집중력이 떨어질 때

## 마무리

집중력은 하루아침에 늘지 않습니다. 꾸준한 연습과 부모님의 인내심이 필요합니다. 아이의 속도에 맞춰 천천히, 그리고 즐겁게 접근해보세요.

무엇보다 아이가 스트레스받지 않도록 하는 것이 중요합니다. 작은 발전도 크게 격려해주시고, 실패했을 때도 따뜻하게 격려해주세요.

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다. 더 많은 육아 정보는 제 다른 칼럼에서 확인하실 수 있습니다.*
    `,
    excerpt: '집중력이 부족한 아이들을 위한 실용적인 해결책을 소개합니다. 가정에서 쉽게 적용할 수 있는 방법들을 전문가의 시각에서 설명드립니다.',
    category: 'attention',
    author: {
      id: 2,
      name: '김전문가',
      title: '아동발달 전문가',
      profile_image: null,
      expertise: ['집중력', '주의력', 'ADHD'],
      experience_years: 10,
      certifications: ['아동발달전문가', '임상심리사'],
      introduction: '10년간 집중력 부족 아동들을 도와온 전문가입니다. 실용적이고 효과적인 방법을 제시합니다.'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    views_count: 1250,
    likes_count: 45,
    is_liked: false,
    reading_time: 5,
    tags: ['집중력', '육아팁', 'ADHD', '아동발달'],
    thumbnail: null
  };

  const mockRelatedColumns = [
    {
      id: 2,
      title: 'ADHD 아이의 학습 지도 방법',
      author: { name: '이전문가', title: '특수교육전문가' },
      views_count: 890,
      reading_time: 6
    },
    {
      id: 3,
      title: '주의력 향상을 위한 놀이치료',
      author: { name: '박치료사', title: '놀이치료사' },
      views_count: 720,
      reading_time: 4
    }
  ];

  useEffect(() => {
    loadColumnDetail();
    loadRelatedColumns();
  }, [params.id]);

  const loadColumnDetail = async () => {
    try {
      // 실제 API 호출 시
      // const data = await ColumnsAPI.getColumn(params.id);
      // await ColumnsAPI.incrementViews(params.id); // 조회수 증가
      // setColumn(data);
      
      // 임시로 목 데이터 사용
      setColumn(mockColumn);
    } catch (error) {
      toast.error('칼럼을 불러오는데 실패했습니다');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedColumns = async () => {
    try {
      // const data = await ColumnsAPI.getColumnsByCategory(column.category, { limit: 3 });
      // setRelatedColumns(data.results.filter(col => col.id !== parseInt(params.id)));
      
      setRelatedColumns(mockRelatedColumns);
    } catch (error) {
    }
  };

  const handleLike = async () => {
    try {
      // await ColumnsAPI.likeColumn(column.id);
      setColumn({
        ...column,
        is_liked: !column.is_liked,
        likes_count: column.is_liked ? column.likes_count - 1 : column.likes_count + 1
      });
      
      toast.success(column.is_liked ? '좋아요를 취소했습니다' : '좋아요를 눌렀습니다');
    } catch (error) {
      toast.error('좋아요 처리에 실패했습니다');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: column.title,
        text: column.excerpt,
        url: window.location.href,
      });
    } catch (error) {
      // 공유 API가 지원되지 않는 경우 URL 복사
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryName = (category) => {
    const categories = {
      attention: '집중력',
      language: '언어발달',
      social: '사회성',
      behavior: '행동',
      learning: '학습',
      emotion: '정서발달'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!column) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">칼럼을 찾을 수 없습니다</h2>
            <Link href="/client/columns">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/columns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Button>
            </Link>
          </div>

          {/* 칼럼 헤더 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {getCategoryName(column.category)}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {column.reading_time}분 읽기
                    </span>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mb-4">{column.title}</CardTitle>
                  <p className="text-lg text-gray-600 mb-6">{column.excerpt}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {column.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(column.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Eye className="mr-1 h-4 w-4" />
                    {column.views_count.toLocaleString()} 조회
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={column.is_liked ? 'text-red-500' : ''}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${column.is_liked ? 'fill-current' : ''}`} />
                    {column.likes_count}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="mr-1 h-4 w-4" />
                    공유
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 작성자 정보 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {column.author.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-blue-900">{column.author.name}</h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Award className="mr-1 h-3 w-3" />
                      {column.author.title}
                    </Badge>
                  </div>
                  <p className="text-blue-800 mb-2">{column.author.introduction}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-blue-700">
                      경력 {column.author.experience_years}년
                    </span>
                    <span className="text-sm text-blue-700">•</span>
                    <span className="text-sm text-blue-700">
                      전문분야: {column.author.expertise.join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {column.author.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 칼럼 내용 */}
          <Card>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: column.content.replace(/\n/g, '<br/>') }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center space-x-4">
                <Button onClick={handleLike} className={column.is_liked ? 'bg-red-500 hover:bg-red-600' : ''}>
                  <Heart className={`mr-2 h-4 w-4 ${column.is_liked ? 'fill-current' : ''}`} />
                  {column.is_liked ? '좋아요 취소' : '도움이 되었어요'}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  공유하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 관련 칼럼 */}
          {relatedColumns.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">관련 칼럼</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedColumns.map((relatedColumn) => (
                  <Card key={relatedColumn.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <Link href={`/client/columns/${relatedColumn.id}`}>
                        <h4 className="font-medium text-gray-900 hover:text-primary cursor-pointer mb-2">
                          {relatedColumn.title}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{relatedColumn.author.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            {relatedColumn.views_count}
                          </span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {relatedColumn.reading_time}분
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}