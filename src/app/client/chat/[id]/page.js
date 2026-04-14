'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatAPI } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { AdminChat } from '@/components/chat/AdminChat';

export default function ClientChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatRoomId = params.id;

  const [chatRoom, setChatRoom] = useState(null);
  const [counselingRequestId, setCounselingRequestId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadChatRoom();
    loadMessages();
  }, [chatRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRoom = async () => {
    try {
      const [data, rooms] = await Promise.all([
        ChatAPI.getChatRoom(chatRoomId),
        ChatAPI.getChatRooms()
      ]);
      setChatRoom(data);

      const roomList = Array.isArray(rooms) ? rooms : rooms.results || [];
      const matched = roomList.find((r) => String(r.id) === String(chatRoomId));
      if (matched?.counseling_request_id) {
        setCounselingRequestId(matched.counseling_request_id);
      }

      await ChatAPI.markAllAsRead(chatRoomId);
    } catch (error) {
      console.error('채팅방 로딩 실패:', error);
      toast.error('채팅방을 불러오는데 실패했습니다');
      router.push('/client/chat');
    }
  };

  const loadMessages = async (before = null) => {
    try {
      const params = { page_size: 50 };
      if (before) {
        params.before = before;
      }
      const data = await ChatAPI.getMessages(chatRoomId, params);
      const messageList = Array.isArray(data) ? data : data.results || [];

      // 메시지를 역순으로 정렬 (가장 오래된 메시지가 위, 최신 메시지가 아래)
      const sortedMessages = messageList.reverse();

      if (before) {
        setMessages((prev) => [...sortedMessages, ...prev]);
      } else {
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('메시지 로딩 실패:', error);
      toast.error('메시지를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sentMessage = await ChatAPI.sendMessage(chatRoomId, {
        message_type: 'GENERAL',
        content: newMessage.trim()
      });
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      toast.error('메시지 전송에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('이미지 크기는 10MB 이하여야 합니다');
      return;
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPEG, PNG, GIF, WebP 형식만 지원됩니다');
      return;
    }

    setSending(true);
    try {
      const sentMessage = await ChatAPI.sendMessage(chatRoomId, {
        message_type: 'IMAGE',
        image: file
      });
      setMessages((prev) => [...prev, sentMessage]);
    } catch (error) {
      console.error('이미지 전송 실패:', error);
      toast.error('이미지 전송에 실패했습니다');
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const isMyMessage = (message) => {
    // sender 객체의 id와 user.id 비교
    if (message.sender?.id && user?.id) {
      return message.sender.id == user.id;
    }
    // 구버전 호환: sender_id와 비교
    if (message.sender_id && user?.id) {
      return message.sender_id == user.id;
    }
    return message.sender === user?.name || message.sender === user?.email;
  };

  const isAdminChatMessage = (message) => {
    // 상담 예약 관련 메시지만 AdminChat으로 표시
    const adminChatTypes = [
      'RESERVATION_REQUEST',
      'SCHEDULE_CONFIRM',
      'SESSION_REMINDER',
      'SESSION_COMPLETE',
      'SCHEDULE_CHANGE',
      'PAYMENT_NOTICE',
      'COUNSELING_LOG_COMPLETE',
      'CURRICULUM',
      'reservation_request',
      'reservation_accept',
      'reservation_imminent',
      'reservation_complete',
      'counseling_log_complete'
    ];
// 1. 명시된 관리자 채팅 타입이거나
  if (adminChatTypes.includes(message.message_type)) return true;

  // 2. SYSTEM 메시지 중 특정 문구가 포함된 경우 카드로 표시
  if (message.message_type === 'SYSTEM' &&
     (message.content?.includes('커리큘럼'))) {
    return true;
  }

  return false;
};
  const isSimpleSystemMessage = (message) => {
    // 채팅방 개설 등 간단한 시스템 메시지 (중앙 회색 배경)
    return message.message_type === 'SYSTEM' && !isAdminChatMessage(message);
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.sent_at).toDateString();
    const prevDate = new Date(prevMsg.sent_at).toDateString();
    return currentDate !== prevDate;
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

    try {
      await ChatAPI.deleteMessage(chatRoomId, messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true, content: '' } : msg
        )
      );
      toast.success('메시지가 삭제되었습니다');
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
      toast.error('메시지 삭제에 실패했습니다');
    }
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
        {/* 이미지 확대 모달 */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="원본 이미지"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* 채팅방 헤더 */}
          <Card className="rounded-b-none">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Link href="/client/chat">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                  {chatRoom?.expert?.name?.charAt(0) || '전'}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {chatRoom?.expert?.name || '전문가'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {chatRoom?.expert?.specialty_display || chatRoom?.expert?.specialty}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>대화를 시작해보세요!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                // 커리큘럼 작성 요청 메시지는 client에게 노출 안 함
                if (message.message_type === 'SYSTEM' && message.content?.includes('커리큘럼')) return null;

                return (<div key={message.id}>
                  {/* 날짜 구분선 */}
                  {shouldShowDate(message, messages[index - 1]) && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.sent_at)}
                      </span>
                    </div>
                  )}

                  {isAdminChatMessage(message) ? (
                    // 상담 예약 관련 시스템 메시지 - AdminChat 컴포넌트
                    <div className="flex justify-center">
                      <AdminChat
                        messageType={message.message_type}
                        metadata={message.metadata || {}}
                        sessionId={message.session_id}
                        participantName={chatRoom?.expert?.name}
                        sessionNumber={message.session_number}
                        chatRoomId={chatRoomId}
                        counselingRequestId={counselingRequestId}
                        counselorName={chatRoom?.expert?.name}
                        counselingDate={message.counseling_date}
                        counselingLogId={message.counseling_log_id}
                        imageUrl={message.image_url}
                        userType="client"
                      />
                    </div>
                  ) : isSimpleSystemMessage(message) ? (
                    // 간단한 시스템 메시지 (채팅방 개설 등) - 중앙 회색 배경
                    <div className="flex items-center justify-center my-2">
                      <span className="bg-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg whitespace-pre-wrap text-center">
                        {message.content}
                      </span>
                    </div>
                  ) : (
                    /* 메시지 */
                    <div
                      className={`flex gap-2 group ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isMyMessage(message) ? 'order-2' : 'order-1'
                        }`}
                      >
                        {/* 삭제된 메시지 */}
                        {message.is_deleted ? (
                          <div className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg italic">
                            삭제된 메시지입니다
                          </div>
                        ) : (
                          <>
                            {/* 이미지 메시지 */}
                            {message.message_type === 'IMAGE' && message.image_url && (
                              <img
                                src={message.image_url}
                                alt="전송된 이미지"
                                className="max-w-full rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedImage(message.image_url)}
                              />
                            )}

                            {/* 텍스트 메시지 */}
                            {message.content && (
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isMyMessage(message)
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* 시간 및 읽음 표시 */}
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                            isMyMessage(message) ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{formatTime(message.sent_at)}</span>
                          {isMyMessage(message) && (
                            message.is_read ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>

                      {/* 메시지 옵션 (내가 보낸 메시지만) */}
                      {isMyMessage(message) && !message.is_deleted && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 */}
          <Card className="rounded-t-none">
            <CardContent className="p-3">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={!newMessage.trim() || sending}>
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
