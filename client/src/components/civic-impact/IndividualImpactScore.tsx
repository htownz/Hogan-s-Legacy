import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Award, TrendingUp, Users } from 'lucide-react';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

interface IndividualImpactScoreProps {
  userScore: number;
  communityAverage: number;
  userRank: number;
  totalUsers: number;
  userCategoryScores: {
    category: string;
    score: number;
    communityAverage: number;
  }[];
  className?: string;
}

export default function IndividualImpactScore({
  userScore,
  communityAverage,
  userRank,
  totalUsers,
  userCategoryScores,
  className = ''
}: IndividualImpactScoreProps) {
  // Calculate percentile rank
  const percentileRank = 100 - Math.round((userRank / totalUsers) * 100);
  
  // Format rank with suffix (1st, 2nd, 3rd, etc.)
  const formatRank = (rank: number) => {
    if (rank % 100 === 11 || rank % 100 === 12 || rank % 100 === 13) {
      return `${rank}th`;
    }
    switch (rank % 10) {
      case 1: return `${rank}st`;
      case 2: return `${rank}nd`;
      case 3: return `${rank}rd`;
      default: return `${rank}th`;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Award className="mr-2 h-5 w-5" style={{ color: COLORS.ACCENT }} />
              Your Civic Impact Score
            </CardTitle>
            <CardDescription>
              How your engagement compares to the Act Up community
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Impact Score */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Overall Impact Score</span>
              <span className="text-sm font-medium">{userScore}/100</span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 h-2 overflow-hidden bg-gray-200 rounded">
                <div
                  style={{
                    width: `${userScore}%`,
                    backgroundColor: userScore > communityAverage ? COLORS.OPTIONAL : COLORS.ACCENT
                  }}
                  className="flex flex-col justify-center rounded"
                ></div>
              </div>
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-500"
                style={{
                  left: `${communityAverage}%`,
                  backgroundColor: COLORS.PRIMARY
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" /> Community Average: {communityAverage}
              </span>
              {userScore > communityAverage ? (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> +{(userScore - communityAverage).toFixed(1)} points above average
                </span>
              ) : (
                <span className="flex items-center text-amber-600">
                  <Activity className="h-3 w-3 mr-1" /> {(communityAverage - userScore).toFixed(1)} points to reach average
                </span>
              )}
            </div>
          </div>
          
          {/* Rank Information */}
          <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: '#F5F7FA' }}>
            <div>
              <div className="text-sm font-medium text-gray-600">Community Rank</div>
              <div className="text-2xl font-bold" style={{ color: COLORS.PRIMARY }}>
                {formatRank(userRank)} <span className="text-base font-normal">of {totalUsers}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">Percentile</div>
              <div className="text-2xl font-bold" style={{ color: COLORS.ACCENT }}>
                {percentileRank}<span className="text-base">%</span>
              </div>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Impact By Category</h4>
            {userCategoryScores.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{category.category}</span>
                  <span>{category.score} / 100</span>
                </div>
                <div className="relative pt-1">
                  <Progress value={category.score} className="h-1.5" />
                  <div
                    className="absolute top-0 h-1.5 w-0.5 bg-gray-500 z-10"
                    style={{
                      left: `${category.communityAverage}%`,
                      backgroundColor: COLORS.PRIMARY
                    }}
                  ></div>
                </div>
                <div className="flex justify-end text-xs text-gray-500">
                  <span>Community Avg: {category.communityAverage}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Personalized Impact Summary */}
          <div className="p-4 rounded-md border border-dashed" style={{ borderColor: COLORS.OPTIONAL }}>
            <h4 className="text-sm font-medium mb-2 flex items-center" style={{ color: COLORS.PRIMARY }}>
              <Award className="h-4 w-4 mr-1" /> Your Impact Summary
            </h4>
            <p className="text-sm text-gray-600">
              Your engagement is particularly strong in{' '}
              <span className="font-medium" style={{ color: COLORS.PRIMARY }}>
                {userCategoryScores.sort((a, b) => b.score - a.score)[0].category}
              </span>
              {userScore > communityAverage 
                ? '. Your active participation puts you in the top performers of the community!'
                : '. Continue tracking bills and sharing insights to increase your impact score!'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}