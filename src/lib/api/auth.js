import { apiClient } from './client';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export class AuthAPI {
  // 이메일 로그인
  static async login(credentials, rememberMe = false) {
    const response = await apiClient.post('/auth/login/', credentials);
    
    // 토큰 저장
    TokenStorage.setTokens(response.data.access, response.data.refresh, rememberMe);
    
    return response.data;
  }
  
  // 로그아웃
  static async logout() {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      TokenStorage.clearTokens();
    }
  }
  
  // 현재 사용자 정보
  static async getCurrentUser() {
    const response = await apiClient.get('/user/me/');
    return response.data;
  }
  
  // 토큰 갱신
  static async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data.access;
  }
  
  // 기본 회원가입
  static async basicSignup(data) {
    const response = await apiClient.post('/auth/signup/', data);
    return response.data;
  }
  
  // 사용자 타입 선택
  static async selectUserType(userType) {
    const response = await apiClient.post('/auth/select-type/', {
      user_type: userType
    });
    return response.data;
  }
  
  // 내담자 프로필 완성
  static async completeClientProfile(profileData) {
    const response = await apiClient.post('/auth/profile/client/', profileData);
    return response.data;
  }
  
  // 전문가 프로필 완성
  static async completeExpertProfile(profileData) {
    const response = await apiClient.post('/auth/profile/expert/', profileData);
    return response.data;
  }
  
  // 이메일 중복 확인
  static async checkEmailAvailability(email) {
    try {
      const response = await apiClient.post('/auth/check-email/', { email });
      return response.data.available;
    } catch {
      return false;
    }
  }
  
  // 비밀번호 재설정 요청
  static async requestPasswordReset(email) {
    await apiClient.post('/auth/password-reset/request/', { email });
  }
  
  // 비밀번호 재설정 확인
  static async confirmPasswordReset(token, newPassword) {
    await apiClient.post('/auth/password-reset/confirm/', {
      token,
      password: newPassword,
    });
  }
}