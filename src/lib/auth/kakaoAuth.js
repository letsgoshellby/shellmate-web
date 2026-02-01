/**
 * Kakao OAuth 인증 유틸리티
 * JavaScript SDK를 사용한 카카오 로그인 처리
 */

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

/**
 * 역할(client/expert)에 따른 카카오 앱 키 반환
 * @param {string} role - 'client' 또는 'expert'
 * @returns {string} 카카오 JavaScript 앱 키
 */
export const getKakaoAppKey = (role) => {
  if (role === 'client') {
    return process.env.NEXT_PUBLIC_KAKAO_CLIENT_APP_KEY;
  } else if (role === 'expert') {
    return process.env.NEXT_PUBLIC_KAKAO_EXPERT_APP_KEY;
  }
  throw new Error('Invalid role: must be "client" or "expert"');
};

/**
 * 역할(client/expert)에 따른 리다이렉트 URI 반환
 * @param {string} role - 'client' 또는 'expert'
 * @returns {string} 리다이렉트 URI
 */
export const getKakaoRedirectUri = (role) => {
  if (role === 'client') {
    return process.env.NEXT_PUBLIC_KAKAO_CLIENT_REDIRECT_URI;
  } else if (role === 'expert') {
    return process.env.NEXT_PUBLIC_KAKAO_EXPERT_REDIRECT_URI;
  }
  throw new Error('Invalid role: must be "client" or "expert"');
};

/**
 * 카카오 JavaScript SDK 초기화
 * @param {string} role - 'client' 또는 'expert'
 */
export const initKakaoSDK = (role) => {
  if (typeof window === 'undefined') return;

  const appKey = getKakaoAppKey(role);

  if (!window.Kakao) {
    console.error('Kakao SDK not loaded');
    return;
  }

  // 이미 초기화되어 있으면 cleanup 후 재초기화
  if (window.Kakao.isInitialized()) {
    window.Kakao.cleanup();
  }

  window.Kakao.init(appKey);
  console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
};

/**
 * 카카오 로그인 시작 (JavaScript SDK 사용)
 * @param {string} role - 'client' 또는 'expert'
 * @param {Function} onSuccess - 성공 콜백 (accessToken 전달)
 * @param {Function} onFailure - 실패 콜백 (error 전달)
 */
export const loginWithKakao = (role, onSuccess, onFailure) => {
  if (typeof window === 'undefined') {
    onFailure(new Error('Window object not available'));
    return;
  }

  if (!window.Kakao || !window.Kakao.isInitialized()) {
    initKakaoSDK(role);
  }

  window.Kakao.Auth.login({
    success: (authObj) => {
      console.log('Kakao login success:', authObj);
      onSuccess(authObj.access_token);
    },
    fail: (err) => {
      console.error('Kakao login failed:', err);
      onFailure(err);
    },
  });
};

/**
 * 카카오 로그아웃
 */
export const logoutKakao = () => {
  if (typeof window === 'undefined') return;

  if (!window.Kakao || !window.Kakao.isInitialized()) {
    return;
  }

  window.Kakao.Auth.logout(() => {
    console.log('Kakao logged out');
  });
};

/**
 * 카카오 SDK 스크립트 로드 여부 확인
 * @returns {boolean}
 */
export const isKakaoSDKLoaded = () => {
  return typeof window !== 'undefined' && !!window.Kakao;
};
