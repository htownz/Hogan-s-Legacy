// @ts-nocheck
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, BarChart3, LineChart, ListFilter, Table as TableIcon, Archive, Search, Activity } from 'lucide-react';

import PointsOfOrderStats from "@/components/points-of-order/PointsOfOrderStats";
import PointsOfOrderTrends from "@/components/points-of-order/PointsOfOrderTrends";
import { PageHeader } from "@/components/ui/page-header";

// React Table imports
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

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
  ruleReference?: string;
}

export default function EnhancedPointsOfOrderDashboard() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");

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
      accessorKey: 'billId',
      header: 'Bill ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('billId')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('type')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description: string = row.getValue('description');
        return (
          <div className="max-w-md truncate" title={description}>
            {description.length > 100 ? description.substring(0, 100) + '...' : description}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status: string = row.getValue('status');
        return (
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity: string = row.getValue('severity');
        return (
          <Badge className={getSeverityColor(severity)}>
            {severity}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'ruleReference',
      header: 'Rule Reference',
      cell: ({ row }) => (
        <div>{row.getValue('ruleReference') || '-'}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const pointOfOrder = row.original;
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation(`/points-of-order/${pointOfOrder.id}`)}
          >
            View
          </Button>
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
        (item.ruleCitation && item.ruleCitation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ruleReference && item.ruleReference.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [data, searchQuery]);

  const table = useReactTable({
    data: filteredData || [],
    columns,
    state: {
      columnFilters: filters,
    },
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Enhanced Points of Order Dashboard" 
          description="Analyze, visualize, and manage points of order in the Texas Legislature"
          actionChildren={
            <div className="flex space-x-2">
              <Button onClick={() => setLocation('/points-of-order-dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Simple View
              </Button>
              <Button variant="default" onClick={() => setLocation('/analyze-point-of-order')}>
                Analyze New Point of Order
              </Button>
            </div>
          }
        />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-muted-foreground">Loading points of order data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Enhanced Points of Order Dashboard" 
          description="Analyze, visualize, and manage points of order in the Texas Legislature"
          actionChildren={
            <div className="flex space-x-2">
              <Button onClick={() => setLocation('/points-of-order-dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Simple View
              </Button>
              <Button variant="default" onClick={() => setLocation('/analyze-point-of-order')}>
                Analyze New Point of Order
              </Button>
            </div>
          }
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
        title="Enhanced Points of Order Dashboard" 
        description="Analyze, visualize, and manage points of order in the Texas Legislature"
        actionChildren={
          <div className="flex space-x-2">
            <Button onClick={() => setLocation('/points-of-order-dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Simple View
            </Button>
            <Button variant="default" onClick={() => setLocation('/analyze-point-of-order')}>
              Analyze New Point of Order
            </Button>
          </div>
        }
      />

      <div className="mt-6 flex justify-between items-center mb-4">
        <div className="flex items-center w-full max-w-sm space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search points of order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center">
                <TableIcon className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === "list" && (
        <>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setLocation(`/points-of-order/${row.original.id}`)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No points of order found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>
              {" "}to{" "}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>
              {" "}of{" "}
              <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>
              {" "}results
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="mt-4">
          <PointsOfOrderStats />
        </div>
      )}

      {activeTab === "trends" && (
        <div className="mt-4">
          <PointsOfOrderTrends />
        </div>
      )}
    </div>
  );
}