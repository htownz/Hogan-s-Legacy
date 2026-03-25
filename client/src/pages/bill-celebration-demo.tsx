import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BillProgressCelebration, { BillCelebrationEvent } from '@/components/legislation/BillProgressCelebration';

const DEMO_MILESTONES = [
  'committee_approval',
  'passed_chamber',
  'passed_legislature',
  'signed',
  'effective',
  'custom'
] as const;

const DEMO_BILLS = [
  {
    billId: 'tx-hb42',
    billNumber: 'HB 42',
    title: 'Comprehensive Education Reform Act',
    description: 'A bill to provide comprehensive education reform for the state of Texas.'
  },
  {
    billId: 'tx-sb101',
    billNumber: 'SB 101',
    title: 'Health Insurance Expansion',
    description: 'A bill to expand health insurance coverage for low-income residents.'
  },
  {
    billId: 'tx-hb255',
    billNumber: 'HB 255',
    title: 'Environmental Protection Standards',
    description: 'Establishes new environmental protection standards for industrial facilities.'
  },
  {
    billId: 'tx-sb77',
    billNumber: 'SB 77',
    title: 'Criminal Justice Reform',
    description: 'Comprehensive criminal justice reform provisions including sentencing guidelines.'
  }
];

export default function BillCelebrationDemo() {
  const [celebration, setCelebration] = useState<BillCelebrationEvent | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('committee_approval');
  const [selectedBill, setSelectedBill] = useState<string>('tx-hb42');
  const [customMilestone, setCustomMilestone] = useState<string>('');
  const [committeeInfo, setCommitteeInfo] = useState<string>('House Committee on Education');
  const [yesVotes, setYesVotes] = useState<number>(95);
  const [noVotes, setNoVotes] = useState<number>(45);

  const handleTriggerCelebration = () => {
    const bill = DEMO_BILLS.find(b => b.billId === selectedBill);
    if (!bill) return;

    const newCelebration: BillCelebrationEvent = {
      id: `${bill.billId}-${Date.now()}`,
      billId: bill.billId,
      billNumber: bill.billNumber,
      title: bill.title,
      milestone: selectedMilestone as any,
      customMilestone: selectedMilestone === 'custom' ? customMilestone : undefined,
      description: bill.description,
      date: new Date().toISOString(),
      chamber: bill.billNumber.startsWith('HB') ? 'house' : 'senate',
      committeeInfo: selectedMilestone === 'committee_approval' ? committeeInfo : undefined,
      voteCounts: ['passed_chamber', 'passed_legislature'].includes(selectedMilestone) 
        ? { yes: yesVotes, no: noVotes, present: 5, absent: 5 }
        : undefined
    };

    setCelebration(newCelebration);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Bill Progress Celebration Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Configure Celebration</CardTitle>
            <CardDescription>Set up the bill milestone details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bill">Bill</Label>
                <Select value={selectedBill} onValueChange={setSelectedBill}>
                  <SelectTrigger id="bill">
                    <SelectValue placeholder="Select a bill" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_BILLS.map((bill) => (
                      <SelectItem key={bill.billId} value={bill.billId}>
                        {bill.billNumber} - {bill.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="milestone">Milestone</Label>
                <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                  <SelectTrigger id="milestone">
                    <SelectValue placeholder="Select a milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_MILESTONES.map((milestone) => (
                      <SelectItem key={milestone} value={milestone}>
                        {milestone.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMilestone === 'custom' && (
                <div>
                  <Label htmlFor="customMilestone">Custom Milestone Name</Label>
                  <Input
                    id="customMilestone"
                    value={customMilestone}
                    onChange={(e) => setCustomMilestone(e.target.value)}
                    placeholder="Enter custom milestone name"
                  />
                </div>
              )}

              {selectedMilestone === 'committee_approval' && (
                <div>
                  <Label htmlFor="committeeInfo">Committee Information</Label>
                  <Input
                    id="committeeInfo"
                    value={committeeInfo}
                    onChange={(e) => setCommitteeInfo(e.target.value)}
                    placeholder="Committee name"
                  />
                </div>
              )}

              {['passed_chamber', 'passed_legislature'].includes(selectedMilestone) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yesVotes">Yes Votes</Label>
                    <Input
                      id="yesVotes"
                      type="number"
                      value={yesVotes}
                      onChange={(e) => setYesVotes(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="noVotes">No Votes</Label>
                    <Input
                      id="noVotes"
                      type="number"
                      value={noVotes}
                      onChange={(e) => setNoVotes(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger Celebration</CardTitle>
            <CardDescription>Preview and test the celebration notification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p>
                Click the button below to trigger a celebration for the selected bill milestone.
                The notification will appear in the top right corner.
              </p>

              <Button 
                size="lg"
                className="w-full"
                onClick={handleTriggerCelebration}
              >
                Celebrate Bill Progress
              </Button>

              <div className="text-sm text-muted-foreground mt-4">
                <p>This demo allows you to test different milestone celebrations.</p>
                <p className="mt-2">In a real application, these celebrations would be triggered automatically when a bill reaches a significant milestone.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>About Bill Progress Celebrations</CardTitle>
            <CardDescription>Helping users celebrate legislative victories</CardDescription>
          </CardHeader>
          <CardContent className="prose">
            <p>
              The Bill Progress Celebration feature provides visually engaging notifications when bills that users
              are tracking reach significant milestones in the legislative process.
            </p>
            <h3>Features</h3>
            <ul>
              <li><strong>Animated Notifications:</strong> Each celebration features smooth animations and milestone-specific styling</li>
              <li><strong>Confetti Effects:</strong> Virtual confetti creates a celebratory atmosphere</li>
              <li><strong>Milestone Specificity:</strong> Different visuals for different types of milestones</li>
              <li><strong>Vote Information:</strong> When applicable, shows voting results for the milestone</li>
              <li><strong>Auto-dismiss:</strong> Notifications automatically disappear after viewing</li>
            </ul>
            <p>
              This feature helps keep users engaged with the legislative process and provides positive reinforcement
              for their civic participation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* The actual celebration component */}
      <BillProgressCelebration
        celebration={celebration}
        onClose={() => setCelebration(null)}
        autoHideDuration={8000}
      />
    </div>
  );
}