import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { formatLevelDisplay } from "@/lib/utils/progressUtils";
import { NAV_ITEMS } from "@/lib/constants";
import actUpLogo from "@assets/act-up-logo.png";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { mainRole } = useSuperUser();

  return (
    <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 border-r border-gray-200 bg-white">
      {/* Logo and App Name */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <img src={actUpLogo} alt="Act Up Logo" className="h-8 w-auto" />
          </Link>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-2 space-y-1">
          {NAV_ITEMS.map((item: { path: string; name: string; icon: React.ReactNode }) => (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  location === item.path
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "text-gray-700 hover:bg-gray-100",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                )}
                aria-current={location === item.path ? "page" : undefined}
              >
                <span className={cn(
                  location === item.path
                    ? "text-primary"
                    : "text-gray-500 group-hover:text-gray-600",
                  "mr-3 h-5 w-5"
                )}>
                  {item.icon}
                </span>
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      {user && mainRole && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="relative flex-shrink-0 h-10 w-10">
              <img 
                className="h-10 w-10 rounded-full" 
                src={user.profileImageUrl !== null ? user.profileImageUrl : '/images/default-avatar.png'} 
                alt={user.displayName !== null ? user.displayName : user.name}
              />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white"></span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.displayName !== null ? user.displayName : user.name}</p>
              <div className="flex items-center">
                <span className="text-xs text-success-dark font-semibold">
                  {formatLevelDisplay(mainRole.level, mainRole.role as any)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
