# Shellmate 상담 서비스 Next.js 개발 가이드

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [API 베이스 설정](#api-베이스-설정)
3. [인증 시스템](#인증-시스템)
4. [핵심 도메인 모델](#핵심-도메인-모델)
5. [API 엔드포인트 레퍼런스](#api-엔드포인트-레퍼런스)
6. [WebSocket 실시간 기능](#websocket-실시간-기능)
7. [상담 라이프사이클](#상담-라이프사이클)
8. [결제 시스템](#결제-시스템)
9. [파일 업로드](#파일-업로드)
10. [에러 처리](#에러-처리)

## 프로젝트 개요

Shellmate는 발달 장애 아동의 부모와 인증된 전문가를 연결하는 멘탈 헬스 상담 플랫폼입니다.

### 주요 기능
- 실시간 화상 상담 (Agora)
- 텍스트 채팅
- Q&A 게시판
- 전문가 매칭 시스템
- 크레딧 기반 결제

### 기술 스택
- **Backend**: Django REST Framework
- **인증**: JWT (Access/Refresh Token)
- **실시간 통신**: Django Channels (WebSocket)
- **화상 통화**: Agora SDK
- **백그라운드 작업**: Celery
- **결제**: Google Play, 토스페이먼츠

## API 베이스 설정

### 환경별 엔드포인트
```javascript
// config/api.js
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8000/api/v1',
    wsURL: 'ws://localhost:8000/ws',
  },
  production: {
    baseURL: 'https://api.shellmate.com/api/v1',
    wsURL: 'wss://api.shellmate.com/ws',
  }
};

export default API_CONFIG[process.env.NODE_ENV || 'development'];
```

### Axios 인스턴스 설정
```javascript
// lib/axios.js
import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';
import API_CONFIG from '@/config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (토큰 갱신)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post(
          `${API_CONFIG.baseURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const { access } = response.data;
        setTokens(access, refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 인증 시스템

### 회원가입 플로우

#### 1단계: 기본 정보
```javascript
// api/auth.js
export const signupBasic = async (userData) => {
  const response = await axios.post('/auth/signup/', {
    email: userData.email,
    password: userData.password,
    name: userData.name,
    phone_number: userData.phoneNumber,
    terms_agreed: true,
  });
  return response.data; // { user, access, refresh }
};
```

#### 2단계: 사용자 타입 선택
```javascript
export const selectUserType = async (userType) => {
  const response = await apiClient.post('/auth/select-type/', {
    user_type: userType, // 'client' | 'expert'
  });
  return response.data;
};
```

#### 3단계: 프로필 완성

**내담자 프로필:**
```javascript
export const completeClientProfile = async (profileData) => {
  const response = await apiClient.post('/auth/client/complete-profile/', {
    // 부모 정보
    relationship: profileData.relationship, // 'mother' | 'father' | 'etc'
    birth_year: profileData.birthYear,
    address_city: profileData.city,
    address_district: profileData.district,
    
    // 아이 정보
    children: [{
      name: profileData.childName,
      birth_date: profileData.childBirthDate,
      gender: profileData.childGender, // 'M' | 'F'
      concern_status: profileData.concernStatus, // 'observation' | 'diagnosed' | 'none'
      diagnosis_name: profileData.diagnosisName, // optional
      therapy_status: profileData.therapyStatus, // JSON string
    }]
  });
  return response.data;
};
```

**전문가 프로필:**
```javascript
export const completeExpertProfile = async (profileData) => {
  const formData = new FormData();
  
  // 기본 정보
  formData.append('specialty', profileData.specialty);
  formData.append('career_years', profileData.careerYears);
  formData.append('education', profileData.education);
  formData.append('major_credentials', profileData.majorCredentials);
  
  // 파일 업로드
  profileData.certificates.forEach(file => {
    formData.append('certificate_images', file);
  });
  
  if (profileData.profileImage) {
    formData.append('profile_image', profileData.profileImage);
  }
  
  const response = await apiClient.post('/auth/expert/complete-profile/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

### 로그인

```javascript
export const login = async (email, password) => {
  const response = await axios.post('/auth/login/', {
    email,
    password,
  });
  
  const { access, refresh, user } = response.data;
  setTokens(access, refresh);
  
  return user;
};
```

### 소셜 로그인

```javascript
export const socialLogin = async (provider, accessToken) => {
  const response = await axios.post('/auth/social/login/', {
    provider, // 'google' | 'kakao' | 'github'
    access_token: accessToken,
  });
  
  const { access, refresh, user, signup_required } = response.data;
  
  if (signup_required) {
    // 추가 정보 입력 필요
    return { needsSignup: true, tempToken: access };
  }
  
  setTokens(access, refresh);
  return user;
};
```

### 전화번호 인증

```javascript
// 인증 코드 발송
export const sendVerificationCode = async (phoneNumber) => {
  const response = await apiClient.post('/auth/phone/send-code/', {
    phone_number: phoneNumber,
  });
  return response.data;
};

// 인증 코드 확인
export const verifyPhoneNumber = async (phoneNumber, code) => {
  const response = await apiClient.post('/auth/phone/verify/', {
    phone_number: phoneNumber,
    code,
  });
  return response.data;
};
```

## 핵심 도메인 모델

### User (사용자)
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  phone_number: string;
  user_type: 'client' | 'expert' | 'admin';
  signup_status: 'basic' | 'type_selected' | 'profile_pending' | 'completed';
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}
```

### ExpertProfile (전문가 프로필)
```typescript
interface ExpertProfile {
  id: number;
  user: number;
  specialty: string[];
  career_years: number;
  education: string;
  major_credentials: string;
  introduction?: string;
  treatment_approach?: string;
  certificate_images: string[];
  is_verified: boolean;
  average_rating: number;
  total_consultations: number;
  response_rate: number;
}
```

### ChildProfile (아이 프로필)
```typescript
interface ChildProfile {
  id: string; // UUID
  parent: number;
  name: string;
  birth_date: string;
  gender: 'M' | 'F';
  concern_status: 'observation' | 'diagnosed' | 'none';
  diagnosis_name?: string;
  therapy_status: {
    language?: boolean;
    occupational?: boolean;
    sensory?: boolean;
    behavior?: boolean;
    play?: boolean;
  };
}
```

### Consultation (상담)
```typescript
interface Consultation {
  id: string; // UUID
  expert: number;
  client: number;
  child_profile: string;
  scheduled_at: string; // ISO datetime
  duration: number; // minutes
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  concern_summary: string;
  consultation_report?: string;
  price: number;
  agora_channel?: string;
  agora_token?: string;
  created_at: string;
}
```

## API 엔드포인트 레퍼런스

### 인증 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/auth/signup/` | 회원가입 | X |
| POST | `/auth/login/` | 로그인 | X |
| POST | `/auth/logout/` | 로그아웃 | O |
| POST | `/auth/token/refresh/` | 토큰 갱신 | X |
| POST | `/auth/select-type/` | 사용자 타입 선택 | O |
| GET | `/auth/profile/` | 내 프로필 조회 | O |
| PATCH | `/auth/profile/` | 프로필 수정 | O |
| POST | `/auth/social/login/` | 소셜 로그인 | X |
| POST | `/auth/phone/send-code/` | 인증코드 발송 | O |
| POST | `/auth/phone/verify/` | 전화번호 인증 | O |

### 전문가 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/experts/` | 전문가 목록 조회 | X |
| GET | `/experts/{id}/` | 전문가 상세 정보 | X |
| GET | `/experts/search/` | 전문가 검색 | X |
| GET | `/experts/{id}/reviews/` | 전문가 리뷰 조회 | X |
| GET | `/experts/{id}/availability/` | 상담 가능 시간 조회 | X |
| POST | `/experts/availability/` | 상담 가능 시간 등록 | Expert |
| DELETE | `/experts/availability/{id}/` | 상담 가능 시간 삭제 | Expert |
| GET | `/experts/pricing/` | 전문가 가격 정보 조회 | X |
| POST | `/experts/pricing/` | 가격 정보 설정 | Expert |

### 상담 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/consultations/` | 상담 목록 조회 | O |
| POST | `/consultations/request/` | 상담 신청 | Client |
| GET | `/consultations/{id}/` | 상담 상세 정보 | O |
| POST | `/consultations/{id}/confirm/` | 상담 승인 | Expert |
| POST | `/consultations/{id}/cancel/` | 상담 취소 | O |
| POST | `/consultations/{id}/complete/` | 상담 완료 | Expert |
| POST | `/consultations/{id}/report/` | 상담 보고서 작성 | Expert |
| GET | `/consultations/{id}/agora-token/` | Agora 토큰 조회 | O |
| POST | `/consultations/{id}/extend/` | 상담 시간 연장 | O |
| POST | `/consultations/{id}/review/` | 상담 리뷰 작성 | Client |

### 채팅 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/chat/rooms/` | 채팅방 목록 | O |
| POST | `/chat/rooms/` | 채팅방 생성 | O |
| GET | `/chat/rooms/{id}/` | 채팅방 정보 | O |
| GET | `/chat/rooms/{id}/messages/` | 메시지 목록 | O |
| POST | `/chat/messages/` | 메시지 전송 | O |
| POST | `/chat/messages/file/` | 파일 메시지 전송 | O |
| PATCH | `/chat/rooms/{id}/read/` | 메시지 읽음 처리 | O |

### 결제/지갑 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/wallet/` | 지갑 정보 조회 | O |
| GET | `/wallet/transactions/` | 거래 내역 조회 | O |
| POST | `/wallet/purchase/` | 크레딧 구매 | O |
| POST | `/wallet/purchase/verify/` | 구매 검증 (Google) | O |
| POST | `/wallet/refund/` | 환불 요청 | O |
| GET | `/wallet/products/` | 상품 목록 조회 | O |

### Q&A 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/qna/questions/` | 질문 목록 | X |
| POST | `/qna/questions/` | 질문 작성 | O |
| GET | `/qna/questions/{id}/` | 질문 상세 | X |
| POST | `/qna/answers/` | 답변 작성 | Expert |
| PATCH | `/qna/answers/{id}/` | 답변 수정 | Expert |
| POST | `/qna/answers/{id}/like/` | 답변 좋아요 | O |

### 칼럼 관련 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/columns/` | 칼럼 목록 | X |
| GET | `/columns/{id}/` | 칼럼 상세 | X |
| POST | `/columns/` | 칼럼 작성 | Expert |
| POST | `/columns/{id}/like/` | 칼럼 좋아요 | O |
| POST | `/columns/{id}/bookmark/` | 칼럼 북마크 | O |

## WebSocket 실시간 기능

### WebSocket 연결 설정

```javascript
// lib/websocket.js
import { getAccessToken } from './auth';

class WebSocketManager {
  constructor() {
    this.connections = {};
  }
  
  connect(channel, roomId) {
    const token = getAccessToken();
    const wsUrl = `${API_CONFIG.wsURL}/${channel}/${roomId}/?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`Connected to ${channel}/${roomId}`);
      
      // 인증 메시지 전송
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log(`Disconnected from ${channel}/${roomId}`);
      delete this.connections[`${channel}/${roomId}`];
    };
    
    this.connections[`${channel}/${roomId}`] = ws;
    return ws;
  }
  
  disconnect(channel, roomId) {
    const key = `${channel}/${roomId}`;
    if (this.connections[key]) {
      this.connections[key].close();
      delete this.connections[key];
    }
  }
  
  send(channel, roomId, message) {
    const key = `${channel}/${roomId}`;
    if (this.connections[key]?.readyState === WebSocket.OPEN) {
      this.connections[key].send(JSON.stringify(message));
    }
  }
}

export default new WebSocketManager();
```

### 상담 상태 모니터링

```javascript
// hooks/useConsultationStatus.js
import { useEffect, useState } from 'react';
import wsManager from '@/lib/websocket';

export function useConsultationStatus(consultationId) {
  const [status, setStatus] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  useEffect(() => {
    if (!consultationId) return;
    
    const ws = wsManager.connect('consultation', consultationId);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'status_update':
          setStatus(data.status);
          break;
          
        case 'participant_joined':
          setParticipants(prev => [...prev, data.user]);
          break;
          
        case 'participant_left':
          setParticipants(prev => 
            prev.filter(p => p.id !== data.user.id)
          );
          break;
          
        case 'consultation_started':
          setStatus('in_progress');
          break;
          
        case 'consultation_ended':
          setStatus('completed');
          break;
      }
    };
    
    return () => {
      wsManager.disconnect('consultation', consultationId);
    };
  }, [consultationId]);
  
  return { status, participants };
}
```

### 실시간 채팅

```javascript
// hooks/useChat.js
import { useEffect, useState, useCallback } from 'react';
import wsManager from '@/lib/websocket';

export function useChat(roomId) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  
  useEffect(() => {
    if (!roomId) return;
    
    const ws = wsManager.connect('chat', roomId);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
          
        case 'typing_start':
          setTyping(prev => [...prev, data.user]);
          break;
          
        case 'typing_stop':
          setTyping(prev => 
            prev.filter(u => u.id !== data.user.id)
          );
          break;
          
        case 'message_read':
          setMessages(prev =>
            prev.map(msg => 
              msg.id === data.message_id 
                ? { ...msg, read: true }
                : msg
            )
          );
          break;
      }
    };
    
    return () => {
      wsManager.disconnect('chat', roomId);
    };
  }, [roomId]);
  
  const sendMessage = useCallback((content, type = 'text') => {
    wsManager.send('chat', roomId, {
      type: 'message',
      content,
      message_type: type,
    });
  }, [roomId]);
  
  const sendTyping = useCallback((isTyping) => {
    wsManager.send('chat', roomId, {
      type: isTyping ? 'typing_start' : 'typing_stop',
    });
  }, [roomId]);
  
  return {
    messages,
    typing,
    sendMessage,
    sendTyping,
  };
}
```

## 상담 라이프사이클

### 1. 상담 예약 플로우

```javascript
// pages/consultation/booking.jsx
import { useState } from 'react';
import apiClient from '@/lib/axios';

function ConsultationBooking({ expertId, childId }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [concern, setConcern] = useState('');
  
  // 1. 전문가의 가능한 시간 슬롯 조회
  const fetchAvailableSlots = async () => {
    const response = await apiClient.get(
      `/experts/${expertId}/availability/`,
      {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        }
      }
    );
    return response.data;
  };
  
  // 2. 상담 신청
  const requestConsultation = async () => {
    const response = await apiClient.post('/consultations/request/', {
      expert_id: expertId,
      child_profile_id: childId,
      availability_slot_id: selectedSlot.id,
      concern_summary: concern,
      duration: 30, // 30분 기본
    });
    
    return response.data; // consultation object
  };
  
  // 3. 결제 처리 (크레딧 차감)
  const processPayment = async (consultationId) => {
    const response = await apiClient.post(
      `/consultations/${consultationId}/payment/`,
      {
        payment_method: 'credit',
      }
    );
    return response.data;
  };
}
```

### 2. 상담 진행 플로우

```javascript
// pages/consultation/room.jsx
import { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import apiClient from '@/lib/axios';

function ConsultationRoom({ consultationId }) {
  const [agoraClient, setAgoraClient] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  
  useEffect(() => {
    initializeAgora();
    return () => cleanup();
  }, []);
  
  const initializeAgora = async () => {
    // 1. Agora 토큰 가져오기
    const { agora_token, agora_channel, agora_uid } = 
      await apiClient.get(`/consultations/${consultationId}/agora-token/`)
        .then(res => res.data);
    
    // 2. Agora 클라이언트 생성
    const client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8' 
    });
    
    // 3. 이벤트 핸들러 설정
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);
    
    // 4. 채널 참가
    await client.join(
      process.env.NEXT_PUBLIC_AGORA_APP_ID,
      agora_channel,
      agora_token,
      agora_uid
    );
    
    // 5. 로컬 트랙 생성 및 발행
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    await client.publish([audioTrack, videoTrack]);
    
    setAgoraClient(client);
    setLocalTracks([audioTrack, videoTrack]);
  };
  
  const handleUserPublished = async (user, mediaType) => {
    await agoraClient.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      user.videoTrack.play(`remote-video-${user.uid}`);
    }
    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
    
    setRemoteUsers(prev => [...prev, user]);
  };
  
  const endConsultation = async () => {
    // 상담 종료 API 호출
    await apiClient.post(`/consultations/${consultationId}/complete/`);
    
    // Agora 정리
    cleanup();
  };
  
  const cleanup = async () => {
    localTracks.forEach(track => track.close());
    await agoraClient?.leave();
  };
}
```

### 3. 상담 자동화 프로세스

백엔드에서 Celery를 통해 다음 작업들이 자동으로 처리됩니다:

- **상담 5분 전**: Agora 룸 자동 생성
- **상담 시작 시간**: 참가자 입장 대기
- **상담 10분 경과 후 노쇼**: 자동 취소 및 환불
- **상담 30분 후**: 자동 종료
- **상담 종료 후**: 정산 처리

## 결제 시스템

### 크레딧 구매 (Google Play)

```javascript
// services/payment.js
export class PaymentService {
  // 1. 상품 목록 조회
  async getProducts() {
    const response = await apiClient.get('/wallet/products/');
    return response.data;
  }
  
