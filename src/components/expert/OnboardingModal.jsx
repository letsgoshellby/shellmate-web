'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, FileText, DollarSign, ArrowRight } from 'lucide-react';

export function OnboardingModal({ onClose }) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleStart = () => {
    onClose();
    router.push('/signup/expert/introduction');
  };

  const handleLater = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full ${
          isClosing ? 'animate-out fade-out zoom-out duration-200' : 'animate-in zoom-in duration-200'
        }`}
      >
        {/* 헤더 */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            상담을 시작하기 위한<br />마지막 단계입니다!
          </h2>
          <p className="text-center text-gray-600 text-sm">
            내담자에게 보여질 정보를 작성해주세요
          </p>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-4 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">자기소개 작성</h3>
              <p className="text-xs text-blue-800">
                학력, 경력, 전문성을 내담자에게 소개해주세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 text-sm mb-1">상담 가격 설정</h3>
              <p className="text-xs text-green-800">
                단회 상담 및 패키지 가격을 설정해주세요
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-800 text-center">
              💡 작성하신 정보는 언제든 마이페이지에서 수정 가능합니다
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-6 pt-2 space-y-2">
          <Button
            onClick={handleStart}
            className="w-full"
            size="lg"
          >
            지금 작성하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={handleLater}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            나중에 할게요
          </Button>
        </div>
      </div>
    </div>
  );
}
