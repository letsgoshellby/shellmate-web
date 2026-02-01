import { apiClient } from './client';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export class AuthAPI {
  // 이메일 로그인
  static async login(credentials, rememberMe = false) {
    try {
      console.log('🔵 [로그인] 요청 시작');
      console.log('🔵 [로그인] 이메일:', credentials.email);

      const response = await apiClient.post('/auth/login/', credentials);
      console.log('🔵 [로그인] 응답:', response.data);

      // 토큰 저장
      TokenStorage.setTokens(response.data.access, response.data.refresh, rememberMe);
      console.log('✅ [로그인] 토큰 저장 완료');

      // Flutter API는 user 정보를 별도로 반환하지 않으므로 토큰에서 추출하거나 별도 API 호출 필요
      // 로그인 후 사용자 정보 가져오기
      console.log('🔵 [로그인] 사용자 정보 요청');
      const userResponse = await apiClient.get('/user/me/');
      console.log('✅ [로그인] 사용자 정보:', userResponse.data);

      return {
        ...response.data,
        user: userResponse.data,
      };
    } catch (error) {
      console.log('🔴 [로그인] 에러 발생');
      console.log('🔴 [로그인] 상태 코드:', error.response?.status);
      console.log('🔴 [로그인] 에러 데이터:', error.response?.data);
      console.log('🔴 [로그인] 에러 메시지:', error.message);
      throw error;
    }
  }
  
  // 로그아웃
  static async logout() {
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
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

  // 소셜 로그인 - Client
  static async clientSocialLogin(provider, accessToken, terms = {}) {
    try {
      console.log('🔵 [소셜 로그인] Client 요청 시작');
      console.log('🔵 [소셜 로그인] Provider:', provider);

      const response = await apiClient.post('/auth/client/social-login/', {
        provider,
        access_token: accessToken,
        ...terms,
      });

      console.log('🔵 [소셜 로그인] 응답:', response.data);

      // 토큰이 있으면 저장 (기존 회원)
      if (response.data.access && response.data.refresh) {
        TokenStorage.setTokens(response.data.access, response.data.refresh, false);
        console.log('✅ [소셜 로그인] 토큰 저장 완료');

        // 사용자 정보 가져오기
        const userResponse = await apiClient.get('/user/me/');
        console.log('✅ [소셜 로그인] 사용자 정보:', userResponse.data);

        return {
          ...response.data,
          user: userResponse.data,
          isNewUser: false,
        };
      }

      // 토큰이 없으면 신규 회원
      return {
        ...response.data,
        isNewUser: true,
      };
    } catch (error) {
      console.log('🔴 [소셜 로그인] 에러 발생');
      console.log('🔴 [소셜 로그인] 상태 코드:', error.response?.status);
      console.log('🔴 [소셜 로그인] 에러 데이터:', error.response?.data);
      throw error;
    }
  }

  // 소셜 로그인 - Expert
  static async expertSocialLogin(provider, accessToken, terms = {}) {
    try {
      console.log('🔵 [소셜 로그인] Expert 요청 시작');
      console.log('🔵 [소셜 로그인] Provider:', provider);

      const response = await apiClient.post('/auth/expert/social-login/', {
        provider,
        access_token: accessToken,
        ...terms,
      });

      console.log('🔵 [소셜 로그인] 응답:', response.data);

      // 토큰이 있으면 저장 (기존 회원)
      if (response.data.access && response.data.refresh) {
        TokenStorage.setTokens(response.data.access, response.data.refresh, false);
        console.log('✅ [소셜 로그인] 토큰 저장 완료');

        // 사용자 정보 가져오기
        const userResponse = await apiClient.get('/user/me/');
        console.log('✅ [소셜 로그인] 사용자 정보:', userResponse.data);

        return {
          ...response.data,
          user: userResponse.data,
          isNewUser: false,
        };
      }

      // 토큰이 없으면 신규 회원
      return {
        ...response.data,
        isNewUser: true,
      };
    } catch (error) {
      console.log('🔴 [소셜 로그인] 에러 발생');
      console.log('🔴 [소셜 로그인] 상태 코드:', error.response?.status);
      console.log('🔴 [소셜 로그인] 에러 데이터:', error.response?.data);
      throw error;
    }
  }
}