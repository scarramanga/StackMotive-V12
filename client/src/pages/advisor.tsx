import React, { Suspense } from 'react';
import { useSessionStore } from '../store/session';

const AdvisorPanel = React.lazy(() => import('../components/panels/AdvisorPanel'));

export default function AdvisorPage() {
  const user = useSessionStore(s => s.user);
  if (!user) {
    return <div className="p-8 text-center">Please log in to access the AI Portfolio Advisor.</div>;
  }
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Suspense fallback={<div className="p-8 text-center">Loading Advisor Panel...</div>}>
        <AdvisorPanel />
      </Suspense>
    </div>
  );
} 