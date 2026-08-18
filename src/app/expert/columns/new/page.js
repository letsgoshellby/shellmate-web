'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnsAPI } from '@/lib/api/columns';
import { getQuillTextLength } from '@/lib/quillText';
import { Save, Eye, Loader2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false });
const QuillViewer = dynamic(() => import('@/components/editor/QuillViewer'), { ssr: false });

export default function NewColumnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const textLength = Math.max(0, getQuillTextLength(content));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!content || textLength < 50) {
      toast.error('50자 이상의 칼럼만 업로드 가능합니다.');
      return;
    }

    setLoading(true);
    try {
      await ColumnsAPI.createColumn({ title: title.trim(), content });
      toast.success('칼럼이 성공적으로 등록되었습니다');
      router.push('/expert/columns');
    } catch (error) {
      toast.error('칼럼 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">새 칼럼 작성</h1>
                <p className="text-gray-600">전문적인 지식과 경험을 공유해주세요</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPreview(!preview)}>
              <Eye className="mr-2 h-4 w-4" />
              {preview ? '편집모드' : '미리보기'}
            </Button>
          </div>

          {preview ? (
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">{title || '제목을 입력해주세요'}</h2>
              </CardHeader>
              <CardContent>
                <QuillViewer content={content} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* 제목 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    기본 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      placeholder="독자의 관심을 끄는 명확한 제목을 작성해주세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 본문 */}
              <Card>
                <CardHeader>
                  <CardTitle>본문 작성</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuillEditor
                    value={content}
                    onChange={setContent}
                    placeholder="여기에 칼럼 내용을 작성해주세요"
                    className="min-h-[400px]"
                  />
                  <div className="mt-2 flex justify-end">
                    <span className={`text-xs ${textLength < 50 ? 'text-red-500' : textLength > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
                      {textLength}/5000
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 leading-5">
                    - 칼럼은 최소 50자 이상, 5000자 내외로 작성해주세요.<br />
                    - 허위 사실을 기재할 시 무통보 삭제 처리될 수 있습니다.<br />
                    - 지속적으로 부적절한 내용을 게시할 시 전문가 자격이 박탈될 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 액션 버튼 */}
          {/* <Card> */}
            <CardContent className="p-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    등록하기
                  </>
                )}
              </Button>
            </CardContent>
          {/* </Card> */}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
