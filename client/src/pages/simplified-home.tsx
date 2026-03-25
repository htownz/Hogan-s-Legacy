import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Users, 
  DollarSign,
  BarChart3,
  Network,
  MessageSquare,
  BookOpen,
  Bell,
  Target,
  Zap,
  ArrowRight
} from "lucide-react";

export default function SimplifiedHome() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const keyFeatures = [
    {
      id: "search",
      title: "Find Bills & Laws",
      description: "Search 1,017+ authentic Texas bills with smart AI assistance",
      icon: Search,
      link: "/legislative-intelligence",
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      stats: "1,017 Bills"
    },
    {
      id: "legislators",
      title: "Meet Your Representatives",
      description: "Connect with 183 current Texas legislators and their voting records",
      icon: Users,
      link: "/legislative-intelligence", 
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      stats: "183 Legislators"
    },
    {
      id: "money",
      title: "Follow the Money",
      description: "Track campaign contributions and lobbying with FEC transparency data",
      icon: DollarSign,
      link: "/texas/campaign-finance",
      gradient: "from-amber-500 to-orange-500", 
      bgColor: "bg-amber-50",
      stats: "Live Data"
    },
    {
      id: "collaborate",
      title: "Suggest Changes",
      description: "Collaborate on bill amendments with the community",
      icon: MessageSquare,
      link: "/amendment-playground",
      gradient: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      stats: "Community Driven"
    },
    {
      id: "analyze", 
      title: "Understand Bills",
      description: "AI-powered bill complexity translator makes laws easy to understand",
      icon: BookOpen,
      link: "/bill-complexity-translator",
      gradient: "from-rose-500 to-pink-500",
      bgColor: "bg-rose-50",
      stats: "AI Powered"
    },
    {
      id: "network",
      title: "See Connections",
      description: "Interactive network showing how legislators, bills, and committees connect",
      icon: Network,
      link: "/legislative-intelligence",
      gradient: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      stats: "Visual Network"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="pt-12 pb-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm">
              🏛️ Powered by Official Texas Government Data
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Make Your Voice Heard
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your complete toolkit for engaging with Texas government. 
            Track bills, understand laws, connect with representatives, and collaborate on change.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="bg-white rounded-xl px-6 py-3 shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">1,017+</div>
              <div className="text-sm text-gray-600">Authentic Bills</div>
            </div>
            <div className="bg-white rounded-xl px-6 py-3 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">183</div>
              <div className="text-sm text-gray-600">Current Legislators</div>
            </div>
            <div className="bg-white rounded-xl px-6 py-3 shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">3,076+</div>
              <div className="text-sm text-gray-600">Campaign Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Starting Point
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Each tool connects you directly to authentic Texas government data. 
            Click any card to begin your civic engagement journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyFeatures.map((feature) => {
            const IconComponent = feature.icon;
            const isHovered = hoveredCard === feature.id;
            
            return (
              <Link key={feature.id} href={feature.link}>
                <Card 
                  className={`h-full transition-all duration-300 cursor-pointer border-2 hover:border-transparent hover:shadow-2xl transform hover:scale-105 ${feature.bgColor} hover:bg-white`}
                  onMouseEnter={() => setHoveredCard(feature.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {feature.stats}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </CardTitle>
                    
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Button 
                      className={`w-full group transition-all duration-300 ${
                        isHovered 
                          ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg`
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Access Bar */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg border p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Popular Actions
            </h3>
            <p className="text-gray-600">
              Quick access to the most commonly used features
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/legislative-intelligence">
              <Button variant="outline" className="w-full h-16 text-left justify-start hover:bg-blue-50 hover:border-blue-200">
                <Search className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-semibold">Search Bills</div>
                  <div className="text-xs text-gray-500">Find legislation</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/texas/campaign-finance">
              <Button variant="outline" className="w-full h-16 text-left justify-start hover:bg-amber-50 hover:border-amber-200">
                <DollarSign className="w-5 h-5 mr-3 text-amber-600" />
                <div>
                  <div className="font-semibold">Track Money</div>
                  <div className="text-xs text-gray-500">Campaign finance</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/bill-complexity-translator">
              <Button variant="outline" className="w-full h-16 text-left justify-start hover:bg-rose-50 hover:border-rose-200">
                <BookOpen className="w-5 h-5 mr-3 text-rose-600" />
                <div>
                  <div className="font-semibold">Understand Bills</div>
                  <div className="text-xs text-gray-500">AI explanations</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/amendment-playground">
              <Button variant="outline" className="w-full h-16 text-left justify-start hover:bg-purple-50 hover:border-purple-200">
                <MessageSquare className="w-5 h-5 mr-3 text-purple-600" />
                <div>
                  <div className="font-semibold">Suggest Changes</div>
                  <div className="text-xs text-gray-500">Collaborate</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium">
              Live data from official Texas government sources
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}