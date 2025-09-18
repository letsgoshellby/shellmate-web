'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ColumnsAPI } from '@/lib/api/columns';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  X, 
  Loader2, 
  BookOpen,
  Clock,
  Target,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const columnSchema = z.object({
  title: z.string().min(10, '제목은 10자 이상이어야 합니다').max(100, '제목은 100자를 초과할 수 없습니다'),
  excerpt: z.string().min(20, '요약은 20자 이상이어야 합니다').max(300, '요약은 300자를 초과할 수 없습니다'),
  content: z.string().min(100, '본문은 100자 이상이어야 합니다'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  reading_time: z.number().min(1, '예상 읽기 시간을 입력해주세요').max(60, '읽기 시간은 60분을 초과할 수 없습니다'),
});

export default function NewColumnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [preview, setPreview] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      category: '',
      reading_time: 5,
    }
  });

  const watchedTitle = watch('title', '');
  const watchedExcerpt = watch('excerpt', '');
  const watchedContent = watch('content', '');

  const categories = [
    { value: 'attention', label: '집중력/주의력' },
    { value: 'language', label: '언어발달' },
    { value: 'social', label: '사회성' },
    { value: 'behavior', label: '행동문제' },
    { value: 'learning', label: '학습능력' },
    { value: 'emotion', label: '정서발달' },
    { value: 'development', label: '발달전반' },
    { value: 'parenting', label: '육아정보' },
  ];

  // 읽기 시간 자동 계산 (한국어 기준: 분당 약 200-250자)
  const calculateReadingTime = (content) => {
    const wordsPerMinute = 225;
    const words = content.length;
    const time = Math.ceil(words / wordsPerMinute);
    return Math.max(1, time);
  };

  // 내용이 변경될 때마다 읽기 시간 자동 계산
  const handleContentChange = (e) => {
    const content = e.target.value;
    const estimatedTime = calculateReadingTime(content);
    setValue('reading_time', estimatedTime);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data, isDraft = false) => {
    setLoading(true);
    
    try {
      const columnData = {
        ...data,
        tags: tags,
        status: isDraft ? 'draft' : 'published',
      };
      
      // 실제 API 호출
      // const result = await ColumnsAPI.createColumn(columnData);
      
      // 임시로 성공 처리
      toast.success(isDraft ? '칼럼이 임시저장되었습니다' : '칼럼이 성공적으로 발행되었습니다');
      router.push('/expert/columns');
    } catch (error) {
      toast.error('칼럼 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handlePublish = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/expert/columns">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  돌아가기
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">새 칼럼 작성</h1>
                <p className="text-gray-600">전문적인 지식과 경험을 공유해주세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setPreview(!preview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {preview ? '편집모드' : '미리보기'}
              </Button>
            </div>
          </div>

          {/* 작성 가이드 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <h3 className="font-medium mb-1">좋은 칼럼 작성 가이드</h3>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 학부모들이 실제로 적용할 수 있는 구체적인 방법을 제시해주세요</li>
                    <li>• 전문 용어는 쉽게 풀어서 설명해주세요</li>
                    <li>• 실제 사례나 경험담을 포함하면 더욱 도움이 됩니다</li>
                    <li>• 안전하고 검증된 정보만 제공해주세요</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {preview ? (
            /* 미리보기 모드 */
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary">미리보기</Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {watch('reading_time', 5)}분 읽기
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{watchedTitle || '제목을 입력해주세요'}</CardTitle>
                <p className="text-lg text-gray-600">{watchedExcerpt || '요약을 입력해주세요'}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: watchedContent.replace(/\n/g, '<br/>') || '본문을 입력해주세요' 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            /* 편집 모드 */
            <form className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    기본 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 카테고리 */}
                  <div className="space-y-2">
                    <Label htmlFor="category">카테고리 *</Label>
                    <select
                      id="category"
                      {...register('category')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">카테고리를 선택해주세요</option>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-red-500">{errors.category.message}</p>
                    )}
                  </div>

                  {/* 제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      placeholder="독자의 관심을 끄는 명확한 제목을 작성해주세요"
                      {...register('title')}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    <div className="flex justify-between items-center text-sm">
                      {errors.title && (
                        <p className="text-red-500">{errors.title.message}</p>
                      )}
                      <p className="text-gray-500 ml-auto">
                        {watchedTitle.length}/100
                      </p>
                    </div>
                  </div>

                  {/* 요약 */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">요약 *</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="칼럼의 핵심 내용을 간략하게 요약해주세요. 이 내용은 목록에서 미리보기로 표시됩니다."
                      rows={3}
                      {...register('excerpt')}
                      className={errors.excerpt ? 'border-red-500' : ''}
                    />
                    <div className="flex justify-between items-center text-sm">
                      {errors.excerpt && (
                        <p className="text-red-500">{errors.excerpt.message}</p>
                      )}
                      <p className="text-gray-500 ml-auto">
                        {watchedExcerpt.length}/300
                      </p>
                    </div>
                  </div>

                  {/* 예상 읽기 시간 */}
                  <div className="space-y-2">
                    <Label htmlFor="reading_time">예상 읽기 시간 (분) *</Label>
                    <Input
                      id="reading_time"
                      type="number"
                      min="1"
                      max="60"
                      {...register('reading_time', { valueAsNumber: true })}
                      className={errors.reading_time ? 'border-red-500' : ''}
                    />
                    {errors.reading_time && (
                      <p className="text-sm text-red-500">{errors.reading_time.message}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      본문 작성 시 자동으로 계산됩니다
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 본문 작성 */}
              <Card>
                <CardHeader>
                  <CardTitle>본문 작성</CardTitle>
                  <p className="text-sm text-gray-600">
                    마크다운 문법을 사용하여 작성할 수 있습니다. (# 제목, ## 소제목, **굵게**, *기울임* 등)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="여기에 칼럼의 본문을 작성해주세요. 

예시:
# 주요 제목
## 소제목
본문 내용을 작성합니다.

**중요한 내용은 굵게 표시**할 수 있습니다.

### 세부 항목들
1. 첫 번째 방법
2. 두 번째 방법
3. 세 번째 방법

*기울임체로 강조*도 가능합니다."
                      rows={20}
                      {...register('content', {
                        onChange: handleContentChange
                      })}
                      className={`min-h-[400px] ${errors.content ? 'border-red-500' : ''}`}
                    />
                    <div className="flex justify-between items-center text-sm">
                      {errors.content && (
                        <p className="text-red-500">{errors.content.message}</p>
                      )}
                      <p className="text-gray-500 ml-auto">
                        {watchedContent.length} 글자
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 태그 */}
              <Card>
                <CardHeader>
                  <CardTitle>태그</CardTitle>
                  <p className="text-sm text-gray-600">
                    칼럼과 관련된 키워드를 태그로 추가해주세요
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-gray-200 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="태그 입력 후 Enter 또는 추가 버튼을 클릭하세요"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={tags.length >= 10}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!currentTag.trim() || tags.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      최대 10개까지 태그를 추가할 수 있습니다 ({tags.length}/10)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {/* 액션 버튼 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>• 임시저장하면 언제든지 수정할 수 있습니다</p>
                  <p>• 발행하면 즉시 독자들에게 공개됩니다</p>
                </div>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveDraft}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        임시저장
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handlePublish}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        발행 중...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        발행하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}