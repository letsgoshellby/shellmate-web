'use client';

import { ExpertSignupForm2 } from '@/components/auth/ExpertSignupForm2';

export default function ExpertSignupStep1Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <ExpertSignupForm2 />
      </div>
    </div>
  );
}
