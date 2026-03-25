// @ts-nocheck
import { useEffect, useRef } from "react";
import { useUser } from "@/context/user-context";
import { cn, getRoleBgColor } from "@/lib/utils";

interface RippleEffectProps {
  className?: string;
}

export function RippleEffect({ className }: RippleEffectProps) {
  const { user, superUser } = useUser();
  const svgRef = useRef<SVGSVGElement>(null);

  if (!user || !superUser) return null;

  return (
    <div className={cn("relative h-52 flex items-center justify-center", className)}>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center z-10 shadow-md", getRoleBgColor(superUser.role))}>
          <img 
            className="h-10 w-10 rounded-full"
            src={user?.profileImageUrl} 
            alt={user?.name} 
          />
        </div>
        
        {/* First level connections */}
        <div className={cn("absolute top-1/4 left-1/4 w-8 h-8 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-80")}>
          <img 
            className="h-6 w-6 rounded-full" 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        <div className={cn("absolute top-1/3 right-1/4 w-8 h-8 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-80")}>
          <img 
            className="h-6 w-6 rounded-full" 
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        <div className={cn("absolute bottom-1/3 left-1/3 w-8 h-8 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-80")}>
          <img 
            className="h-6 w-6 rounded-full" 
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        
        {/* Second level connections */}
        <div className={cn("absolute top-1/6 left-1/2 w-6 h-6 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-60")}>
          <img 
            className="h-4 w-4 rounded-full" 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        <div className={cn("absolute bottom-1/4 right-1/3 w-6 h-6 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-60")}>
          <img 
            className="h-4 w-4 rounded-full" 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        <div className={cn("absolute top-1/2 left-1/5 w-6 h-6 rounded-full flex items-center justify-center z-0 shadow", getRoleBgColor(superUser.role), "bg-opacity-60")}>
          <img 
            className="h-4 w-4 rounded-full" 
            src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Connection" 
          />
        </div>
        
        {/* Lines connecting people */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }} ref={svgRef}>
          {/* Primary connections */}
          <line x1="50%" y1="50%" x2="25%" y2="25%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="2" strokeOpacity="0.6" />
          <line x1="50%" y1="50%" x2="75%" y2="33%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="2" strokeOpacity="0.6" />
          <line x1="50%" y1="50%" x2="33%" y2="66%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="2" strokeOpacity="0.6" />
          
          {/* Secondary connections */}
          <line x1="25%" y1="25%" x2="50%" y2="16%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="1" strokeOpacity="0.4" />
          <line x1="75%" y1="33%" x2="66%" y2="75%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="1" strokeOpacity="0.4" />
          <line x1="33%" y1="66%" x2="20%" y2="50%" stroke={superUser.role === 'amplifier' ? "#805AD5" : superUser.role === 'catalyst' ? "#3182CE" : "#DD6B20"} strokeWidth="1" strokeOpacity="0.4" />
        </svg>
        
        {/* Ripple effect around the user */}
        <div className="absolute top-1/2 left-1/2">
          <div className={cn("ripple-circle ripple-1", getRoleBgColor(superUser.role))}></div>
          <div className={cn("ripple-circle ripple-2", getRoleBgColor(superUser.role))}></div>
          <div className={cn("ripple-circle ripple-3", getRoleBgColor(superUser.role))}></div>
        </div>
      </div>
      
      <style jsx>{`
        .ripple-circle {
          border-radius: 50%;
          position: absolute;
          transform: translate(-50%, -50%);
          opacity: 0.3;
          animation: ripple 2s ease-out infinite;
        }
        .ripple-1 {
          width: 30px;
          height: 30px;
          animation-delay: 0s;
        }
        .ripple-2 {
          width: 60px;
          height: 60px;
          animation-delay: 0.5s;
        }
        .ripple-3 {
          width: 90px;
          height: 90px;
          animation-delay: 1s;
        }
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
