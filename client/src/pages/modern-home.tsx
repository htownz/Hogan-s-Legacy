import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  DollarSign,
  Network,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Eye,
  ChevronRight
} from "lucide-react";

export default function ModernHome() {
  const [currentStat, setCurrentStat] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const stats = [
    { value: "1,017+", label: "Authentic Bills", color: "text-blue-600" },
    { value: "183", label: "Current Legislators", color: "text-green-600" },
    { value: "3,076+", label: "Campaign Records", color: "text-purple-600" },
    { value: "100%", label: "Official Data", color: "text-orange-600" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const keyFeatures = [
    {
      id: "search",
      title: "Smart Bill Search",
      description: "AI-powered search through 1,017+ authentic Texas bills with intelligent suggestions",
      icon: Search,
      link: "/legislative-intelligence",
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 via-blue-25 to-cyan-50",
      accent: "blue",
      stats: "1,017+ Bills"
    },
    {
      id: "legislators",
      title: "Your Representatives",
      description: "Connect with all 183 Texas legislators, view voting records and contact information",
      icon: Users,
      link: "/legislative-intelligence", 
      gradient: "from-emerald-600 via-green-500 to-teal-500",
      bgGradient: "from-emerald-50 via-green-25 to-teal-50",
      accent: "emerald",
      stats: "183 Active"
    },
    {
      id: "money",
      title: "Campaign Finance",
      description: "Track money in politics with official FEC data and transparency reports",
      icon: DollarSign,
      link: "/texas/campaign-finance",
      gradient: "from-amber-600 via-yellow-500 to-orange-500", 
      bgGradient: "from-amber-50 via-yellow-25 to-orange-50",
      accent: "amber",
      stats: "Live FEC Data"
    },
    {
      id: "collaborate",
      title: "Bill Amendments",
      description: "Collaborate with the community to suggest improvements to legislation",
      icon: MessageSquare,
      link: "/amendment-playground",
      gradient: "from-purple-600 via-violet-500 to-indigo-500",
      bgGradient: "from-purple-50 via-violet-25 to-indigo-50",
      accent: "purple",
      stats: "Community Driven"
    },
    {
      id: "understand", 
      title: "Bill Translator",
      description: "AI breaks down complex legal language into plain English explanations",
      icon: BookOpen,
      link: "/bill-complexity-translator",
      gradient: "from-rose-600 via-pink-500 to-red-500",
      bgGradient: "from-rose-50 via-pink-25 to-red-50",
      accent: "rose",
      stats: "AI Powered"
    },
    {
      id: "network",
      title: "Legislative Network",
      description: "Visualize connections between bills, legislators, and committees",
      icon: Network,
      link: "/legislative-intelligence",
      gradient: "from-indigo-600 via-blue-500 to-purple-500",
      bgGradient: "from-indigo-50 via-blue-25 to-purple-50",
      accent: "indigo",
      stats: "Interactive Map"
    }
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.1,
            top: mousePosition.y * 0.1,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-200/20 to-cyan-200/20 rounded-full blur-2xl animate-bounce" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                🏛️ Powered by Official Texas Government APIs
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
              Texas Government
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              The most comprehensive platform for Texas civic engagement. 
              Track legislation, understand your representatives, and make your voice heard with authentic government data.
            </p>

            {/* Animated Stats */}
            <div className="flex justify-center mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center">
                  <div className={`text-4xl md:text-5xl font-bold ${stats[currentStat].color} transition-all duration-500`}>
                    {stats[currentStat].value}
                  </div>
                  <div className="text-gray-600 font-medium text-lg">
                    {stats[currentStat].label}
                  </div>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  {stats.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentStat ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link href="/legislative-intelligence">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-14 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Explore Bills
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/texas/campaign-finance">
                <Button size="lg" variant="outline" className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 shadow-lg hover:shadow-xl transition-all duration-300 h-14 px-8">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Track Money
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose Your Path to Civic Engagement
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Every tool connects you to authentic Texas government data. Start anywhere and discover how democracy works.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {keyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                
                return (
                  <Link key={feature.id} href={feature.link}>
                    <Card 
                      className="group h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Accent Border */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`} />
                      
                      <CardHeader className="relative z-10 pb-4">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="bg-white/80 backdrop-blur-sm text-gray-700 font-medium shadow-sm"
                          >
                            {feature.stats}
                          </Badge>
                        </div>
                        
                        <CardTitle className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                          {feature.title}
                        </CardTitle>
                        
                        <CardDescription className="text-gray-600 text-base leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="relative z-10 pt-0">
                        <Button 
                          className="w-full group/btn bg-white/50 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-300"
                        >
                          Get Started
                          <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Trust & Security Section */}
          <div className="mt-20 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Shield className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Trusted & Transparent
                </h3>
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                All data comes directly from official government sources: OpenStates, LegiScan, and the Federal Election Commission. 
                No bias, no interpretation—just authentic information to help you engage with democracy.
              </p>

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Real-time Data</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Full Transparency</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 bg-purple-50 rounded-xl">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Official Sources</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}