  // 2. 구매 요청 (Google Play)
  async initiatePurchase(productId) {
    const response = await apiClient.post('/wallet/purchase/', {
      product_id: productId,
      payment_method: 'google_play',
    });
    
    const { order_id, product_id } = response.data;
    
    // Google Play 결제 SDK 호출
    // (Next.js에서는 클라이언트 사이드에서 처리)
    return { orderId: order_id, productId: product_id };
  }
  
  // 3. 구매 검증
  async verifyPurchase(purchaseToken, orderId) {
    const response = await apiClient.post('/wallet/purchase/verify/', {
      purchase_token: purchaseToken,
      order_id: orderId,
      store: 'google_play',
    });
    
    return response.data; // { success, credits_added, new_balance }
  }
  
  // 4. 거래 내역 조회
  async getTransactionHistory(page = 1) {
    const response = await apiClient.get('/wallet/transactions/', {
      params: { page, page_size: 20 }
    });
    return response.data;
  }
}
```

### 토스페이먼츠 결제 (웹 결제)

```javascript
// components/TossPayment.jsx
import { loadTossPayments } from '@tosspayments/payment-sdk';

export function TossPaymentWidget({ amount, orderId, orderName }) {
  const [payment, setPayment] = useState(null);
  
  useEffect(() => {
    initializePayment();
  }, []);
  
  const initializePayment = async () => {
    const tossPayments = await loadTossPayments(
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    );
    
    const payment = tossPayments.payment({
      customerKey: 'customer-key',
    });
    
    setPayment(payment);
  };
  
  const requestPayment = async () => {
    await payment.requestPayment({
      method: 'CARD',
      amount: {
        currency: 'KRW',
        value: amount,
      },
      orderId: orderId,
      orderName: orderName,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  };
}
```

## 파일 업로드

### 프로필 이미지 업로드

```javascript
// services/upload.js
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('profile_image', file);
  
  const response = await apiClient.patch('/auth/profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.profile_image; // 업로드된 이미지 URL
};
```

### 채팅 파일 업로드

```javascript
export const uploadChatFile = async (roomId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('room_id', roomId);
  
  const response = await apiClient.post('/chat/messages/file/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`Upload Progress: ${percentCompleted}%`);
    },
  });
  
  return response.data;
};
```

## 에러 처리

### 글로벌 에러 핸들러

```javascript
// lib/errorHandler.js
export class APIError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function handleAPIError(error) {
  if (error.response) {
    // 서버 응답 에러
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new APIError(
          data.message || '잘못된 요청입니다.',
          status,
          data.errors
        );
        
      case 401:
        throw new APIError(
          '인증이 필요합니다.',
          status
        );
        
      case 403:
        throw new APIError(
          '권한이 없습니다.',
          status
        );
        
      case 404:
        throw new APIError(
          '요청한 리소스를 찾을 수 없습니다.',
          status
        );
        
      case 422:
        throw new APIError(
          '입력 데이터를 확인해주세요.',
          status,
          data.errors
        );
        
      case 500:
        throw new APIError(
          '서버 오류가 발생했습니다.',
          status
        );
        
      default:
        throw new APIError(
          data.message || '알 수 없는 오류가 발생했습니다.',
          status
        );
    }
  } else if (error.request) {
    // 네트워크 에러
    throw new APIError(
      '네트워크 연결을 확인해주세요.',
      0
    );
  } else {
    // 기타 에러
    throw new APIError(
      error.message || '오류가 발생했습니다.',
      -1
    );
  }
}
```

### 컴포넌트에서 에러 처리

```javascript
// hooks/useAPICall.js
import { useState, useCallback } from 'react';
import { handleAPIError } from '@/lib/errorHandler';
import { toast } from 'react-hot-toast';

