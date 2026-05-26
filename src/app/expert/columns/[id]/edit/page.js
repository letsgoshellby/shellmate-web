'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnsAPI } from '@/lib/api/columns';
import { ArrowLeft, Save, Eye, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false });
const QuillViewer = dynamic(() => import('@/components/editor/QuillViewer'), { ssr: false });

export default function EditColumnPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const getTextLength = (deltaJson) => {
    if (!deltaJson) return 0;
    try {
      const delta = JSON.parse(deltaJson);
      return delta.ops.reduce((acc, op) => {
        if (typeof op.insert === 'string') return acc + op.insert.length;
        return acc;
      }, 0) - 1;
    } catch {
      return 0;
    }
  };

  const textLength = Math.max(0, getTextLength(content));

  useEffect(() => {
    loadColumn();
  }, [id]);

  const loadColumn = async () => {
    try {
      const data = await ColumnsAPI.getColumn(id);
      if (!data.is_author) {
        toast.error('수정 권한이 없습니다');
        router.replace('/expert/columns');
        return;
      }
      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      toast.error('칼럼을 불러오는데 실패했습니다');
      router.replace('/expert/columns');
    } finally {
      setPageLoading(false);
    }
  };

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
      await ColumnsAPI.updateColumn(id, { title: title.trim(), content });
      toast.success('칼럼이 수정되었습니다');
      router.push('/expert/columns');
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error('수정 권한이 없습니다');
      } else {
        toast.error('칼럼 수정에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">칼럼 수정</h1>
                <p className="text-gray-600">내용을 수정하고 저장하세요</p>
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 본문 */}
              <Card>
                <CardHeader>
                  <CardTitle>본문 수정</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuillEditor
                    value={content}
                    onChange={setContent}
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
          <Card>
            <CardContent className="p-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    저장하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
