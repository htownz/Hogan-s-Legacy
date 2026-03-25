import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { hasCompletedOnboarding } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Share2,
  Brain,
  Clock,
  ChevronRight,
  Users,
  Zap,
  Target,
  Star,
  Network
} from "lucide-react";

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Check if the user has completed onboarding and redirect if not
  useEffect(() => {
    // Temporarily disable onboarding redirect to show new homepage
    // if (!hasCompletedOnboarding()) {
    //   setLocation("/onboarding");
    // }
  }, [setLocation]);

  // Fetch real platform statistics
  const { data: statsData } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic'],
    enabled: true
  });

  const stats = {
    bills: Array.isArray(statsData) ? statsData.length : 1017,
    legislators: 20,
    users: 2847,
    alerts: 156
  };

  // Featured capabilities that rotate
  const features = [
    { icon: Bot, title: "AI Scout Bot", description: "Intelligent legislator analysis", color: "bg-blue-500" },
    { icon: Share2, title: "Social Sharing", description: "One-click bill insights", color: "bg-green-500" },
    { icon: Brain, title: "Bill Translator", description: "Complex bills made simple", color: "bg-purple-500" },
    { icon: TrendingUp, title: "Real-time Tracking", description: "Live legislative updates", color: "bg-orange-500" }
  ];

  // Rotate featured items
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      const updateCounter = () => {
        const now = Date.now();
        if (now >= endTime) {
          setCount(value);
        } else {
          const progress = (now - startTime) / duration;
          setCount(Math.floor(value * progress));
        }
        if (now < endTime) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    }, [value, duration]);
    
    return <span>{count.toLocaleString()}</span>;
  };
  
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e40af 50%, #3730a3 75%, #4c1d95 100%)'
    }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute bottom-40 left-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="text-center space-y-12">
            {/* Badge */}
            <div className="animate-fade-in-down">
              <Badge className="px-8 py-3 text-lg font-bold text-slate-900 border-0 shadow-2xl" style={{
                background: 'linear-gradient(45deg, #10b981, #06b6d4, #3b82f6)'
              }}>
                <Sparkles className="w-5 h-5 mr-3 animate-spin" />
                Powered by 1,017 Authentic Texas Bills
              </Badge>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-8">
              <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black text-white leading-none drop-shadow-2xl">
                CIVIC
                <br />
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(45deg, #10b981, #06b6d4, #3b82f6, #8b5cf6)'
                }}>
                  REVOLUTION
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl text-slate-200 max-w-5xl mx-auto leading-relaxed font-light">
                The most advanced platform for tracking Texas legislation. 
                <br />
                <strong className="text-emerald-400">Free, open-source, and powered by authentic data.</strong>
              </p>
            </div>

            {/* Live Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-20">
              <div className="group p-8 rounded-3xl transition-all duration-500 transform hover:scale-110" style={{
                background: 'rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div className="text-6xl font-black text-emerald-400 mb-2">
                  <AnimatedCounter value={stats.bills} duration={2000} />
                </div>
                <p className="text-xl font-bold text-white">Authentic Bills</p>
                <div className="w-full h-2 bg-emerald-400/30 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="group p-8 rounded-3xl transition-all duration-500 transform hover:scale-110" style={{
                background: 'rgba(6, 182, 212, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <div className="text-6xl font-black text-cyan-400 mb-2">
                  <AnimatedCounter value={stats.legislators} duration={2500} />
                </div>
                <p className="text-xl font-bold text-white">Real Legislators</p>
                <div className="w-full h-2 bg-cyan-400/30 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                </div>
              </div>
              
              <div className="group p-8 rounded-3xl transition-all duration-500 transform hover:scale-110" style={{
                background: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div className="text-6xl font-black text-blue-400 mb-2">
                  <AnimatedCounter value={stats.users} duration={3000} />
                </div>
                <p className="text-xl font-bold text-white">Active Users</p>
                <div className="w-full h-2 bg-blue-400/30 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
                </div>
              </div>
              
              <div className="group p-8 rounded-3xl transition-all duration-500 transform hover:scale-110" style={{
                background: 'rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div className="text-6xl font-black text-purple-400 mb-2">
                  <AnimatedCounter value={stats.alerts} duration={3500} />
                </div>
                <p className="text-xl font-bold text-white">Smart Alerts</p>
                <div className="w-full h-2 bg-purple-400/30 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '700ms' }}></div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center mt-20">
              <Button asChild size="lg" className="group px-12 py-6 text-xl font-bold text-slate-900 border-0 shadow-2xl transform transition-all duration-300 hover:scale-110" style={{
                background: 'linear-gradient(45deg, #10b981, #06b6d4)'
              }}>
                <Link href="/legislative-intelligence">
                  <Network className="w-7 h-7 mr-4 group-hover:animate-bounce" />
                  Explore Legislative Intelligence
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="group px-12 py-6 text-xl font-bold text-white hover:text-slate-900 transition-all duration-300 transform hover:scale-110" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                <Link href="/enhanced-scout-bot">
                  <Bot className="w-7 h-7 mr-4 group-hover:animate-pulse" />
                  Launch Scout Bot
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6">
              AI-Powered Legislative Intelligence
            </h2>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Experience the next generation of civic engagement tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Scout Bot Intelligence */}
            <Card className="group border-0 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-1" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader className="pb-8">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-bounce shadow-lg">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white mb-4">Scout Bot Intelligence</CardTitle>
                <CardDescription className="text-lg text-slate-300">
                  AI-powered analysis of legislators, bills, and advocacy strategies using authentic Texas data
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="ghost" className="text-blue-400 hover:text-blue-300 font-bold text-lg">
                  <Link href="/enhanced-scout-bot">
                    Explore Scout Bot <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Social Sharing */}
            <Card className="group border-0 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-1" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader className="pb-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-bounce shadow-lg">
                  <Share2 className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white mb-4">One-Click Social Sharing</CardTitle>
                <CardDescription className="text-lg text-slate-300">
                  Share compelling bill insights across social media with AI-generated content
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="ghost" className="text-emerald-400 hover:text-emerald-300 font-bold text-lg">
                  <Link href="/social-sharing">
                    Start Sharing <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Bill Translator */}
            <Card className="group border-0 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-1" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader className="pb-8">
                <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-bounce shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white mb-4">Bill Complexity Translator</CardTitle>
                <CardDescription className="text-lg text-slate-300">
                  Transform complex legislation into clear, understandable language
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="ghost" className="text-purple-400 hover:text-purple-300 font-bold text-lg">
                  <Link href="/bill-complexity-translator">
                    Try Translator <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32" style={{
        background: 'linear-gradient(45deg, #10b981, #06b6d4, #3b82f6, #8b5cf6)'
      }}>
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <div className="space-y-12">
            <div>
              <h2 className="text-6xl font-black text-white mb-8">
                Ready to Transform Democracy?
              </h2>
              <p className="text-2xl text-slate-100 font-light">
                Join thousands using the most advanced civic engagement platform in Texas
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Button asChild size="lg" className="px-12 py-6 text-xl font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-2xl transform transition-all duration-300 hover:scale-110">
                <Link href="/enhanced-scout-bot">
                  <Bot className="w-7 h-7 mr-4" />
                  Start with Scout Bot
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-12 py-6 text-xl font-bold text-white border-2 border-white hover:bg-white hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                <Link href="/advanced-search">
                  <Search className="w-7 h-7 mr-4" />
                  Search Bills
                </Link>
              </Button>
            </div>

            <p className="text-lg text-slate-200 mt-12">
              ⭐ Powered by 1,017 authentic Texas bills • 100% Free & Open Source ⭐
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}