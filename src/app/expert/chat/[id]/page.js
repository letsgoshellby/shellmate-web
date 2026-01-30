'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatAPI } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExpertChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatRoomId = params.id;

  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

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
      const data = await ChatAPI.getChatRoom(chatRoomId);
      setChatRoom(data);
      await ChatAPI.markAllAsRead(chatRoomId);
    } catch (error) {
      console.error('채팅방 로딩 실패:', error);
      toast.error('채팅방을 불러오는데 실패했습니다');
      router.push('/expert/chat');
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

      if (before) {
        setMessages((prev) => [...messageList, ...prev]);
      } else {
        setMessages(messageList);
      }
    } catch (error) {
      console.error('메시지 로딩 실패:', error);
      toast.error('메시지를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('이미지 크기는 10MB 이하여야 합니다');
      return;
    }

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
    return message.sender === user?.name || message.sender === user?.email;
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.sent_at).toDateString();
    const prevDate = new Date(prevMsg.sent_at).toDateString();
    return currentDate !== prevDate;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="expert">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* 채팅방 헤더 */}
          <Card className="rounded-b-none">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Link href="/expert/chat">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                  {chatRoom?.client?.name?.charAt(0) || '내'}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {chatRoom?.client?.name || '내담자'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {chatRoom?.client?.email}
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
              messages.map((message, index) => (
                <div key={message.id}>
                  {shouldShowDate(message, messages[index - 1]) && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.sent_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMyMessage(message) ? 'order-2' : 'order-1'}`}>
                      {message.is_deleted ? (
                        <div className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg italic">
                          삭제된 메시지입니다
                        </div>
                      ) : (
                        <>
                          {message.message_type === 'IMAGE' && message.image_url && (
                            <img
                              src={message.image_url}
                              alt="전송된 이미지"
                              className="max-w-full rounded-lg mb-1"
                            />
                          )}
                          {message.content && (
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isMyMessage(message)
                                  ? 'bg-primary text-white rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
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
                  </div>
                </div>
              ))
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
