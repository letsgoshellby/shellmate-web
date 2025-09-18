'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Star, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { consultationAPI } from '@/lib/api/consultation';

const reviewSchema = z.object({
  rating: z.number().min(1, '별점을 선택해주세요').max(5),
  content: z.string().min(10, '최소 10자 이상 작성해주세요').max(1000, '최대 1000자까지 작성 가능합니다'),
});

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      content: '',
    },
  });

  const { watch, setValue } = form;
  const rating = watch('rating');

  useEffect(() => {
    fetchConsultationDetail();
  }, [id]);

  const fetchConsultationDetail = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getConsultationDetail(id);
      
      // 리뷰 작성 가능한 상담인지 확인
      if (data.status !== 'completed') {
        setError('완료된 상담에 대해서만 리뷰를 작성할 수 있습니다.');
        return;
      }
      
      if (data.review) {
        setError('이미 리뷰를 작성한 상담입니다.');
        return;
      }
      
      setConsultation(data);
    } catch (err) {
      setError('상담 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await consultationAPI.createReview(id, {
        rating: data.rating,
        content: data.content,
      });
      
      toast.error('리뷰가 성공적으로 등록되었습니다.');
      router.push(`/client/consultations/${id}`);
    } catch (err) {
      toast.error('리뷰 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = (starRating) => {
    setValue('rating', starRating);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">상담 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push(`/client/consultations/${id}`)}
            >
              상담 상세로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/client/consultations/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          상담 상세로 돌아가기
        </Button>
        
        <h1 className="text-3xl font-bold">리뷰 작성</h1>
        <p className="text-muted-foreground mt-2">
          상담에 대한 솔직한 후기를 남겨주세요. 다른 분들에게 큰 도움이 됩니다.
        </p>
      </div>

      {/* 전문가 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>상담받은 전문가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={consultation.expert.profile_image} />
              <AvatarFallback>{consultation.expert.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{consultation.expert.name}</h3>
              <p className="text-muted-foreground">{consultation.expert.title}</p>
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm ml-1">{consultation.expert.rating}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({consultation.expert.review_count}개 리뷰)
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">상담 주제: {consultation.topic}</p>
            <p className="text-sm text-muted-foreground mt-1">
              상담일: {new Date(consultation.scheduled_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 작성 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>리뷰 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 별점 */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      전체적으로 만족하셨나요?
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleStarClick(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {rating > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({rating === 1 && '매우 불만족'}
                            {rating === 2 && '불만족'}
                            {rating === 3 && '보통'}
                            {rating === 4 && '만족'}
                            {rating === 5 && '매우 만족'})
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 리뷰 내용 */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      상담은 어떠셨나요?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="상담에 대한 자세한 후기를 작성해주세요.&#10;&#10;예시:&#10;- 전문가님이 아이의 상황을 잘 이해해주셨어요&#10;- 구체적인 해결방안을 제시해주셔서 도움이 되었습니다&#10;- 상담 분위기가 편안했어요&#10;&#10;솔직한 후기는 다른 학부모님들에게 큰 도움이 됩니다."
                        className="min-h-[120px] resize-none"
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormMessage />
                      <span className="text-sm text-muted-foreground">
                        {field.value.length}/1000자
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              {/* 안내 메시지 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">리뷰 작성 가이드</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 상담의 전반적인 만족도를 별점으로 표현해주세요</li>
                  <li>• 전문가의 전문성, 소통 방식, 문제 해결 도움 정도 등을 포함해주세요</li>
                  <li>• 다른 학부모들에게 도움이 될 수 있는 구체적인 내용을 작성해주세요</li>
                  <li>• 개인정보나 민감한 내용은 포함하지 마세요</li>
                </ul>
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/client/consultations/${id}`)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="flex-1"
                >
                  {submitting ? '등록 중...' : '리뷰 등록'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}