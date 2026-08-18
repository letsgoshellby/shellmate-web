'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function BackButton({
  label = '돌아가기',
  to,
  variant = 'outline',
  size = 'sm',
  className = '',
}) {
  const router = useRouter();

  const handleClick = () => {
    if (to) {
      router.push(to);
    } else {
      router.back();
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      {label}
    </Button>
  );
}
