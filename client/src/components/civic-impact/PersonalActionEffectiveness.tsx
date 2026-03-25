import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Zap } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

interface ActionMetric {
  metric: string;
  personalScore: number;
  communityAverage: number;
  fullMark: number;
}

interface ActionTypeEffectiveness {
  action: string;
  effectiveness: number;
  count: number;
  color: string;
}

interface PersonalActionEffectivenessProps {
  metrics: ActionMetric[];
  actions: ActionTypeEffectiveness[];
  className?: string;
}

export default function PersonalActionEffectiveness({
  metrics,
  actions,
  className = ''
}: PersonalActionEffectivenessProps) {
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" style={{ color: COLORS.ACCENT }} />
          Personal Action Effectiveness
        </CardTitle>
        <CardDescription>
          Measuring the impact of your civic engagement activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="radar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="radar">Effectiveness Profile</TabsTrigger>
            <TabsTrigger value="actions">Action Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="radar" className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  
                  <Radar
                    name="Community Average"
                    dataKey="communityAverage"
                    stroke={COLORS.PRIMARY}
                    fill={COLORS.PRIMARY}
                    fillOpacity={0.2}
                  />
                  
                  <Radar
                    name="Your Score"
                    dataKey="personalScore"
                    stroke={COLORS.ACCENT}
                    fill={COLORS.ACCENT}
                    fillOpacity={0.5}
                  />
                  
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 px-2">
              <h4 className="text-sm font-medium mb-3">Effectiveness Analysis</h4>
              <div className="text-sm text-gray-700">
                {(() => {
                  // Find highest and lowest metrics
                  const sorted = [...metrics].sort((a, b) => b.personalScore - a.personalScore);
                  const highest = sorted[0];
                  const lowest = sorted[sorted.length - 1];
                  
                  return (
                    <>
                      <p>Your strongest area is <span className="font-medium text-primary">{highest.metric}</span> with an effectiveness score of {highest.personalScore}, which is {highest.personalScore > highest.communityAverage ? `${(highest.personalScore - highest.communityAverage).toFixed(1)} points above` : `${(highest.communityAverage - highest.personalScore).toFixed(1)} points below`} the community average.</p>
                      
                      <p className="mt-2">To increase your overall impact, consider focusing on <span className="font-medium" style={{ color: COLORS.ACCENT }}>{lowest.metric}</span> which is currently your lowest scoring area.</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="actions" className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={actions}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="action" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === "effectiveness") return [`${value} / 100`, "Effectiveness"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar 
                    name="Effectiveness" 
                    dataKey="effectiveness" 
                    minPointSize={3}
                    barSize={30}
                  >
                    {actions.map((entry, index) => (
                      <rect 
                        key={`rect-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                  <Bar name="Count" dataKey="count" fill={COLORS.SUPPORT} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 px-2">
              <h4 className="text-sm font-medium mb-3">Action Insights</h4>
              <div className="text-sm text-gray-700">
                {(() => {
                  // Find most effective and most frequent actions
                  const mostEffective = [...actions].sort((a, b) => b.effectiveness - a.effectiveness)[0];
                  const mostFrequent = [...actions].sort((a, b) => b.count - a.count)[0];
                  
                  return (
                    <>
                      <p>Your most effective action type is <span className="font-medium" style={{ color: mostEffective.color }}>{mostEffective.action}</span> with an effectiveness score of {mostEffective.effectiveness}.</p>
                      
                      <p className="mt-2">You engage most frequently in <span className="font-medium" style={{ color: COLORS.SUPPORT }}>{mostFrequent.action}</span> activities ({mostFrequent.count} times).</p>
                      
                      {mostEffective.action !== mostFrequent.action && (
                        <p className="mt-2">Consider shifting more of your engagement toward {mostEffective.action} activities to maximize your impact.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}