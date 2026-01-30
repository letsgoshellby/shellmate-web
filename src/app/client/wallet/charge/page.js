'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletAPI } from '@/lib/api/wallet';
import {
  ArrowLeft,
  Coins,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ChargeEggPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [walletInfo, setWalletInfo] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 지갑 정보와 패키지 목록 동시 로딩
      const [walletData, packagesData] = await Promise.all([
        WalletAPI.getMyWallet(),
        WalletAPI.getTokenPackages(),
      ]);

      setWalletInfo(walletData);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('충전할 패키지를 선택해주세요');
      return;
    }

    setProcessing(true);

    try {
      // 1. 결제 준비 (주문 정보 생성)
      const prepareResponse = await WalletAPI.prepareTokenPurchase(selectedPackage.product_id);

      // 2. PortOne V2 결제 호출
      if (typeof window !== 'undefined' && window.PortOne) {
        const response = await window.PortOne.requestPayment({
          storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
          channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_PAYMENT,
          paymentId: prepareResponse.order_id,
          orderName: selectedPackage.name,
          totalAmount: selectedPackage.price_krw,
          currency: 'KRW',
          payMethod: 'CARD',
          customer: {
            email: user?.email,
            fullName: user?.name || '',
            phoneNumber: user?.phone_number || user?.phone || '',
          },
        });

        if (response.code) {
          // 결제 실패
          toast.error(`결제 실패: ${response.message}`);
          setProcessing(false);
          return;
        }

        try {
          // 3. 결제 확인 및 토큰 지급
          await WalletAPI.confirmTokenPurchase(
            prepareResponse.order_id,
            response.paymentId
          );

          toast.success('에그 충전이 완료되었습니다!');
          router.push('/client/wallet');
        } catch (confirmError) {
          console.error('결제 확인 실패:', confirmError);
          toast.error('결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.');
        }
      } else {
        // PortOne SDK가 로드되지 않은 경우
        toast.error('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('결제 준비 실패:', error);
      toast.error('결제 준비 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const currentBalance = walletInfo ? parseFloat(walletInfo.balance) : 0;

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/wallet">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">에그 충전</h1>
              <p className="text-gray-600">상담에 사용할 에그를 충전하세요</p>
            </div>
          </div>

          {/* 현재 잔액 */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">현재 보유 에그</p>
                  <p className="text-3xl font-bold mt-1">
                    {currentBalance.toLocaleString()} 에그
                  </p>
                </div>
                <Coins className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          {/* 패키지 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>충전 패키지 선택</CardTitle>
              <p className="text-sm text-gray-500">1 에그 = 1,000원</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>사용 가능한 패키지가 없습니다</p>
                </div>
              ) : (
                packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 선택 체크 */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPackage?.id === pkg.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPackage?.id === pkg.id && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>

                        <div>
                          <span className="font-semibold text-lg">{pkg.name}</span>
                          <p className="text-sm text-gray-500">
                            {pkg.tokens} 에그 지급
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          ₩{pkg.price_krw.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 선택 정보 및 결제 버튼 */}
          {selectedPackage && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">선택 패키지</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">지급 에그</span>
                    <span className="font-bold text-green-600">
                      {selectedPackage.tokens}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">결제 금액</span>
                    <span className="font-bold text-xl">
                      ₩{selectedPackage.price_krw.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={processing}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      결제 진행 중...
                    </>
                  ) : (
                    `₩${selectedPackage.price_krw.toLocaleString()} 결제하기`
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  결제 완료 후 즉시 에그가 충전됩니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
