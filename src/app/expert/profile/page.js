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
  IoDocumentText,
  IoPricetag,
  IoCard,
  IoImage,
  IoAdd,
  IoTrash
} from 'react-icons/io5';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { ConsultationsAPI } from '@/lib/api/consultations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ExpertProfilePage() {
  const { user, isAuthenticated, isExpert, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState({});
  const [pricings, setPricings] = useState([]);
  const [education, setEducation] = useState([]);
  const [career, setCareer] = useState([]);

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
          introduction: data.expert_profile?.introduction || '',
          experience_years: data.expert_profile?.experience_years || '',
          institution: data.expert_profile?.institution || '',
          workplace: data.expert_profile?.workplace || '',
          bank_name: data.expert_profile?.bank_name || '',
          account_number: data.expert_profile?.account_number || '',
        });

        // 학력, 경력 정보 설정 (빈 배열일 경우 기본값 1개 제공)
        const educationData = Array.isArray(data.expert_profile?.education) && data.expert_profile.education.length > 0
          ? data.expert_profile.education
          : [''];
        const careerData = Array.isArray(data.expert_profile?.career) && data.expert_profile.career.length > 0
          ? data.expert_profile.career
          : [''];
        setEducation(educationData);
        setCareer(careerData);
      }

      // 가격 설정 정보 가져오기
      const pricingData = await ConsultationsAPI.getMyPricing();
      setPricings(Array.isArray(pricingData) ? pricingData : []);
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
      introduction: profileData?.expert_profile?.introduction || '',
      experience_years: profileData?.expert_profile?.experience_years || '',
      institution: profileData?.expert_profile?.institution || '',
      workplace: profileData?.expert_profile?.workplace || '',
      bank_name: profileData?.expert_profile?.bank_name || '',
      account_number: profileData?.expert_profile?.account_number || '',
    });

    // 학력, 경력 정보 원복
    const educationData = Array.isArray(profileData?.expert_profile?.education) && profileData.expert_profile.education.length > 0
      ? profileData.expert_profile.education
      : [''];
    const careerData = Array.isArray(profileData?.expert_profile?.career) && profileData.expert_profile.career.length > 0
      ? profileData.expert_profile.career
      : [''];
    setEducation(educationData);
    setCareer(careerData);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();

      // 빈 문자열 제거
      const filteredEducation = education.filter(item => item.trim() !== '');
      const filteredCareer = career.filter(item => item.trim() !== '');

      const requestData = {
        ...editData,
        education: filteredEducation,
        career: filteredCareer,
      };


      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const responseData = await response.json();

        // 응답 데이터에서 user 객체 추출
        const updatedData = responseData.user || responseData;
        setProfileData(updatedData);

        // AuthContext의 사용자 정보도 업데이트 (새로고침 시 로그인 유지를 위해)
        await refreshUser();

        setIsEditing(false);
        toast.success('프로필이 업데이트되었습니다');
      } else {
        const errorData = await response.json();
        toast.error('프로필 업데이트에 실패했습니다');
      }
    } catch (error) {
      console.error('❌ 네트워크 에러:', error);
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: '심사대기', variant: 'secondary' },
      'approved': { label: '승인완료', variant: 'default' },
      'rejected': { label: '심사반려', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleAddEducation = () => {
    setEducation([...education, '']);
  };

  const handleRemoveEducation = (index) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index));
    }
  };

  const handleEducationChange = (index, value) => {
    const newEducation = [...education];
    newEducation[index] = value;
    setEducation(newEducation);
  };

  const handleAddCareer = () => {
    setCareer([...career, '']);
  };

  const handleRemoveCareer = (index) => {
    if (career.length > 1) {
      setCareer(career.filter((_, i) => i !== index));
    }
  };

  const handleCareerChange = (index, value) => {
    const newCareer = [...career];
    newCareer[index] = value;
    setCareer(newCareer);
  };

  if (!profileData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>프로필 정보를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전문가 프로필</h1>
          <p className="text-gray-600 mt-2">전문가 정보 및 승인 현황을 확인하고 수정할 수 있습니다.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">기본 정보</TabsTrigger>
            <TabsTrigger value="professional">전문가 정보</TabsTrigger>
            <TabsTrigger value="pricing">가격 설정</TabsTrigger>
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
                      value={profileData.email || ''}
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
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <Input value={profileData.name || ''} disabled className="bg-gray-50" />
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
                        value={editData.phone_number || ''}
                        onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                      />
                    ) : (
                      <Input value={profileData.phone_number || ''} disabled className="bg-gray-50" />
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

                {/* 학력 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <IoSchool className="h-4 w-4" />
                      학력
                    </Label>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEducation}
                        className="h-8"
                      >
                        <IoAdd className="h-4 w-4 mr-1" />
                        추가
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      {education.map((edu, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={edu}
                            onChange={(e) => handleEducationChange(index, e.target.value)}
                            placeholder="예: 서울대학교 교육학 학사 (2015-2019)"
                            className="flex-1"
                          />
                          {education.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveEducation(index)}
                              className="h-10 w-10 p-0"
                            >
                              <IoTrash className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        학교명, 전공, 학위, 기간 등을 입력해주세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {education.filter(edu => edu.trim() !== '').length > 0 ? (
                        education.filter(edu => edu.trim() !== '').map((edu, index) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-900">{edu}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          학력 정보가 작성되지 않았습니다.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 경력 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <IoBusiness className="h-4 w-4" />
                      경력
                    </Label>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCareer}
                        className="h-8"
                      >
                        <IoAdd className="h-4 w-4 mr-1" />
                        추가
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      {career.map((car, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={car}
                            onChange={(e) => handleCareerChange(index, e.target.value)}
                            placeholder="예: ABC 아동발달센터 언어치료사 (2019-2023)"
                            className="flex-1"
                          />
                          {career.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCareer(index)}
                              className="h-10 w-10 p-0"
                            >
                              <IoTrash className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        기관명, 직책, 주요 업무, 기간 등을 입력해주세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {career.filter(car => car.trim() !== '').length > 0 ? (
                        career.filter(car => car.trim() !== '').map((car, index) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-900">{car}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          경력 정보가 작성되지 않았습니다.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 자기소개 */}
                <div className="space-y-2">
                  <Label htmlFor="introduction" className="flex items-center gap-2">
                    <IoDocumentText className="h-4 w-4" />
                    자기소개
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="introduction"
                      value={editData.introduction || ''}
                      onChange={(e) => setEditData({ ...editData, introduction: e.target.value })}
                      placeholder="자신을 소개하는 글을 작성해주세요"
                      rows={4}
                    />
                  ) : (
                    <Textarea
                      value={profileData.expert_profile?.introduction || '자기소개가 작성되지 않았습니다.'}
                      disabled
                      className="bg-gray-50"
                      rows={4}
                    />
                  )}
                </div>

                {/* 계좌 정보 */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <IoCard className="h-5 w-5" />
                    계좌 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name" className="flex items-center gap-2">
                        <IoCard className="h-4 w-4" />
                        은행명
                      </Label>
                      {isEditing ? (
                        <Input
                          id="bank_name"
                          value={editData.bank_name || ''}
                          onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })}
                          placeholder="은행명을 입력해주세요 (예: 국민은행)"
                        />
                      ) : (
                        <Input
                          value={profileData.expert_profile?.bank_name || '미입력'}
                          disabled
                          className="bg-gray-50"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="flex items-center gap-2">
                        <IoCard className="h-4 w-4" />
                        계좌번호
                      </Label>
                      {isEditing ? (
                        <Input
                          id="account_number"
                          value={editData.account_number || ''}
                          onChange={(e) => setEditData({ ...editData, account_number: e.target.value })}
                          placeholder="계좌번호를 입력해주세요 (하이픈 없이)"
                        />
                      ) : (
                        <Input
                          value={profileData.expert_profile?.account_number || '미입력'}
                          disabled
                          className="bg-gray-50"
                        />
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <IoImage className="h-4 w-4" />
                        통장 사본
                      </Label>
                      {profileData.expert_profile?.bankbook_image ? (
                        <div className="space-y-2">
                          <a
                            href={profileData.expert_profile.bankbook_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:underline"
                          >
                            <IoImage className="h-4 w-4 mr-1" />
                            통장 사본 확인하기
                          </a>
                          {/* {isEditing && (
                            <p className="text-xs text-gray-500">
                              통장 사본을 변경하려면 회원가입 페이지에서 재등록해주세요.
                            </p>
                          )} */}
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-500">통장 사본이 등록되지 않았습니다.</p>
                          {/* {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">
                              통장 사본은 회원가입 페이지에서 등록해주세요.
                            </p>
                          )} */}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>안내:</strong> 상담료 정산을 위해 정확한 계좌 정보를 입력해주세요.
                      입력하신 계좌로 매월 정산금이 입금됩니다.
                    </p>
                  </div>
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
                        value={editData.experience_years || ''}
                        onChange={(e) => setEditData({ ...editData, experience_years: e.target.value })}
                        placeholder="경력 년수를 입력해주세요"
                      />
                    ) : (
                      <Input
                        value={profileData.expert_profile?.experience_years ? `${profileData.expert_profile.experience_years}년` : '미입력'}
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
                        value={editData.institution || ''}
                        onChange={(e) => setEditData({ ...editData, institution: e.target.value })}
                        placeholder="소속 기관을 입력해주세요"
                      />
                    ) : (
                      <Input
                        value={profileData.expert_profile?.institution || '미입력'}
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
                      {profileData.expert_profile?.specialty_list && profileData.expert_profile.specialty_list.length > 0 ? (
                        profileData.expert_profile.specialty_list.map((specialty, index) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">미설정</Badge>
                      )}
                    </div>
                  </div>

                  {/* <div className="space-y-2">
                    <Label>근무지</Label>
                    <Input
                      value={profileData.expert_profile?.workplace || '미입력'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div> */}
                </div>

                {!profileData.expert_profile && (
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

                {profileData.expert_profile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>학력 증명서</Label>
                        {profileData.expert_profile.education_certificate ? (
                          <a
                            href={profileData.expert_profile.education_certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            증명서 확인
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">미제출</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>자격증</Label>
                        {profileData.expert_profile.license_certificate ? (
                          <a
                            href={profileData.expert_profile.license_certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            자격증 확인
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">미제출</p>
                        )}
                      </div>
                    </div>

                    {profileData.expert_profile.additional_certificates_count > 0 && (
                      <div className="space-y-2">
                        <Label>추가 증명서 ({profileData.expert_profile.additional_certificates_count}개)</Label>
                        <div className="flex flex-wrap gap-2">
                          {profileData.expert_profile.additional_certificates?.map((cert, index) => (
                            <a
                              key={index}
                              href={cert}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              증명서 {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IoPricetag className="h-5 w-5" />
                    상담 가격 설정
                  </CardTitle>
                  <CardDescription>
                    설정된 상담 유형별 가격을 확인할 수 있습니다
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/signup/expert/pricing')}>
                  가격 수정하러 가기
                </Button>
              </CardHeader>
              <CardContent>
                {pricings.length > 0 ? (
                  <div className="space-y-6">
                    {/* 가격 정보 안내 */}
                    {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <IoPricetag className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-blue-900 mb-1">가격 안내</h4>
                          <p className="text-xs text-blue-800">
                            1토큰 = 1,000원입니다. 설정된 가격은 내담자에게 표시됩니다.
                          </p>
                        </div>
                      </div>
                    </div> */}

                    {/* 가격 목록 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pricings.map((pricing) => {
                        const getSessionLabel = (type) => {
                          const labels = {
                            SINGLE: '체험형 - 1회',
                            SINGLE_PLUS_3: '집중형 - 4회',
                            SINGLE_PLUS_7: '집중형 - 8회',
                            SINGLE_PLUS_11: '집중형 - 12회',
                          };
                          return labels[type] || type;
                        };

                        return (
                          <div
                            key={pricing.id}
                            className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {getSessionLabel(pricing.session_type)}
                              </h4>
                              {pricing.is_active ? (
                                <Badge variant="default" className="bg-green-500">활성</Badge>
                              ) : (
                                <Badge variant="secondary">비활성</Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  {(pricing.tokens_required * 1000).toLocaleString()}
                                </span>
                                <span className="text-gray-600">원</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 가격 수정 안내 */}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                    <IoPricetag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      설정된 가격이 없습니다
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      상담을 시작하려면 먼저 가격을 설정해주세요
                    </p>
                    <Button onClick={() => router.push('/signup/expert/pricing')}>
                      가격 설정하러 가기
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
                    {getVerificationStatusBadge(profileData.expert_profile?.verification_status)}
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
                        {profileData.expert_profile ? '완료' : '미완료'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">3단계: 서류 제출</h4>
                      <p className="text-sm text-gray-600">학력증명서, 자격증</p>
                      <Badge variant="outline" className="mt-2">
                        {profileData.expert_profile?.education_certificate || profileData.expert_profile?.license_certificate ? '완료' : '미완료'}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">4단계: 최종 승인</h4>
                      <p className="text-sm text-gray-600">관리자 검토 및 승인</p>
                      <Badge variant="outline" className="mt-2">
                        {profileData.expert_profile?.verification_status === 'approved' ? '완료' :
                         profileData.expert_profile?.verification_status === 'rejected' ? '반려' : '대기중'}
                      </Badge>
                    </div>
                  </div>

                  {profileData.expert_profile?.verification_status === 'pending' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">심사 진행 중</h4>
                      <p className="text-sm text-blue-800">
                        전문가 자격 심사가 진행 중입니다. 심사 결과는 이메일로 안내드리겠습니다.
                        (보통 1-3일 소요)
                      </p>
                    </div>
                  )}

                  {profileData.expert_profile?.verification_status === 'rejected' && (
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

                  {profileData.expert_profile?.verification_status === 'approved' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">승인 완료</h4>
                      <p className="text-sm text-green-800">
                        전문가 승인이 완료되었습니다! 이제 자기소개 및 상담 과목 정보를 입력한 후, 상담 서비스를 제공할 수 있습니다.
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
    </DashboardLayout>
  );
}