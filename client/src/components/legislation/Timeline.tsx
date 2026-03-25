export type TimelineStepStatus = 'completed' | 'current' | 'upcoming';
export type TimelineStepType = 'filing' | 'committee' | 'floor' | 'governor';

interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: Date;
  status: TimelineStepStatus;
  type: TimelineStepType;
}

interface TimelineProps {
  billNumber: string;
  billTitle: string;
  steps: TimelineStep[];
}

export default function Timeline({ billNumber, steps }: Omit<TimelineProps, 'billTitle'>) {
  return (
    <div className="bg-[#1e2334] rounded-lg p-5 text-white">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-1">{billNumber}</h3>
      </div>
      
      <div className="space-y-2 relative">
        {steps.slice(0, 3).map((step, index) => {
          const isLast = index === 2;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-[#f05a28]' : 'bg-gray-400'} flex-shrink-0`}></div>
              
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute h-full w-0.5 bg-gray-600 left-1.5 top-0 z-0"></div>
              )}
              
              {/* Content */}
              <div className="ml-4">
                <div className={`text-lg ${isCurrent ? 'text-white font-medium' : 'text-gray-300'}`}>
                  {step.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}