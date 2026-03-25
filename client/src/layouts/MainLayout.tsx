import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { RoleBadge } from "@/components/ui/role-badge";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import actUpLogo from "../assets/act-up-logo.png"; // This is now using the new logo

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, superUserRole, logout } = useUser();
  const [location] = useLocation();
  const [notificationCount] = useState(3); // This would typically come from a notification service

  const getRoleLevelLabel = () => {
    switch (superUserRole?.level) {
      case 1:
        return "Advocate";
      case 2:
        return "Influencer";
      case 3:
        return "Super Spreader";
      case 4:
        return "Movement Builder";
      default:
        return "Advocate";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <Link href="/">
                    <img src={actUpLogo} alt="Act Up Logo" className="h-10 w-auto" />
                  </Link>
                </div>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <Link href="/dashboard" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/dashboard" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Dashboard
                </Link>
                <Link href="/legislation" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/legislation" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Legislation
                </Link>
                <Link href="/recommendations" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/recommendations" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Recommendations
                </Link>
                <Link href="/war-room" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/war-room" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  War Room
                </Link>
                <Link href="/action-circles" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/action-circles" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Action Circles
                </Link>
                <Link href="/network" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/network" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  My Network
                </Link>
                <Link href="/ai-assistant" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/ai-assistant" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Role Assistant
                </Link>
                <Link href="/representatives" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/representatives" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Representatives
                </Link>
                <Link href="/resources" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/resources" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Resources
                </Link>
                <Link href="/verification" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/verification" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Verification
                </Link>
                <Link href="/civic-impact" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/civic-impact" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Civic Impact
                </Link>
                <Link href="/community-impact" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location === "/community-impact" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Community Impact
                </Link>
                <Link href="/documents" className={cn(
                  "border-b-2 px-1 pt-1 font-medium",
                  location.startsWith("/documents") 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}>
                  Documents
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              {user && (
                <>
                  <button className="text-neutral-500 hover:text-neutral-700 p-2 rounded-full relative">
                    <Bell className="h-6 w-6" />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-alert-500 rounded-full flex items-center justify-center text-white text-xs">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                  <div className="ml-4 relative flex items-center">
                    <div>
                      <Button variant="ghost" className="rounded-full p-0 h-auto">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl || undefined} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-700">{user.name}</p>
                      <div className="flex items-center">
                        {superUserRole && <RoleBadge role={superUserRole.role} className="text-xs" />}
                        <span className="ml-2 text-xs text-neutral-500">Level {superUserRole?.level}: {getRoleLevelLabel()}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!user && (
                <div className="flex space-x-4">
                  <Link href="/login" className="inline-block">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register" className="inline-block">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-neutral-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 text-neutral-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Link href="/">
                  <img src={actUpLogo} alt="Act Up Logo" className="h-12 w-auto bg-white p-1 rounded" />
                </Link>
              </div>
              <p className="text-sm mb-4">Driving civic engagement and government accountability through collective action.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Super User Guide</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Role Training</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Action Toolkit</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Legislative Tracking</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Advocacy Templates</a></li>
              </ul>
              
              <h3 className="text-white font-medium mb-4 mt-6">Feature Demos</h3>
              <ul className="space-y-2">
                <li><Link href="/bill-celebration-demo" className="text-neutral-400 hover:text-white text-sm">Bill Progress Celebration</Link></li>
                <li><Link href="/legislative-timeline-demo" className="text-neutral-400 hover:text-white text-sm">Legislative Timeline</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/action-circles" className="text-neutral-400 hover:text-white text-sm">Action Circles</Link></li>
                <li><Link href="/network" className="text-neutral-400 hover:text-white text-sm">My Network</Link></li>
                <li><Link href="/verification" className="text-neutral-400 hover:text-white text-sm">Verification System</Link></li>
                <li><Link href="/civic-impact" className="text-neutral-400 hover:text-white text-sm">Civic Impact</Link></li>
                <li><Link href="/community-impact" className="text-neutral-400 hover:text-white text-sm">Community Impact</Link></li>
                <li><Link href="/recommendations" className="text-neutral-400 hover:text-white text-sm">Bill Recommendations</Link></li>
                <li><Link href="/ai-assistant" className="text-neutral-400 hover:text-white text-sm">Role Assistant</Link></li>
                <li><Link href="/documents" className="text-neutral-400 hover:text-white text-sm">Documents</Link></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Super User Forum</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Virtual Events</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Movement Building</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">About Act Up</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Our Mission</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">The Team</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white text-sm">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="mt-8 bg-neutral-700" />
          
          <div className="mt-8 text-sm text-neutral-400 text-center">
            <p>&copy; {new Date().getFullYear()} Act Up. All rights reserved. This platform is designed for civic engagement and education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