export function useAPICall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError);
      toast.error(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { execute, loading, error };
}

// 사용 예시
function MyComponent() {
  const { execute, loading } = useAPICall();
  
  const handleSubmit = async (data) => {
    try {
      const result = await execute(() => 
        apiClient.post('/some-endpoint/', data)
      );
      toast.success('성공적으로 처리되었습니다.');
    } catch (error) {
      // 에러는 이미 useAPICall에서 처리됨
    }
  };
}
```

## 환경 설정 (.env.local)

```bash
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Agora 설정
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# 결제 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
NEXT_PUBLIC_GOOGLE_PLAY_PUBLIC_KEY=your_google_play_key

# 소셜 로그인
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# 기타
NEXT_PUBLIC_ENVIRONMENT=development
```

## 개발 팁

### 1. 상태 관리 (Zustand 추천)

```javascript
// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      
      setUser: (user) => set({ user }),
      setTokens: (access, refresh) => set({ 
        accessToken: access, 
        refreshToken: refresh 
      }),
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### 2. 페이지네이션 훅

```javascript
// hooks/usePagination.js
export function usePagination(fetchFunction) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetchFunction(page);
      
      if (response.results.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...response.results]);
        setPage(prev => prev + 1);
        setHasMore(response.next !== null);
      }
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, fetchFunction]);
  
  return { data, loadMore, hasMore, loading };
}
```

