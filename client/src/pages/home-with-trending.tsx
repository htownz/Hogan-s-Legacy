import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  ArrowRight, 
  Play,
  Gavel,
  Calendar,
  UsersRound,
  Megaphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrendingBillsDashboard } from "@/components/legislation/TrendingBillsDashboard";

export default function HomeWithTrending() {
  const { user } = useUser();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
            </svg>
            <span className="ml-2 text-2xl font-bold text-primary">Act Up</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Visual Elements */}
      <section className="bg-gradient-to-br from-red-800 via-primary to-red-900 text-white py-20 relative overflow-hidden">
        {/* Background pattern overlay - virus/network spread visualization */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <radialGradient id="spread" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="50" cy="50" r="40" fill="url(#spread)">
              <animate attributeName="r" values="30;40;30" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-none">
                THE CIVIC REVOLUTION
              </Badge>
              <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight">
                Ignite a <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-white">Civic Epidemic</span> of Accountability
              </h1>
              <p className="text-xl mb-8 text-red-100 max-w-lg">
                Become a super-spreader in the movement that's revolutionizing the power balance between citizens and government—no wealth or connections required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-red-50 shadow-md shadow-red-800/30">
                    {user ? "Enter War Room" : "Join the Revolution"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  See The Vision
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4 mt-10 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg">
                  <div className="text-2xl font-bold">25%</div>
                  <div className="text-xs text-red-100">Tipping Point</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg">
                  <div className="text-2xl font-bold">17,328</div>
                  <div className="text-xs text-red-100">Super-Spreaders</div>
                </div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-2xl font-bold">8.2%</div>
                    <div className="text-xs text-red-100">Toward Revolution</div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-red-400" style={{width: '8.2%'}}></div>
                </div>
              </div>
            </div>
            
            {/* Hero visual */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Abstract visual - a simplified texas map with network nodes */}
                <svg className="w-full h-auto" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M200,50 L100,100 L50,200 L100,300 L200,350 L300,300 L350,200 L300,100 Z" 
                    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  
                  {/* Network nodes */}
                  <circle cx="200" cy="50" r="8" fill="white" />
                  <circle cx="100" cy="100" r="6" fill="white" />
                  <circle cx="50" cy="200" r="5" fill="white" />
                  <circle cx="100" cy="300" r="7" fill="white" />
                  <circle cx="200" cy="350" r="6" fill="white" />
                  <circle cx="300" cy="300" r="8" fill="white" />
                  <circle cx="350" cy="200" r="5" fill="white" />
                  <circle cx="300" cy="100" r="7" fill="white" />
                  <circle cx="200" cy="200" r="12" fill="white" />
                  
                  {/* Connection lines */}
                  <line x1="200" y1="50" x2="100" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="50" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="50" y1="200" x2="100" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="100" y1="300" x2="200" y2="350" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="350" x2="300" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="300" y1="300" x2="350" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="350" y1="200" x2="300" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="300" y1="100" x2="200" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  
                  {/* Center connections */}
                  <line x1="200" y1="200" x2="200" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="100" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="50" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="100" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="200" y2="350" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="300" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="350" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="300" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  
                  {/* Animated pulse */}
                  <circle cx="200" cy="200" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" from="10" to="50" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>
                
                {/* Floating badges */}
                <div className="absolute top-10 right-10 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium animate-bounce">
                  New Bills Added
                </div>
                <div className="absolute bottom-20 left-10 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  Live Updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Navigation Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Quick Access</h2>
            <p className="text-gray-600">Navigate directly to key platform features</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/legislation">
              <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center">
                <Gavel className="h-8 w-8 text-primary mb-3" />
                <span className="font-medium">Legislation</span>
              </div>
            </Link>
            
            <Link href="/committee-meetings">
              <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center">
                <Calendar className="h-8 w-8 text-primary mb-3" />
                <span className="font-medium">Committee Meetings</span>
              </div>
            </Link>
            
            <Link href="/action-circles">
              <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center">
                <UsersRound className="h-8 w-8 text-primary mb-3" />
                <span className="font-medium">Action Circles</span>
              </div>
            </Link>
            
            <Link href="/action-center">
              <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center">
                <Megaphone className="h-8 w-8 text-primary mb-3" />
                <span className="font-medium">Action Center</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Bills Dashboard Section */}
      <TrendingBillsDashboard />

      {/* Call to Action Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Make a Real Impact?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the movement that's transforming how citizens engage with government and hold power accountable.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-red-700">
                Join Act Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Act Up</h3>
              <p className="text-sm">
                Transforming civic engagement through social impact to create a more equitable democratic process.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legislation">Legislation Tracking</Link></li>
                <li><Link href="/committees">Committee Monitoring</Link></li>
                <li><Link href="/action-circles">Action Circles</Link></li>
                <li><Link href="/war-room">War Room</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works">How It Works</Link></li>
                <li><Link href="/training">Training Center</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© {new Date().getFullYear()} Act Up. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}