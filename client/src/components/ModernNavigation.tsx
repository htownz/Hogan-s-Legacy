import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  Search, 
  Users, 
  DollarSign, 
  BookOpen, 
  MessageSquare, 
  Network,
  BarChart3,
  Home,
  Sparkles,
  Heart,
  Globe
} from "lucide-react";

export default function ModernNavigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navigationItems = [
    { 
      name: "Home", 
      href: "/", 
      icon: Home,
      description: "Return to homepage"
    },
    { 
      name: "Find Bills", 
      href: "/legislative-intelligence", 
      icon: Search,
      description: "Search 1,017+ bills"
    },
    { 
      name: "Representatives", 
      href: "/legislative-intelligence", 
      icon: Users,
      description: "Meet your legislators"
    },
    { 
      name: "Campaign Finance", 
      href: "/texas/campaign-finance", 
      icon: DollarSign,
      description: "Track political money"
    },
    { 
      name: "Bill Translator", 
      href: "/bill-complexity-translator", 
      icon: BookOpen,
      description: "Understand complex laws"
    },
    { 
      name: "Civic Learning", 
      href: "/civic-learning", 
      icon: MessageSquare,
      description: "Learn about Texas government"
    },
    { 
      name: "Bill Sentiment", 
      href: "/emoji-sentiment", 
      icon: Heart,
      description: "Emoji analysis"
    },
    { 
      name: "Amendments", 
      href: "/amendment-playground", 
      icon: Network,
      description: "Suggest improvements"
    },
    { 
      name: "Legislative Map", 
      href: "/legislative-map", 
      icon: Globe,
      description: "Geographic visualization"
    },
    { 
      name: "Analytics", 
      href: "/advanced-analytics", 
      icon: BarChart3,
      description: "Data insights"
    }
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                    ActUp Texas
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Civic Engagement Platform</p>
                </div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`h-12 px-4 group relative transition-all duration-300 ${
                        active 
                          ? 'bg-blue-50 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      <span className="font-medium">{item.name}</span>
                      
                      {/* Active Indicator */}
                      {active && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                      )}
                      
                      {/* Hover Tooltip */}
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          {item.description}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Live Data Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Live Data</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-3">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`p-4 rounded-xl transition-all duration-300 ${
                        active 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            active 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className={`font-medium ${
                            active ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Live Data Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Connected to Official Texas Government Data
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}