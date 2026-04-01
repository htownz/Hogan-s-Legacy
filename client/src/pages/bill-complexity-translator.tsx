import { BillComplexityTranslator } from '@/components/BillComplexityTranslator';
import { Helmet } from 'react-helmet-async';

export default function BillComplexityTranslatorPage() {
  return (
    <>
      <Helmet>
        <title>AI Bill Translator - Act Up</title>
        <meta name="description" content="Transform complex Texas legislation into plain English with AI-powered translation for everyday citizens" />
      </Helmet>
      <BillComplexityTranslator />
    </>
  );
}