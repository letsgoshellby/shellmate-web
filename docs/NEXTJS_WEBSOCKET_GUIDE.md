# WebSocket 실시간 기능 구현 가이드

## 목차
1. [WebSocket 아키텍처 개요](#websocket-아키텍처-개요)
2. [Django Channels 엔드포인트](#django-channels-엔드포인트)
3. [Next.js WebSocket 클라이언트 구현](#nextjs-websocket-클라이언트-구현)
4. [상담 실시간 모니터링](#상담-실시간-모니터링)
5. [실시간 채팅 구현](#실시간-채팅-구현)
6. [예약 채팅 시스템](#예약-채팅-시스템)
7. [실시간 알림 시스템](#실시간-알림-시스템)
8. [연결 상태 관리](#연결-상태-관리)
9. [에러 처리 및 재연결](#에러-처리-및-재연결)
10. [성능 최적화](#성능-최적화)

## WebSocket 아키텍처 개요

### 백엔드 구조
- **Django Channels**: WebSocket 처리
- **Redis**: 채널 레이어 (메시지 브로커)
- **Celery Beat**: 주기적 상태 브로드캐스트

### WebSocket 엔드포인트
```
ws://localhost:8000/ws/consultation/{consultation_id}/  # 상담 상태
ws://localhost:8000/ws/chat/{room_id}/                  # 채팅
ws://localhost:8000/ws/reservation-chat/{expert_id}/    # 예약 채팅
ws://localhost:8000/ws/notifications/                   # 알림
```

## Django Channels 엔드포인트

### 인증 메커니즘
모든 WebSocket 연결은 JWT 토큰을 통해 인증됩니다:
- URL 파라미터: `?token={jwt_token}`
- 또는 첫 메시지로 인증 정보 전송

## Next.js WebSocket 클라이언트 구현

### 기본 WebSocket Manager

```typescript
// lib/websocket/WebSocketManager.ts
import EventEmitter from 'events';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  
  constructor(url: string) {
    super();
    this.url = url;
  }
  
  connect(token?: string): void {
    const wsUrl = token ? `${this.url}?token=${token}` : this.url;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    }
  }
  
  private setupEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
        
        // 메시지 타입별 이벤트 발생
        if (data.type) {
          this.emit(data.type, data);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.stopHeartbeat();
      this.emit('disconnected');
      
      if (!event.wasClean) {
        this.handleReconnection();
      }
    };
  }
  
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_exceeded');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30초마다 ping
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
  
  send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      this.messageQueue.push(message);
      return;
    }
    
    try {
      this.ws?.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}

// WebSocket Manager Singleton
class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  }
  
  getConnection(channel: string, id: string): WebSocketConnection {
    const key = `${channel}/${id}`;
    
    if (!this.connections.has(key)) {
      const connection = new WebSocketConnection(
        `${this.baseUrl}/${channel}/${id}/`
      );
      this.connections.set(key, connection);
    }
    
    return this.connections.get(key)!;
  }
  
  closeConnection(channel: string, id: string): void {
    const key = `${channel}/${id}`;
    const connection = this.connections.get(key);
    
    if (connection) {
      connection.disconnect();
      this.connections.delete(key);
    }
  }
  
  closeAllConnections(): void {
    this.connections.forEach(connection => {
      connection.disconnect();
    });
    this.connections.clear();
  }
}

export const wsManager = new WebSocketManager();
```

## 상담 실시간 모니터링

### 상담 상태 WebSocket Hook

```typescript
// hooks/useConsultationWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { wsManager } from '@/lib/websocket/WebSocketManager';
import { useAuth } from '@/hooks/useAuth';

export interface ConsultationStatus {
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  participants: Array<{
    id: number;
    name: string;
    type: 'expert' | 'client';
    joined_at: string;
  }>;
  started_at?: string;
  agora_token?: string;
  agora_channel?: string;
}

export function useConsultationWebSocket(consultationId: string) {
  const { token } = useAuth();
  const [status, setStatus] = useState<ConsultationStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!consultationId || !token) return;
    
    const connection = wsManager.getConnection('consultation', consultationId);
    
    // 이벤트 핸들러
    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };
    
    const handleDisconnected = () => {
      setIsConnected(false);
    };
    
    const handleMessage = (data: any) => {
      switch (data.type) {
        case 'consultation_status':
          setStatus(data.status_data);
          break;
          
        case 'participant_joined':
          setStatus(prev => ({
            ...prev!,
            participants: [...(prev?.participants || []), data.participant]
          }));
          break;
          
        case 'participant_left':
          setStatus(prev => ({
            ...prev!,
            participants: prev?.participants.filter(
              p => p.id !== data.participant_id
            ) || []
          }));
          break;
          
        case 'consultation_started':
          setStatus(prev => ({
            ...prev!,
            status: 'in_progress',
            started_at: data.started_at,
            agora_token: data.agora_token,
            agora_channel: data.agora_channel,
          }));
          break;
          
        case 'consultation_ended':
          setStatus(prev => ({
            ...prev!,
            status: 'completed'
          }));
          break;
          
        case 'consultation_cancelled':
          setStatus(prev => ({
            ...prev!,
            status: 'cancelled'
          }));
          break;
      }
    };
    
    const handleError = (error: any) => {
      setError('연결 오류가 발생했습니다.');
      console.error('Consultation WebSocket error:', error);
    };
    
    // 이벤트 리스너 등록
    connection.on('connected', handleConnected);
    connection.on('disconnected', handleDisconnected);
    connection.on('message', handleMessage);
    connection.on('error', handleError);
    
    // 연결 시작
    connection.connect(token);
    
    // 클린업
    return () => {
      connection.off('connected', handleConnected);
      connection.off('disconnected', handleDisconnected);
      connection.off('message', handleMessage);
      connection.off('error', handleError);
      wsManager.closeConnection('consultation', consultationId);
    };
  }, [consultationId, token]);
  
  const sendPresence = useCallback(() => {
    const connection = wsManager.getConnection('consultation', consultationId);
    connection.send({ type: 'presence_update' });
  }, [consultationId]);
  
  const requestExtension = useCallback((minutes: number) => {
    const connection = wsManager.getConnection('consultation', consultationId);
    connection.send({ 
      type: 'request_extension',
      duration_minutes: minutes 
    });
  }, [consultationId]);
  
  return {
    status,
    isConnected,
    error,
    sendPresence,
    requestExtension,
  };
}
```

### 상담방 컴포넌트

```typescript
// components/consultation/ConsultationRoom.tsx
import { useConsultationWebSocket } from '@/hooks/useConsultationWebSocket';
import { useAgoraClient } from '@/hooks/useAgoraClient';

export function ConsultationRoom({ consultationId }: { consultationId: string }) {
  const { 
    status, 
    isConnected, 
    sendPresence 
  } = useConsultationWebSocket(consultationId);
  
  const {
    localVideoTrack,
    remoteUsers,
    isJoined,
    join,
    leave,
  } = useAgoraClient();
  
  // 주기적으로 presence 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        sendPresence();
      }
    }, 10000); // 10초마다
    
    return () => clearInterval(interval);
  }, [isConnected, sendPresence]);
  
  // Agora 자동 참가
  useEffect(() => {
    if (status?.status === 'in_progress' && status.agora_token && !isJoined) {
      join(status.agora_channel!, status.agora_token);
    }
  }, [status, isJoined, join]);
  
  return (
    <div className="consultation-room">
      {/* 상태 표시 */}
      <div className="status-bar">
        <span>상담 상태: {status?.status}</span>
        <span>참가자: {status?.participants.length}명</span>
      </div>
      
      {/* 비디오 화면 */}
      <div className="video-container">
        <div className="local-video" ref={localVideoTrack?.play} />
        {remoteUsers.map(user => (
          <div 
            key={user.uid}
            className="remote-video"
            ref={user.videoTrack?.play}
          />
        ))}
      </div>
      
      {/* 컨트롤 */}
      <div className="controls">
        <button onClick={leave}>상담 종료</button>
      </div>
    </div>
  );
}
```

## 실시간 채팅 구현

### 채팅 WebSocket Hook

```typescript
// hooks/useChatWebSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { wsManager } from '@/lib/websocket/WebSocketManager';

export interface ChatMessage {
  id: string;
  sender: {
    id: number;
    name: string;
    profile_image?: string;
  };
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  is_read: boolean;
  file_url?: string;
  file_name?: string;
}

export interface TypingUser {
  id: number;
  name: string;
}

export function useChatWebSocket(roomId: string) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!roomId || !token) return;
    
    const connection = wsManager.getConnection('chat', roomId);
    
    const handleMessage = (data: any) => {
      switch (data.type) {
        case 'chat_message':
          setMessages(prev => [...prev, data.message]);
          break;
          
        case 'message_history':
          setMessages(data.messages);
          break;
          
        case 'typing_start':
          setTypingUsers(prev => {
            const exists = prev.some(u => u.id === data.user.id);
            return exists ? prev : [...prev, data.user];
          });
          break;
          
        case 'typing_stop':
          setTypingUsers(prev => 
            prev.filter(u => u.id !== data.user_id)
          );
          break;
          
        case 'message_read':
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.message_id
                ? { ...msg, is_read: true }
                : msg
            )
          );
          break;
          
        case 'message_deleted':
          setMessages(prev =>
            prev.filter(msg => msg.id !== data.message_id)
          );
          break;
      }
    };
    
    connection.on('connected', () => setIsConnected(true));
    connection.on('disconnected', () => setIsConnected(false));
    connection.on('message', handleMessage);
    
    connection.connect(token);
    
    return () => {
      wsManager.closeConnection('chat', roomId);
    };
  }, [roomId, token]);
  
  const sendMessage = useCallback((content: string, messageType: 'text' | 'image' | 'file' = 'text', fileData?: any) => {
    const connection = wsManager.getConnection('chat', roomId);
    connection.send({
      type: 'chat_message',
      content,
      message_type: messageType,
      ...fileData
    });
  }, [roomId]);
  
  const sendTyping = useCallback((isTyping: boolean) => {
    const connection = wsManager.getConnection('chat', roomId);
    connection.send({
      type: isTyping ? 'typing_start' : 'typing_stop'
    });
    
    // 자동으로 typing 중지
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  }, [roomId]);
  
  const markAsRead = useCallback((messageId: string) => {
    const connection = wsManager.getConnection('chat', roomId);
    connection.send({
      type: 'mark_read',
      message_id: messageId
    });
  }, [roomId]);
  
  return {
    messages,
    typingUsers,
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
  };
}
```

### 채팅 UI 컴포넌트

```typescript
// components/chat/ChatRoom.tsx
import { useState, useRef, useEffect } from 'react';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

export function ChatRoom({ roomId }: { roomId: string }) {
  const {
    messages,
    typingUsers,
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useChatWebSocket(roomId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 메시지 읽음 처리
  useEffect(() => {
    const unreadMessages = messages.filter(m => !m.is_read);
    unreadMessages.forEach(msg => markAsRead(msg.id));
  }, [messages, markAsRead]);
  
  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
      sendTyping(false);
    }
  };
  
  const handleTyping = (value: string) => {
    setInputValue(value);
    
    if (value.length > 0) {
      sendTyping(true);
    } else {
      sendTyping(false);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);
    
    try {
      const response = await apiClient.post('/chat/messages/file/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 파일 메시지는 서버에서 WebSocket으로 브로드캐스트됨
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };
  
  return (
    <div className="chat-room">
      <div className="chat-header">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '연결됨' : '연결 끊김'}
        </span>
      </div>
      
      <div className="messages-container">
        <MessageList messages={messages} />
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        value={inputValue}
        onChange={handleTyping}
        onSend={handleSend}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}
```

## 예약 채팅 시스템

### 예약 채팅 Hook

```typescript
// hooks/useReservationChat.ts
import { useEffect, useState } from 'react';
import { wsManager } from '@/lib/websocket/WebSocketManager';

export interface ReservationRequest {
  id: string;
  client: {
    id: number;
    name: string;
  };
  child_name: string;
  requested_date: string;
  requested_time: string;
  concern_summary: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export function useReservationChat(expertId: string) {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [activeChats, setActiveChats] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    if (!expertId || !token) return;
    
    const connection = wsManager.getConnection('reservation-chat', expertId);
    
    const handleMessage = (data: any) => {
      switch (data.type) {
        case 'reservation_request':
          setRequests(prev => [...prev, data.request]);
          // 알림 표시
          showNotification('새로운 상담 예약 요청', data.request.client.name);
          break;
          
        case 'client_message':
          // 클라이언트로부터 메시지 수신
          setActiveChats(prev => new Set(prev).add(data.client_id));
          break;
          
        case 'request_cancelled':
          setRequests(prev => 
            prev.filter(r => r.id !== data.request_id)
          );
          break;
      }
    };
    
    connection.on('message', handleMessage);
    connection.connect(token);
    
    return () => {
      wsManager.closeConnection('reservation-chat', expertId);
    };
  }, [expertId, token]);
  
  const acceptRequest = (requestId: string) => {
    const connection = wsManager.getConnection('reservation-chat', expertId);
    connection.send({
      type: 'accept_request',
      request_id: requestId
    });
  };
  
  const rejectRequest = (requestId: string, reason?: string) => {
    const connection = wsManager.getConnection('reservation-chat', expertId);
    connection.send({
      type: 'reject_request',
      request_id: requestId,
      reason
    });
  };
  
  const sendMessageToClient = (clientId: number, message: string) => {
    const connection = wsManager.getConnection('reservation-chat', expertId);
    connection.send({
      type: 'expert_message',
      client_id: clientId,
      message
    });
  };
  
  return {
    requests,
    activeChats,
    acceptRequest,
    rejectRequest,
    sendMessageToClient,
  };
}
```

## 실시간 알림 시스템

### 전역 알림 Hook

```typescript
// hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { wsManager } from '@/lib/websocket/WebSocketManager';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'consultation' | 'message' | 'payment' | 'system';
  title: string;
  body: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!token || !user) return;
    
    const connection = wsManager.getConnection('notifications', user.id.toString());
    
    const handleNotification = (data: any) => {
      switch (data.type) {
        case 'new_notification':
          const notification = data.notification;
          
          // 알림 목록에 추가
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // 토스트 알림 표시
          toast.custom((t) => (
            <NotificationToast
              notification={notification}
              onDismiss={() => toast.dismiss(t.id)}
            />
          ));
          
          // 브라우저 알림 (권한이 있는 경우)
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/logo.png',
              tag: notification.id,
            });
          }
          break;
          
        case 'notification_read':
          setNotifications(prev =>
            prev.map(n =>
              n.id === data.notification_id
                ? { ...n, is_read: true }
                : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          break;
          
        case 'bulk_update':
          setNotifications(data.notifications);
          setUnreadCount(
            data.notifications.filter((n: Notification) => !n.is_read).length
          );
          break;
      }
    };
    
    connection.on('message', handleNotification);
    connection.connect(token);
    
    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      wsManager.closeConnection('notifications', user.id.toString());
    };
  }, [token, user]);
  
  const markAsRead = (notificationId: string) => {
    const connection = wsManager.getConnection('notifications', user!.id.toString());
    connection.send({
      type: 'mark_read',
      notification_id: notificationId
    });
  };
  
  const markAllAsRead = () => {
    const connection = wsManager.getConnection('notifications', user!.id.toString());
    connection.send({
      type: 'mark_all_read'
    });
  };
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
```

### 알림 컴포넌트

```typescript
// components/notifications/NotificationCenter.tsx
import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="notification-center">
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="header">
            <h3>알림</h3>
            <button onClick={markAllAsRead}>
              모두 읽음
            </button>
          </div>
          
          <div className="notification-list">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 연결 상태 관리

### 전역 연결 상태 Provider

```typescript
// providers/WebSocketProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { wsManager } from '@/lib/websocket/WebSocketManager';

interface WebSocketContextType {
  isOnline: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketContextType['connectionStatus']>('disconnected');
  
  useEffect(() => {
    // 네트워크 상태 모니터링
    const handleOnline = () => {
      setIsOnline(true);
      wsManager.reconnectAll();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('disconnected');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 페이지 visibility 변경 감지
    const handleVisibilityChange = () => {
      if (!document.hidden && isOnline) {
        wsManager.reconnectAll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline]);
  
  const reconnect = () => {
    wsManager.reconnectAll();
  };
  
  return (
    <WebSocketContext.Provider value={{ isOnline, connectionStatus, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketStatus must be used within WebSocketProvider');
  }
  return context;
};
```

## 에러 처리 및 재연결

### 자동 재연결 로직

```typescript
// lib/websocket/ReconnectableWebSocket.ts
export class ReconnectableWebSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private listeners: Map<string, Set<Function>> = new Map();
  
  constructor(url: string) {
    this.url = url;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('open');
          resolve();
        };
        
        this.ws.onclose = (event) => {
          this.emit('close', event);
          
          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          this.emit('message', event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private shouldReconnect(): boolean {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
  
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }
  
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }
  
  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }
  
  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
```

## 성능 최적화

### 메시지 배칭

```typescript
// lib/websocket/MessageBatcher.ts
export class MessageBatcher {
  private queue: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelay = 100; // ms
  private sendFunction: (messages: any[]) => void;
  
  constructor(sendFunction: (messages: any[]) => void) {
    this.sendFunction = sendFunction;
  }
  
  add(message: any): void {
    this.queue.push(message);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }
  
  flush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.queue.length > 0) {
      const messages = [...this.queue];
      this.queue = [];
      this.sendFunction(messages);
    }
  }
}
```

### 메모리 관리

```typescript
// hooks/useOptimizedChat.ts
export function useOptimizedChat(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const maxMessages = 100;
  const visibleRange = 50;
  
  // 메시지 수 제한
  useEffect(() => {
    if (messages.length > maxMessages) {
      setMessages(prev => prev.slice(-maxMessages));
    }
  }, [messages]);
  
  // 가상 스크롤링을 위한 가시 범위 메시지
  const updateVisibleMessages = useCallback((scrollTop: number, containerHeight: number) => {
    const messageHeight = 80; // 평균 메시지 높이
    const startIndex = Math.floor(scrollTop / messageHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / messageHeight) + 5,
      messages.length
    );
    
    setVisibleMessages(messages.slice(startIndex, endIndex));
  }, [messages]);
  
  return {
    messages: visibleMessages,
    totalMessages: messages.length,
    updateVisibleMessages,
  };
}
```

### 디바운싱 및 쓰로틀링

```typescript
// utils/websocket.ts
export function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function debounce(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// 사용 예시
const throttledSendTyping = throttle(sendTyping, 1000);
const debouncedSendMessage = debounce(sendMessage, 300);
```

## 테스팅

### WebSocket Mock

```typescript
// __tests__/mocks/WebSocketMock.ts
export class WebSocketMock {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  send(data: string | ArrayBuffer | Blob): void {
    // Mock send
  }
  
  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
  
  // 테스트용 헬퍼 메서드
  mockReceiveMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(data)
      }));
    }
  }
}

// 전역 WebSocket을 mock으로 대체
global.WebSocket = WebSocketMock as any;
```

## 트러블슈팅

### 일반적인 문제와 해결방법

1. **CORS 에러**
   - 백엔드 ALLOWED_HOSTS 설정 확인
   - WebSocket URL이 올바른지 확인

2. **인증 실패**
   - JWT 토큰이 유효한지 확인
   - 토큰이 URL 파라미터로 전달되는지 확인

3. **연결 끊김**
   - 네트워크 상태 확인
   - 서버 타임아웃 설정 확인
   - 클라이언트 heartbeat 구현

4. **메시지 손실**
   - 메시지 큐 구현
   - 재연결 시 히스토리 동기화

5. **메모리 누수**
   - 컴포넌트 unmount 시 연결 정리
   - 이벤트 리스너 제거 확인