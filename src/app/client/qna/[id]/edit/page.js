'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const questionSchema = z.object({
  title: z.string().min(10, '제목은 10자 이상이어야 합니다').max(100, '제목은 100자를 초과할 수 없습니다'),
  content: z.string().min(20, '내용은 20자 이상이어야 합니다').max(2000, '내용은 2000자를 초과할 수 없습니다'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
});

const categories = [
  { value: 'learning_disability', label: '학습·발달' },
  { value: 'career_independence', label: '진로·자립' },
  { value: 'parenting_emotional', label: '기본생활·양육' },
  { value: 'social_skills', label: '정서행동·사회성' },
];

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    resolver: zodResolver(questionSchema),
  });

  const watchedTitle = watch('title', '');
  const watchedContent = watch('content', '');

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const data = await QnAAPI.getQuestion(params.id);
        reset({
          title: data.title,
          content: data.content,
          category: data.category,
        });
        setTags(data.tags || []);
      } catch {
        toast.error('질문을 불러오는데 실패했습니다');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    };
    loadQuestion();
  }, [params.id]);

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => setTags(tags.filter(t => t !== tagToRemove));

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await QnAAPI.updateQuestion(params.id, {
        title: data.title,
        content: data.content,
        category: data.category,
        tags,
      });
      toast.success('질문이 수정되었습니다');
      router.push(`/client/qna/${params.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || '질문 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Link href={`/client/qna/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">질문 수정</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>질문 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <select
                    id="category"
                    {...register('category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">카테고리를 선택해주세요</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  <div className="flex justify-between text-sm">
                    {errors.title && <p className="text-red-500">{errors.title.message}</p>}
                    <p className="text-gray-500 ml-auto">{watchedTitle.length}/100</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">질문 내용 *</Label>
                  <Textarea
                    id="content"
                    rows={8}
                    {...register('content')}
                    className={errors.content ? 'border-red-500' : ''}
                  />
                  <div className="flex justify-between text-sm">
                    {errors.content && <p className="text-red-500">{errors.content.message}</p>}
                    <p className="text-gray-500 ml-auto">{watchedContent.length}/2000</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>태그 (선택사항)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:bg-gray-200 rounded-full p-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="태그 입력 후 Enter"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={tags.length >= 5}
                    />
                    <Button type="button" variant="outline" onClick={addTag} disabled={!currentTag.trim() || tags.length >= 5}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">최대 5개 ({tags.length}/5)</p>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Link href={`/client/qna/${params.id}`}>
                    <Button variant="outline">취소</Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
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
