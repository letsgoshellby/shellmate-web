'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '@/lib/api/auth';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 초기 로드 시 사용자 정보 가져오기
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    const token = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (!token && !refreshToken) {
      setLoading(false);
      return;
    }
    
    // 토큰이 만료되었지만 refresh token이 있는 경우 갱신 시도
    if (!token && refreshToken) {
      try {
        const newAccessToken = await AuthAPI.refreshToken(refreshToken);
        TokenStorage.setTokens(newAccessToken, refreshToken);
      } catch (err) {
        TokenStorage.clearTokens();
        setLoading(false);
        return;
      }
    }
    
    try {
      const userData = await AuthAPI.getCurrentUser();
      setUser(userData);
      // 사용자 정보를 로컬스토리지에 저장
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (err) {
      
      // 401 (인증 실패)인 경우에만 토큰 관련 처리
      if (err.response?.status === 401) {
        // 인증 실패 시 refresh token으로 재시도
        if (refreshToken) {
          try {
            const newAccessToken = await AuthAPI.refreshToken(refreshToken);
            TokenStorage.setTokens(newAccessToken, refreshToken);
            const userData = await AuthAPI.getCurrentUser();
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          } catch (refreshErr) {
            // refresh도 실패하면 토큰 삭제
            TokenStorage.clearTokens();
            localStorage.removeItem('user_data');
          }
        } else {
          // refresh token이 없으면 토큰 삭제
          TokenStorage.clearTokens();
          localStorage.removeItem('user_data');
        }
      } else {
        // 기타 에러는 로컬스토리지에서 사용자 정보 복원 시도
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseErr) {
            localStorage.removeItem('user_data');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    try {
      const response = await AuthAPI.login({ email, password });
      setUser(response.user);
      // 사용자 정보를 로컬스토리지에 저장
      localStorage.setItem('user_data', JSON.stringify(response.user));
      setError(null);
      return response;
    } catch (err) {
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
      localStorage.removeItem('user_data');
    }
  };
  
  const refreshUser = async () => {
    try {
      const userData = await AuthAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (err) {
      setError(err);
    }
  };
  
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    setUser,
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