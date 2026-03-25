import { Link } from "wouter";
import { 
  Gavel, 
  Calendar, 
  UsersRound, 
  Megaphone, 
  Search, 
  BarChart2, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  Eye, 
  Clock, 
  Settings, 
  HelpCircle, 
  BookOpen, 
  PlusCircle,
  Video,
  ChevronRight,
  FolderOpen,
  Globe,
  LucideIcon,
  Newspaper,
  Lightbulb,
  Terminal,
  Building2,
  ArrowUpRight,
  User,
  Upload,
  Bookmark,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

// Define categories for the tools
interface ToolCategory {
  title: string;
  description: string;
  icon: LucideIcon;
  tools: Tool[];
}

// Define a tool/feature
interface Tool {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
  color?: string;
}

export function ModernDashboard() {
  const { user } = useUser();
  
  // Define all tool categories
  const categories: ToolCategory[] = [
    {
      title: "Legislative Tracking",
      description: "Monitor and analyze legislation",
      icon: Gavel,
      tools: [
        {
          title: "Bill Tracker",
          description: "Track and follow bills through the legislative process",
          icon: FileText,
          path: "/legislation",
          color: "bg-blue-100 text-blue-900"
        },
        {
          title: "Committee Videos",
          description: "Watch and analyze committee hearings",
          icon: Video,
          path: "/committee-meetings",
          badge: {
            text: "Live",
            variant: "destructive"
          },
          color: "bg-red-100 text-red-900"
        },
        {
          title: "War Room",
          description: "Strategic analysis of key legislation",
          icon: Eye,
          path: "/war-room",
          color: "bg-indigo-100 text-indigo-900"
        },
        {
          title: "Insider Track",
          description: "Capitol insights and behind-the-scenes updates",
          icon: Lightbulb,
          path: "/insider-track",
          badge: {
            text: "Premium",
            variant: "secondary"
          },
          color: "bg-amber-100 text-amber-900"
        }
      ]
    },
    {
      title: "Community & Action",
      description: "Connect and make an impact",
      icon: UsersRound,
      tools: [
        {
          title: "Action Circles",
          description: "Join groups focused on specific issues",
          icon: UsersRound,
          path: "/action-circles",
          color: "bg-green-100 text-green-900"
        },
        {
          title: "Discussion Forum",
          description: "Engage in meaningful civic conversations",
          icon: MessageSquare,
          path: "/discussions",
          color: "bg-purple-100 text-purple-900"
        },
        {
          title: "Civic Impact",
          description: "Measure your civic engagement influence",
          icon: Activity,
          path: "/civic-impact",
          color: "bg-cyan-100 text-cyan-900"
        },
        {
          title: "Community Impact",
          description: "See collective action results",
          icon: Globe,
          path: "/community-impact",
          color: "bg-emerald-100 text-emerald-900"
        }
      ]
    },
    {
      title: "Knowledge & Resources",
      description: "Learn and get informed",
      icon: BookOpen,
      tools: [
        {
          title: "AI Assistant",
          description: "Get AI-powered help with civic questions",
          icon: Terminal,
          path: "/ai-assistant",
          badge: {
            text: "AI",
            variant: "default"
          },
          color: "bg-slate-100 text-slate-900"
        },
        {
          title: "Civic Terms",
          description: "Glossary of civic and legislative terminology",
          icon: BookOpen,
          path: "/civic-terms",
          color: "bg-stone-100 text-stone-900"
        },
        {
          title: "Infographics",
          description: "Visual explanations of complex topics",
          icon: BarChart2,
          path: "/infographics",
          color: "bg-rose-100 text-rose-900"
        },
        {
          title: "State Agencies",
          description: "Information on government departments",
          icon: Building2,
          path: "/state-agencies",
          color: "bg-blue-100 text-blue-900"
        }
      ]
    },
    {
      title: "Document Center",
      description: "Access and manage documents",
      icon: FolderOpen,
      tools: [
        {
          title: "Documents Library",
          description: "Browse community-shared documents",
          icon: FolderOpen,
          path: "/documents",
          color: "bg-orange-100 text-orange-900"
        },
        {
          title: "Upload Document",
          description: "Share documents with the community",
          icon: Upload,
          path: "/documents/upload",
          color: "bg-teal-100 text-teal-900"
        },
        {
          title: "Saved Documents",
          description: "Access your bookmarked documents",
          icon: Bookmark,
          path: "/documents/saved",
          color: "bg-violet-100 text-violet-900"
        },
        {
          title: "Unified Search",
          description: "Search across all platform content",
          icon: Search,
          path: "/search",
          color: "bg-gray-100 text-gray-900"
        }
      ]
    },
    {
      title: "News & Updates",
      description: "Stay informed on latest developments",
      icon: Newspaper,
      tools: [
        {
          title: "Activity Feed",
          description: "Personalized updates and notifications",
          icon: Activity,
          path: "/feed",
          badge: {
            text: "New",
            variant: "default"
          },
          color: "bg-pink-100 text-pink-900"
        },
        {
          title: "Recommendations",
          description: "AI-powered content suggestions",
          icon: Lightbulb,
          path: "/recommendations",
          color: "bg-yellow-100 text-yellow-900"
        },
        {
          title: "User Activity",
          description: "Track your engagement on the platform",
          icon: User,
          path: "/activity",
          color: "bg-blue-100 text-blue-900"
        }
      ]
    }
  ];

  return (
    <div className="p-6 bg-gray-50">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome, {user?.username || 'Citizen'}</h1>
            <p className="text-blue-100">Let's make an impact on the issues that matter to you</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Link href="/search">
              <Badge variant="outline" className="border-blue-300 hover:bg-blue-800 cursor-pointer text-sm px-3 py-1">
                <Search className="h-3.5 w-3.5 mr-1" />
                Search
              </Badge>
            </Link>
            <Link href="/settings">
              <Badge variant="outline" className="border-blue-300 hover:bg-blue-800 cursor-pointer text-sm px-3 py-1">
                <Settings className="h-3.5 w-3.5 mr-1" />
                Settings
              </Badge>
            </Link>
            <Link href="/help">
              <Badge variant="outline" className="border-blue-300 hover:bg-blue-800 cursor-pointer text-sm px-3 py-1">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Help
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      {categories.map((category, i) => (
        <div key={i} className="mb-8">
          <div className="flex items-center mb-4">
            <category.icon className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-xl font-bold">{category.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {category.tools.map((tool, j) => (
              <Link key={j} href={tool.path}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-gray-200 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={cn("p-2 rounded-md flex items-center justify-center", tool.color || "bg-primary/10")}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      {tool.badge && (
                        <Badge variant={tool.badge.variant} className="ml-auto">
                          {tool.badge.text}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">{tool.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0 pb-3">
                    <span className="text-xs text-blue-600 flex items-center">
                      Access tool
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Quick Access Row */}
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3 text-gray-700">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </Badge>
          </Link>
          <Link href="/legislation">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <Gavel className="h-3.5 w-3.5 mr-1.5" />
              Bills
            </Badge>
          </Link>
          <Link href="/committee-meetings">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <Video className="h-3.5 w-3.5 mr-1.5" />
              Committees
            </Badge>
          </Link>
          <Link href="/feed">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Feed
            </Badge>
          </Link>
          <Link href="/war-room">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              War Room
            </Badge>
          </Link>
          <Link href="/ai-assistant">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              AI Assistant
            </Badge>
          </Link>
          <Link href="/action-circles">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <UsersRound className="h-3.5 w-3.5 mr-1.5" />
              Action Circles
            </Badge>
          </Link>
          <Link href="/documents">
            <Badge className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-0">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              Documents
            </Badge>
          </Link>
        </div>
      </div>
    </div>
  );
}