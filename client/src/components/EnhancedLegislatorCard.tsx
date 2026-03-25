import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Building, 
  Phone,
  Mail,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Star
} from "lucide-react";

interface EnhancedLegislatorCardProps {
  legislator: {
    id: string;
    name: string;
    chamber: string;
    district: string;
    party: string;
    committees: string[];
    email?: string;
    phone?: string;
  };
  onSelect?: (legislatorId: string) => void;
  isSelected?: boolean;
  sponsoredBills?: any[];
  showDetails?: boolean;
}

export function EnhancedLegislatorCard({ 
  legislator, 
  onSelect, 
  isSelected = false,
  sponsoredBills = [],
  showDetails = false
}: EnhancedLegislatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'republican': case 'r': return 'bg-red-600';
      case 'democratic': case 'democrat': case 'd': return 'bg-blue-600';
      case 'independent': case 'i': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getChamberColor = (chamber: string) => {
    return chamber.toLowerCase().includes('house') ? 'bg-emerald-600' : 'bg-orange-600';
  };

  const activeBillsCount = sponsoredBills.filter(bill => bill.status === 'active').length;
  const passedBillsCount = sponsoredBills.filter(bill => bill.status === 'passed').length;
  const totalBillsSponsored = sponsoredBills.length;

  // Calculate influence score based on bill sponsorship and committee assignments
  const influenceScore = (totalBillsSponsored * 2) + (legislator.committees.length * 3) + (passedBillsCount * 5);

  return (
    <Card 
      className={`border-0 shadow-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-blue-400 shadow-blue-400/20' : 'hover:shadow-xl'
      }`}
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={() => onSelect?.(legislator.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white mb-1">{legislator.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getChamberColor(legislator.chamber)}>{legislator.chamber}</Badge>
                  <Badge className={getPartyColor(legislator.party)}>{legislator.party}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">District {legislator.district}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building className="w-4 h-4 text-blue-400" />
                <span className="text-sm">{legislator.committees.length} Committees</span>
              </div>
              {legislator.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{legislator.phone}</span>
                </div>
              )}
              {legislator.email && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">{legislator.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right space-y-2 ml-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Star className="w-4 h-4" />
              <span className="font-bold">{influenceScore}</span>
              <span className="text-xs text-slate-400">influence</span>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                <span>{totalBillsSponsored} bills</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                <span>{passedBillsCount} passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Committee assignments preview */}
        <div className="mt-4">
          <h4 className="text-sm font-bold text-slate-300 mb-2">Key Committees</h4>
          <div className="flex flex-wrap gap-1">
            {legislator.committees.slice(0, isExpanded ? undefined : 3).map((committee, index) => (
              <Badge key={index} className="bg-indigo-600 text-xs">{committee}</Badge>
            ))}
            {!isExpanded && legislator.committees.length > 3 && (
              <Badge className="bg-gray-600 text-xs">+{legislator.committees.length - 3} more</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{activeBillsCount}</div>
              <div className="text-xs text-slate-400">Active Bills</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{passedBillsCount}</div>
              <div className="text-xs text-slate-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{legislator.committees.length}</div>
              <div className="text-xs text-slate-400">Committees</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {legislator.committees.length > 3 && (
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
            
            {totalBillsSponsored > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Bills
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isSelected && showDetails && sponsoredBills.length > 0 && (
        <CardContent className="border-t border-white/10 pt-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Recent Sponsored Bills
          </h4>
          
          <div className="space-y-3">
            {sponsoredBills.slice(0, 5).map((bill) => (
              <div key={bill.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">
                      {bill.title.length > 80 ? `${bill.title.substring(0, 80)}...` : bill.title}
                    </p>
                    <p className="text-slate-400 text-xs mb-2">
                      {bill.description.substring(0, 120)}...
                    </p>
                  </div>
                  <Badge 
                    className={`ml-2 ${
                      bill.status === 'active' ? 'bg-emerald-600' :
                      bill.status === 'passed' ? 'bg-blue-600' :
                      bill.status === 'failed' ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    {bill.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {bill.subjects.slice(0, 2).map((subject: any, idx: any) => (
                      <Badge key={idx} className="bg-purple-600 text-xs">{subject}</Badge>
                    ))}
                  </div>
                  <span className="text-slate-400 text-xs">
                    {new Date(bill.introducedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {sponsoredBills.length > 5 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                View All {sponsoredBills.length} Bills
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}