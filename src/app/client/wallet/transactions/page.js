'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletAPI } from '@/lib/api/wallet';
import {
  ArrowLeft,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const FILTER_TYPES = [
  { label: '전체', value: '' },
  { label: '충전', value: 'charge' },
  { label: '사용', value: 'deduct' },
  { label: '환불', value: 'refund' },
];

const FILTER_STATUS = [
  { label: '전체', value: '' },
  { label: '완료', value: 'completed' },
  { label: '처리중', value: 'pending' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const PAGE_SIZE = 15;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...(filterType && { transaction_type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };
      const data = await WalletAPI.getTransactions(params);

      // 페이지네이션 구조가 { results, count } 또는 배열일 수 있음
      if (Array.isArray(data)) {
        setTransactions(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else {
        setTransactions(data.results || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
      }
    } catch (error) {
      console.error('거래내역 로딩 실패:', error);
      toast.error('거래내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = () => {
    setPage(1);
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

  const getAmountColor = (transaction) => {
    return transaction.is_income ? 'text-green-600' : 'text-red-600';
  };

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <Link href="/client/wallet">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전체 거래 내역</h1>
              <p className="text-gray-600">에그 충전 및 사용 내역을 확인하세요</p>
            </div>
          </div>

          {/* 필터 */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* 거래 유형
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">거래 유형</p>
                <div className="flex gap-2 flex-wrap">
                  {FILTER_TYPES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => { setFilterType(f.value); handleFilterChange(); }}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        filterType === f.value
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상태
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">상태</p>
                <div className="flex gap-2 flex-wrap">
                  {FILTER_STATUS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => { setFilterStatus(f.value); handleFilterChange(); }}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        filterStatus === f.value
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* 날짜 범위 */}
              <div className="flex gap-3 items-center flex-wrap">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">시작일</p>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <span className="text-gray-400 mt-5">~</span>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">종료일</p>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); handleFilterChange(); }}
                    className="text-sm text-gray-400 hover:text-gray-600 mt-5"
                  >
                    초기화
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 내역 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>
                거래 내역{' '}
                {!loading && (
                  <span className="text-sm font-normal text-gray-500">
                    총 {totalCount.toLocaleString()}건
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>거래 내역이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.transaction_type_display}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-gray-500">{transaction.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${getAmountColor(transaction)}`}>
                          {transaction.is_income ? '+' : ''}{parseFloat(transaction.amount).toLocaleString()}
                          <span className="text-sm font-normal ml-1">에그</span>
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            transaction.status === 'completed'
                              ? 'text-green-600 border-green-600 text-xs'
                              : 'text-yellow-600 border-yellow-600 text-xs'
                          }
                        >
                          {transaction.status === 'completed' ? '완료' : '처리중'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 페이지네이션 */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={page === pageNum ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
