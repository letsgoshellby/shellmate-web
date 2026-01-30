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
import { QnAAPI } from '@/lib/api/qna';
import { ArrowLeft, Plus, X, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const questionSchema = z.object({
  title: z.string().min(10, '제목은 10자 이상이어야 합니다').max(100, '제목은 100자를 초과할 수 없습니다'),
  content: z.string().min(20, '내용은 20자 이상이어야 합니다').max(2000, '내용은 2000자를 초과할 수 없습니다'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
});

export default function NewQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      category: '',
    }
  });

  const watchedTitle = watch('title', '');
  const watchedContent = watch('content', '');

  const categories = [
    { value: 'attention', label: '집중력/주의력' },
    { value: 'language', label: '언어발달' },
    { value: 'social', label: '사회성' },
    { value: 'behavior', label: '행동문제' },
    { value: 'learning', label: '학습능력' },
    { value: 'emotion', label: '정서발달' },
    { value: 'motor', label: '운동발달' },
    { value: 'etc', label: '기타' },
  ];

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
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

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const questionData = {
        title: data.title,
        content: data.content,
        category: data.category,
        is_anonymous: false, // 익명 여부 (추후 UI 추가 가능)
      };

      // 실제 API 호출
      const result = await QnAAPI.createQuestion(questionData);

      toast.success('질문이 성공적으로 등록되었습니다');
      router.push(`/client/qna/${result.id}`);
    } catch (error) {
      console.error('질문 등록 실패:', error);
      const errorMessage = error.response?.data?.detail || '질문 등록에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/client/qna">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  돌아가기
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">새 질문 작성</h1>
                <p className="text-gray-600">전문가에게 궁금한 점을 자세히 적어주세요</p>
              </div>
            </div>
          </div>

          {/* 도움말 카드 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <h3 className="font-medium mb-1">좋은 질문 작성 팁</h3>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 아이의 나이와 상황을 구체적으로 설명해주세요</li>
                    <li>• 언제부터, 어떤 상황에서 문제가 발생하는지 적어주세요</li>
                    <li>• 지금까지 시도해본 방법이 있다면 함께 공유해주세요</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 질문 작성 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>질문 작성</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 카테고리 선택 */}
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
                    placeholder="질문의 제목을 간단하고 명확하게 적어주세요"
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

                {/* 내용 */}
                <div className="space-y-2">
                  <Label htmlFor="content">질문 내용 *</Label>
                  <Textarea
                    id="content"
                    placeholder="아이의 상황을 자세히 설명해주세요. 나이, 성별, 현재 상황, 언제부터 시작되었는지 등을 포함해서 작성해주시면 더 정확한 답변을 받을 수 있습니다."
                    rows={8}
                    {...register('content')}
                    className={errors.content ? 'border-red-500' : ''}
                  />
                  <div className="flex justify-between items-center text-sm">
                    {errors.content && (
                      <p className="text-red-500">{errors.content.message}</p>
                    )}
                    <p className="text-gray-500 ml-auto">
                      {watchedContent.length}/2000
                    </p>
                  </div>
                </div>

                {/* 태그 */}
                <div className="space-y-2">
                  <Label>태그 (선택사항)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
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
                      disabled={tags.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!currentTag.trim() || tags.length >= 5}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    최대 5개까지 태그를 추가할 수 있습니다 ({tags.length}/5)
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Link href="/client/qna">
                    <Button variant="outline">취소</Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      '질문 등록'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}