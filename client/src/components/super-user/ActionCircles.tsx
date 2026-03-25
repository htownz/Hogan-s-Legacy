// @ts-nocheck
import { useState, useEffect } from "react";
import { ActionCircle, ActionCircleMember } from "@shared/schema";
import { ActionCircleWithMembers } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface ActionCircleCardProps {
  circle: ActionCircleWithMembers;
  onViewCircle: (circleId: number) => void;
}

function ActionCircleCard({ circle, onViewCircle }: ActionCircleCardProps) {
  // Get icon based on icon type
  const getCircleIcon = (iconType: string) => {
    switch (iconType) {
      case "water":
        return (
          <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
          </svg>
        );
      case "education":
        return (
          <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
    }
  };

  // Get badge color based on recent actions
  const getActionBadgeClass = (recentActions: number) => {
    if (recentActions >= 5) {
      return "bg-purple-100 text-purple-800";
    }
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0 h-10 w-10">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${circle.iconType === 'water' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {getCircleIcon(circle.iconType)}
          </div>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">{circle.name}</h3>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">{circle.memberCount} members</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-sm text-gray-500">{circle.active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{circle.description}</p>
      <div className="flex flex-wrap -ml-1 mb-4">
        <div className="flex -space-x-2 ml-1">
          {circle.members.slice(0, 3).map((member: any) => (
            <img 
              key={member.id}
              className="h-6 w-6 rounded-full ring-2 ring-white" 
              src={member.avatarUrl || `https://ui-avatars.com/api/?name=User&background=random`} 
              alt="Member" 
            />
          ))}
          {circle.members.length > 3 && (
            <div className="h-6 w-6 rounded-full ring-2 ring-white flex items-center justify-center bg-gray-200 text-xs font-medium text-gray-500">
              +{circle.members.length - 3}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(circle.recentActions)}`}>
            {circle.recentActions} recent {circle.recentActions === 1 ? 'action' : 'actions'}
          </span>
        </div>
        <Button 
          variant="ghost" 
          className="text-primary text-sm font-medium hover:text-primary-dark"
          onClick={() => onViewCircle(circle.id)}
        >
          View Circle
        </Button>
      </div>
    </div>
  );
}

export default function ActionCircles() {
  const { user } = useUser();
  const [actionCircles, setActionCircles] = useState<ActionCircleWithMembers[]>([]);

  useEffect(() => {
    // In a real app, we would fetch from API
    // For demo, use static data
    const mockActionCircles: ActionCircleWithMembers[] = [
      {
        id: 1,
        name: "Austin Water Rights",
        description: "Tracking and informing public about water rights legislation affecting Austin communities.",
        iconType: "water",
        memberCount: 8,
        active: true,
        recentActions: 3,
        createdAt: new Date(),
        members: [
          { id: 1, avatarUrl: "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
          { id: 2, avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
          { id: 3, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" },
          { id: 4, avatarUrl: undefined },
          { id: 5, avatarUrl: undefined },
          { id: 6, avatarUrl: undefined },
          { id: 7, avatarUrl: undefined },
          { id: 8, avatarUrl: undefined },
        ]
      },
      {
        id: 2,
        name: "Education Funding Watch",
        description: "Tracking legislation related to public education funding and providing verified information.",
        iconType: "education",
        memberCount: 12,
        active: true,
        recentActions: 5,
        createdAt: new Date(),
        members: [
          { id: 1, avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
          { id: 2, avatarUrl: "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
          { id: 3, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" },
          { id: 4, avatarUrl: undefined },
          { id: 5, avatarUrl: undefined },
          { id: 6, avatarUrl: undefined },
          { id: 7, avatarUrl: undefined },
          { id: 8, avatarUrl: undefined },
          { id: 9, avatarUrl: undefined },
          { id: 10, avatarUrl: undefined },
          { id: 11, avatarUrl: undefined },
          { id: 12, avatarUrl: undefined },
        ]
      }
    ];

    setActionCircles(mockActionCircles);
  }, [user]);

  const handleViewCircle = (circleId: number) => {
    console.log(`Viewing circle with ID: ${circleId}`);
    // In a real app, navigate to circle detail page
  };

  const handleCreateCircle = () => {
    console.log("Creating new circle");
    // In a real app, open modal or navigate to create page
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your Action Circles</h2>
        <div className="mt-2 md:mt-0">
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary-dark"
            onClick={handleCreateCircle}
          >
            Create New Circle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionCircles.map((circle) => (
          <ActionCircleCard
            key={circle.id}
            circle={circle}
            onViewCircle={handleViewCircle}
          />
        ))}
      </div>
    </div>
  );
}
