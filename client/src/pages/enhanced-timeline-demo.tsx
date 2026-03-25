import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import EnhancedLegislativeTimeline from '@/components/legislation/EnhancedLegislativeTimeline';
import { TimelineEvent } from '@/components/legislation/LegislativeTimeline';

// Sample bills with timeline events
const DEMO_BILLS = [
  {
    id: 'tx-hb42',
    billNumber: 'HB 42',
    title: 'Texas Comprehensive Education Reform Act',
    events: [
      {
        id: 'tx-hb42-intro',
        date: '2025-01-15T10:00:00Z',
        title: 'Introduction in House',
        description: 'The bill was introduced in the House by Representative Johnson and referred to the Education Committee.',
        eventType: 'introduction',
        chamber: 'house'
      },
      {
        id: 'tx-hb42-committee-hearing',
        date: '2025-02-03T14:30:00Z',
        title: 'House Education Committee Hearing',
        description: 'The House Education Committee held a public hearing where 23 witnesses testified, with most in support of the bill\'s teacher pay provisions but concerns raised about the standardized testing requirements.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Education Committee',
        mediaLink: 'https://example.com/committee-video',
        mediaType: 'video'
      },
      {
        id: 'tx-hb42-committee-vote',
        date: '2025-02-17T11:15:00Z',
        title: 'House Education Committee Vote',
        description: 'The House Education Committee voted to advance the bill with several amendments addressing concerns about testing requirements for special education students.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Education Committee',
        voteInfo: {
          yes: 9,
          no: 3,
          present: 1,
          absent: 0
        }
      },
      {
        id: 'tx-hb42-house-floor',
        date: '2025-03-05T09:45:00Z',
        title: 'House Floor Debate',
        description: 'The House debated the bill for over three hours, with proponents arguing it would improve teacher recruitment and student outcomes, while opponents expressed concern about funding mechanisms.',
        eventType: 'floor_vote',
        chamber: 'house'
      },
      {
        id: 'tx-hb42-house-vote',
        date: '2025-03-05T13:20:00Z',
        title: 'House Floor Vote',
        description: 'The House passed the bill with bipartisan support after adopting three amendments related to school funding formulas.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 98,
          no: 47,
          present: 3,
          absent: 2
        },
        impactSummary: 'Passage in the House sets the stage for Senate consideration, which could lead to increased education funding and new teacher qualification standards affecting thousands of educators.'
      },
      {
        id: 'tx-hb42-senate-referred',
        date: '2025-03-08T11:00:00Z',
        title: 'Referred to Senate Education Committee',
        description: 'The bill was received in the Senate and referred to the Senate Education Committee.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Education Committee'
      },
      {
        id: 'tx-hb42-senate-hearing',
        date: '2025-03-22T10:00:00Z',
        title: 'Senate Education Committee Hearing',
        description: 'The Senate Education Committee held a hearing on the bill, with testimony from education officials, teachers\' unions, and parent organizations.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Education Committee',
        mediaLink: 'https://example.com/senate-hearing',
        mediaType: 'video'
      },
      {
        id: 'tx-hb42-senate-vote',
        date: '2025-04-02T14:30:00Z',
        title: 'Senate Floor Vote',
        description: 'After adding two amendments focused on rural school funding, the Senate passed the bill.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 19,
          no: 12,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-hb42-house-concurrence',
        date: '2025-04-10T15:45:00Z',
        title: 'House Concurrence with Senate Amendments',
        description: 'The House voted to accept the Senate amendments, sending the bill to the Governor.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 92,
          no: 53,
          present: 2,
          absent: 3
        }
      },
      {
        id: 'tx-hb42-governor-signed',
        date: '2025-04-28T11:30:00Z',
        title: 'Signed by Governor',
        description: 'The Governor signed the bill into law at a ceremony attended by education leaders, teachers, and students from across the state.',
        eventType: 'signature',
        chamber: 'governor',
        mediaLink: 'https://example.com/signing-ceremony',
        mediaType: 'image',
        impactSummary: 'The new law will increase teacher salaries by an average of 6%, reform standardized testing, and provide additional funding for school districts with high numbers of economically disadvantaged students.'
      },
      {
        id: 'tx-hb42-effective',
        date: '2025-09-01T00:00:00Z',
        title: 'Law Takes Effect',
        description: 'The Texas Comprehensive Education Reform Act takes effect at the start of the new school year, introducing significant changes to education funding and teacher certification requirements.',
        eventType: 'effective',
        chamber: 'house',
        impactSummary: 'School districts begin implementing the new standards and funding formulas, affecting approximately 5.4 million students and 350,000 teachers across Texas.'
      }
    ]
  },
  {
    id: 'tx-sb17',
    billNumber: 'SB 17',
    title: 'Texas Renewable Energy Expansion Act',
    events: [
      {
        id: 'tx-sb17-intro',
        date: '2025-01-10T10:00:00Z',
        title: 'Introduction in Senate',
        description: 'Senator Martinez introduced the Texas Renewable Energy Expansion Act, which was referred to the Senate Energy Committee.',
        eventType: 'introduction',
        chamber: 'senate'
      },
      {
        id: 'tx-sb17-committee',
        date: '2025-01-25T14:00:00Z',
        title: 'Senate Energy Committee Hearing',
        description: 'The Senate Energy Committee held a public hearing with testimony from energy industry representatives, environmental groups, and consumer advocates.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Energy Committee',
        mediaLink: 'https://example.com/energy-hearing',
        mediaType: 'video'
      },
      {
        id: 'tx-sb17-committee-vote',
        date: '2025-02-08T10:30:00Z',
        title: 'Senate Committee Vote',
        description: 'The Senate Energy Committee voted to advance the bill with amendments strengthening renewable energy targets.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Energy Committee',
        voteInfo: {
          yes: 7,
          no: 4,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-sb17-senate-vote',
        date: '2025-02-20T13:15:00Z',
        title: 'Senate Floor Vote',
        description: 'After debate focusing on economic impacts and grid reliability, the Senate passed the bill with several amendments.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 18,
          no: 13,
          present: 0,
          absent: 0
        },
        impactSummary: 'The bill would increase renewable energy targets for the state\'s power grid and provide tax incentives for clean energy development.'
      },
      {
        id: 'tx-sb17-house-committee',
        date: '2025-03-10T09:00:00Z',
        title: 'House Energy Resources Committee Hearing',
        description: 'The House Energy Resources Committee held hearings on the bill, focusing on implementation costs and potential rate impacts.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Energy Resources Committee',
        mediaLink: 'https://example.com/house-energy-hearing',
        mediaType: 'document'
      },
      {
        id: 'tx-sb17-house-amendments',
        date: '2025-03-22T11:45:00Z',
        title: 'House Committee Amendments',
        description: 'The House committee added several amendments to protect consumers from potential rate increases and ensure grid reliability.',
        eventType: 'amendment',
        chamber: 'house',
        committeeInfo: 'House Energy Resources Committee'
      },
      {
        id: 'tx-sb17-house-vote',
        date: '2025-04-15T14:30:00Z',
        title: 'House Floor Vote',
        description: 'After extensive debate, the House passed an amended version of the bill with changes to implementation timelines and consumer protections.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 80,
          no: 70,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-sb17-conference',
        date: '2025-04-28T16:00:00Z',
        title: 'Conference Committee Appointed',
        description: 'With differences between the House and Senate versions, a conference committee was appointed to reconcile the bill.',
        eventType: 'committee',
        chamber: 'house'
      },
      {
        id: 'tx-sb17-conference-report',
        date: '2025-05-10T15:30:00Z',
        title: 'Conference Committee Report',
        description: 'The conference committee produced a compromise version of the bill, balancing renewable energy goals with consumer protections.',
        eventType: 'amendment',
        chamber: 'senate',
        mediaLink: 'https://example.com/conference-report',
        mediaType: 'document'
      },
      {
        id: 'tx-sb17-house-final',
        date: '2025-05-15T13:00:00Z',
        title: 'House Approval of Conference Report',
        description: 'The House approved the conference committee report, sending the compromise bill forward.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 85,
          no: 65,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-sb17-senate-final',
        date: '2025-05-18T11:30:00Z',
        title: 'Senate Approval of Conference Report',
        description: 'The Senate approved the conference committee report, sending the bill to the Governor.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 16,
          no: 15,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-sb17-governor-signed',
        date: '2025-06-10T14:00:00Z',
        title: 'Signed by Governor',
        description: 'The Governor signed the Texas Renewable Energy Expansion Act into law, committing the state to higher renewable energy standards.',
        eventType: 'signature',
        chamber: 'governor',
        mediaLink: 'https://example.com/renewable-signing',
        mediaType: 'image',
        impactSummary: 'The new law aims to increase Texas renewable energy capacity by 40% over 10 years and is expected to create an estimated 25,000 clean energy jobs.'
      },
      {
        id: 'tx-sb17-effective',
        date: '2025-09-01T00:00:00Z',
        title: 'Law Takes Effect',
        description: 'The Texas Renewable Energy Expansion Act takes effect, beginning a phased implementation of new renewable energy targets and incentives.',
        eventType: 'effective',
        chamber: 'senate',
        impactSummary: 'Energy providers must begin planning for increased renewable capacity, with the first benchmarks due in 18 months.'
      }
    ]
  },
  {
    id: 'tx-hb108',
    billNumber: 'HB 108',
    title: 'Texas Digital Privacy Protection Act',
    events: [
      {
        id: 'tx-hb108-intro',
        date: '2025-01-12T11:30:00Z',
        title: 'Introduction in House',
        description: 'Representative Chen introduced the Texas Digital Privacy Protection Act, which was referred to the House Technology Committee.',
        eventType: 'introduction',
        chamber: 'house'
      },
      {
        id: 'tx-hb108-committee',
        date: '2025-02-05T09:30:00Z',
        title: 'House Technology Committee Hearing',
        description: 'The House Technology Committee held a hearing with testimony from privacy experts, technology companies, and consumer advocates regarding data protection standards.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Technology Committee',
        mediaLink: 'https://example.com/privacy-hearing',
        mediaType: 'video'
      },
      {
        id: 'tx-hb108-amendments',
        date: '2025-02-20T13:45:00Z',
        title: 'Committee Amendments',
        description: 'The committee adopted several amendments to strengthen enforcement provisions and clarify consumer opt-out mechanisms.',
        eventType: 'amendment',
        chamber: 'house',
        committeeInfo: 'House Technology Committee'
      },
      {
        id: 'tx-hb108-committee-vote',
        date: '2025-02-28T10:15:00Z',
        title: 'Committee Vote',
        description: 'The House Technology Committee voted to advance the bill to the full House.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Technology Committee',
        voteInfo: {
          yes: 11,
          no: 2,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-hb108-house-vote',
        date: '2025-03-15T14:00:00Z',
        title: 'House Floor Vote',
        description: 'After debate focused on balancing innovation with consumer protection, the House passed the bill with bipartisan support.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 120,
          no: 28,
          present: 1,
          absent: 1
        },
        impactSummary: 'If enacted, the bill would establish new data privacy rights for Texas consumers and create new compliance requirements for businesses collecting personal data.'
      },
      {
        id: 'tx-hb108-senate-committee',
        date: '2025-03-30T10:30:00Z',
        title: 'Senate Business & Commerce Committee Hearing',
        description: 'The Senate committee held hearings on the bill, with technology industry representatives expressing concerns about implementation timelines.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Business & Commerce Committee',
        mediaLink: 'https://example.com/senate-privacy-hearing',
        mediaType: 'document'
      },
      {
        id: 'tx-hb108-senate-amendments',
        date: '2025-04-10T15:30:00Z',
        title: 'Senate Committee Amendments',
        description: 'The Senate committee adopted amendments to extend implementation deadlines and modify enforcement provisions.',
        eventType: 'amendment',
        chamber: 'senate',
        committeeInfo: 'Senate Business & Commerce Committee'
      },
      {
        id: 'tx-hb108-senate-vote',
        date: '2025-04-25T13:45:00Z',
        title: 'Senate Floor Vote',
        description: 'The Senate passed an amended version of the bill after debate about the proper role of government in regulating data privacy.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 21,
          no: 10,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-hb108-house-reject',
        date: '2025-05-05T11:00:00Z',
        title: 'House Rejects Senate Amendments',
        description: 'The House voted not to concur with Senate amendments, particularly objecting to extended implementation timelines.',
        eventType: 'amendment',
        chamber: 'house'
      },
      {
        id: 'tx-hb108-conference',
        date: '2025-05-10T09:00:00Z',
        title: 'Conference Committee Appointed',
        description: 'A conference committee was appointed to reconcile differences between the House and Senate versions.',
        eventType: 'committee',
        chamber: 'house'
      },
      {
        id: 'tx-hb108-conference-report',
        date: '2025-05-20T16:30:00Z',
        title: 'Conference Committee Report',
        description: 'The conference committee produced a compromise version with phased implementation timelines and strengthened enforcement provisions.',
        eventType: 'amendment',
        chamber: 'house',
        mediaLink: 'https://example.com/privacy-compromise',
        mediaType: 'document'
      },
      {
        id: 'tx-hb108-house-final',
        date: '2025-05-25T10:15:00Z',
        title: 'House Approval of Conference Report',
        description: 'The House approved the conference committee report.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 110,
          no: 35,
          present: 2,
          absent: 3
        }
      }
    ]
  }
];

