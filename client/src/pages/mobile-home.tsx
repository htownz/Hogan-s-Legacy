import { useState } from "react";
import { Link } from "wouter";
import { MobileNavigation } from "../components/shared/mobile-navigation";
import { MobileCard } from "../components/shared/mobile-card";
import { MobileActionButton } from "../components/shared/mobile-action-button";
import {
  Bell,
  Search,
  Share2,
  FileText,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  Star,
  Clock,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MobileHomePage() {
  const [swipeDirection, setSwipeDirection] = useState<string>("");

  // Mock data for demonstration
  const recentAlerts = [
    {
      id: 1,
      billNumber: "HB 2024",
      title: "Education Funding Reform",
      status: "Committee Vote Scheduled",
      urgency: "high",
      timeAgo: "2 hours ago"
    },
    {
      id: 2,
      billNumber: "SB 891",
      title: "Clean Energy Infrastructure",
      status: "Amendment Added",
      urgency: "medium", 
      timeAgo: "5 hours ago"
    }
  ];

  const quickActions = [
    {
      icon: <Search className="h-6 w-6" />,
      label: "Search Bills",
      href: "/advanced-search",
      color: "primary"
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      label: "Create Graphics",
      href: "/shareable-graphics",
      color: "success"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      label: "Smart Alerts",
      href: "/smart-bill-alerts",
      color: "warning"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: "Simplify Bills",
      href: "/bill-translator",
      color: "secondary"
    }
  ];

  const trendingBills = [
    {
      id: 1,
      number: "HB 2024",
      title: "Education Funding Reform Act",
      support: 73,
      activity: "↗️ Rising"
    },
    {
      id: 2,
      number: "SB 891", 
      title: "Clean Energy Infrastructure",
      support: 61,
      activity: "📊 Stable"
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileNavigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white p-6 pt-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to Act Up</h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Stay informed, take action, and make your voice heard in democracy
          </p>
          
          <div className="bg-white/10 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-100">Your Impact Today</span>
              <span className="font-bold">+47 Citizens Engaged</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <MobileCard 
          title="Quick Actions"
          description="Get started with these popular features"
          icon={<Zap className="h-6 w-6 text-primary" />}
          variant="elevated"
        >
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <MobileActionButton
                  variant={action.color as any}
                  size="md"
                  fullWidth
                  icon={action.icon}
                  className="h-16 flex-col text-sm"
                >
                  {action.label}
                </MobileActionButton>
              </Link>
            ))}
          </div>
        </MobileCard>

        {/* Recent Alerts */}
        <MobileCard
          title="Recent Alerts"
          description="Bills that need your attention"
          icon={<Bell className="h-6 w-6 text-orange-500" />}
          headerActions={
            <Link href="/smart-bill-alerts">
              <Badge variant="secondary" className="cursor-pointer">
                View All
              </Badge>
            </Link>
          }
          variant="elevated"
        >
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    alert.urgency === 'high' ? 'bg-red-500' : 
                    alert.urgency === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-primary">{alert.billNumber}</span>
                    <Badge className={`text-xs px-2 py-0.5 ${getUrgencyColor(alert.urgency)}`}>
                      {alert.urgency}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{alert.title}</h4>
                  <p className="text-xs text-gray-600">{alert.status}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{alert.timeAgo}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
              </div>
            ))}
          </div>
        </MobileCard>

        {/* Trending Bills */}
        <MobileCard
          title="Trending Bills"
          description="What's gaining attention right now"
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          variant="elevated"
        >
          <div className="space-y-3">
            {trendingBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-primary">{bill.number}</span>
                    <span className="text-xs">{bill.activity}</span>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{bill.title}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{bill.support}% support</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </MobileCard>

        {/* Community Impact */}
        <MobileCard
          title="Community Impact"
          description="See how citizens are making a difference"
          icon={<Users className="h-6 w-6 text-purple-500" />}
          variant="elevated"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div>
                <p className="font-semibold text-lg text-gray-900">2,847</p>
                <p className="text-sm text-gray-600">Active Citizens</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div>
                <p className="font-semibold text-lg text-gray-900">156</p>
                <p className="text-sm text-gray-600">Bills Tracked</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
        </MobileCard>

        {/* Call to Action */}
        <MobileCard variant="outlined" className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
          <div className="text-center space-y-4">
            <div className="text-4xl">🗳️</div>
            <h3 className="font-bold text-lg text-gray-900">Make Your Voice Heard</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Join thousands of engaged citizens tracking legislation and taking action on the issues that matter most.
            </p>
            <Link href="/onboarding">
              <MobileActionButton 
                variant="primary" 
                size="lg" 
                fullWidth
                className="mt-4"
              >
                Get Started
              </MobileActionButton>
            </Link>
          </div>
        </MobileCard>
      </div>
    </div>
  );
}