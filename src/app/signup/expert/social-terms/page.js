'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { AuthAPI } from '@/lib/api/auth';

export default function ExpertSocialTermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kakaoAccessToken, setKakaoAccessToken] = useState('');

  const [serviceTerms, setServiceTerms] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [personalInfoAndThirdParty, setPersonalInfoAndThirdParty] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    // localStorage에서 카카오 Access Token 확인
    const token = localStorage.getItem('kakao_access_token');
    const provider = localStorage.getItem('kakao_provider');

    if (!token || provider !== 'kakao') {
      toast.error('잘못된 접근입니다');
      router.push('/login');
      return;
    }

    setKakaoAccessToken(token);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 약관 체크
    if (!serviceTerms || !privacyPolicy || !personalInfoAndThirdParty) {
      toast.error('필수 약관에 모두 동의해주세요');
      return;
    }

    setLoading(true);
    try {
      // 약관 데이터 준비
      const terms = {
        service_terms: serviceTerms,
        privacy_policy: privacyPolicy,
        personal_info_and_third_party: personalInfoAndThirdParty,
        marketing_consent: marketingConsent,
      };

      // 소셜 로그인 API 호출 (약관 포함)
      const response = await AuthAPI.expertSocialLogin('kakao', kakaoAccessToken, terms);

      // localStorage 정리
      localStorage.removeItem('kakao_access_token');
      localStorage.removeItem('kakao_provider');

      if (response.isNewUser) {
        // 신규 회원 - Step 1으로 이동
        toast.success('약관 동의가 완료되었습니다. 추가 정보를 입력해주세요.');
        router.push('/signup/expert/step1');
      } else {
        // 기존 회원 (이 케이스는 발생하지 않아야 함)
        toast.success('로그인되었습니다');
        router.push('/expert/dashboard');
      }
    } catch (error) {
      console.error('약관 동의 처리 실패:', error);
      toast.error('약관 동의 처리 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">약관 동의</CardTitle>
          <CardDescription>
            서비스 이용을 위해 아래 약관에 동의해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 border-t pt-4">
              {/* 필수 약관 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service_terms"
                  checked={serviceTerms}
                  onCheckedChange={(checked) => setServiceTerms(checked)}
                />
                <Label htmlFor="service_terms" className="text-sm font-normal cursor-pointer">
                  (필수) 전문가 이용약관에 동의합니다
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy_policy"
                  checked={privacyPolicy}
                  onCheckedChange={(checked) => setPrivacyPolicy(checked)}
                />
                <Label htmlFor="privacy_policy" className="text-sm font-normal cursor-pointer">
                  (필수) 개인정보 처리방침에 동의합니다
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="personal_info_and_third_party"
                  checked={personalInfoAndThirdParty}
                  onCheckedChange={(checked) => setPersonalInfoAndThirdParty(checked)}
                />
                <Label htmlFor="personal_info_and_third_party" className="text-sm font-normal cursor-pointer">
                  (필수) 개인정보 수집·이용 및 제3자 제공에 동의합니다
                </Label>
              </div>

              {/* 선택 약관 */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="marketing_consent"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked)}
                />
                <Label htmlFor="marketing_consent" className="text-sm font-normal cursor-pointer">
                  (선택) 마케팅 정보 수신에 동의합니다
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '동의하고 계속하기'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
