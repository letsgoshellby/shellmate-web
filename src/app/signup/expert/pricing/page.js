'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, CheckCircle, Plus, X } from 'lucide-react';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { AuthAPI } from '@/lib/api/auth';

// 전문가 레벨별 가격 구간 (원 단위 - 전문가 수령액 기준)
const PRICE_RANGES = {
  standard: {
    SINGLE: { min: 44000, max: 94000, label: '체험형 - 1회 (50분)' },
    SINGLE_PLUS_3: { min: 36000, max: 78000, label: '집중형 - 4회 (2개월 이내)' },
    SINGLE_PLUS_7: { min: 32000, max: 70000, label: '집중형 - 8회 (4개월 이내)' },
    SINGLE_PLUS_11: { min: 30000, max: 65000, label: '집중형 - 12회 (6개월 이내)' },
  },
  advanced: {
    SINGLE: { min: 102000, max: 160000, label: '체험형 - 1회 (50분)' },
    SINGLE_PLUS_3: { min: 84000, max: 132000, label: '집중형 - 4회 (2개월 이내)' },
    SINGLE_PLUS_7: { min: 76000, max: 119000, label: '집중형 - 8회 (4개월 이내)' },
    SINGLE_PLUS_11: { min: 70000, max: 110000, label: '집중형 - 12회 (6개월 이내)' },
  },
};

const SESSION_COUNTS = {
  SINGLE: 1,
  SINGLE_PLUS_3: 4,
  SINGLE_PLUS_7: 8,
  SINGLE_PLUS_11: 12,
};

const SESSION_TYPE_OPTIONS = [
  { value: 'SINGLE', label: '체험형 - 1회' },
  { value: 'SINGLE_PLUS_3', label: '집중형 - 4회' },
  { value: 'SINGLE_PLUS_7', label: '집중형 - 8회' },
  { value: 'SINGLE_PLUS_11', label: '집중형 - 12회' },
];

