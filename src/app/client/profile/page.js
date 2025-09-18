'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Baby, Settings, Edit3, Save, X } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientProfilePage() {
  const { user, isAuthenticated, isClient } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isClient) {
      router.push('/');
      return;
    }

    fetchProfileData();
  }, [isAuthenticated, isClient, router]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditData({
          name: data.name || '',
          nickname: data.nickname || '',
          phone_number: data.phone_number || '',
        });
      }
    } catch (error) {
      toast.error('프로필 정보를 불러오는데 실패했습니다');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profileData?.name || '',
      nickname: profileData?.nickname || '',
      phone_number: profileData?.phone_number || '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setIsEditing(false);
        toast.success('프로필이 업데이트되었습니다');
      } else {
        const errorData = await response.json();
        toast.error('프로필 업데이트에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getSignupStatusBadge = (status) => {
    const statusMap = {
      'basic': { label: '기본 정보', variant: 'secondary' },
      'step1_completed': { label: '1단계 완료', variant: 'secondary' },
      'step2_completed': { label: '필수 완료', variant: 'default' },
      'step3_completed': { label: '3단계 완료', variant: 'default' },
      'completed': { label: '완료', variant: 'default' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 프로필</h1>
          <p className="text-gray-600 mt-2">개인정보 및 회원가입 현황을 확인하고 수정할 수 있습니다.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">기본 정보</TabsTrigger>
            <TabsTrigger value="status">가입 현황</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                  <CardDescription>
                    회원가입 시 입력한 기본 정보를 확인하고 수정할 수 있습니다.
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      이메일
                    </Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <Input value={profileData.name} disabled className="bg-gray-50" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    {isEditing ? (
                      <Input
                        id="nickname"
                        value={editData.nickname}
                        onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                      />
                    ) : (
                      <Input value={profileData.nickname} disabled className="bg-gray-50" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      전화번호
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone_number}
                        onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                      />
                    ) : (
                      <Input value={profileData.phone_number} disabled className="bg-gray-50" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      회원 유형
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">학부모 (내담자)</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      가입일
                    </Label>
                    <Input
                      value={new Date(profileData.created_at).toLocaleDateString('ko-KR')}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  회원가입 현황
                </CardTitle>
                <CardDescription>
                  회원가입 단계별 진행 상황을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">현재 상태</h3>
                      <p className="text-sm text-gray-600">회원가입 진행 상황</p>
                    </div>
                    {getSignupStatusBadge(profileData.signup_status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">1단계: 아이 기본정보</h4>
                      <p className="text-sm text-gray-600">생년월일, 성별, 출생순서</p>
                      <Badge variant="outline" className="mt-2">
                        {['step1_completed', 'step2_completed', 'step3_completed', 'completed'].includes(profileData.signup_status) ? '완료' : '미완료'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">2단계: 아이 세부정보</h4>
                      <p className="text-sm text-gray-600">학습/감각/정서 문제</p>
                      <Badge variant="outline" className="mt-2">
                        {['step2_completed', 'step3_completed', 'completed'].includes(profileData.signup_status) ? '완료' : '미완료'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">3단계: 특이사항 (선택)</h4>
                      <p className="text-sm text-gray-600">진단여부, 치료현황</p>
                      <Badge variant="outline" className="mt-2">
                        {['step3_completed', 'completed'].includes(profileData.signup_status) ? '완료' : '선택사항'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">4단계: 맞춤설정 (선택)</h4>
                      <p className="text-sm text-gray-600">관심분야 설정</p>
                      <Badge variant="outline" className="mt-2">
                        {profileData.signup_status === 'completed' ? '완료' : '선택사항'}
                      </Badge>
                    </div>
                  </div>

                  {profileData.signup_status !== 'completed' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">추가 정보 입력</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        더 정확한 전문가 매칭을 위해 추가 정보를 입력해보세요.
                      </p>
                      <Button size="sm" onClick={() => router.push('/signup/client/step1')}>
                        정보 입력 계속하기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}