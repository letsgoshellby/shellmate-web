/**
 * Kakao OAuth 인증 유틸리티
 * JavaScript SDK를 사용한 카카오 로그인 처리
 */

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

/**
 * 역할(client/expert)에 따른 카카오 앱 키 반환
 * @param {string} role - 'client' 또는 'expert'
 * @returns {string} 카카오 JavaScript 앱 키 (REST API Key)
 */
export const getKakaoAppKey = (role) => {
  let appKey;
  if (role === 'client') {
    appKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_APP_KEY;
  } else if (role === 'expert') {
    appKey = process.env.NEXT_PUBLIC_KAKAO_EXPERT_APP_KEY;
  } else {
    throw new Error('Invalid role: must be "client" or "expert"');
  }

  if (!appKey) {
    console.error(`카카오 앱 키가 설정되지 않았습니다. Role: ${role}`);
    console.error('환경 변수:', {
      client: process.env.NEXT_PUBLIC_KAKAO_CLIENT_APP_KEY,
      expert: process.env.NEXT_PUBLIC_KAKAO_EXPERT_APP_KEY,
    });
    throw new Error(`Kakao App Key not found for role: ${role}`);
  }

  return appKey;
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
 * 카카오 SDK 로드 대기
 * @returns {Promise<boolean>}
 */
const waitForKakaoSDK = () => {
  return new Promise((resolve) => {
    if (window.Kakao) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5초 (100ms * 50)

    const checkKakao = setInterval(() => {
      attempts++;

      if (window.Kakao) {
        clearInterval(checkKakao);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkKakao);
        console.error('Kakao SDK failed to load');
        resolve(false);
      }
    }, 100);
  });
};

/**
 * 카카오 JavaScript SDK 초기화
 * @param {string} role - 'client' 또는 'expert'
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
export const initKakaoSDK = async (role) => {
  if (typeof window === 'undefined') return false;

  // SDK 로드 대기
  const isLoaded = await waitForKakaoSDK();
  if (!isLoaded) {
    console.error('Kakao SDK not loaded');
    return false;
  }

  const appKey = getKakaoAppKey(role);

  // 이미 초기화되어 있으면 cleanup 후 재초기화
  if (window.Kakao.isInitialized()) {
    window.Kakao.cleanup();
  }

  window.Kakao.init(appKey);
  return true;
};

/**
 * 인증 코드를 액세스 토큰으로 교환
 * @param {string} code - 카카오 인증 코드
 * @param {string} role - 'client' 또는 'expert'
 * @returns {Promise<string>} 액세스 토큰
 */
export const exchangeCodeForToken = async (code, role) => {
  const appKey = getKakaoAppKey(role);
  const redirectUri = getKakaoRedirectUri(role);

  // Kakao SDK의 setAccessToken 방식 사용
  try {
    // 카카오 SDK를 통해 토큰 요청
    const response = await fetch(`${KAKAO_TOKEN_URL}?grant_type=authorization_code&client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

/**
 * 카카오 로그인 시작 (JavaScript SDK 사용)
 * @param {string} role - 'client' 또는 'expert'
 * @param {Function} onSuccess - 성공 콜백 (accessToken 전달)
 * @param {Function} onFailure - 실패 콜백 (error 전달)
 */
export const loginWithKakao = async (role, onSuccess, onFailure) => {
  if (typeof window === 'undefined') {
    onFailure(new Error('Window object not available'));
    return;
  }

  // SDK가 초기화되지 않았으면 먼저 초기화
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    const initialized = await initKakaoSDK(role);
    if (!initialized) {
      onFailure(new Error('Kakao SDK initialization failed'));
      return;
    }
  }

  try {
    // Kakao SDK로 리다이렉트 방식 로그인 (인증 코드 받기)
    const redirectUri = getKakaoRedirectUri(role);

    window.Kakao.Auth.authorize({
      redirectUri: redirectUri,
      state: role, // 역할 정보를 state로 전달
    });
  } catch (err) {
    console.error('Kakao login failed:', err);
    onFailure(err);
  }
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
