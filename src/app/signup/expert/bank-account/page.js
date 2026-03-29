'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Wallet, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export default function BankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankbookImage, setBankbookImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 타입 검증
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('JPG, JPEG, PNG 형식의 이미지만 업로드 가능합니다');
        return;
      }

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('이미지 크기는 10MB 이하여야 합니다');
        return;
      }

      setBankbookImage(file);

      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankName.trim()) {
      toast.error('은행명을 입력해주세요');
      return;
    }

    if (!accountNumber.trim()) {
      toast.error('계좌번호를 입력해주세요');
      return;
    }

    if (!bankbookImage) {
      toast.error('통장 사본 이미지를 업로드해주세요');
      return;
    }

    setLoading(true);
    try {
      const accessToken = TokenStorage.getAccessToken();

      // FormData 사용하여 파일 전송
      const formData = new FormData();
      formData.append('bank_name', bankName);
      formData.append('account_number', accountNumber);
      formData.append('bankbook_image', bankbookImage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/expert/signup/account/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Content-Type을 설정하지 않으면 브라우저가 자동으로 multipart/form-data로 설정
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '계좌 정보 등록에 실패했습니다' }));
        throw new Error(error.detail || JSON.stringify(error) || '계좌 정보 등록에 실패했습니다');
      }

      await response.json();
      toast.success('정산 계좌 정보가 등록되었습니다!');
      window.location.href = '/expert/dashboard';
    } catch (error) {
      console.error('계좌 정보 등록 실패:', error);
      toast.error(error.message || '계좌 정보 등록에 실패했습니다');
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="expert">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">정산 계좌 정보 등록</h1>
            <p className="text-gray-600">
              전문가 활동을 통해 발생하는 수익을 정산받을 계좌 정보를 입력해주세요
            </p>
          </div>

          {/* 계좌 정보 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-5 w-5" />
                정산 계좌 정보
              </CardTitle>
              <CardDescription>
                정확한 계좌 정보를 입력해주세요. 입력하신 계좌로 수익금이 정산됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 은행명 */}
                <div className="space-y-2">
                  <Label htmlFor="bank_name">
                    은행명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bank_name"
                    type="text"
                    placeholder="예: 국민은행, 신한은행"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>

                {/* 계좌번호 */}
                <div className="space-y-2">
                  <Label htmlFor="account_number">
                    계좌번호 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="account_number"
                    type="text"
                    placeholder="'-' 없이 숫자만 입력"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    하이픈(-) 없이 숫자만 입력해주세요
                  </p>
                </div>

                {/* 통장 사본 이미지 */}
                <div className="space-y-2">
                  <Label htmlFor="bankbook_image">
                    통장 사본 이미지 <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="bankbook_image"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {previewUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={previewUrl}
                              alt="통장 사본 미리보기"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                            </p>
                            <p className="text-xs text-gray-500">JPG, JPEG, PNG (최대 10MB)</p>
                          </div>
                        )}
                        <input
                          id="bankbook_image"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageChange}
                          className="hidden"
                          required
                        />
                      </label>
                    </div>
                    {bankbookImage && (
                      <div className="flex items-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">{bankbookImage.name}</span>
                        <span className="ml-2 text-gray-500">
                          ({(bankbookImage.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    예금주명과 계좌번호가 명확하게 보이는 통장 사본을 업로드해주세요
                  </p>
                </div>

                {/* 안내 사항 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">안내사항</h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>입력하신 계좌로 매월 정산금이 입금됩니다</li>
                    <li>계좌 정보는 마이페이지에서 언제든 수정 가능합니다</li>
                    <li>타인 명의 계좌는 등록할 수 없습니다</li>
                    <li>통장 사본은 본인 확인 용도로만 사용됩니다</li>
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
                        처리 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        등록 완료
                      </>
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