### 3. 디바운싱 검색

```javascript
// hooks/useDebounce.js
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// 사용 예시
function SearchExperts() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchExperts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
}
```

## 보안 고려사항

1. **환경 변수**: 민감한 정보는 절대 클라이언트 코드에 포함하지 않기
2. **CORS**: 백엔드에서 허용된 도메인만 요청 가능하도록 설정
3. **XSS 방어**: 사용자 입력은 항상 sanitize 처리
4. **CSRF**: Django의 CSRF 토큰 활용
5. **파일 업로드**: 파일 타입과 크기 제한 설정

## 성능 최적화

1. **이미지 최적화**: Next.js Image 컴포넌트 활용
2. **코드 스플리팅**: Dynamic imports 사용
3. **캐싱**: React Query 또는 SWR 활용
4. **무한 스크롤**: Intersection Observer API 활용
5. **메모이제이션**: useMemo, useCallback 적절히 활용

## 문제 해결 가이드

### WebSocket 연결 실패
- Redis 서버 실행 확인
- 토큰 유효성 확인
- CORS 설정 확인

### Agora 연결 문제
- APP_ID와 인증서 확인
- 네트워크 방화벽 설정 확인
- 브라우저 카메라/마이크 권한 확인

### 결제 실패
- 테스트 모드 설정 확인
- 상품 ID 매칭 확인
- Google Play Console 설정 확인