import { useParams, useLocation } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { LegislatorDetailView } from "@/components/legislators/LegislatorDetailView";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet";

export default function LegislatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  
  // Convert id to number
  const legislatorId = parseInt(id || "0");
  
  if (!legislatorId) {
    setLocation("/legislators");
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title>Legislator Profile | Act Up</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => setLocation("/legislators")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to All Legislators
          </Button>
          
          <PageHeader
            title="Legislator Profile"
            description="Detailed information about this Texas legislator"
          />
        </div>
        
        <LegislatorDetailView legislatorId={legislatorId} />
      </div>
    </>
  );
}