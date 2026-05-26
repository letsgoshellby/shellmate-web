'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColumnsAPI } from '@/lib/api/columns';
import {
  ArrowLeft,
  Eye,
  Heart,
  Calendar,
  Share2,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const QuillViewer = dynamic(() => import('@/components/editor/QuillViewer'), { ssr: false });

// backHref: 목록으로 돌아가는 경로
// editBasePath: 수정 페이지 경로 prefix (기본 /expert/columns)
export default function ColumnDetail({ columnId, backHref, editBasePath = '/expert/columns' }) {
  const router = useRouter();
  const [column, setColumn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!columnId) return;
    loadColumn();
  }, [columnId]);

  const loadColumn = async () => {
    try {
      const data = await ColumnsAPI.getColumn(columnId);
      setColumn(data);
    } catch {
      toast.error('칼럼을 불러오는데 실패했습니다');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSympathy = async () => {
    try {
      const result = await ColumnsAPI.toggleSympathy(column.id);
      setColumn((prev) => ({
        ...prev,
        is_sympathized: result.is_sympathized,
        sympathy_count: result.sympathy_count,
      }));
    } catch (error) {
      const message = error?.response?.data?.error;
      toast.error(message || '공감 처리에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 칼럼을 삭제하시겠습니까?')) return;
    try {
      await ColumnsAPI.deleteColumn(column.id);
      toast.success('칼럼이 삭제되었습니다');
      router.push(backHref);
    } catch {
      toast.error('칼럼 삭제에 실패했습니다');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: column.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!column) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">칼럼을 찾을 수 없습니다</p>
        <Link href={backHref}>
          <Button>목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        </Link>
        {column.is_author && (
          <div className="flex items-center gap-2">
            <Link href={`${editBasePath}/${column.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        )}
      </div>

      {/* 제목 + 메타 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl leading-snug">{column.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center text-sm text-gray-500 gap-4">
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {formatDate(column.created_at)}
              </span>
              <span className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                {(column.view_count ?? 0).toLocaleString()} 조회
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSympathy}
                className={column.is_sympathized ? 'text-red-500 border-red-300' : ''}
              >
                <Heart className={`mr-1 h-4 w-4 ${column.is_sympathized ? 'fill-current' : ''}`} />
                {column.sympathy_count ?? 0}
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
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {column.author?.profile_image ? (
              <img
                src={column.author.profile_image}
                alt={column.author.nickname || column.author.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(column.author?.nickname || column.author?.name || '?').charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-blue-900">
                {column.author?.nickname || column.author?.name}
              </p>
              {column.author?.specialty_display && (
                <p className="text-sm text-blue-700">{column.author.specialty_display}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 본문 */}
      <Card>
        <CardContent className="p-8">
          <QuillViewer content={column.content} />
        </CardContent>
      </Card>

      {/* 하단 공감/공유 */}
      <Card>
        <CardContent className="p-6 flex justify-center gap-4">
          <Button
            onClick={handleSympathy}
            variant={column.is_sympathized ? 'default' : 'outline'}
            className={column.is_sympathized ? 'bg-red-500 hover:bg-red-600 border-none' : ''}
          >
            <Heart className={`mr-2 h-4 w-4 ${column.is_sympathized ? 'fill-current' : ''}`} />
            {column.is_sympathized ? '공감 취소' : '도움이 되었어요'}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            공유하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
