
"use client";

import { useAuth } from '@/hooks/use-auth';
import BabyTrackerDashboard from '@/components/baby-tracker-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TransitionScreen from '@/components/transition-screen';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <TransitionScreen />;
  }
  
  return <BabyTrackerDashboard />;
}
