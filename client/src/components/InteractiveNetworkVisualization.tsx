// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Network, 
  Users, 
  FileText, 
  Zap,
  Target,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  Maximize2,
  Settings
} from "lucide-react";

interface Node {
  id: string;
  type: 'bill' | 'legislator' | 'committee' | 'subject';
  label: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  data?: any;
}

interface Link {
  source: string | Node;
  target: string | Node;
  strength: number;
  type: 'sponsors' | 'committee' | 'subject' | 'cosponsors';
}

interface InteractiveNetworkVisualizationProps {
  onNodeSelect?: (node: Node) => void;
  selectedFilters?: string[];
}

export function InteractiveNetworkVisualization({ 
  onNodeSelect, 
  selectedFilters = [] 
}: InteractiveNetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [networkType, setNetworkType] = useState<'full' | 'bills' | 'legislators' | 'influence'>('full');
  const [minConnections, setMinConnections] = useState([2]);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Fetch authentic Texas legislative data
  const { data: billsData } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic'],
    enabled: true
  });

  const { data: legislatorsData } = useQuery<any>({
    queryKey: ['/api/legislators/texas-authentic'],
    enabled: true
  });

  const bills = Array.isArray(billsData) ? billsData : [];
  const legislators = Array.isArray(legislatorsData) ? legislatorsData : [];

  // Generate network data from authentic legislative data
  const networkData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // Create legislator nodes
    legislators.forEach(legislator => {
      const node: Node = {
        id: `legislator-${legislator.id}`,
        type: 'legislator',
        label: legislator.name,
        size: 12 + (legislator.committees?.length || 0) * 2,
        color: legislator.party?.toLowerCase() === 'republican' ? '#ef4444' : 
               legislator.party?.toLowerCase() === 'democratic' ? '#3b82f6' : '#6b7280',
        data: legislator
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create subject nodes and track connections
    const subjectConnections = new Map<string, Set<string>>();
    const sponsorConnections = new Map<string, Set<string>>();

    bills.forEach(bill => {
      // Create bill node
      const billNode: Node = {
        id: `bill-${bill.id}`,
        type: 'bill',
        label: bill.title?.substring(0, 30) + '...' || 'Untitled Bill',
        size: 8 + (bill.subjects?.length || 0),
        color: bill.status === 'active' ? '#10b981' : 
               bill.status === 'passed' ? '#3b82f6' : '#6b7280',
        data: bill
      };
      nodes.push(billNode);
      nodeMap.set(billNode.id, billNode);

      // Create sponsor connections
      if (bill.sponsors) {
        const sponsors = bill.sponsors.split(',').map((s: any) => s.trim());
        sponsors.forEach((sponsorName: any) => {
          const legislatorNode = nodes.find(n => 
            n.type === 'legislator' && 
            n.data?.name?.toLowerCase().includes(sponsorName.toLowerCase())
          );
          
          if (legislatorNode) {
            links.push({
              source: legislatorNode.id,
              target: billNode.id,
              strength: 1,
              type: 'sponsors'
            });

            // Track sponsor connections for co-sponsor relationships
            if (!sponsorConnections.has(legislatorNode.id)) {
              sponsorConnections.set(legislatorNode.id, new Set());
            }
            sponsorConnections.get(legislatorNode.id)!.add(billNode.id);
          }
        });

        // Create co-sponsor links
        sponsors.forEach((sponsor1: any) => {
          sponsors.forEach((sponsor2: any) => {
            if (sponsor1 !== sponsor2) {
              const leg1 = nodes.find(n => 
                n.type === 'legislator' && 
                n.data?.name?.toLowerCase().includes(sponsor1.toLowerCase())
              );
              const leg2 = nodes.find(n => 
                n.type === 'legislator' && 
                n.data?.name?.toLowerCase().includes(sponsor2.toLowerCase())
              );
              
              if (leg1 && leg2) {
                const existingLink = links.find(l => 
                  (l.source === leg1.id && l.target === leg2.id) ||
                  (l.source === leg2.id && l.target === leg1.id)
                );
                
                if (!existingLink) {
                  links.push({
                    source: leg1.id,
                    target: leg2.id,
                    strength: 0.5,
                    type: 'cosponsors'
                  });
                }
              }
            }
          });
        });
      }

      // Create subject connections
      if (bill.subjects) {
        bill.subjects.forEach((subject: any) => {
          let subjectNode = nodes.find(n => 
            n.type === 'subject' && n.label === subject
          );
          
          if (!subjectNode) {
            subjectNode = {
              id: `subject-${subject}`,
              type: 'subject',
              label: subject,
              size: 6,
              color: '#8b5cf6',
              data: { subject, billCount: 0 }
            };
            nodes.push(subjectNode);
            nodeMap.set(subjectNode.id, subjectNode);
          }
          
          // Increase subject node size based on bill count
          subjectNode.size = Math.max(subjectNode.size, 6 + (subjectNode.data.billCount || 0));
          subjectNode.data.billCount = (subjectNode.data.billCount || 0) + 1;

          links.push({
            source: billNode.id,
            target: subjectNode.id,
            strength: 0.3,
            type: 'subject'
          });

          // Track subject connections
          if (!subjectConnections.has(subject)) {
            subjectConnections.set(subject, new Set());
          }
          subjectConnections.get(subject)!.add(billNode.id);
        });
      }
    });

    // Filter based on minimum connections and network type
    const filteredNodes = nodes.filter(node => {
      if (networkType === 'bills' && node.type !== 'bill' && node.type !== 'subject') return false;
      if (networkType === 'legislators' && node.type !== 'legislator') return false;
      
      const connectionCount = links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      
      return connectionCount >= minConnections[0];
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(typeof link.source === 'string' ? link.source : link.source.id) &&
      filteredNodeIds.has(typeof link.target === 'string' ? link.target : link.target.id)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [bills, legislators, networkType, minConnections]);

  // Force simulation setup
  useEffect(() => {
    if (!svgRef.current || networkData.nodes.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // Simple force simulation (without d3)
    const simulation = {
      nodes: networkData.nodes.map(n => ({ ...n, x: width/2 + Math.random() * 100 - 50, y: height/2 + Math.random() * 100 - 50 })),
      links: networkData.links,
      alpha: 1,
      alphaDecay: 0.01,
      velocityDecay: 0.4
    };

    const tick = () => {
      if (!isAnimating) return;

      // Apply forces
      simulation.nodes.forEach((node, i) => {
        if (!node.vx) node.vx = 0;
        if (!node.vy) node.vy = 0;

        // Center force
        node.vx += (width / 2 - node.x!) * 0.001;
        node.vy += (height / 2 - node.y!) * 0.001;

        // Repulsion force
        simulation.nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x! - other.x!;
            const dy = node.y! - other.y!;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const strength = (node.size + other.size) * 10 / distance;
            
            node.vx += (dx / distance) * strength * 0.01;
            node.vy += (dy / distance) * strength * 0.01;
          }
        });

        // Link force
        simulation.links.forEach(link => {
          const source = typeof link.source === 'string' ? 
            simulation.nodes.find(n => n.id === link.source) : link.source;
          const target = typeof link.target === 'string' ? 
            simulation.nodes.find(n => n.id === link.target) : link.target;

          if (source && target && (source === node || target === node)) {
            const other = source === node ? target : source;
            const dx = other.x! - node.x!;
            const dy = other.y! - node.y!;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDistance = (node.size + other.size) * 3;
            const strength = (distance - targetDistance) * link.strength * 0.01;

            node.vx += (dx / distance) * strength;
            node.vy += (dy / distance) * strength;
          }
        });

        // Apply velocity
        node.vx *= simulation.velocityDecay;
        node.vy *= simulation.velocityDecay;
        node.x! += node.vx;
        node.y! += node.vy;

        // Boundary constraints
        node.x = Math.max(node.size, Math.min(width - node.size, node.x!));
        node.y = Math.max(node.size, Math.min(height - node.size, node.y!));
      });

      simulation.alpha *= (1 - simulation.alphaDecay);
      
      if (simulation.alpha > 0.01) {
        requestAnimationFrame(tick);
      }
    };

    if (isAnimating) {
      tick();
    }

  }, [networkData, isAnimating]);

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  const resetSimulation = () => {
    setSelectedNode(null);
    setIsAnimating(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-400" />
            Interactive Network Visualization
          </CardTitle>
          <CardDescription className="text-slate-300">
            Explore connections between {bills.length} bills and {legislators.length} legislators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Network Type</label>
              <Select value={networkType} onValueChange={setNetworkType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Network</SelectItem>
                  <SelectItem value="bills">Bills & Subjects</SelectItem>
                  <SelectItem value="legislators">Legislators Only</SelectItem>
                  <SelectItem value="influence">Influence Map</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Min Connections: {minConnections[0]}
              </label>
              <Slider
                value={minConnections}
                onValueChange={setMinConnections}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={isAnimating ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetSimulation}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant={showLabels ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-300">
                <div>{networkData.nodes.length} nodes</div>
                <div>{networkData.links.length} connections</div>
              </div>
            </div>
          </div>

          {/* Network Visualization */}
          <div className="relative">
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              className="border border-white/20 rounded-lg bg-slate-900/50"
              style={{ cursor: selectedNode ? 'pointer' : 'default' }}
            >
              {/* Links */}
              {networkData.links.map((link, index) => {
                const sourceNode = networkData.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
                const targetNode = networkData.nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id));
                
                if (!sourceNode || !targetNode || !sourceNode.x || !targetNode.x) return null;

                return (
                  <line
                    key={index}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={
                      link.type === 'sponsors' ? '#10b981' :
                      link.type === 'cosponsors' ? '#3b82f6' :
                      link.type === 'subject' ? '#8b5cf6' : '#6b7280'
                    }
                    strokeWidth={link.strength * 2}
                    opacity={0.6}
                  />
                );
              })}

              {/* Nodes */}
              {networkData.nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke={selectedNode?.id === node.id ? '#ffffff' : 'transparent'}
                    strokeWidth={3}
                    opacity={hoveredNode && hoveredNode.id !== node.id ? 0.3 : 0.8}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />
                  {showLabels && (
                    <text
                      x={node.x}
                      y={node.y! + node.size + 12}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      opacity={0.8}
                    >
                      {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <div className="text-sm font-bold text-white mb-2">Legend</div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Republican</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Democrat / Active Bills</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Subjects</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Active Bills</span>
              </div>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  {selectedNode.type === 'bill' && <FileText className="w-5 h-5 text-emerald-400" />}
                  {selectedNode.type === 'legislator' && <Users className="w-5 h-5 text-blue-400" />}
                  {selectedNode.type === 'subject' && <Target className="w-5 h-5 text-purple-400" />}
                  {selectedNode.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-2">Details</h4>
                    {selectedNode.type === 'legislator' && (
                      <div className="space-y-1 text-sm text-slate-300">
                        <p><strong>Party:</strong> {selectedNode.data?.party || 'Unknown'}</p>
                        <p><strong>Chamber:</strong> {selectedNode.data?.chamber || 'Unknown'}</p>
                        <p><strong>District:</strong> {selectedNode.data?.district || 'Unknown'}</p>
                        <p><strong>Committees:</strong> {selectedNode.data?.committees?.length || 0}</p>
                      </div>
                    )}
                    {selectedNode.type === 'bill' && (
                      <div className="space-y-1 text-sm text-slate-300">
                        <p><strong>Status:</strong> {selectedNode.data?.status || 'Unknown'}</p>
                        <p><strong>Chamber:</strong> {selectedNode.data?.chamber || 'Unknown'}</p>
                        <p><strong>Subjects:</strong> {selectedNode.data?.subjects?.length || 0}</p>
                      </div>
                    )}
                    {selectedNode.type === 'subject' && (
                      <div className="space-y-1 text-sm text-slate-300">
                        <p><strong>Related Bills:</strong> {selectedNode.data?.billCount || 0}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-2">Connections</h4>
                    <div className="text-sm text-slate-300">
                      {networkData.links.filter(link => 
                        (typeof link.source === 'string' ? link.source : link.source.id) === selectedNode.id ||
                        (typeof link.target === 'string' ? link.target : link.target.id) === selectedNode.id
                      ).length} total connections
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}