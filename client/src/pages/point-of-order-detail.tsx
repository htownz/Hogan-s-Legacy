import React from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Clock, 
  ClipboardCheck, 
  AlertTriangle,
  Edit,
  Trash
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/page-header";

interface PointOfOrder {
  id: string;
  billId: string;
  type: string;
  description: string;
  status: 'pending' | 'sustained' | 'overruled';
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  ruleCitation?: string;
  ruleReference?: string;
  suggestedFix?: string;
  textLocation?: {
    startIndex: number;
    endIndex: number;
    excerptText: string;
  };
  precedents?: {
    year: number;
    bill: string;
    ruling: string;
    outcome: 'sustained' | 'overruled';
  }[];
}

export default function PointOfOrderDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const pointId = params?.id;

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/points-of-order/${pointId}`],
    queryFn: async () => {
      const response = await fetch(`/api/points-of-order/${pointId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch point of order details');
      }
      return response.json();
    },
    enabled: !!pointId
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation('/points-of-order-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex justify-center items-center h-64">
          <p>Loading point of order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation('/points-of-order-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex justify-center mt-12">
          <div className="bg-red-50 p-4 rounded-md flex items-start max-w-2xl">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error loading point of order details</h3>
              <p className="text-red-700 mt-1">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation('/points-of-order-dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pointOfOrder: PointOfOrder = data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sustained':
        return 'bg-green-100 text-green-800';
      case 'overruled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => setLocation('/points-of-order-dashboard')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Point of Order: {pointOfOrder.type}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <Link href={`/bills/${pointOfOrder.billId}`}>
              <a className="text-blue-600 hover:underline inline-flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {pointOfOrder.billId}
              </a>
            </Link>
            <span className="text-gray-400">•</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(pointOfOrder.severity)}`}>
              Severity: {pointOfOrder.severity.charAt(0).toUpperCase() + pointOfOrder.severity.slice(1)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pointOfOrder.status)}`}>
              Status: {pointOfOrder.status.charAt(0).toUpperCase() + pointOfOrder.status.slice(1)}
            </span>
            <span className="inline-flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(pointOfOrder.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" className="flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="flex items-center text-red-600 hover:text-red-700">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Description Section */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <SectionHeader title="Description" />
            <p className="mt-2 text-gray-700">{pointOfOrder.description}</p>
          </div>

          {/* Text Location Section */}
          {pointOfOrder.textLocation && (
            <div className="bg-white rounded-md shadow-sm p-6 mb-6">
              <SectionHeader title="Affected Text" />
              <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {pointOfOrder.textLocation.excerptText}
                </pre>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Character range: {pointOfOrder.textLocation.startIndex} - {pointOfOrder.textLocation.endIndex}
              </div>
            </div>
          )}

          {/* Rule Citation Section */}
          {(pointOfOrder.ruleCitation || pointOfOrder.ruleReference) && (
            <div className="bg-white rounded-md shadow-sm p-6 mb-6">
              <SectionHeader title="Rule Reference" />
              {pointOfOrder.ruleReference && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">Referenced Rule:</h4>
                  <p className="text-gray-700">{pointOfOrder.ruleReference}</p>
                </div>
              )}
              {pointOfOrder.ruleCitation && (
                <div>
                  <h4 className="font-medium text-gray-700">Full Citation:</h4>
                  <div className="mt-2 bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-gray-700">{pointOfOrder.ruleCitation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Precedents Section */}
          {pointOfOrder.precedents && pointOfOrder.precedents.length > 0 && (
            <div className="bg-white rounded-md shadow-sm p-6 mb-6">
              <SectionHeader 
                title="Historical Precedents" 
                description="Similar points of order raised in previous sessions"
              />
              <div className="mt-4 space-y-4">
                {pointOfOrder.precedents.map((precedent, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{precedent.year} - {precedent.bill}</h4>
                        <p className="text-gray-700 mt-1">{precedent.ruling}</p>
                      </div>
                      <span className={`inline-flex items-center h-6 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        precedent.outcome === 'sustained' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {precedent.outcome.charAt(0).toUpperCase() + precedent.outcome.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {/* Suggested Fix Section */}
          {pointOfOrder.suggestedFix && (
            <div className="bg-white rounded-md shadow-sm p-6 mb-6">
              <div className="flex items-center mb-3">
                <ClipboardCheck className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium">Suggested Fix</h3>
              </div>
              <p className="text-gray-700">{pointOfOrder.suggestedFix}</p>
            </div>
          )}

          {/* Similar Issues Section */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Similar Points of Order</h3>
            <p className="text-gray-500 text-sm mb-4">Issues with similar characteristics</p>
            <div className="space-y-3">
              {/* This would be populated with real data */}
              <div className="p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start">
                  <span className="inline-flex items-center mr-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Germaneness
                  </span>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    Amendment contains subject matter not included in the original bill...
                  </p>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  TX-HB789
                </div>
              </div>
              <div className="p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start">
                  <span className="inline-flex items-center mr-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Analysis
                  </span>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    Fiscal note does not include complete economic impact analysis...
                  </p>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  TX-SB321
                </div>
              </div>
            </div>
          </div>

          {/* Status Alert Section */}
          {pointOfOrder.status === 'pending' && (
            <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <h3 className="text-yellow-800 font-medium">Pending Resolution</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    This point of order is still waiting for a ruling. Subscribe for updates.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  >
                    Subscribe to Updates
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}