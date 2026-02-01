'use client';

import { X, UserCircle, GraduationCap } from 'lucide-react';

export function RoleSelectionModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">역할 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6 text-center">
            카카오 로그인을 진행할 역할을 선택해주세요
          </p>

          <div className="space-y-4">
            {/* Client 선택 */}
            <button
              onClick={() => onSelect('client')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <UserCircle className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 mb-1">학부모</h3>
                  <p className="text-sm text-gray-600">
                    상담을 받고 싶은 학부모입니다
                  </p>
                </div>
              </div>
            </button>

            {/* Expert 선택 */}
            <button
              onClick={() => onSelect('expert')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <GraduationCap className="h-7 w-7 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 mb-1">전문가</h3>
                  <p className="text-sm text-gray-600">
                    상담을 제공하는 전문가입니다
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            역할 선택 후 카카오 로그인 페이지로 이동합니다
          </p>
        </div>
      </div>
    </div>
  );
}
