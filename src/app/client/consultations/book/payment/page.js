'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletAPI } from '@/lib/api/wallet';
import { ConsultationsAPI } from '@/lib/api/consultations';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Coins,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 결제 정보 가져오기
  const expertId = searchParams.get('expert_id');
  const expertName = searchParams.get('expert_name');
  const sessionType = searchParams.get('session_type');
  const sessionTypeDisplay = searchParams.get('session_type_display');
  const tokensRequired = parseInt(searchParams.get('tokens_required') || '0');
  const scheduledDate = searchParams.get('scheduled_date');
  const scheduledTime = searchParams.get('scheduled_time');
  const clientNotes = searchParams.get('client_notes');

  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      const data = await WalletAPI.getMyWallet();
      setWalletInfo(data);
    } catch (error) {
      console.error('지갑 정보 로딩 실패:', error);
      toast.error('지갑 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = walletInfo ? parseFloat(walletInfo.balance) : 0;
  const hasEnoughBalance = currentBalance >= tokensRequired;

  const handlePayment = async () => {
    if (!hasEnoughBalance) {
      toast.error('에그가 부족합니다. 충전 후 다시 시도해주세요.');
      return;
    }

    setProcessing(true);

    try {
      // 상담 신청 생성 (에그 자동 차감)
      const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

      const requestData = {
        expert_id: parseInt(expertId),
        session_type: sessionType,
        client_notes: clientNotes || '',
        first_session_schedule: {
          session_number: 1,
          scheduled_at: scheduledAt,
        },
      };

      const response = await ConsultationsAPI.createCounselingRequest(requestData);

      toast.success('상담 예약이 완료되었습니다!');

      // 성공 페이지로 이동하거나 상담 목록으로 이동
      router.push(`/client/consultations?success=true&id=${response.id}`);
    } catch (error) {
      console.error('결제 실패:', error);

      // 에러 메시지 처리
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || error.response?.data?.error
        || '결제 중 오류가 발생했습니다';

      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

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
            <Link href="/client/consultations/book">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">결제하기</h1>
            </div>
          </div>

          {/* 상품 정보 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{sessionTypeDisplay} 패키지</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">전문가</span>
                  <span className="font-medium">{expertName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예약 일시</span>
                  <span className="font-medium">{scheduledDate} {scheduledTime}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">구매 전 유의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 1회기 당 50분이며, 결제일로부터 8주간 사용할 수 있습니다.</li>
                  <li>• 이용기간 내에 이용권 사용을 완료해주세요.</li>
                  <li>• 상담 24시간 전까지 취소 가능합니다.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 에그 잔액 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">에그</h3>
                <Link href="/client/wallet/charge">
                  <Button variant="link" className="text-green-600 p-0 h-auto">
                    에그 충전하기
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                얼마나 사용할까요? (10 에그 단위로 사용 가능)
              </p>

              <div className={`p-4 rounded-lg flex items-center justify-between ${
                hasEnoughBalance ? 'bg-green-600' : 'bg-red-500'
              }`}>
                <div className="flex items-center text-white">
                  <Coins className="h-5 w-5 mr-2" />
                  <span className="font-semibold">
                    사용 가능 : {currentBalance.toLocaleString()} 에그
                  </span>
                </div>
                {hasEnoughBalance ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-white" />
                )}
              </div>

              {!hasEnoughBalance && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    에그가 부족합니다. {(tokensRequired - currentBalance).toLocaleString()} 에그가 더 필요합니다.
                  </p>
                  <Link href="/client/wallet/charge">
                    <Button className="mt-2 w-full bg-red-600 hover:bg-red-700">
                      에그 충전하러 가기
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 결제 금액 */}
          <Card>
            <CardContent className="p-0">
              {/* 토글 버튼 */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-center border-b"
              >
                {isExpanded ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronUp className="h-6 w-6" />
                )}
              </button>

              <div className="p-6">
                {/* 결제 예정 금액 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">결제 예정 금액</span>
                  <span className="text-2xl font-bold">{tokensRequired.toLocaleString()} 에그</span>
                </div>

                {/* 펼쳐진 상태일 때 상세 내역 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">상담 패키지</span>
                      <span className="text-gray-500">{sessionTypeDisplay}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">정가</span>
                      <span className="text-gray-500">{tokensRequired.toLocaleString()} 에그</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">할인</span>
                      <span className="text-gray-500">0 에그</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-600 pt-2">
                      <span>최종 결제 금액</span>
                      <span>{tokensRequired.toLocaleString()} 에그</span>
                    </div>
                  </div>
                )}

                {/* 결제 버튼 */}
                <Button
                  onClick={handlePayment}
                  disabled={!hasEnoughBalance || processing}
                  className="w-full mt-6 h-12 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      결제 중...
                    </>
                  ) : (
                    '에그 사용하기'
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  결제 내용을 확인하였으며, 서비스 처리방침에 동의합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
