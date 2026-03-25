// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users, 
  Calendar, 
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Network,
  Clock,
  Building
} from "lucide-react";

interface EnhancedBillCardProps {
  bill: {
    id: string;
    title: string;
    description: string;
    chamber: string;
    status: string;
    sponsors: string;
    introducedAt: string;
    subjects: string[];
    committee?: string;
    billNumber?: string;
  };
  onSelect?: (billId: string) => void;
  isSelected?: boolean;
  showConnections?: boolean;
  relatedLegislators?: any[];
  relatedBills?: any[];
}

export function EnhancedBillCard({ 
  bill, 
  onSelect, 
  isSelected = false, 
  showConnections = false,
  relatedLegislators = [],
  relatedBills = []
}: EnhancedBillCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-600';
      case 'passed': return 'bg-blue-600';
      case 'failed': return 'bg-red-600';
      case 'pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getChamberColor = (chamber: string) => {
    return chamber.toLowerCase().includes('house') ? 'bg-purple-600' : 'bg-orange-600';
  };

  const sponsorCount = bill.sponsors.split(',').length;
  const daysSinceIntroduced = Math.floor(
    (new Date().getTime() - new Date(bill.introducedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card 
      className={`border-0 shadow-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-emerald-400 shadow-emerald-400/20' : 'hover:shadow-xl'
      }`}
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={() => onSelect?.(bill.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {bill.billNumber && (
                <Badge className="bg-cyan-600 font-bold">{bill.billNumber}</Badge>
              )}
              <Badge className={getChamberColor(bill.chamber)}>{bill.chamber}</Badge>
              <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
            </div>
            
            <CardTitle className="text-xl text-white mb-3 leading-tight">
              {bill.title}
            </CardTitle>
            
            <CardDescription className="text-slate-300 mb-4 leading-relaxed">
              {isExpanded 
                ? bill.description 
                : `${bill.description.substring(0, 200)}${bill.description.length > 200 ? '...' : ''}`
              }
            </CardDescription>

            <div className="flex flex-wrap gap-2 mb-4">
              {bill.subjects.slice(0, 3).map((subject, index) => (
                <Badge key={index} className="bg-indigo-600 text-xs">{subject}</Badge>
              ))}
              {bill.subjects.length > 3 && (
                <Badge className="bg-gray-600 text-xs">+{bill.subjects.length - 3} more</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right text-sm space-y-2 ml-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{daysSinceIntroduced} days ago</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span>{sponsorCount} sponsor{sponsorCount > 1 ? 's' : ''}</span>
            </div>
            {bill.committee && (
              <div className="flex items-center gap-2 text-slate-400">
                <Building className="w-4 h-4" />
                <span className="text-xs">{bill.committee.substring(0, 20)}...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-slate-400">
            <strong className="text-white">Sponsors:</strong> {bill.sponsors}
          </div>
          
          <div className="flex gap-2">
            {bill.description.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-slate-400 hover:text-white"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isExpanded ? 'Less' : 'More'}
              </Button>
            )}
            
            {showConnections && (
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-400 hover:text-emerald-300"
              >
                <Network className="w-4 h-4 mr-2" />
                View Connections
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isSelected && showConnections && (relatedLegislators.length > 0 || relatedBills.length > 0) && (
        <CardContent className="border-t border-white/10 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {relatedLegislators.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Connected Legislators
                </h4>
                <div className="space-y-2">
                  {relatedLegislators.slice(0, 3).map((legislator) => (
                    <div key={legislator.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{legislator.name}</p>
                          <p className="text-slate-400 text-sm">{legislator.party} - District {legislator.district}</p>
                        </div>
                        <Badge className="bg-cyan-600">{legislator.chamber}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedBills.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Related Bills
                </h4>
                <div className="space-y-2">
                  {relatedBills.slice(0, 3).map((relatedBill) => (
                    <div key={relatedBill.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-medium text-sm mb-1">
                        {relatedBill.title.substring(0, 60)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">{relatedBill.chamber}</p>
                        <Badge className={getStatusColor(relatedBill.status)} size="sm">
                          {relatedBill.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}