import { InteractiveBillComparison } from '@/components/InteractiveBillComparison';
import { Helmet } from 'react-helmet-async';

export default function BillComparisonPage() {
  return (
    <>
      <Helmet>
        <title>Interactive Bill Comparison - Act Up</title>
        <meta name="description" content="Compare Texas bills side-by-side with AI-powered analysis and interactive slider comparison tools" />
      </Helmet>
      <InteractiveBillComparison />
    </>
  );
}