import { useLocation } from "wouter";
import { Home, Search, Bell, Map, User } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function MobileNav() {
  const [location, setLocation] = useLocation();
  
  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/",
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "Search",
      href: "/advanced-search",
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Alerts",
      href: "/dashboard",
    },
    {
      icon: <Map className="h-5 w-5" />,
      label: "Map",
      href: "/legislative-map",
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      href: "/onboarding",
    },
  ];
  
  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#121825] border-t border-gray-800 z-40 py-3 px-4">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              className="flex flex-col items-center justify-center"
              onClick={() => setLocation(item.href)}
            >
              <div 
                className={`p-1.5 ${
                  active 
                    ? "text-[#f05a28]" 
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {item.icon}
              </div>
              <span 
                className={`text-xs mt-1 ${
                  active ? "font-medium text-[#f05a28]" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}