'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SignupProgress } from '@/components/auth/SignupProgress';
import { toast } from 'react-hot-toast';
import { IoArrowBack, IoArrowForward, IoCheckmarkCircle } from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const step4Schema = z.object({
  main_interests: z.array(z.string()).max(3, '최대 3개까지 선택할 수 있습니다').optional(),
});

const interestOptions = [
  { value: 'academic', label: '학업' },
  { value: 'friendship', label: '친구관계' },
  { value: 'sensory_issues', label: '감각 문제' },
  { value: 'language', label: '언어' },
  { value: 'emotional_anxiety', label: '정서 불안' },
  { value: 'behavioral_issues', label: '행동 문제' },
  { value: 'career_planning', label: '진로 설계' },
  { value: 'parenting_discipline', label: '가정 육아 / 훈육' },
];

export default function ClientSignupStep4Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const {
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step4Schema),
  });

  const handleInterestChange = (interest, checked) => {
    if (checked) {
      if (selectedInterests.length >= 3) {
        toast.error('최대 3개까지 선택할 수 있습니다');
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    }
  };

  const handleStep4Submit = async () => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      if (!token) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/client/signup/step4/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          main_interests: selectedInterests,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('이미 등록된 정보가 있습니다.');
        } else if (responseData.errors) {
          Object.values(responseData.errors).forEach((error) => {
            toast.error(Array.isArray(error) ? error[0] : error);
          });
        } else {
          toast.error(responseData.detail || '등록 중 오류가 발생했습니다');
        }
        return;
      }
      
      toast.success('맞춤 설정이 저장되었습니다. 모든 회원가입이 완료되었습니다!');
      router.push('/client/dashboard');
      
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/client/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">맞춤 추천 설정</CardTitle>
            <CardDescription>
              관심 있는 상담 분야를 선택해주세요 (선택사항, 최대 3개)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupProgress currentStep={4} />
            
            <div className="mt-12 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">주요 관심사</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {interestOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={option.value}
                        checked={selectedInterests.includes(option.value)}
                        onCheckedChange={(checked) => handleInterestChange(option.value, checked)}
                      />
                      <Label htmlFor={option.value} className="font-normal cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedInterests.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>선택된 관심사 ({selectedInterests.length}/3):</strong>{' '}
                      {selectedInterests.map(interest => 
                        interestOptions.find(opt => opt.value === interest)?.label
                      ).join(', ')}
                    </p>
                  </div>
                )}
                
                {errors.main_interests && (
                  <p className="text-sm text-red-500">{errors.main_interests.message}</p>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <IoCheckmarkCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    <strong>회원가입이 거의 완료되었습니다!</strong>
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  관심사를 선택하시면 더 맞춤화된 전문가 추천을 받으실 수 있습니다.
                  지금 건너뛰셔도 나중에 설정에서 변경하실 수 있습니다.
                </p>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/signup/client/step3')}
                >
                  <IoArrowBack className="mr-2 h-4 w-4" />
                  이전 단계
                </Button>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleComplete}
                  >
                    건너뛰기
                  </Button>
                  <Button 
                    onClick={handleStep4Submit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        완료하기
                        <IoCheckmarkCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}