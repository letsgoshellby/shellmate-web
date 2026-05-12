'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WalletAPI } from '@/lib/api/wallet';
import {
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function WalletPage() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ account_number: '', refund_reason: '' });
  const [refundLoading, setRefundLoading] = useState(false);

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

  const handleRefundSubmit = async () => {
    if (!refundForm.account_number.trim() || !refundForm.refund_reason.trim()) {
      toast.error('계좌번호와 환불 사유를 모두 입력해주세요');
      return;
    }
    setRefundLoading(true);
    try {
      await WalletAPI.requestEggRefund(refundForm.account_number, refundForm.refund_reason);
      toast.success('환불 요청이 접수되었습니다');
      setRefundModalOpen(false);
      setRefundForm({ account_number: '', refund_reason: '' });
    } catch (error) {
      const message = error?.response?.data?.error || '환불 요청에 실패했습니다';
      toast.error(message);
    } finally {
      setRefundLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.is_income) {
      return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-600" />;
  };

  const getTransactionColor = (transaction) => {
    if (transaction.is_income) {
      return 'text-green-600';
    }
    return 'text-red-600';
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

  const currentBalance = walletInfo ? parseFloat(walletInfo.balance) : 0;
  const totalIncome = walletInfo ? parseFloat(walletInfo.total_income || 0) : 0;
  const totalExpense = walletInfo ? parseFloat(walletInfo.total_expense || 0) : 0;
  const recentTransactions = walletInfo?.recent_transactions || [];

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 지갑</h1>
              <p className="text-gray-600">에그 잔액 및 거래 내역을 확인하세요</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRefundModalOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                환불 신청
              </Button>
              <Link href="/client/wallet/charge">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  에그 충전
                </Button>
              </Link>
            </div>
          </div>

          {/* 환불 신청 모달 */}
          <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>에그 환불 신청</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="account_number">환불 계좌번호</Label>
                  <Input
                    id="account_number"
                    placeholder="계좌번호를 입력하세요 (예: 110-123-456789)"
                    value={refundForm.account_number}
                    onChange={(e) => setRefundForm((prev) => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund_reason">환불 사유</Label>
                  <Textarea
                    id="refund_reason"
                    placeholder="환불 사유를 입력하세요"
                    rows={4}
                    value={refundForm.refund_reason}
                    onChange={(e) => setRefundForm((prev) => ({ ...prev, refund_reason: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRefundModalOpen(false)} disabled={refundLoading}>
                  취소
                </Button>
                <Button onClick={handleRefundSubmit} disabled={refundLoading} className="bg-green-600 hover:bg-green-700">
                  {refundLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  환불 신청
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 잔액 카드 */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">현재 보유 에그</p>
                  <p className="text-4xl font-bold mt-2">
                    {currentBalance.toLocaleString()}
                  </p>
                  <p className="text-green-100 text-sm mt-1">에그</p>
                </div>
                <Coins className="h-16 w-16 opacity-80" />
              </div>

              {walletInfo?.is_frozen && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                  <p className="text-sm">
                    ⚠️ 지갑이 동결되었습니다: {walletInfo.freeze_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 충전</p>
                    <p className="text-xl font-bold text-green-600">
                      +{totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <ArrowDownLeft className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 사용</p>
                    <p className="text-xl font-bold text-red-600">
                      -{totalExpense.toLocaleString()}
                    </p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 거래 수</p>
                    <p className="text-xl font-bold">
                      {walletInfo?.transaction_count || 0}건
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 최근 거래 내역 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>최근 거래 내역</CardTitle>
                <Link href="/client/wallet/transactions">
                  <Button variant="link" className="text-green-600">
                    전체 보기
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>거래 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {getTransactionIcon(transaction)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.transaction_type_display}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction)}`}>
                          {transaction.is_income ? '+' : ''}{parseFloat(transaction.amount).toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            transaction.status === 'completed'
                              ? 'text-green-600 border-green-600'
                              : 'text-yellow-600 border-yellow-600'
                          }
                        >
                          {transaction.status === 'completed' ? '완료' : '처리중'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