export default function EnhancedTimelineDemoPage() {
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical' | 'auto'>('auto');

  const handleLayoutChange = (mode: 'horizontal' | 'vertical' | 'auto') => {
    setLayoutMode(mode);
  };

  return (
    <div>
      {/* Simple header for demo page */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
              </svg>
              <span className="ml-2 text-2xl font-bold text-primary-500">Act Up</span>
              <Link href="/">
                <Button variant="ghost" size="sm" className="ml-6">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    
      <div className="container mx-auto py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Responsive Legislative Timeline Visualization</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About This Feature</CardTitle>
            <CardDescription>
              Track a bill's journey through the legislative process with our adaptive timeline visualization
            </CardDescription>
          </CardHeader>
          <CardContent className="prose">
            <p>
              The Responsive Legislative Timeline Visualization provides an engaging way to follow bills through the Texas Legislature.
              The timeline adapts to both desktop (horizontal) and mobile (vertical) views, offering a consistent experience across devices.
            </p>
            
            <h3>Key Features</h3>
            <ul>
              <li><strong>Adaptive Layout:</strong> Automatically switches between horizontal (desktop) and vertical (mobile) views</li>
              <li><strong>Interactive Milestones:</strong> Each event in the timeline is expandable to show detailed information</li>
              <li><strong>Rich Content:</strong> Integrates documents, videos, and images related to legislative events</li>
              <li><strong>Vote Visualizations:</strong> Clear graphical representation of voting results</li>
              <li><strong>Impact Insights:</strong> Highlights the potential real-world effects of legislative changes</li>
              <li><strong>Auto-Play Mode:</strong> Automatically progress through timeline events</li>
            </ul>
            
            <div className="not-prose flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border mt-6">
              <div>
                <h4 className="text-sm font-medium mb-1">Timeline Display Options</h4>
                <p className="text-xs text-gray-600">Choose how you'd like to view the timeline visualization</p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={layoutMode === 'horizontal' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleLayoutChange('horizontal')}
                  >
                    Horizontal
                  </Button>
                  
                  <Button 
                    variant={layoutMode === 'vertical' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleLayoutChange('vertical')}
                  >
                    Vertical
                  </Button>
                  
                  <Button 
                    variant={layoutMode === 'auto' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleLayoutChange('auto')}
                  >
                    Responsive
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue={DEMO_BILLS[0].id} className="w-full">
          <TabsList className="mb-4">
            {DEMO_BILLS.map(bill => (
              <TabsTrigger key={bill.id} value={bill.id}>
                {bill.billNumber}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {DEMO_BILLS.map(bill => (
            <TabsContent key={bill.id} value={bill.id}>
              <Card>
                <CardContent className="pt-6">
                  <EnhancedLegislativeTimeline
                    billId={bill.id}
                    billNumber={bill.billNumber}
                    billTitle={bill.title}
                    events={bill.events as TimelineEvent[]}
                    layout={layoutMode}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm">
          <h3 className="font-semibold text-blue-800 mb-2">Implementation Notes</h3>
          <p className="text-blue-700 mb-2">
            In the full Act Up application, this feature will be integrated with real-time legislative data from
            the Texas Legislature Online API and committee video services.
          </p>
          <p className="text-blue-700">
            The timeline will automatically update as bills progress through the legislature, and users
            can receive notifications when important milestones are reached for bills they're tracking.
          </p>
        </div>
      </div>
    </div>
  );
}