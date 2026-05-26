'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnsAPI } from '@/lib/api/columns';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  BookOpen,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');

  useEffect(() => {
    loadMyColumns();
  }, [sortBy]);

  const loadMyColumns = async () => {
    try {
      const data = await ColumnsAPI.getMyColumns({ ordering: sortBy });
      const results = data.results ?? data;
      setColumns(results);
    } catch (error) {
      toast.error('칼럼 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (columnId) => {
    if (!confirm('정말로 이 칼럼을 삭제하시겠습니까?')) return;
    try {
      await ColumnsAPI.deleteColumn(columnId);
      setColumns(columns.filter(col => col.id !== columnId));
      toast.success('칼럼이 삭제되었습니다');
    } catch (error) {
      toast.error('칼럼 삭제에 실패했습니다');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const filteredColumns = columns.filter(column =>
    column.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (column.content_preview ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 칼럼 관리</h1>
              <p className="text-gray-600">작성한 칼럼을 관리하고 새로운 칼럼을 작성하세요</p>
            </div>
            <Link href="/expert/columns/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 칼럼 작성
              </Button>
            </Link>
          </div>

          {/* 검색 및 정렬 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="칼럼 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="-created_at">최신순</option>
                  <option value="-view_count">조회순</option>
                  <option value="-sympathy_count">공감순</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 칼럼 목록 */}
          <div className="space-y-4">
            {filteredColumns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">칼럼이 없습니다</h3>
                  <p className="text-gray-600 mb-4">첫 번째 칼럼을 작성해보세요!</p>
                  <Link href="/expert/columns/new">
                    <Button>칼럼 작성하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredColumns.map((column) => (
                <Card key={column.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {column.title}
                        </h3>
                        {column.content_preview && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {column.content_preview}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {formatDate(column.created_at)}
                          </span>
                          <span className="flex items-center">
                            <Eye className="mr-1 h-4 w-4" />
                            {(column.view_count ?? 0).toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Heart className="mr-1 h-4 w-4" />
                            {column.sympathy_count ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 flex-shrink-0">
                        <Link href={`/expert/columns/${column.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-4 w-4" />
                            보기
                          </Button>
                        </Link>
                        <Link href={`/expert/columns/${column.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="mr-1 h-4 w-4" />
                            수정
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(column.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
