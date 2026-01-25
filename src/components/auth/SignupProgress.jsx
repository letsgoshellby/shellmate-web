'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SignupProgress({ currentStep = 1, totalSteps = 3 }) {
  const steps = [
    { number: 1, title: '아이 정보', required: true },
    { number: 2, title: '추가 정보', required: false },
    { number: 3, title: '관심사', required: false },
  ];

  return (
    <div className="w-full mb-16">
      <div className="flex justify-between items-start">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center w-full">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  currentStep > step.number
                    ? 'bg-primary border-primary text-white'
                    : currentStep === step.number
                    ? 'border-primary text-primary'
                    : 'border-gray-300 text-gray-300'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'text-xs font-medium leading-tight',
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    'text-xs leading-tight',
                    step.required ? 'text-red-500' : 'text-gray-400'
                  )}
                >
                  {step.required ? '(필수)' : '(선택)'}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 -mt-5 mx-1 transition-colors',
                  currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}