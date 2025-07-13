// Block 10 Implementation: My Watchlist page scaffold
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WatchlistEngine from '@/components/ui/WatchlistEngine';

const WatchlistPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
        <WatchlistEngine />
      </div>
    </PageLayout>
  );
};

export default WatchlistPage; 