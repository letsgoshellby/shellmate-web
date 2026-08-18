'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, BookOpen } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CurriculumView({ curriculum }) {
  if (!curriculum) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 작성된 커리큘럼이 없습니다
            </h3>
            <p className="text-gray-500">
              전문가가 커리큘럼을 작성하면 여기에서 확인할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const createdAtLabel = formatDate(curriculum.created_at);

  return (
    <>
      {/* 커리큘럼 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {curriculum.title || '커리큘럼'}
          </CardTitle>
          {curriculum.description && (
            <CardDescription className="text-base mt-2">
              {curriculum.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>총 {curriculum.total_sessions}회차</span>
            </div>
            {createdAtLabel && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>생성일: {createdAtLabel}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 세션별 정보 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">세션별 계획</h2>
        {curriculum.sessions_info && curriculum.sessions_info.length > 0 ? (
          curriculum.sessions_info.map((session, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {session.session_number}회차
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-50">
                    {session.duration_minutes || 50}분
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 세션 제목 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {session.title}
                  </h4>
                </div>

                {/* 세션 설명 */}
                {session.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        세션 내용
                      </p>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {session.description}
                      </p>
                    </div>
                  </>
                )}

                {/* 태그 */}
                {session.tags && session.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        주요 주제
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(session.tags) ? session.tags : session.tags.split(',')).map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="bg-gray-100"
                          >
                            {typeof tag === 'string' ? tag.trim() : tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">세션별 정보가 없습니다</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