export default function ExpertPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [expertLevel, setExpertLevel] = useState('standard');
  const [pricingItems, setPricingItems] = useState([
    { id: null, session_type: 'SINGLE', price: 44000, is_active: true }
  ]);

  // 전문가 레벨 가져오기
  useEffect(() => {
    loadExpertProfile();
  }, []);

  const loadExpertProfile = async () => {
    try {
      const userData = await AuthAPI.getCurrentUser();
      const level = userData.expert_profile?.expert_level || 'standard';
      setExpertLevel(level);

      // 기존 가격 설정이 있으면 불러오기
      try {
        const existingPricings = await ConsultationsAPI.getMyPricing();
        if (Array.isArray(existingPricings) && existingPricings.length > 0) {
          setPricingItems(existingPricings.map(p => ({
            id: p.id,
            session_type: p.session_type,
            price: tokensToWon(p.tokens_required),
            is_active: p.is_active,
          })));
        } else {
          // 기본값 설정
          const ranges = PRICE_RANGES[level];
          setPricingItems([
            { id: null, session_type: 'SINGLE', price: ranges.SINGLE.min, is_active: true }
          ]);
        }
      } catch (err) {
        // 가격 설정이 없는 경우
        const ranges = PRICE_RANGES[level];
        setPricingItems([
          { id: null, session_type: 'SINGLE', price: ranges.SINGLE.min, is_active: true }
        ]);
      }
    } catch (error) {
      console.error('전문가 정보 로딩 실패:', error);
      toast.error('전문가 정보를 불러오는데 실패했습니다');
    } finally {
      setLoadingProfile(false);
    }
  };

  // 원 → 토큰 변환 (전문가 수령액 * 1.1 / 1000)
  const wonToTokens = (won) => {
    return Math.round(won * 0.0011);
  };

  // 토큰 → 원 변환 (토큰 / 0.0011)
  const tokensToWon = (tokens) => {
    if (tokens === 0) return 0;
    return Math.round(tokens / 0.0011);
  };

  const handleAddPricing = () => {
    const ranges = PRICE_RANGES[expertLevel];
    setPricingItems([...pricingItems, {
      id: null,
      session_type: 'SINGLE',
      price: ranges.SINGLE.min,
      is_active: true
    }]);
  };

  const handleRemovePricing = (index) => {
    if (pricingItems.length === 1) {
      toast.error('최소 1개의 가격 설정은 필요합니다');
      return;
    }
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const handlePricingChange = (index, field, value) => {
    const newItems = [...pricingItems];
    newItems[index][field] = value;
    setPricingItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    const validPricings = pricingItems.filter(p => p.price > 0);
    if (validPricings.length === 0) {
      toast.error('최소 1개의 가격 설정을 입력해주세요');
      return;
    }

    // 중복 세션 타입 체크
    const sessionTypes = validPricings.map(p => p.session_type);
    const uniqueSessionTypes = new Set(sessionTypes);
    if (sessionTypes.length !== uniqueSessionTypes.size) {
      toast.error('동일한 세션 타입이 중복되었습니다');
      return;
    }

    setLoading(true);
    try {
      // 기존 가격 설정 가져오기
      const existingPricings = await ConsultationsAPI.getMyPricing();
      const existingIds = existingPricings.map(p => p.id);
      const currentIds = pricingItems.filter(p => p.id !== null).map(p => p.id);

      // 삭제된 항목 처리
      for (const id of existingIds) {
        if (!currentIds.includes(id)) {
          await ConsultationsAPI.deleteMyPricing(id);
        }
      }

    // 생성 및 수정 처리
    for (const item of validPricings) {
      // [수정 포인트] 1회당 가격 * 세션 횟수 = 총액
      const sessionCount = SESSION_COUNTS[item.session_type] || 1;
      const totalPrice = item.price * sessionCount;
      const tokens = wonToTokens(totalPrice); // 총액을 토큰으로 변환

        if (item.id) {
          // 기존 항목 수정
          await ConsultationsAPI.updateMyPricing(item.id, {
            session_type: item.session_type,
            tokens_required: tokens,
            is_active: item.is_active,
          });
        } else {
          // 새 항목 생성
          await ConsultationsAPI.createMyPricing({
            session_type: item.session_type,
            tokens_required: tokens,
            is_active: item.is_active,
          });
        }
      }

      toast.success('가격 설정이 완료되었습니다!');

      // 온보딩 완료 - 대시보드로 이동
      window.location.href = '/expert/dashboard';
    } catch (error) {
      console.error('가격 설정 실패:', error);
      toast.error(error.message || '가격 설정에 실패했습니다');
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <AuthGuard requiredRole="expert">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthGuard>
    );
  }

  const currentRanges = PRICE_RANGES[expertLevel];
  const levelDisplay = expertLevel === 'standard' ? 'Standard' : 'Advanced';

  return (
    <AuthGuard requiredRole="expert">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">상담 가격을 설정해주세요</h1>
            <p className="text-gray-600 text-sm">
              일회성 상담: 1회 상담 / Care+ 패키지: 4, 8, 12회 패키지
            </p>
          </div>

          {/* 가격 설정 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 가격 설정 카드들 */}
            {pricingItems.map((item, index) => {
              const range = currentRanges[item.session_type];
              return (
                <Card key={index} className="border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-base">상담 타입</h4>
                      {pricingItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePricing(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    {/* 세션 타입 선택 */}
                    <div className="mb-4">
                      <select
                        value={item.session_type}
                        onChange={(e) => {
                          handlePricingChange(index, 'session_type', e.target.value);
                          // 세션 타입 변경시 가격도 해당 타입의 최소값으로 초기화
                          const newRange = currentRanges[e.target.value];
                          handlePricingChange(index, 'price', newRange.min);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {SESSION_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 가격 슬라이더 */}
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">가격 (원)</Label>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {item.price.toLocaleString()}원
                          </div>
                        </div>
                      </div>

                      {/* 슬라이더 */}
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={range.min}
                          max={range.max}
                          step={1000}
                          value={item.price}
                          onChange={(e) => handlePricingChange(index, 'price', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{range.min.toLocaleString()}원</span>
                          <span>{range.max.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>

                    {/* 활성화 여부 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`active_${index}`}
                        checked={item.is_active}
                        onChange={(e) => handlePricingChange(index, 'is_active', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor={`active_${index}`} className="ml-2 text-sm text-gray-700">
                        활성화
                      </label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* 가격 추가 버튼 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPricing}
              className="w-full border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              가격 설정 추가
            </Button>

            {/* 제출 버튼 */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
