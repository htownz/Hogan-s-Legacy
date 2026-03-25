import React from 'react';
import { VoiceSearch } from '../components/voice/VoiceSearch';
import { Helmet } from 'react-helmet';

export default function VoiceSearchPage() {
  return (
    <>
      <Helmet>
        <title>Voice Search - Act Up</title>
        <meta name="description" content="Search for bills using your voice on Act Up, making legislative information more accessible." />
      </Helmet>
      
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Voice-Activated Bill Search</h1>
            
            <div className="mb-8">
              <p className="text-gray-700 mb-4">
                Our voice search feature allows you to easily find and interact with Texas legislative bills using natural voice commands.
                Simply speak your query, and we'll help you find what you're looking for.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h3 className="text-lg font-medium text-blue-700">Example Voice Commands:</h3>
                <ul className="list-disc pl-5 mt-2 text-blue-800">
                  <li>"Search for bills about education"</li>
                  <li>"Find House Bill 1"</li>
                  <li>"Show me Senate Bill 100"</li>
                  <li>"Summarize HB 10"</li>
                  <li>"What is SB 20?"</li>
                </ul>
              </div>
            </div>
            
            <VoiceSearch standalone={true} />
            
            <div className="mt-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">How Voice Search Works</h2>
              <p className="mb-4">
                Our voice search uses your device's built-in speech recognition to convert your spoken words into text.
                We then analyze your request to determine what you're looking for, whether it's searching for bills by topic
                or accessing a specific bill by number.
              </p>
              <p className="text-sm text-gray-500">
                Note: Voice search works best in a quiet environment with a clear speaking voice.
                This feature requires microphone access and is available on most modern browsers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}