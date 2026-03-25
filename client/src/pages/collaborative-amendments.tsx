import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Search, 
  Filter,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Tag,
  Vote,
  Edit3,
  Eye,
  ChevronRight
} from 'lucide-react';

interface Amendment {
  id: string;
  billId: string;
  sectionNumber?: string;
  lineNumber?: number;
  amendmentType: 'addition' | 'deletion' | 'modification' | 'substitution';
  originalText: string;
  proposedText: string;
  rationale: string;
  category: 'technical' | 'policy' | 'clarity' | 'scope' | 'enforcement';
  impact: 'minor' | 'moderate' | 'major';
  tags: string[];
  authorId: string;
  status: string;
  votes: {
    support: number;
    oppose: number;
    neutral: number;
  };
  totalVotes: number;
  supportPercentage: number;
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  commentType: 'support' | 'oppose' | 'suggestion' | 'question';
  isExpert: boolean;
  expertise?: string;
  authorId: string;
  createdAt: string;
  likes: number;
}

export default function CollaborativeAmendments() {
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [selectedBillId, setSelectedBillId] = useState('HB-1001');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('votes');
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Amendment form state
  const [formData, setFormData] = useState({
    amendmentType: 'modification' as const,
    sectionNumber: '',
    lineNumber: '',
    originalText: '',
    proposedText: '',
    rationale: '',
    category: 'policy' as const,
    impact: 'moderate' as const,
    tags: ''
  });

  // Load amendments for selected bill
  useEffect(() => {
    loadAmendments();
  }, [selectedBillId, sortBy, categoryFilter]);

  const loadAmendments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/amendments/bill/${selectedBillId}?${params}`);
      const result = await response.json();

      if (result.success) {
        setAmendments(result.amendments);
      }
    } catch (error) {
      console.error('Error loading amendments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAmendment = async () => {
    try {
      const amendmentData = {
        billId: selectedBillId,
        ...formData,
        lineNumber: formData.lineNumber ? parseInt(formData.lineNumber) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const response = await fetch('/api/amendments/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amendmentData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Amendment Submitted!",
          description: "Your amendment suggestion has been added to the collaborative playground."
        });
        setShowCreateForm(false);
        setFormData({
          amendmentType: 'modification',
          sectionNumber: '',
          lineNumber: '',
          originalText: '',
          proposedText: '',
          rationale: '',
          category: 'policy',
          impact: 'moderate',
          tags: ''
        });
        loadAmendments();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const voteOnAmendment = async (amendmentId: string, vote: 'support' | 'oppose' | 'neutral') => {
    try {
      const response = await fetch(`/api/amendments/${amendmentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendmentId, vote })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Vote Recorded",
          description: `Your ${vote} vote has been recorded.`
        });
        loadAmendments();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive"
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'minor': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'major': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'policy': return 'bg-purple-100 text-purple-800';
      case 'clarity': return 'bg-cyan-100 text-cyan-800';
      case 'scope': return 'bg-orange-100 text-orange-800';
      case 'enforcement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAmendments = amendments.filter(amendment => 
    amendment.proposedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    amendment.rationale.toLowerCase().includes(searchQuery.toLowerCase()) ||
    amendment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Collaborative Amendment Playground</h1>
          <p className="text-muted-foreground">
            Propose, discuss, and refine bill amendments collaboratively with fellow citizens
          </p>
        </div>

        {/* Bill Selection & Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={selectedBillId} onValueChange={setSelectedBillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a bill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HB-1001">HB 1001 - Education Funding Reform</SelectItem>
                <SelectItem value="SB-500">SB 500 - Healthcare Access Act</SelectItem>
                <SelectItem value="HB-2025">HB 2025 - Environmental Protection</SelectItem>
                <SelectItem value="SB-750">SB 750 - Criminal Justice Reform</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Suggest Amendment
          </Button>
        </div>

        <Tabs defaultValue="amendments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="amendments">
              <FileText className="h-4 w-4 mr-2" />
              Amendments
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageCircle className="h-4 w-4 mr-2" />
              Discussion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amendments" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search amendments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="clarity">Clarity</SelectItem>
                  <SelectItem value="scope">Scope</SelectItem>
                  <SelectItem value="enforcement">Enforcement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes">Most Supported</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amendments List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading amendments...</div>
              ) : filteredAmendments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No amendments yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to suggest an amendment for this bill
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Suggest Amendment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredAmendments.map((amendment) => (
                  <Card key={amendment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(amendment.category)}>
                              {amendment.category}
                            </Badge>
                            <Badge className={getImpactColor(amendment.impact)}>
                              {amendment.impact} impact
                            </Badge>
                            <Badge variant="outline">
                              {amendment.amendmentType}
                            </Badge>
                          </div>
                          
                          {amendment.sectionNumber && (
                            <p className="text-sm text-muted-foreground">
                              Section {amendment.sectionNumber}
                              {amendment.lineNumber && `, Line ${amendment.lineNumber}`}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            {amendment.supportPercentage}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {amendment.totalVotes} votes
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress value={amendment.supportPercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{amendment.votes.support} support</span>
                          <span>{amendment.votes.oppose} oppose</span>
                          <span>{amendment.votes.neutral} neutral</span>
                        </div>
                      </div>

                      {/* Amendment Text */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Original Text:</h4>
                          <p className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-200">
                            {amendment.originalText}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Proposed Text:</h4>
                          <p className="text-sm bg-green-50 p-3 rounded border-l-4 border-green-200">
                            {amendment.proposedText}
                          </p>
                        </div>
                      </div>

                      {/* Rationale */}
                      <div>
                        <h4 className="font-medium text-sm mb-1">Rationale:</h4>
                        <p className="text-sm text-muted-foreground">{amendment.rationale}</p>
                      </div>

                      {/* Tags */}
                      {amendment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {amendment.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteOnAmendment(amendment.id, 'support')}
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Support
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteOnAmendment(amendment.id, 'oppose')}
                            className="flex items-center gap-1"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Oppose
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAmendment(amendment)}
                            className="flex items-center gap-1"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Comment ({amendment.comments.length})
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(amendment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Amendment Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{amendments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Amendments</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {amendments.reduce((acc, a) => acc + a.totalVotes, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Votes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {amendments.reduce((acc, a) => acc + a.comments.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion">
            <Card>
              <CardHeader>
                <CardTitle>Recent Discussions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select an amendment above to view and participate in discussions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Amendment Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Suggest New Amendment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amendment Type</label>
                    <Select 
                      value={formData.amendmentType} 
                      onValueChange={(value: any) => setFormData({...formData, amendmentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="addition">Addition</SelectItem>
                        <SelectItem value="deletion">Deletion</SelectItem>
                        <SelectItem value="modification">Modification</SelectItem>
                        <SelectItem value="substitution">Substitution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: any) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="clarity">Clarity</SelectItem>
                        <SelectItem value="scope">Scope</SelectItem>
                        <SelectItem value="enforcement">Enforcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Section Number</label>
                    <Input
                      value={formData.sectionNumber}
                      onChange={(e) => setFormData({...formData, sectionNumber: e.target.value})}
                      placeholder="e.g., 3.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Line Number</label>
                    <Input
                      type="number"
                      value={formData.lineNumber}
                      onChange={(e) => setFormData({...formData, lineNumber: e.target.value})}
                      placeholder="e.g., 45"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Impact Level</label>
                    <Select 
                      value={formData.impact} 
                      onValueChange={(value: any) => setFormData({...formData, impact: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Original Text</label>
                  <Textarea
                    value={formData.originalText}
                    onChange={(e) => setFormData({...formData, originalText: e.target.value})}
                    placeholder="Enter the current text you want to amend..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Proposed Text</label>
                  <Textarea
                    value={formData.proposedText}
                    onChange={(e) => setFormData({...formData, proposedText: e.target.value})}
                    placeholder="Enter your proposed amendment text..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rationale</label>
                  <Textarea
                    value={formData.rationale}
                    onChange={(e) => setFormData({...formData, rationale: e.target.value})}
                    placeholder="Explain why this amendment is needed..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="education, funding, equity"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitAmendment}>
                    Submit Amendment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}