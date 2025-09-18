'use client';

import { ExpertSignupForm } from '@/components/auth/ExpertSignupForm';

export default function ExpertSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <ExpertSignupForm />
      </div>
    </div>
  );
}