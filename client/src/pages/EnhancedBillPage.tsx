import React from 'react';
import { useLocation } from 'wouter';
import EnhancedBillView from '../components/integrator/EnhancedBillView';

const EnhancedBillPage: React.FC = () => {
  const [location] = useLocation();
  
  // Parse bill ID from URL if present
  let initialBillId: number | undefined;
  const match = location.match(/\/enhanced-bill\/(\d+)/);
  if (match && match[1]) {
    initialBillId = parseInt(match[1], 10);
  }
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Enhanced Bill Explorer</h1>
      <EnhancedBillView initialBillId={initialBillId} />
    </div>
  );
};

export default EnhancedBillPage;