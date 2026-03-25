import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LegislativeTimeline, { TimelineEvent } from '@/components/legislation/LegislativeTimeline';

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
        description: 'The House debated the bill for over 4 hours, with 12 amendments proposed. Seven amendments were adopted, including additional funding for rural schools.',
        eventType: 'floor_vote',
        chamber: 'house',
        impactSummary: 'The amendments strengthened teacher pay provisions and increased support for rural districts.'
      },
      {
        id: 'tx-hb42-house-passage',
        date: '2025-03-05T15:30:00Z',
        title: 'Passed by House',
        description: 'The bill passed the House with bipartisan support, though several representatives expressed concerns about implementation costs.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 98,
          no: 47,
          present: 3,
          absent: 2
        }
      },
      {
        id: 'tx-hb42-senate-committee',
        date: '2025-03-20T13:00:00Z',
        title: 'Senate Education Committee Hearing',
        description: 'The Senate Education Committee held hearings with testimony from education officials, teacher organizations, and parent groups.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Education Committee'
      },
      {
        id: 'tx-hb42-senate-committee-vote',
        date: '2025-04-02T10:30:00Z',
        title: 'Senate Education Committee Vote',
        description: 'The Senate Education Committee voted to advance the bill with additional amendments related to teacher certification and school accountability measures.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Education Committee',
        voteInfo: {
          yes: 7,
          no: 4,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-hb42-senate-floor',
        date: '2025-04-15T14:00:00Z',
        title: 'Senate Floor Debate',
        description: 'The Senate debated the bill extensively with particular focus on funding mechanisms and property tax implications.',
        eventType: 'floor_vote',
        chamber: 'senate'
      },
      {
        id: 'tx-hb42-senate-passage',
        date: '2025-04-15T19:15:00Z',
        title: 'Passed by Senate with Amendments',
        description: 'The Senate passed an amended version of the bill requiring the House to either accept Senate changes or form a conference committee to reconcile differences.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 19,
          no: 12,
          present: 0,
          absent: 0
        },
        impactSummary: 'Senate amendments reduced implementation costs but scaled back some teacher pay provisions.'
      },
      {
        id: 'tx-hb42-conference',
        date: '2025-04-28T11:00:00Z',
        title: 'Conference Committee Formed',
        description: 'A conference committee with 5 representatives and 5 senators was formed to reconcile differences between House and Senate versions.',
        eventType: 'committee',
        committeeInfo: 'Conference Committee'
      },
      {
        id: 'tx-hb42-conference-report',
        date: '2025-05-10T16:45:00Z',
        title: 'Conference Committee Report',
        description: 'The conference committee issued its report with compromises on teacher pay, testing requirements, and implementation timelines.',
        eventType: 'committee',
        committeeInfo: 'Conference Committee',
        mediaLink: 'https://example.com/conference-report.pdf',
        mediaType: 'document'
      },
      {
        id: 'tx-hb42-house-concurrence',
        date: '2025-05-15T10:30:00Z',
        title: 'House Approves Conference Report',
        description: 'The House voted to approve the conference committee report, accepting the compromise bill.',
        eventType: 'passage',
        chamber: 'house',
        voteInfo: {
          yes: 102,
          no: 43,
          present: 3,
          absent: 2
        }
      },
      {
        id: 'tx-hb42-senate-concurrence',
        date: '2025-05-18T15:15:00Z',
        title: 'Senate Approves Conference Report',
        description: 'The Senate voted to approve the conference committee report, sending the bill to the Governor.',
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
        id: 'tx-hb42-governor-signature',
        date: '2025-06-01T11:00:00Z',
        title: 'Signed by Governor',
        description: 'Governor signed the Texas Comprehensive Education Reform Act in a ceremony with educational stakeholders.',
        eventType: 'signature',
        chamber: 'governor',
        mediaLink: 'https://example.com/signing-ceremony.jpg',
        mediaType: 'image'
      },
      {
        id: 'tx-hb42-effective',
        date: '2025-09-01T00:00:00Z',
        title: 'Law Takes Effect',
        description: 'The Texas Comprehensive Education Reform Act takes effect, though some provisions have phased implementation over 3 years.',
        eventType: 'effective',
        impactSummary: 'School districts begin implementing teacher pay raises immediately, while new curriculum standards will phase in over the next 3 school years.'
      }
    ]
  },
  {
    id: 'tx-sb101',
    billNumber: 'SB 101',
    title: 'Texas Health Insurance Expansion Act',
    events: [
      {
        id: 'tx-sb101-intro',
        date: '2025-01-12T09:30:00Z',
        title: 'Introduction in Senate',
        description: 'Bill was introduced in the Senate by Senator Martinez and referred to the Health & Human Services Committee.',
        eventType: 'introduction',
        chamber: 'senate'
      },
      {
        id: 'tx-sb101-committee',
        date: '2025-02-05T13:00:00Z',
        title: 'Senate Health Committee Hearing',
        description: 'The Senate Health & Human Services Committee held a hearing with testimony from healthcare providers, patient advocates, and insurance industry representatives.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Health & Human Services Committee'
      },
      {
        id: 'tx-sb101-amendment',
        date: '2025-02-20T10:15:00Z',
        title: 'Committee Amendments',
        description: 'The committee adopted several amendments to address concerns about cost and implementation timeline.',
        eventType: 'amendment',
        chamber: 'senate',
        committeeInfo: 'Senate Health & Human Services Committee'
      },
      {
        id: 'tx-sb101-committee-vote',
        date: '2025-02-20T16:45:00Z',
        title: 'Committee Vote',
        description: 'The Senate Health & Human Services Committee voted to advance the bill with amendments.',
        eventType: 'committee',
        chamber: 'senate',
        committeeInfo: 'Senate Health & Human Services Committee',
        voteInfo: {
          yes: 6,
          no: 5,
          present: 0,
          absent: 0
        }
      },
      {
        id: 'tx-sb101-senate-debate',
        date: '2025-03-10T10:00:00Z',
        title: 'Senate Floor Debate',
        description: 'The Senate debated the bill with particularly contentious discussion around coverage mandates and funding mechanisms.',
        eventType: 'floor_vote',
        chamber: 'senate'
      },
      {
        id: 'tx-sb101-senate-passage',
        date: '2025-03-10T17:30:00Z',
        title: 'Senate Passage',
        description: 'The bill passed the Senate by a narrow margin after nearly 7 hours of debate.',
        eventType: 'passage',
        chamber: 'senate',
        voteInfo: {
          yes: 16,
          no: 15,
          present: 0,
          absent: 0
        },
        impactSummary: 'Bill would expand health insurance coverage to approximately 850,000 additional Texans.'
      },
      {
        id: 'tx-sb101-house-committee',
        date: '2025-03-25T14:00:00Z',
        title: 'House Insurance Committee Hearing',
        description: 'The House Insurance Committee held hearings on the Senate-passed bill with extensive public testimony.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Insurance Committee',
        mediaLink: 'https://example.com/house-hearing.mp4',
        mediaType: 'video'
      }
      // Additional events would continue the journey
    ]
  },
  {
    id: 'tx-hb255',
    billNumber: 'HB 255',
    title: 'Environmental Protection Standards Act',
    events: [
      {
        id: 'tx-hb255-intro',
        date: '2025-01-18T11:15:00Z',
        title: 'Introduction in House',
        description: 'The bill was introduced by Representative Garcia and referred to the Environmental Regulation Committee.',
        eventType: 'introduction',
        chamber: 'house'
      },
      {
        id: 'tx-hb255-committee-hearing',
        date: '2025-02-10T09:00:00Z',
        title: 'Committee Public Hearing',
        description: 'The House Environmental Regulation Committee held a public hearing with testimony from environmental groups, industry representatives, and regulatory experts.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Environmental Regulation Committee'
      },
      {
        id: 'tx-hb255-subcommittee',
        date: '2025-02-24T14:30:00Z',
        title: 'Subcommittee Workgroup',
        description: 'A special subcommittee met to develop technical amendments to standards provisions based on stakeholder feedback.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Environmental Regulation Subcommittee on Air Quality'
      },
      {
        id: 'tx-hb255-amendment',
        date: '2025-03-03T13:45:00Z',
        title: 'Amendments Adopted',
        description: 'The committee adopted 12 amendments after extended discussion on implementation timelines and compliance mechanisms.',
        eventType: 'amendment',
        chamber: 'house',
        committeeInfo: 'House Environmental Regulation Committee',
        impactSummary: 'Amendments balanced industry compliance concerns with environmental protection goals.'
      },
      {
        id: 'tx-hb255-committee-vote',
        date: '2025-03-03T16:15:00Z',
        title: 'Committee Vote',
        description: 'The House Environmental Regulation Committee voted to advance the amended bill.',
        eventType: 'committee',
        chamber: 'house',
        committeeInfo: 'House Environmental Regulation Committee',
        voteInfo: {
          yes: 7,
          no: 4,
          present: 0,
          absent: 1
        }
      }
      // Additional events would continue the journey
    ]
  }
];

