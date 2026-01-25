'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { IoArrowBack, IoCloudUpload, IoClose, IoImage, IoDocument } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const SPECIALTY_OPTIONS = [
  { value: 'learning_disability', label: '학습·발달' },
  { value: 'career_independence', label: '진로·자립' },
  { value: 'parenting_emotional', label: '기본생활·양육' },
  { value: 'social_skills', label: '정서행동·사회성' },
];

const expertSignup2Schema = z.object({
  specialty: z.array(z.string()).min(1, '전문분야를 1개 이상 선택해주세요').max(4, '전문분야는 최대 4개까지 선택 가능합니다'),
  experience_years: z.number().min(0, '경력은 0년 이상이어야 합니다').max(100, '올바른 경력을 입력해주세요'),
  institution: z.string().min(1, '소속 기관을 입력해주세요'),
});

export function ExpertSignupForm2() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [educationCertificate, setEducationCertificate] = useState(null);
  const [licenseCertificate, setLicenseCertificate] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(expertSignup2Schema),
    defaultValues: {
      specialty: [],
      experience_years: 0,
      institution: '',
    }
  });

  const handleSpecialtyChange = (value, checked) => {
    let newSpecialties;
    if (checked) {
      if (selectedSpecialties.length >= 4) {
        toast.error('전문분야는 최대 4개까지 선택 가능합니다');
        return;
      }
      newSpecialties = [...selectedSpecialties, value];
    } else {
      newSpecialties = selectedSpecialties.filter(s => s !== value);
    }
    setSelectedSpecialties(newSpecialties);
    setValue('specialty', newSpecialties);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('JPG, JPEG, PNG 형식만 업로드 가능합니다');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEducationCertificateChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('PDF, JPG, JPEG, PNG 형식만 업로드 가능합니다');
        return;
      }
      setEducationCertificate(file);
    }
  };

  const handleLicenseCertificateChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('PDF, JPG, JPEG, PNG 형식만 업로드 가능합니다');
        return;
      }
      setLicenseCertificate(file);
    }
  };

  const handleSignup = async (data) => {
    if (!profileImage) {
      toast.error('프로필 사진을 업로드해주세요');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // 전문분야 (배열)
      data.specialty.forEach(s => {
        formData.append('specialty', s);
      });

      formData.append('experience_years', data.experience_years.toString());
      formData.append('institution', data.institution);
      formData.append('profile_image', profileImage);

      if (educationCertificate) {
        formData.append('education_certificate', educationCertificate);
      }

      if (licenseCertificate) {
        formData.append('license_certificate', licenseCertificate);
      }

      const accessToken = TokenStorage.getAccessToken();

      const response = await fetch(`${API_BASE_URL}/auth/expert/signup/2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors || typeof responseData === 'object') {
          Object.entries(responseData).forEach(([key, value]) => {
            toast.error(Array.isArray(value) ? value[0] : value);
          });
        } else {
          toast.error(responseData.detail || '정보 등록 중 오류가 발생했습니다');
        }
        return;
      }

      toast.success('전문가 정보가 등록되었습니다. 심사 후 승인되면 알려드리겠습니다.');
      router.push('/');

    } catch (error) {
      console.error('Signup error:', error);
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center relative">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IoArrowBack className="h-5 w-5" />
        </button>
        <CardTitle className="text-2xl font-bold">전문가 정보 입력</CardTitle>
        <CardDescription>
          전문가 심사를 위한 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-6">
          {/* 프로필 사진 */}
          <div className="space-y-2">
            <Label>프로필 사진 *</Label>
            <div className="flex flex-col items-center gap-4">
              {profileImagePreview ? (
                <div className="relative">
                  <img
                    src={profileImagePreview}
                    alt="프로필 미리보기"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <IoClose className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <IoImage className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">사진 선택</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-500">JPG, JPEG, PNG (최대 10MB)</p>
            </div>
          </div>

          {/* 전문분야 선택 */}
          <div className="space-y-3">
            <Label>전문분야 * (1-4개 선택)</Label>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedSpecialties.includes(option.value)}
                    onCheckedChange={(checked) => handleSpecialtyChange(option.value, checked)}
                  />
                  <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.specialty && (
              <p className="text-sm text-red-500">{errors.specialty.message}</p>
            )}
          </div>

          {/* 경력 */}
          <div className="space-y-2">
            <Label htmlFor="experience_years">경력 *</Label>
            <div className="relative">
              <Input
                id="experience_years"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                {...register('experience_years', { valueAsNumber: true })}
                className={`pr-12 ${errors.experience_years ? 'border-red-500' : ''}`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                년차
              </span>
            </div>
            {errors.experience_years && (
              <p className="text-sm text-red-500">{errors.experience_years.message}</p>
            )}
          </div>

          {/* 소속 기관 */}
          <div className="space-y-2">
            <Label htmlFor="institution">소속 기관/병원 *</Label>
            <Input
              id="institution"
              type="text"
              placeholder="예: 서울아동병원"
              {...register('institution')}
              className={errors.institution ? 'border-red-500' : ''}
            />
            {errors.institution && (
              <p className="text-sm text-red-500">{errors.institution.message}</p>
            )}
          </div>

          {/* 학력증명서 */}
          <div className="space-y-2">
            <Label>학력증명서</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <IoCloudUpload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {educationCertificate ? educationCertificate.name : '파일 선택'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleEducationCertificateChange}
                  className="hidden"
                />
              </label>
              {educationCertificate && (
                <button
                  type="button"
                  onClick={() => setEducationCertificate(null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG (최대 10MB)</p>
          </div>

          {/* 자격증명서 */}
          <div className="space-y-2">
            <Label>자격증명서</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <IoDocument className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {licenseCertificate ? licenseCertificate.name : '파일 선택'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleLicenseCertificateChange}
                  className="hidden"
                />
              </label>
              {licenseCertificate && (
                <button
                  type="button"
                  onClick={() => setLicenseCertificate(null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG (최대 10MB)</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              입력하신 정보를 바탕으로 전문가 자격 심사가 진행됩니다.
              정확한 정보를 입력해주세요.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '다음 단계'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
