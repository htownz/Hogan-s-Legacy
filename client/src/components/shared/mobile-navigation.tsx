import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Bell,
  Search,
  User,
  Menu,
  X,
  Share2,
  FileText,
  Users,
  Settings,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNavigation() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainNavItems = [
    { href: "/", icon: Home, label: "Home", badge: null },
    { href: "/smart-bill-alerts", icon: Bell, label: "Alerts", badge: "3" },
    { href: "/advanced-search", icon: Search, label: "Search", badge: null },
    { href: "/shareable-graphics", icon: Share2, label: "Share", badge: "New" },
  ];

  const menuItems = [
    { 
      section: "Track & Monitor",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/smart-bill-alerts", label: "Smart Alerts", icon: Bell },
        { href: "/bill-comparison", label: "Compare Bills", icon: FileText },
        { href: "/legislative-updates", label: "Updates", icon: FileText },
      ]
    },
    {
      section: "Create & Share", 
      items: [
        { href: "/shareable-graphics", label: "Impact Cards", icon: Share2 },
        { href: "/collaborative", label: "Collaborate", icon: Users },
        { href: "/bill-translator", label: "Simplify Bills", icon: FileText },
      ]
    },
    {
      section: "Research & Learn",
      items: [
        { href: "/advanced-search", label: "Search Bills", icon: Search },
        { href: "/legislators", label: "Representatives", icon: Users },
        { href: "/scout-bot", label: "Scout Bot", icon: Search },
        { href: "/contextual-bill-analysis", label: "Deep Analysis", icon: FileText },
      ]
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-3 min-w-0 flex-1 relative rounded-lg transition-colors ${
                isActiveRoute(item.href)
                  ? "text-primary bg-primary/5"
                  : "text-gray-600 active:bg-gray-50"
              }`}
            >
              <div className="relative">
                <item.icon className="h-6 w-6 mb-1" />
                {item.badge && (
                  <Badge 
                    variant={item.badge === "New" ? "default" : "destructive"}
                    className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center min-w-5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          ))}
          
          {/* Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 text-gray-600 rounded-lg active:bg-gray-50 transition-colors">
                <Menu className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-primary/80 text-white">
                <SheetTitle className="text-white text-xl font-bold">Act Up</SheetTitle>
                <SheetDescription className="text-white/90 text-sm">
                  Legislative transparency for everyone
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-4">
                {menuItems.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {section.section}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors active:scale-95 ${
                            isActiveRoute(item.href)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-gray-50 text-gray-700 active:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-6">
                  <Link
                    href="/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-700 active:bg-gray-100 transition-colors active:scale-95"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 md:hidden z-40 safe-area-inset-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">🏛️</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Act Up</h1>
              <p className="text-xs text-gray-500">Legislative Transparency</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Link href="/smart-bill-alerts">
              <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer for fixed headers on mobile */}
      <div className="h-20 md:hidden"></div>
      <div className="h-20 md:hidden"></div>
    </>
  );
}