export default function LegislativeTimelineDemoPage() {
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
                <a className="ml-6">
                  <Button variant="ghost" size="sm">
                    Back to Home
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>
    
      <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Interactive Legislative Timeline Storyteller</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About This Feature</CardTitle>
          <CardDescription>
            Visualize the complete journey of a bill through the legislative process
          </CardDescription>
        </CardHeader>
        <CardContent className="prose">
          <p>
            The Interactive Legislative Timeline Storyteller provides an engaging way to understand how bills move through 
            the Texas Legislature. Each bill's journey is presented as a captivating story with key events, votes, 
            amendments, and impacts clearly visualized.
          </p>
          
          <h3>Key Features</h3>
          <ul>
            <li><strong>Chronological Timeline:</strong> Follow a bill from introduction to becoming law</li>
            <li><strong>Vote Visualizations:</strong> See how legislators voted at each key stage</li>
            <li><strong>Impact Analysis:</strong> Understand the real-world effects of legislative changes</li>
            <li><strong>Committee Insights:</strong> Track a bill's journey through various committees</li>
            <li><strong>Media Integration:</strong> Access related videos, documents, and images</li>
            <li><strong>Interactive Navigation:</strong> Explore each stage at your own pace or use auto-play mode</li>
          </ul>
          
          <p>
            Below are example timelines for several bills. Select different bills from the tabs to 
            see their unique legislative journeys.
          </p>
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
                <LegislativeTimeline
                  billId={bill.id}
                  billNumber={bill.billNumber}
                  billTitle={bill.title}
                  events={bill.events as TimelineEvent[]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Integration with Act Up</CardTitle>
        </CardHeader>
        <CardContent className="prose">
          <p>
            In the full Act Up application, this feature will be integrated with real-time legislative data, allowing users to:
          </p>
          
          <ul>
            <li>Follow the progress of bills they're tracking</li>
            <li>Receive notifications when a bill reaches a new stage</li>
            <li>Share specific milestones with their network</li>
            <li>Access related committee videos and documents directly</li>
            <li>View insights on how legislative changes might impact their communities</li>
          </ul>
          
          <p>
            The timeline data shown in this demo is representative of how real bills move through the Texas Legislature, 
            though the specific dates and details are simulated for demonstration purposes.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}