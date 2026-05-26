'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ColumnDetail from '@/components/columns/ColumnDetail';

export default function ExpertColumnDetailPage() {
  const { id } = useParams();
  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <ColumnDetail columnId={id} backHref="/expert/columns" />
      </DashboardLayout>
    </AuthGuard>
  );
}
