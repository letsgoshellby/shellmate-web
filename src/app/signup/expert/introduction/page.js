'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2, User, Plus, X, BookOpen, Briefcase, FileText } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export default function ExpertIntroductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [introduction, setIntroduction] = useState('');
  const [education, setEducation] = useState(['']);
  const [career, setCareer] = useState(['']);

  const handleAddEducation = () => {
    setEducation([...education, '']);
  };

  const handleRemoveEducation = (index) => {
    if (education.length === 1) {
      toast.error('최소 1개의 학력 정보는 필요합니다');
      return;
    }
    setEducation(education.filter((_, i) => i !== index));
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
    if (career.length === 1) {
      toast.error('최소 1개의 경력 정보는 필요합니다');
      return;
    }
    setCareer(career.filter((_, i) => i !== index));
  };

  const handleCareerChange = (index, value) => {
    const newCareer = [...career];
    newCareer[index] = value;
    setCareer(newCareer);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!introduction.trim()) {
      toast.error('자기소개를 입력해주세요');
      return;
    }

    const validEducation = education.filter(e => e.trim());
    if (validEducation.length === 0) {
      toast.error('최소 1개의 학력 정보를 입력해주세요');
      return;
    }

    const validCareer = career.filter(c => c.trim());
    if (validCareer.length === 0) {
      toast.error('최소 1개의 경력 정보를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const accessToken = TokenStorage.getAccessToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          introduction,
          education: validEducation,
          career: validCareer,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '정보 저장에 실패했습니다' }));
        throw new Error(error.detail || JSON.stringify(error) || '정보 저장에 실패했습니다');
      }

      await response.json();
      toast.success('전문가 정보가 저장되었습니다!');

      // 다음 단계로 이동 (가격 설정)
      window.location.href = '/signup/expert/pricing';
    } catch (error) {
      console.error('정보 저장 실패:', error);
      toast.error(error.message || '정보 저장에 실패했습니다');
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="expert">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">전문가 정보 작성</h1>
            <p className="text-gray-600">
              내담자에게 보여질 학력, 경력, 자기소개를 작성해주세요
            </p>
          </div>

          {/* 정보 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                전문가 소개
              </CardTitle>
              <CardDescription>
                정확하고 전문적인 정보를 작성하면 내담자의 신뢰를 얻을 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 학력 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      학력 <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEducation}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {education.map((edu, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="예: 00대학교 심리학과 학사"
                          value={edu}
                          onChange={(e) => handleEducationChange(index, e.target.value)}
                          required
                        />
                        {education.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEducation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    최신 학력부터 작성해주세요 (예: 대학교 졸업, 대학원 수료 등)
                  </p>
                </div>

                {/* 경력 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      경력 <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCareer}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {career.map((car, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="예: 00아동센터 상담사 5년"
                          value={car}
                          onChange={(e) => handleCareerChange(index, e.target.value)}
                          required
                        />
                        {career.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCareer(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    주요 경력을 작성해주세요 (기관명, 직책, 기간 등)
                  </p>
                </div>

                {/* 자기소개 */}
                <div className="space-y-2">
                  <Label htmlFor="introduction">
                    자기소개 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="introduction"
                    placeholder="내담자에게 보여질 자기소개를 작성해주세요.&#10;&#10;예시:&#10;안녕하세요, 아동 심리 전문가 이전문입니다.&#10;15년간 느린학습자 아동들과 함께하며 맞춤형 상담을 제공해왔습니다.&#10;아이들의 잠재력을 발견하고 키워나가는 것이 저의 가장 큰 보람입니다."
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    rows={8}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    전문성과 따뜻함이 느껴지는 소개글을 작성해주세요 (최소 50자 이상 권장)
                  </p>
                </div>

                {/* 안내 사항 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">작성 가이드</h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>학력과 경력은 구체적으로 작성할수록 좋습니다</li>
                    <li>자기소개는 내담자가 신뢰할 수 있도록 전문성을 강조해주세요</li>
                    <li>편안하고 친근한 어조로 작성하면 더욱 좋습니다</li>
                    <li>작성한 내용은 마이페이지에서 언제든 수정 가능합니다</li>
                  </ul>
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      '다음 단계'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
