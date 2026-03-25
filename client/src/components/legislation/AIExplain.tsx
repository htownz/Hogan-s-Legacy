interface AIExplainProps {
  billNumber: string;
  billTitle: string;
  zipCode: string;
  interests: string[];
}

// This is a simplified dark-themed version with static content
export default function AIExplain(_props: Partial<AIExplainProps>) {
  
  return (
    <div className="bg-[#1e2334] rounded-lg p-5 text-white">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-1">Impact Summary</h3>
      </div>
        
      <div className="bg-indigo-800 bg-opacity-50 p-5 rounded-lg">
        <p className="text-white text-lg">
          This bill may limit healthcare access within your ZIP code and could impact local education funding.
        </p>
      </div>
    </div>
  );
}