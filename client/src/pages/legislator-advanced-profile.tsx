import React, { useEffect } from 'react';
import { useRoute } from 'wouter';
import { Helmet } from 'react-helmet-async';
import LegislatorAdvancedProfileView from '@/components/legislators/LegislatorAdvancedProfileView';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

const LegislatorAdvancedProfilePage: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/legislator-advanced-profile/:id');
  const legislatorId = params ? parseInt(params.id) : 0;

  // Scroll to top on initial render
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Legislator Profile | Act Up</title>
      </Helmet>
      
      <div className="container mx-auto py-4">
        <Link href="/legislators">
          <Button variant="ghost" className="mb-4 pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Legislators
          </Button>
        </Link>
        
        {legislatorId ? (
          <LegislatorAdvancedProfileView legislatorId={legislatorId} />
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-4">Legislator Not Found</h1>
            <p className="text-gray-500 mb-6">The requested legislator profile could not be found.</p>
            <Link href="/legislators">
              <Button>
                View All Legislators
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default LegislatorAdvancedProfilePage;