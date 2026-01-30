'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatAPI } from '@/lib/api/chat';
import { MessageSquare, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientChatPage() {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      const data = await ChatAPI.getChatRooms();
      setChatRooms(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('채팅방 목록 로딩 실패:', error);
      toast.error('채팅방 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
            <p className="text-gray-600">전문가와의 대화 목록입니다</p>
          </div>

          {/* 채팅방 목록 */}
          <div className="space-y-3">
            {chatRooms.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    채팅방이 없습니다
                  </h3>
                  <p className="text-gray-600">
                    상담을 예약하면 전문가와 채팅할 수 있습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              chatRooms.map((room) => (
                <Link key={room.id} href={`/client/chat/${room.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* 프로필 이미지 */}
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-medium shrink-0">
                          {room.partner?.charAt(0) || <User className="h-6 w-6" />}
                        </div>

                        {/* 채팅 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {room.partner || '전문가'}
                            </h3>
                            <span className="text-xs text-gray-500 shrink-0 ml-2">
                              {formatDate(room.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {room.last_message || '대화를 시작해보세요'}
                          </p>
                        </div>

                        {/* 안 읽은 메시지 배지 */}
                        {room.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white shrink-0">
                            {room.unread_count}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
