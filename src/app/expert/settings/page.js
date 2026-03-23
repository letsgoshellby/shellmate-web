'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import {
  IoShieldCheckmark,
  IoKey,
  IoNotifications,
  IoEye,
  IoEyeOff,
  IoChevronForward,
  IoTrash
} from 'react-icons/io5';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ExpertSettingsPage() {
  const { user, isAuthenticated, isExpert, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 비밀번호 변경 상태
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 알림 설정 상태
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_notifications: false,
  });

  // 회원 탈퇴 상태
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isExpert) {
      router.push('/');
      return;
    }

    fetchNotificationSettings();
  }, [isAuthenticated, isExpert, router]);

  const fetchNotificationSettings = async () => {
    // TODO: 백엔드에서 알림 설정 API가 준비되면 구현
    // 현재는 기본값 사용
  };

  const handlePasswordChange = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/user/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (response.ok) {
        toast.success('비밀번호가 변경되었습니다');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setShowPasswordChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || '비밀번호 변경에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);

    // TODO: 백엔드 API 연동
    try {
      const token = TokenStorage.getAccessToken();
      // await fetch(`${API_BASE_URL}/user/notification-settings/`, { ... });
      toast.success('알림 설정이 변경되었습니다');
    } catch (error) {
      // 실패 시 롤백
      setNotificationSettings(notificationSettings);
      toast.error('알림 설정 변경에 실패했습니다');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '탈퇴하기') {
      toast.error('탈퇴 확인 문구를 정확히 입력해주세요');
      return;
    }

    if (!deleteReason.trim()) {
      toast.error('탈퇴 사유를 입력해주세요');
      return;
    }

    const confirmed = window.confirm(
      '정말로 탈퇴하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/user/delete-account/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: deleteReason,
        }),
      });

      if (response.ok) {
        toast.success('회원 탈퇴가 완료되었습니다');
        await logout();
        router.push('/');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || '회원 탈퇴에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">계정 설정</h1>
            <p className="text-gray-600 mt-2">계정 보안 및 알림 설정을 관리할 수 있습니다.</p>
          </div>

          <div className="space-y-6">
            {/* 개인정보 처리방침 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoShieldCheckmark className="h-5 w-5" />
                  개인정보 처리방침
                </CardTitle>
                <CardDescription>
                  셸메이트의 개인정보 처리방침을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    // 개인정보 처리방침 페이지로 리다이렉트
                    window.open('https://www.letsgoshellby.com/terms/expert/privacy', '_blank');
                  }}
                >
                  <span>개인정보 처리방침 보기</span>
                  <IoChevronForward className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* 비밀번호 변경 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoKey className="h-5 w-5" />
                  비밀번호 변경
                </CardTitle>
                <CardDescription>
                  계정 보안을 위해 주기적으로 비밀번호를 변경하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.provider !== 'email' ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {user?.provider === 'kakao' && '카카오톡 '}
                      {user?.provider === 'apple' && '애플 '}
                      소셜 로그인으로 가입한 계정은 비밀번호 변경이 불가능합니다.
                      {user?.provider === 'kakao' && ' 카카오톡 계정 설정에서 비밀번호를 변경해주세요.'}
                      {user?.provider === 'apple' && ' 애플 계정 설정에서 비밀번호를 변경해주세요.'}
                    </p>
                  </div>
                ) : !showPasswordChange ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordChange(true)}
                  >
                    비밀번호 변경하기
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">현재 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, current_password: e.target.value })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <IoEyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <IoEye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">새 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, new_password: e.target.value })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <IoEyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <IoEye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">8자 이상 입력해주세요</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">새 비밀번호 확인</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirm_password}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirm_password: e.target.value })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <IoEyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <IoEye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            current_password: '',
                            new_password: '',
                            confirm_password: '',
                          });
                        }}
                      >
                        취소
                      </Button>
                      <Button onClick={handlePasswordChange} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            변경 중...
                          </>
                        ) : (
                          '비밀번호 변경'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 알림 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoNotifications className="h-5 w-5" />
                  알림 설정
                </CardTitle>
                <CardDescription>
                  받고 싶은 알림을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">이메일 알림</h4>
                    <p className="text-sm text-gray-600">상담 일정 및 중요 알림을 이메일로 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={() => handleNotificationToggle('email_notifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">푸시 알림</h4>
                    <p className="text-sm text-gray-600">실시간 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={() => handleNotificationToggle('push_notifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">마케팅 알림</h4>
                    <p className="text-sm text-gray-600">이벤트 및 혜택 정보를 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketing_notifications}
                    onCheckedChange={() => handleNotificationToggle('marketing_notifications')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 회원 탈퇴 */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <IoTrash className="h-5 w-5" />
                  회원 탈퇴
                </CardTitle>
                <CardDescription>
                  탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDeleteAccount ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    회원 탈퇴
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">⚠️ 주의사항</h4>
                      <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        <li>탈퇴 시 모든 상담 기록이 삭제됩니다</li>
                        <li>정산 내역 및 포인트가 모두 소멸됩니다</li>
                        <li>탈퇴 후 동일한 이메일로 재가입이 불가능할 수 있습니다</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete_reason">탈퇴 사유</Label>
                      <Textarea
                        id="delete_reason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="탈퇴 사유를 입력해주세요 (선택)"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete_confirm">확인</Label>
                      <Input
                        id="delete_confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="'탈퇴하기'를 입력해주세요"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteAccount(false);
                          setDeleteReason('');
                          setDeleteConfirmText('');
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={loading || deleteConfirmText !== '탈퇴하기'}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          '탈퇴하기'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
