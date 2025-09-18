'use client';

import { ClientSignupForm } from '@/components/auth/ClientSignupForm';

export default function ClientSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <ClientSignupForm />
      </div>
    </div>
  );
}