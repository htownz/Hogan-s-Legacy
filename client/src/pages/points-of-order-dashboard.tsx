import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ColumnDef,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Eye, Filter, AlertCircle, ChevronRight, Tag } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  suggestedFix?: string;
}

export default function PointsOfOrderDashboard() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/points-of-order'],
    queryFn: async () => {
      const response = await fetch('/api/points-of-order');
      if (!response.ok) {
        throw new Error('Failed to fetch points of order');
      }
      return response.json();
    }
  });

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

  const columns: ColumnDef<PointOfOrder>[] = [
    {
      accessorKey: "billId",
      header: "Bill ID",
      cell: ({ row }) => (
        <Link href={`/bills/${row.getValue("billId")}`}>
          <a className="text-blue-600 hover:underline flex items-center">
            {row.getValue("billId")}
          </a>
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description: string = row.getValue("description");
        return (
          <div className="max-w-[500px] truncate" title={description}>
            {description}
          </div>
        );
      }
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity: string = row.getValue("severity");
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </span>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: string = row.getValue("status");
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const pointOfOrder = row.original;
        
        return (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation(`/points-of-order/${pointOfOrder.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        );
      },
    },
  ];

  // Filter the data based on the search query
  const filteredData = React.useMemo(() => {
    if (!data || !searchQuery) return data;
    
    return data.filter((item: PointOfOrder) => {
      return (
        item.billId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ruleCitation && item.ruleCitation.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Points of Order Dashboard" 
          description="View and manage all points of order in the Texas Legislature"
        />
        <div className="flex justify-center mt-12">
          <p>Loading points of order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Points of Order Dashboard" 
          description="View and manage all points of order in the Texas Legislature"
        />
        <div className="flex justify-center mt-12">
          <div className="bg-red-50 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error loading points of order</h3>
              <p className="text-red-700 mt-1">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Points of Order Dashboard" 
        description="View and manage all points of order in the Texas Legislature"
        action={
          <Button onClick={() => setLocation('/analyze-point-of-order')}>
            Analyze New Point of Order
          </Button>
        }
      />

      <div className="bg-white rounded-md shadow-sm p-6 mt-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Search points of order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Group by
              </Button>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData || []}
          searchKey="billId"
          searchPlaceholder="Filter by bill ID..."
        />
      </div>

      <div className="flex justify-between items-center mt-8 bg-blue-50 p-4 rounded-md">
        <div>
          <h3 className="font-medium text-blue-800">Need help with points of order?</h3>
          <p className="text-blue-700 mt-1">Learn how to identify potential points of order in legislative text.</p>
        </div>
        <Button 
          variant="outline" 
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
          onClick={() => setLocation('/points-of-order-guide')}
        >
          View Guide
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}