import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionList } from '@/components/legiscan/SessionList';
import { BillSearch } from '@/components/legiscan/BillSearch';
import { BillDetail } from '@/components/legiscan/BillDetail';

/**
 * LegislativePage component serves as the main interface for legislative data
 */
export function LegislativePage() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  // This will be connected to the BillSearch component in future updates
  // when we implement bill selection functionality
  const handleBackToBills = () => {
    setSelectedBillId(null);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Legislative Center</h1>
      
      {selectedBillId ? (
        <BillDetail billId={selectedBillId} onBack={handleBackToBills} />
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="search">Bill Search</TabsTrigger>
            <TabsTrigger value="sessions">Legislative Sessions</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="mt-4">
            <BillSearch />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <SessionList />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default LegislativePage;