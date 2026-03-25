import { useState } from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import actUpLogo from "@assets/act-up-logo.png";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link href="/">
            <img src={actUpLogo} alt="Act Up Logo" className="h-8 w-auto" />
          </Link>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex flex-col h-full py-6">
              <div className="flex items-center mb-8">
                <Link href="/" onClick={() => setOpen(false)}>
                  <img src={actUpLogo} alt="Act Up Logo" className="h-8 w-auto" />
                </Link>
              </div>
              
              <nav className="space-y-2">
                {NAV_ITEMS.map((item: { path: string; name: string; icon: React.ReactNode }) => (
                  <Link key={item.path} href={item.path}>
                    <a 
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <span className="mr-3 h-5 w-5 text-gray-500">{item.icon}</span>
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
