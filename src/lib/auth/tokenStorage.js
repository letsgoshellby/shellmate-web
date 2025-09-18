import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'shellmate_access_token';
const REFRESH_TOKEN_KEY = 'shellmate_refresh_token';

// 쿠키 옵션
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // strict에서 lax로 변경 (개발환경에서 더 안정적)
  path: '/',
};

export class TokenStorage {
  // 토큰 저장
  static setTokens(access, refresh) {
    
    // Access Token: 개발환경에서는 더 긴 시간 (2시간)
    const accessExpires = process.env.NODE_ENV === 'production' ? 1 / 24 : 1 / 12; // 프로덕션: 1시간, 개발: 2시간
    Cookies.set(ACCESS_TOKEN_KEY, access, {
      ...cookieOptions,
      expires: accessExpires,
    });
    
    // Refresh Token: 긴 만료 시간 (7일)
    Cookies.set(REFRESH_TOKEN_KEY, refresh, {
      ...cookieOptions,
      expires: 7,
    });
    
  }
  
  // Access Token 가져오기
  static getAccessToken() {
    return Cookies.get(ACCESS_TOKEN_KEY);
  }
  
  // Refresh Token 가져오기
  static getRefreshToken() {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }
  
  // 토큰 삭제
  static clearTokens() {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
  }
  
  // 토큰 상태 확인 (디버깅용)
  static getTokenStatus() {
    const access = this.getAccessToken();
    const refresh = this.getRefreshToken();
    
    const status = {
      hasAccessToken: !!access,
      hasRefreshToken: !!refresh,
      accessTokenExpired: access ? this.isTokenExpired(access) : true,
      refreshTokenExpired: refresh ? this.isTokenExpired(refresh) : true,
    };
    
    return status;
  }
  
  // 토큰 유효성 검사
  static isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}