import React, { useState } from 'react';
import {
  AnimatedImpactChart,
  PassageProbabilityGauge,
  SupportTrendChart,
  type ImpactDataPoint,
  type PassageProbabilityData,
  type SupportTrendDataPoint
} from '@/components/visualizations';

// Demo data for the visualizations
const demoImpactData: ImpactDataPoint[] = [
  {
    category: 'Economic',
    value: 72,
    description: 'This bill could increase local business revenue in your area by reducing regulatory barriers.',
    sentiment: 'positive'
  },
  {
    category: 'Taxes',
    value: -35,
    description: 'Your tax bracket would be affected by the changes in this legislation, potentially increasing your tax burden.',
    sentiment: 'negative'
  },
  {
    category: 'Healthcare',
    value: 45,
    description: 'Improved access to preventative care services in your region.',
    sentiment: 'positive'
  },
  {
    category: 'Education',
    value: 10,
    description: 'Minimal impact on current educational policies and resources in your district.',
    sentiment: 'neutral'
  },
  {
    category: 'Environment',
    value: -18,
    description: 'Some risk of increased pollution levels near your community.',
    sentiment: 'negative'
  }
];

const demoProbabilityData: PassageProbabilityData = {
  probability: 0.68,
  confidenceScore: 0.82,
  reasoningFactors: [
    'Strong bipartisan support in committee votes',
    'Similar legislation has passed in recent sessions',
    'Currently has 3 influential co-sponsors',
    'Economic analysis shows minimal budget impact',
    'No significant special interest opposition detected'
  ]
};

// Generate dates for the last 6 months
const generateDates = () => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(today.getMonth() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const demoTrendData: SupportTrendDataPoint[] = generateDates().map((date, index) => {
  // Simulate changing trends
  let supportBase = 30 + index * 5; // Increasing support over time
  let oppositionBase = 50 - index * 3; // Decreasing opposition
  
  // Add some variation
  supportBase += Math.random() * 10 - 5;
  oppositionBase += Math.random() * 10 - 5;
  
  // Calculate neutral as the remainder, ensuring all add up to 100
  const support = Math.round(supportBase);
  const opposition = Math.round(oppositionBase);
  const neutral = 100 - support - opposition;
  
  return {
    date,
    supportPercentage: support,
    oppositionPercentage: opposition,
    neutralPercentage: neutral,
    totalCount: 1200 + index * 300, // Increasing number of responses
    event: index === 2 ? 'Committee hearing' : (index === 4 ? 'Major news coverage' : undefined)
  };
});

const VisualizationDemo = () => {
  const [animate, setAnimate] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Visualization Components</h1>
        <p className="text-gray-600">
          Interactive, animated visualizations for legislation data
        </p>
        <button 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => setAnimate(true)}
        >
          Re-run animations
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">1. Personal Impact Analysis</h2>
          <p className="text-gray-600 mb-4">
            Shows how legislation affects a user personally across different categories
          </p>
          <AnimatedImpactChart 
            data={demoImpactData} 
            animate={animate}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">2. Passage Probability Gauge</h2>
          <p className="text-gray-600 mb-4">
            Visualizes the likelihood of a bill passing with confidence metrics
          </p>
          <PassageProbabilityGauge 
            data={demoProbabilityData} 
            animate={animate}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">3. Support Trend Chart</h2>
        <p className="text-gray-600 mb-4">
          Tracks how support for legislation has changed over time
        </p>
        <SupportTrendChart 
          data={demoTrendData} 
          animate={animate}
          height={300}
        />
      </div>

      <div className="mt-16 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Implementation Notes</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            All visualizations are built using <strong>Framer Motion</strong> for smooth animations
          </li>
          <li>
            Components are fully responsive and work on mobile and desktop
          </li>
          <li>
            Interactive features include hover effects, tooltips, and animated transitions
          </li>
          <li>
            Each component accepts customizable props for easy integration
          </li>
          <li>
            Color schemes reflect sentiment (positive/negative/neutral) with accessible contrast
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VisualizationDemo;