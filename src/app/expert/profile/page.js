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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { 
  IoPerson, 
  IoMail, 
  IoCall, 
  IoCalendar, 
  IoSchool, 
  IoSettings, 
  IoCreate, 
  IoSave, 
  IoClose, 
  IoTrophy,
  IoBusiness,
  IoTime,
  IoDocumentText
} from 'react-icons/io5';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ExpertProfilePage() {
  const { user, isAuthenticated, isExpert } = useAuth();
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
    
    if (!isExpert) {
      router.push('/');
      return;
    }

    fetchProfileData();
  }, [isAuthenticated, isExpert, router]);

  const fetchProfileData = async () => {
    try {
      const token = TokenStorage.getAccessToken();
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
          phone_number: data.phone_number || '',
          bio: data.bio || '',
          experience_years: data.experience_years || '',
          affiliation: data.affiliation || '',
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
      phone_number: profileData?.phone_number || '',
      bio: profileData?.bio || '',
      experience_years: profileData?.experience_years || '',
      affiliation: profileData?.affiliation || '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
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
      'profile_created': { label: '프로필 생성', variant: 'secondary' },
      'pending_approval': { label: '심사 대기', variant: 'secondary' },
      'approved': { label: '승인 완료', variant: 'default' },
      'rejected': { label: '심사 반려', variant: 'destructive' },
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
          <h1 className="text-3xl font-bold text-gray-900">전문가 프로필</h1>
          <p className="text-gray-600 mt-2">전문가 정보 및 승인 현황을 확인하고 수정할 수 있습니다.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">기본 정보</TabsTrigger>
            <TabsTrigger value="professional">전문가 정보</TabsTrigger>
            <TabsTrigger value="status">승인 현황</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IoPerson className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                  <CardDescription>
                    회원가입 시 입력한 기본 정보를 확인하고 수정할 수 있습니다.
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <IoCreate className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <IoClose className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={loading}>
                      <IoSave className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <IoMail className="h-4 w-4" />
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
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <IoCall className="h-4 w-4" />
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
                      <IoSchool className="h-4 w-4" />
                      회원 유형
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">전문가</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IoCalendar className="h-4 w-4" />
                      가입일
                    </Label>
                    <Input
                      value={new Date(profileData.created_at).toLocaleDateString('ko-KR')}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <IoDocumentText className="h-4 w-4" />
                    자기소개
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="자신을 소개하는 글을 작성해주세요"
                      rows={4}
                    />
                  ) : (
                    <Textarea
                      value={profileData.bio || '자기소개가 작성되지 않았습니다.'}
                      disabled
                      className="bg-gray-50"
                      rows={4}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoTrophy className="h-5 w-5" />
                  전문가 정보
                </CardTitle>
                <CardDescription>
                  전문가 자격 및 경력 정보를 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IoTime className="h-4 w-4" />
                      경력 (년)
                    </Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.experience_years}
                        onChange={(e) => setEditData({ ...editData, experience_years: e.target.value })}
                        placeholder="경력 년수를 입력해주세요"
                      />
                    ) : (
                      <Input
                        value={profileData.experience_years ? `${profileData.experience_years}년` : '미입력'}
                        disabled
                        className="bg-gray-50"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IoBusiness className="h-4 w-4" />
                      소속기관
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editData.affiliation}
                        onChange={(e) => setEditData({ ...editData, affiliation: e.target.value })}
                        placeholder="소속 기관을 입력해주세요"
                      />
                    ) : (
                      <Input
                        value={profileData.affiliation || '미입력'}
                        disabled
                        className="bg-gray-50"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>전문 분야</Label>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specialties && profileData.specialties.length > 0 ? (
                        profileData.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">미설정</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>자격증</Label>
                    <div className="flex flex-wrap gap-2">
                      {profileData.certifications && profileData.certifications.length > 0 ? (
                        profileData.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            {cert}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">미등록</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {profileData.signup_status === 'basic' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-2">전문가 정보 입력</h4>
                    <p className="text-sm text-amber-800 mb-3">
                      전문가 승인을 위해 추가 정보를 입력해주세요.
                    </p>
                    <Button size="sm" onClick={() => router.push('/signup/expert/step1')}>
                      전문가 정보 입력하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoSettings className="h-5 w-5" />
                  승인 현황
                </CardTitle>
                <CardDescription>
                  전문가 승인 단계별 진행 상황을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">현재 상태</h3>
                      <p className="text-sm text-gray-600">전문가 승인 진행 상황</p>
                    </div>
                    {getSignupStatusBadge(profileData.signup_status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">1단계: 기본 정보</h4>
                      <p className="text-sm text-gray-600">이메일, 이름, 전화번호</p>
                      <Badge variant="outline" className="mt-2">완료</Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">2단계: 전문가 정보</h4>
                      <p className="text-sm text-gray-600">경력, 자격증, 전문분야</p>
                      <Badge variant="outline" className="mt-2">
                        {['profile_created', 'pending_approval', 'approved', 'completed'].includes(profileData.signup_status) ? '완료' : '미완료'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">3단계: 서류 심사</h4>
                      <p className="text-sm text-gray-600">자격증명서, 경력증명서</p>
                      <Badge variant="outline" className="mt-2">
                        {['pending_approval', 'approved', 'completed'].includes(profileData.signup_status) ? '진행중/완료' : 
                         profileData.signup_status === 'rejected' ? '반려' : '대기중'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">4단계: 최종 승인</h4>
                      <p className="text-sm text-gray-600">관리자 검토 및 승인</p>
                      <Badge variant="outline" className="mt-2">
                        {['approved', 'completed'].includes(profileData.signup_status) ? '완료' : 
                         profileData.signup_status === 'rejected' ? '반려' : '대기중'}
                      </Badge>
                    </div>
                  </div>

                  {profileData.signup_status === 'pending_approval' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">심사 진행 중</h4>
                      <p className="text-sm text-blue-800">
                        전문가 자격 심사가 진행 중입니다. 심사 결과는 이메일로 안내드리겠습니다.
                        (보통 1-3일 소요)
                      </p>
                    </div>
                  )}

                  {profileData.signup_status === 'rejected' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">심사 반려</h4>
                      <p className="text-sm text-red-800 mb-3">
                        제출해주신 서류에 문제가 있어 심사가 반려되었습니다. 
                        자세한 내용은 이메일을 확인해주세요.
                      </p>
                      <Button size="sm" variant="outline">
                        재신청하기
                      </Button>
                    </div>
                  )}

                  {profileData.signup_status === 'approved' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">승인 완료</h4>
                      <p className="text-sm text-green-800">
                        전문가 승인이 완료되었습니다! 이제 상담 서비스를 제공할 수 있습니다.
                      </p>
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