// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeHtml } from "@/lib/sanitize";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, 
  Users, 
  MessageSquare, 
  ThumbsUp,
  ThumbsDown,
  Plus,
  Save,
  Share2,
  History,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Zap,
  Target,
  Clock,
  User,
  BookOpen,
  GitBranch,
  Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Amendment {
  id: string;
  billId: string;
  section: string;
  originalText: string;
  proposedText: string;
  rationale: string;
  author: string;
  status: 'draft' | 'proposed' | 'reviewed' | 'accepted' | 'rejected';
  votes: { up: number; down: number };
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  amendmentId: string;
  author: string;
  text: string;
  type: 'suggestion' | 'concern' | 'support' | 'question';
  createdAt: string;
}

interface CollaborativeAmendmentPlaygroundProps {
  billId?: string;
  onAmendmentCreate?: (amendment: Amendment) => void;
}

export function CollaborativeAmendmentPlayground({ 
  billId, 
  onAmendmentCreate 
}: CollaborativeAmendmentPlaygroundProps) {
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [proposedText, setProposedText] = useState<string>('');
  const [rationale, setRationale] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'amendments' | 'ai-suggestions'>('editor');
  const [showDiff, setShowDiff] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Fetch authentic Texas bills for selection
  const { data: billsData } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic'],
    enabled: true
  });

  // Fetch amendments for the selected bill
  const { data: amendmentsData } = useQuery<any>({
    queryKey: ['/api/amendments', selectedBill?.id],
    enabled: !!selectedBill?.id
  });

  const bills = Array.isArray(billsData) ? billsData : [];
  const amendments = Array.isArray(amendmentsData) ? amendmentsData : [];

  // Initialize with provided billId or first available bill
  useEffect(() => {
    if (billId && bills.length > 0) {
      const bill = bills.find(b => b.id === billId);
      if (bill) {
        setSelectedBill(bill);
        setOriginalText(bill.description || '');
      }
    } else if (bills.length > 0 && !selectedBill) {
      setSelectedBill(bills[0]);
      setOriginalText(bills[0].description || '');
    }
  }, [billId, bills, selectedBill]);

  // Create amendment mutation
  const createAmendmentMutation = useMutation({
    mutationFn: async (amendmentData: Partial<Amendment>) => {
      return apiRequest('/api/amendments', {
        method: 'POST',
        body: JSON.stringify(amendmentData)
      });
    },
    onSuccess: (newAmendment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/amendments'] });
      onAmendmentCreate?.(newAmendment);
      // Reset form
      setProposedText('');
      setRationale('');
      setCurrentSection('');
    }
  });

  // Vote on amendment mutation
  const voteAmendmentMutation = useMutation({
    mutationFn: async ({ amendmentId, vote }: { amendmentId: string, vote: 'up' | 'down' }) => {
      return apiRequest(`/api/amendments/${amendmentId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/amendments'] });
    }
  });

  // AI suggestion generation (simulated - would use OpenAI in real implementation)
  const generateAISuggestions = () => {
    if (!originalText) return [];
    
    return [
      {
        type: 'clarity',
        suggestion: 'Consider adding specific timelines for implementation',
        section: 'Section 2',
        confidence: 0.85
      },
      {
        type: 'legal',
        suggestion: 'Review compliance with existing state regulations',
        section: 'Section 3',
        confidence: 0.72
      },
      {
        type: 'impact',
        suggestion: 'Add provisions for rural area considerations',
        section: 'Section 1',
        confidence: 0.68
      }
    ];
  };

  const handleCreateAmendment = () => {
    if (!selectedBill || !proposedText || !rationale || !author) return;

    const amendmentData = {
      billId: selectedBill.id,
      section: currentSection || 'General',
      originalText: originalText,
      proposedText: proposedText,
      rationale: rationale,
      author: author,
      status: 'proposed' as const,
      votes: { up: 0, down: 0 },
      comments: []
    };

    createAmendmentMutation.mutate(amendmentData);
  };

  const handleVote = (amendmentId: string, vote: 'up' | 'down') => {
    voteAmendmentMutation.mutate({ amendmentId, vote });
  };

  const generateDiff = (original: string, proposed: string) => {
    // Simple diff visualization - in production, use a proper diff library
    const originalWords = original.split(' ');
    const proposedWords = proposed.split(' ');
    
    let result = '';
    let i = 0, j = 0;
    
    while (i < originalWords.length || j < proposedWords.length) {
      if (i < originalWords.length && j < proposedWords.length) {
        if (originalWords[i] === proposedWords[j]) {
          result += originalWords[i] + ' ';
          i++;
          j++;
        } else {
          result += `<del class="bg-red-200 text-red-800">${originalWords[i]}</del> `;
          result += `<ins class="bg-green-200 text-green-800">${proposedWords[j]}</ins> `;
          i++;
          j++;
        }
      } else if (i < originalWords.length) {
        result += `<del class="bg-red-200 text-red-800">${originalWords[i]}</del> `;
        i++;
      } else {
        result += `<ins class="bg-green-200 text-green-800">${proposedWords[j]}</ins> `;
        j++;
      }
    }
    
    return result;
  };

  const aiSuggestions = generateAISuggestions();

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-emerald-400" />
            Collaborative Bill Amendment Playground
          </CardTitle>
          <CardDescription className="text-slate-300">
            Collaborate on bill amendments with AI-powered suggestions and community feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bill Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Select Bill</label>
              <Select 
                value={selectedBill?.id || ''} 
                onValueChange={(value) => {
                  const bill = bills.find(b => b.id === value);
                  setSelectedBill(bill);
                  setOriginalText(bill?.description || '');
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Choose a bill to amend..." />
                </SelectTrigger>
                <SelectContent>
                  {bills.slice(0, 10).map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {bill.title?.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Your Name</label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter your name..."
                className="bg-white/10 border-white/20 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {selectedBill && (
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-lg text-white">{selectedBill.title}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-emerald-600">{selectedBill.status}</Badge>
                  <Badge className="bg-blue-600">{selectedBill.chamber}</Badge>
                  {selectedBill.subjects?.slice(0, 2).map((subject: string, idx: number) => (
                    <Badge key={idx} className="bg-purple-600">{subject}</Badge>
                  ))}
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Main Playground Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-sm">
              <TabsTrigger value="editor" className="data-[state=active]:bg-emerald-600 text-white">
                <Edit3 className="w-4 h-4 mr-2" />
                Amendment Editor
              </TabsTrigger>
              <TabsTrigger value="amendments" className="data-[state=active]:bg-blue-600 text-white">
                <Users className="w-4 h-4 mr-2" />
                Community Amendments
              </TabsTrigger>
              <TabsTrigger value="ai-suggestions" className="data-[state=active]:bg-purple-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Original Text</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDiff(!showDiff)}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      {showDiff ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showDiff ? 'Hide Diff' : 'Show Diff'}
                    </Button>
                  </div>
                  <Textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Original bill text will appear here..."
                    className="bg-white/5 border-white/20 text-white min-h-[300px]"
                    readOnly
                  />
                </div>

                {/* Proposed Text */}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Your Amendment</label>
                  {showDiff && originalText && proposedText ? (
                    <div 
                      className="bg-white/5 border border-white/20 rounded-lg p-4 min-h-[300px] text-white overflow-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(generateDiff(originalText, proposedText)) }}
                    />
                  ) : (
                    <Textarea
                      ref={editorRef}
                      value={proposedText}
                      onChange={(e) => setProposedText(e.target.value)}
                      placeholder="Write your proposed amendment here..."
                      className="bg-white/5 border-white/20 text-white min-h-[300px]"
                    />
                  )}
                </div>
              </div>

              {/* Amendment Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Section/Area</label>
                  <Input
                    value={currentSection}
                    onChange={(e) => setCurrentSection(e.target.value)}
                    placeholder="Which section does this amendment target?"
                    className="bg-white/10 border-white/20 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Rationale</label>
                  <Textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain why this amendment is needed and what it aims to achieve..."
                    className="bg-white/10 border-white/20 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCreateAmendment}
                  disabled={!proposedText || !rationale || !author || createAmendmentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createAmendmentMutation.isPending ? 'Submitting...' : 'Submit Amendment'}
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Draft
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="amendments" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Community Amendments</h3>
                <Badge className="bg-blue-600">{amendments.length} amendments</Badge>
              </div>

              <div className="space-y-4">
                {amendments.length > 0 ? amendments.map((amendment: Amendment) => (
                  <Card key={amendment.id} className="border-white/20 bg-white/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                            {amendment.author}
                          </CardTitle>
                          <CardDescription className="text-slate-300">
                            {amendment.section} • {new Date(amendment.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={
                            amendment.status === 'accepted' ? 'bg-green-600' :
                            amendment.status === 'rejected' ? 'bg-red-600' :
                            amendment.status === 'reviewed' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }
                        >
                          {amendment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Rationale</h4>
                        <p className="text-white text-sm">{amendment.rationale}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Proposed Changes</h4>
                        <div className="bg-slate-800 rounded p-3 text-sm text-slate-300 max-h-32 overflow-auto">
                          {amendment.proposedText.substring(0, 200)}...
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(amendment.id, 'up')}
                            className="border-green-600/30 text-green-400 hover:bg-green-600/10"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {amendment.votes.up}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(amendment.id, 'down')}
                            className="border-red-600/30 text-red-400 hover:bg-red-600/10"
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            {amendment.votes.down}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAmendment(amendment)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Comment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Full
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border-white/20 bg-white/5">
                    <CardContent className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-300">No amendments yet for this bill.</p>
                      <p className="text-slate-400 text-sm">Be the first to suggest an improvement!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai-suggestions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">AI-Powered Suggestions</h3>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate New Suggestions
                </Button>
              </div>

              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <Card key={index} className="border-white/20 bg-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={
                                suggestion.type === 'clarity' ? 'bg-blue-600' :
                                suggestion.type === 'legal' ? 'bg-red-600' :
                                'bg-green-600'
                              }
                            >
                              {suggestion.type}
                            </Badge>
                            <Badge className="bg-gray-600">{suggestion.section}</Badge>
                            <span className="text-xs text-slate-400">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-white">{suggestion.suggestion}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}