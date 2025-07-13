// Block 18 Implementation: Narrative Digest page with DigestFeed
import React from 'react';
import { DigestFeed } from '@/components/ui/DigestFeed';

const DigestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <h1 className="text-3xl font-bold text-center mb-6">Narrative Digest</h1>
      <DigestFeed />
    </div>
  );
};

export default DigestPage; 