"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employer');
  }, [router]);

  return null;
}
