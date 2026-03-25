// @ts-nocheck
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useUser } from "@/context/user-context";
import { RoleSelector } from "@/components/super-user/role-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function Header() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center md:hidden">
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">
                    {mobileMenuOpen ? "Close menu" : "Open menu"}
                  </span>
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center ml-3">
                  <span className="text-white font-heading font-bold text-sm">AU</span>
                </div>
                <h1 className="ml-2 text-lg font-bold text-primary font-heading">Act Up</h1>
              </div>
            </div>
            <div className="flex items-center">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-4 relative flex-shrink-0 flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleModalOpen(true)}>
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary">
                Dashboard
              </a>
            </Link>
            <Link href="/action-circles">
              <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Action Circles
              </a>
            </Link>
            <Link href="/legislation">
              <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Legislation
              </a>
            </Link>
            <Link href="/training">
              <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Training
              </a>
            </Link>
            <Link href="/challenges">
              <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Challenges
              </a>
            </Link>
          </div>
        </div>
      )}

      <RoleSelector 
        open={roleModalOpen} 
        onOpenChange={setRoleModalOpen}
      />
    </>
  );
}
