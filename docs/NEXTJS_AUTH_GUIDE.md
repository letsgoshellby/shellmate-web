# Next.js 인증 시스템 구현 가이드

## 목차
1. [인증 플로우 개요](#인증-플로우-개요)
2. [JWT 토큰 관리](#jwt-토큰-관리)
3. [회원가입 구현](#회원가입-구현)
4. [로그인 구현](#로그인-구현)
5. [소셜 로그인](#소셜-로그인)
6. [인증 상태 관리](#인증-상태-관리)
7. [보호된 라우트](#보호된-라우트)
8. [역할 기반 접근 제어](#역할-기반-접근-제어)
9. [토큰 갱신 전략](#토큰-갱신-전략)
10. [보안 고려사항](#보안-고려사항)

## 인증 플로우 개요

### 인증 아키텍처
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   Django    │────▶│   Database  │
│   Client    │◀────│   Backend   │◀────│  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                     
       │                   │                     
    Cookies            JWT Token              
  (HttpOnly)          Validation              
```

### 사용자 타입별 플로우
1. **일반 사용자 (Client)**: 회원가입 → 아이 정보 입력 → 서비스 이용
2. **전문가 (Expert)**: 회원가입 → 자격 인증 → 심사 → 서비스 제공
3. **관리자 (Admin)**: 별도 생성 → 전체 시스템 관리

## JWT 토큰 관리

### 토큰 저장소 설정

```typescript
// lib/auth/tokenStorage.ts
import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'shellmate_access_token';
const REFRESH_TOKEN_KEY = 'shellmate_refresh_token';

// 쿠키 옵션
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export class TokenStorage {
  // 토큰 저장
  static setTokens(access: string, refresh: string): void {
    // Access Token: 짧은 만료 시간 (15분)
    Cookies.set(ACCESS_TOKEN_KEY, access, {
      ...cookieOptions,
      expires: 1 / 96, // 15분
    });
    
    // Refresh Token: 긴 만료 시간 (7일)
    Cookies.set(REFRESH_TOKEN_KEY, refresh, {
      ...cookieOptions,
      expires: 7,
    });
  }
  
  // Access Token 가져오기
  static getAccessToken(): string | undefined {
    return Cookies.get(ACCESS_TOKEN_KEY);
  }
  
  // Refresh Token 가져오기
  static getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }
  
  // 토큰 삭제
  static clearTokens(): void {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
  }
  
  // 토큰 유효성 검사
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
```

### API 클라이언트 인터셉터

```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터 (토큰 자동 갱신)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = TokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        TokenStorage.setTokens(access, refreshToken);
        
        // 원래 요청 재시도
        originalRequest.headers!.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃
        TokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 회원가입 구현

### 다단계 회원가입 폼

```typescript
// components/auth/SignupForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupAPI } from '@/lib/api/auth';

type SignupStep = 'basic' | 'type' | 'profile' | 'verification' | 'complete';

interface SignupData {
  // 기본 정보
  email: string;
  password: string;
  name: string;
  phone_number: string;
  terms_agreed: boolean;
  
  // 사용자 타입
  user_type?: 'client' | 'expert';
  
  // 프로필 정보 (타입별로 다름)
  profile?: any;
}

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('basic');
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    phone_number: '',
    terms_agreed: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Step 1: 기본 정보 입력
  const handleBasicInfo = async (data: Partial<SignupData>) => {
    setLoading(true);
    try {
      const response = await signupAPI.basicSignup({
        email: data.email!,
        password: data.password!,
        name: data.name!,
        phone_number: data.phone_number!,
        terms_agreed: data.terms_agreed!,
      });
      
      // 토큰 저장
      TokenStorage.setTokens(response.access, response.refresh);
      
      // 다음 단계로
      setSignupData({ ...signupData, ...data });
      setStep('type');
    } catch (error: any) {
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: 사용자 타입 선택
  const handleTypeSelection = async (userType: 'client' | 'expert') => {
    setLoading(true);
    try {
      await signupAPI.selectUserType(userType);
      
      setSignupData({ ...signupData, user_type: userType });
      setStep('profile');
    } catch (error: any) {
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };
  
  // Step 3: 프로필 완성
  const handleProfileCompletion = async (profileData: any) => {
    setLoading(true);
    try {
      if (signupData.user_type === 'client') {
        await signupAPI.completeClientProfile(profileData);
        setStep('complete');
      } else {
        await signupAPI.completeExpertProfile(profileData);
        setStep('verification');
      }
    } catch (error: any) {
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="signup-container">
      {step === 'basic' && (
        <BasicInfoForm
          onSubmit={handleBasicInfo}
          errors={errors}
          loading={loading}
        />
      )}
      
      {step === 'type' && (
        <UserTypeSelection
          onSelect={handleTypeSelection}
          loading={loading}
        />
      )}
      
      {step === 'profile' && signupData.user_type === 'client' && (
        <ClientProfileForm
          onSubmit={handleProfileCompletion}
          errors={errors}
          loading={loading}
        />
      )}
      
      {step === 'profile' && signupData.user_type === 'expert' && (
        <ExpertProfileForm
          onSubmit={handleProfileCompletion}
          errors={errors}
          loading={loading}
        />
      )}
      
      {step === 'verification' && (
        <VerificationPending />
      )}
      
      {step === 'complete' && (
        <SignupComplete
          onContinue={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}
```

### 내담자 프로필 폼

```typescript
// components/auth/ClientProfileForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientProfileSchema = z.object({
  relationship: z.enum(['mother', 'father', 'etc']),
  birth_year: z.number().min(1950).max(new Date().getFullYear()),
  address_city: z.string().min(1),
  address_district: z.string().min(1),
  children: z.array(z.object({
    name: z.string().min(1),
    birth_date: z.string(),
    gender: z.enum(['M', 'F']),
    concern_status: z.enum(['observation', 'diagnosed', 'none']),
    diagnosis_name: z.string().optional(),
    therapy_status: z.object({
      language: z.boolean(),
      occupational: z.boolean(),
      sensory: z.boolean(),
      behavior: z.boolean(),
      play: z.boolean(),
    }),
  })).min(1),
});

type ClientProfileData = z.infer<typeof clientProfileSchema>;

export function ClientProfileForm({ onSubmit, errors, loading }: Props) {
  const { register, handleSubmit, control, formState } = useForm<ClientProfileData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      children: [{}],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>부모 정보</h2>
      
      <div className="form-group">
        <label>아이와의 관계</label>
        <select {...register('relationship')}>
          <option value="mother">엄마</option>
          <option value="father">아빠</option>
          <option value="etc">기타</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>출생년도</label>
        <input 
          type="number" 
          {...register('birth_year', { valueAsNumber: true })}
        />
      </div>
      
      <div className="form-group">
        <label>거주 지역</label>
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="시/도"
            {...register('address_city')}
          />
          <input 
            placeholder="구/군"
            {...register('address_district')}
          />
        </div>
      </div>
      
      <h2>아이 정보</h2>
      
      {fields.map((field, index) => (
        <ChildInfoFields
          key={field.id}
          index={index}
          register={register}
          control={control}
          onRemove={() => remove(index)}
        />
      ))}
      
      <button
        type="button"
        onClick={() => append({})}
      >
        아이 추가
      </button>
      
      <button type="submit" disabled={loading}>
        {loading ? '처리 중...' : '프로필 완성'}
      </button>
    </form>
  );
}
```

## 로그인 구현

### 로그인 API 서비스

```typescript
// lib/api/auth.ts
import { apiClient } from './client';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    user_type: 'client' | 'expert' | 'admin';
    signup_status: string;
    profile_image?: string;
  };
}

export class AuthAPI {
  // 이메일 로그인
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    
    // 토큰 저장
    TokenStorage.setTokens(response.data.access, response.data.refresh);
    
    return response.data;
  }
  
  // 로그아웃
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      TokenStorage.clearTokens();
    }
  }
  
  // 현재 사용자 정보
  static async getCurrentUser() {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  }
  
  // 토큰 갱신
  static async refreshToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data.access;
  }
  
  // 이메일 중복 확인
  static async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/check-email/', { email });
      return response.data.available;
    } catch {
      return false;
    }
  }
  
  // 비밀번호 재설정 요청
  static async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request/', { email });
  }
  
  // 비밀번호 재설정 확인
  static async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm/', {
      token,
      password: newPassword,
    });
  }
}
```

### 로그인 폼 컴포넌트

```typescript
// components/auth/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthAPI } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  rememberMe: z.boolean().optional(),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    
    try {
      const response = await AuthAPI.login({
        email: data.email,
        password: data.password,
      });
      
      // 사용자 정보 저장
      setUser(response.user);
      
      // 리다이렉트
      const redirectUrl = router.query.redirect as string || '/dashboard';
      router.push(redirectUrl);
      
      toast.success('로그인되었습니다');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('password', {
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        });
      } else {
        toast.error('로그인 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <div className="form-group">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          placeholder="example@email.com"
          {...register('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>
      
      <div className="form-group checkbox">
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          <span>로그인 상태 유지</span>
        </label>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="submit-button"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
      
      <div className="form-footer">
        <a href="/forgot-password">비밀번호 찾기</a>
        <span>•</span>
        <a href="/signup">회원가입</a>
      </div>
    </form>
  );
}
```

## 소셜 로그인

### Google OAuth 구현

```typescript
// lib/auth/google.ts
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { apiClient } from '@/lib/api/client';

export class GoogleAuth {
  static provider = new GoogleAuthProvider();
  
  static async signIn() {
    try {
      const auth = getAuth();
      const result = await signInWithPopup(auth, GoogleAuth.provider);
      const idToken = await result.user.getIdToken();
      
      // 백엔드로 토큰 전송
      const response = await apiClient.post('/auth/social/login/', {
        provider: 'google',
        access_token: idToken,
      });
      
      return response.data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }
}
```

### Kakao OAuth 구현

```typescript
// lib/auth/kakao.ts
declare global {
  interface Window {
    Kakao: any;
  }
}

export class KakaoAuth {
  static initialize() {
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
      }
    }
  }
  
  static async signIn(): Promise<any> {
    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            // 백엔드로 토큰 전송
            const response = await apiClient.post('/auth/social/login/', {
              provider: 'kakao',
              access_token: authObj.access_token,
            });
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        },
        fail: (err: any) => {
          reject(err);
        },
      });
    });
  }
  
  static logout() {
    if (window.Kakao?.Auth) {
      window.Kakao.Auth.logout();
    }
  }
}
```

### 소셜 로그인 버튼

```typescript
// components/auth/SocialLoginButtons.tsx
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { FaGithub } from 'react-icons/fa';
import { GoogleAuth } from '@/lib/auth/google';
import { KakaoAuth } from '@/lib/auth/kakao';

export function SocialLoginButtons() {
  const handleGoogleLogin = async () => {
    try {
      const result = await GoogleAuth.signIn();
      handleSocialLoginSuccess(result);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
  
  const handleKakaoLogin = async () => {
    try {
      KakaoAuth.initialize();
      const result = await KakaoAuth.signIn();
      handleSocialLoginSuccess(result);
    } catch (error) {
      console.error('Kakao login failed:', error);
    }
  };
  
  const handleSocialLoginSuccess = (result: any) => {
    if (result.signup_required) {
      // 추가 정보 입력 필요
      router.push(`/signup/complete?token=${result.temp_token}`);
    } else {
      // 로그인 완료
      TokenStorage.setTokens(result.access, result.refresh);
      router.push('/dashboard');
    }
  };
  
  return (
    <div className="social-login-buttons">
      <button onClick={handleGoogleLogin} className="google-button">
        <FcGoogle size={20} />
        <span>Google로 계속하기</span>
      </button>
      
      <button onClick={handleKakaoLogin} className="kakao-button">
        <RiKakaoTalkFill size={20} />
        <span>카카오로 계속하기</span>
      </button>
      
      <button className="github-button">
        <FaGithub size={20} />
        <span>GitHub로 계속하기</span>
      </button>
    </div>
  );
}
```

## 인증 상태 관리

### Auth Context Provider

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthAPI } from '@/lib/api/auth';
import { TokenStorage } from '@/lib/auth/tokenStorage';

interface User {
  id: number;
  email: string;
  name: string;
  user_type: 'client' | 'expert' | 'admin';
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isClient: boolean;
  isExpert: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 초기 로드 시 사용자 정보 가져오기
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    const token = TokenStorage.getAccessToken();
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const userData = await AuthAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to get user:', err);
      TokenStorage.clearTokens();
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      const response = await AuthAPI.login({ email, password });
      setUser(response.user);
      setError(null);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };
  
  const logout = async () => {
    try {
      await AuthAPI.logout();
    } finally {
      setUser(null);
      TokenStorage.clearTokens();
    }
  };
  
  const refreshUser = async () => {
    try {
      const userData = await AuthAPI.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      setError(err);
    }
  };
  
  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isClient: user?.user_type === 'client',
    isExpert: user?.user_type === 'expert',
    isAdmin: user?.user_type === 'admin',
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Zustand Store (대안)

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthAPI } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      
      login: async (email, password) => {
        set({ loading: true });
        try {
          const response = await AuthAPI.login({ email, password });
          set({ 
            user: response.user, 
            isAuthenticated: true,
            loading: false 
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      logout: async () => {
        await AuthAPI.logout();
        set({ user: null, isAuthenticated: false });
      },
      
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
      
      fetchUser: async () => {
        const token = TokenStorage.getAccessToken();
        if (!token) return;
        
        try {
          const user = await AuthAPI.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

## 보호된 라우트

### Auth Guard HOC

```typescript
// components/auth/AuthGuard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'expert' | 'admin';
  fallbackUrl?: string;
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = '/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(`${fallbackUrl}?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user?.user_type !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, loading, requiredRole, user, router, fallbackUrl]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (requiredRole && user?.user_type !== requiredRole) {
    return null;
  }
  
  return <>{children}</>;
}
```

### 미들웨어 보호

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = ['/dashboard', '/profile', '/consultations'];
const expertPaths = ['/expert'];
const adminPaths = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 보호된 경로 확인
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isExpertPath = expertPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  
  if (!isProtectedPath && !isExpertPath && !isAdminPath) {
    return NextResponse.next();
  }
  
  // 토큰 확인
  const token = request.cookies.get('shellmate_access_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // JWT 검증
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    // 역할 기반 접근 제어
    if (isExpertPath && payload.user_type !== 'expert') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (isAdminPath && payload.user_type !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/expert/:path*', '/admin/:path*'],
};
```

## 역할 기반 접근 제어

### Permission Hook

```typescript
// hooks/usePermission.ts
import { useAuth } from './useAuth';

type Permission = 
  | 'view_consultations'
  | 'create_consultation'
  | 'manage_experts'
  | 'view_analytics'
  | 'manage_system';

const rolePermissions: Record<string, Permission[]> = {
  client: ['view_consultations', 'create_consultation'],
  expert: ['view_consultations', 'view_analytics'],
  admin: ['view_consultations', 'manage_experts', 'view_analytics', 'manage_system'],
};

export function usePermission() {
  const { user } = useAuth();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.user_type] || [];
    return permissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

### Permission Guard Component

```typescript
// components/auth/PermissionGuard.tsx
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// 사용 예시
<PermissionGuard permission="manage_experts">
  <ExpertManagementPanel />
</PermissionGuard>
```

## 토큰 갱신 전략

### 자동 갱신 구현

```typescript
// lib/auth/tokenRefresh.ts
export class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;
  
  startRefreshTimer() {
    this.stopRefreshTimer();
    
    const token = TokenStorage.getAccessToken();
    if (!token) return;
    
    const tokenExp = this.getTokenExpiration(token);
    const now = Date.now();
    const refreshTime = tokenExp - (5 * 60 * 1000); // 만료 5분 전
    
    if (refreshTime > now) {
      const delay = refreshTime - now;
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, delay);
    }
  }
  
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  async refreshToken(): Promise<void> {
    // 중복 갱신 방지
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.performRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  private async performRefresh(): Promise<void> {
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    try {
      const newAccessToken = await AuthAPI.refreshToken(refreshToken);
      TokenStorage.setTokens(newAccessToken, refreshToken);
      this.startRefreshTimer();
    } catch (error) {
      TokenStorage.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }
  
  private getTokenExpiration(token: string): number {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  }
}

export const tokenRefreshManager = new TokenRefreshManager();
```

## 보안 고려사항

### XSS 방어

```typescript
// utils/security.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
```

### CSRF 보호

```typescript
// lib/api/csrf.ts
export async function getCSRFToken(): Promise<string> {
  const response = await apiClient.get('/auth/csrf/');
  return response.data.csrfToken;
}

// API 요청 시 CSRF 토큰 포함
apiClient.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = await getCSRFToken();
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});
```

### 보안 헤더 설정

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

### Rate Limiting

```typescript
// lib/rateLimit.ts
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  reset(key: string): void {
    this.limits.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// 사용 예시
if (!rateLimiter.isAllowed(`login:${email}`)) {
  throw new Error('너무 많은 시도입니다. 잠시 후 다시 시도해주세요.');
}
```

## 테스팅

### Auth Hook 테스트

```typescript
// __tests__/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthAPI } from '@/lib/api/auth';

jest.mock('@/lib/api/auth');

describe('useAuth', () => {
  it('should login successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      user_type: 'client',
    };
    
    (AuthAPI.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      access: 'access-token',
      refresh: 'refresh-token',
    });
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```