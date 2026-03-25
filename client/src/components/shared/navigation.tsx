// @ts-nocheck
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HomeIcon, 
  SearchIcon, 
  FileTextIcon, 
  MenuIcon,
  XIcon,
  BarChart4,
  MapIcon,
  Mic,
  UserIcon,
  FileUpIcon,
  Binoculars,
  Network,
  Edit,
  Lightbulb,
  Brain,
  Zap,
  Activity,
  GitCompare,
  Share2,
  ThumbsUp,
  Sparkles
} from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  // Main navigation links - Core features
  const mainNavLinks = [
    { path: "/", label: "Home", icon: <HomeIcon className="w-4 h-4" /> },
    { path: "/dashboard", label: "Dashboard", icon: <BarChart4 className="w-4 h-4" /> },
    { path: "/advanced-search", label: "Search Bills", icon: <SearchIcon className="w-4 h-4" /> },
    { path: "/legislators", label: "Legislators", icon: <UserIcon className="w-4 h-4" /> },
  ];

  // Featured tools - NEW completed features
  const featuredTools = [
    { 
      path: "/smart-alerts-enhanced", 
      label: "Smart Bill Alerts", 
      icon: <Zap className="w-4 h-4" />, 
      description: "Get instant contextual notifications when bills move",
      isNew: true
    },
    { 
      path: "/real-time-timeline", 
      label: "Real-Time Timeline", 
      icon: <Activity className="w-4 h-4" />, 
      description: "Dynamic bill progress with AI predictions",
      isNew: true
    },
    { 
      path: "/interactive-bill-comparison", 
      label: "Bill Comparison Slider", 
      icon: <GitCompare className="w-4 h-4" />, 
      description: "Interactive side-by-side bill analysis",
      isNew: true
    },
    { 
      path: "/bill-translator", 
      label: "AI Bill Translator", 
      icon: <Lightbulb className="w-4 h-4" />, 
      description: "Transform complex bills into plain English",
      isNew: false
    },
    { 
      path: "/shareable-graphics", 
      label: "Impact Graphics", 
      icon: <Share2 className="w-4 h-4" />, 
      description: "Auto-generate shareable bill impact cards",
      isNew: false
    }
  ];

  // Collaboration tools
  const collaborationTools = [
    { 
      path: "/collaborative-annotations", 
      label: "Bill Annotations", 
      icon: <Edit className="w-4 h-4" />, 
      description: "Collaborative document markup"
    },
    { 
      path: "/collaborative-bill-edit", 
      label: "Collaborative Editing", 
      icon: <FileTextIcon className="w-4 h-4" />, 
      description: "Real-time bill editing with teams"
    },
    { 
      path: "/community", 
      label: "Community Hub", 
      icon: <Network className="w-4 h-4" />, 
      description: "Connect with other civic advocates"
    },
    { 
      path: "/bill-suggestions", 
      label: "Bill Suggestions", 
      icon: <ThumbsUp className="w-4 h-4" />, 
      description: "Propose and vote on community legislation ideas",
      isNew: true
    }
  ];

  // Advanced features
  const advancedFeatures = [
    { 
      path: "/ai-search", 
      label: "AI Smart Search", 
      icon: <Brain className="w-4 h-4" />, 
      description: "Intelligent legislative search with Claude AI",
      isNew: true
    },
    { path: "/scout-bot", label: "Scout Bot", icon: <Binoculars className="w-4 h-4" /> },
    { path: "/contextual-bill-analysis", label: "AI Analysis", icon: <Brain className="w-4 h-4" /> },
    { path: "/legislative-map", label: "Legislative Map", icon: <MapIcon className="w-4 h-4" /> },
    { path: "/ethics-portal/tec-upload", label: "Ethics Portal", icon: <FileUpIcon className="w-4 h-4" /> },
    { path: "/voice-search", label: "Voice Search", icon: <Mic className="w-4 h-4" /> },
  ];

  // Mobile navigation - organized sections
  const mobileNavSections = [
    {
      title: "🚀 Featured Tools",
      items: featuredTools.map(tool => ({
        path: tool.path,
        label: tool.label,
        icon: tool.icon,
        isNew: tool.isNew
      }))
    },
    {
      title: "📊 Core Features", 
      items: mainNavLinks
    },
    {
      title: "🤝 Collaboration",
      items: collaborationTools
    },
    {
      title: "⚡ Advanced",
      items: advancedFeatures
    }
  ];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and site name */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              A
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Act Up
            </span>
          </Link>

          {/* Desktop navigation with modern dropdown */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Main navigation */}
            {mainNavLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button
                  variant={isActive(link.path) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-2 font-medium ${
                    isActive(link.path) 
                      ? "bg-primary text-white shadow-md" 
                      : "text-gray-700 hover:text-primary hover:bg-blue-50"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Button>
              </Link>
            ))}

            {/* Featured Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-primary hover:bg-blue-50 font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Featured Tools
                  <Badge className="ml-2 bg-green-500 text-white text-xs px-1 py-0.5">NEW</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-2">
                {featuredTools.map((tool) => (
                  <DropdownMenuItem key={tool.path} asChild className="cursor-pointer">
                    <Link href={tool.path} className="flex items-center space-x-3 p-3 rounded-md">
                      <div className="p-2 rounded bg-primary/10 text-primary">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{tool.label}</span>
                          {tool.isNew && (
                            <Badge className="bg-green-500 text-white text-xs px-1 py-0.5">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Collaboration Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-primary hover:bg-blue-50 font-medium">
                  <Network className="w-4 h-4 mr-2" />
                  Collaborate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-2">
                {collaborationTools.map((tool) => (
                  <DropdownMenuItem key={tool.path} asChild className="cursor-pointer">
                    <Link href={tool.path} className="flex items-center space-x-3 p-3 rounded-md">
                      <div className="p-2 rounded bg-purple-100 text-purple-600">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium block">{tool.label}</span>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/advanced-search">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50">
                <SearchIcon className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="font-medium">
              Sign In
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu} 
              className="rounded-lg hover:bg-blue-50"
            >
              {isMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-4 bg-gray-50 -mx-4 px-4 border-t">
            {mobileNavSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 px-2 flex items-center">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((link) => (
                    <Link key={link.path} href={link.path}>
                      <Button
                        variant={isActive(link.path) ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start font-medium ${
                          isActive(link.path) 
                            ? "bg-primary text-white shadow-sm" 
                            : "text-gray-700 hover:bg-white hover:text-primary"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          {link.icon}
                          <span className="flex-1 text-left">{link.label}</span>
                          {link.isNew && (
                            <Badge className="bg-green-500 text-white text-xs px-1 py-0.5">NEW</Badge>
                          )}
                        </div>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Link href="/advanced-search">
                <Button variant="outline" size="sm" className="w-full font-medium" onClick={() => setIsMenuOpen(false)}>
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search Bills
                </Button>
              </Link>
              <Button size="sm" className="w-full font-medium">
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}