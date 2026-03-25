import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserNetworkImpact, NetworkUser } from "@/lib/types";
import { MOCK_NETWORK_USERS } from "@/lib/constants";
import { useUser } from "@/hooks/use-user";

interface RippleEffectTrackerProps {
  networkImpact?: UserNetworkImpact;
}

export default function RippleEffectTracker({ networkImpact }: RippleEffectTrackerProps) {
  const { user } = useUser();
  const [ripples, setRipples] = useState<Array<{ id: number; delay: number }>>([]);
  const [networkUsers] = useState<NetworkUser[]>(MOCK_NETWORK_USERS);

  // Create ripple effect animation
  useEffect(() => {
    // Create 3 ripples with different animation delays
    const newRipples = [
      { id: 1, delay: 0 },
      { id: 2, delay: 1 },
      { id: 3, delay: 2 }
    ];
    setRipples(newRipples);

    // Cleanup function
    return () => {
      setRipples([]);
    };
  }, []);

  const getRippleColor = () => {
    return "rgba(26, 77, 159, 0.8)"; // primary color with opacity
  };

  return (
    <div className="ripple-container bg-neutral-50 rounded-lg flex items-center justify-center">
      {/* Ripple animations */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            top: "110px",
            left: "50%",
            backgroundColor: getRippleColor(),
            animationDelay: `${ripple.delay}s`
          }}
        />
      ))}
      
      {/* Central user */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-white rounded-full p-2 shadow-md">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.profileImageUrl} alt={user?.name || "Your profile"} />
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "YP"}</AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-2 text-center">
          <div className="font-medium">You</div>
          <div className="text-xs text-neutral-500">{networkImpact?.actionsInspired || 0} Actions</div>
        </div>
        
        {/* Network users positioned around the central user */}
        {networkUsers.map((networkUser) => (
          <div 
            key={networkUser.id} 
            className="absolute" 
            style={{ 
              top: `${networkUser.position.y}px`, 
              left: `${networkUser.position.x}px` 
            }}
          >
            <div className="bg-white rounded-full p-1 shadow-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage src={networkUser.imageUrl} alt={networkUser.name} />
                <AvatarFallback>{networkUser.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="mt-1 text-center">
              <div className="text-xs">{networkUser.name}</div>
              <div className="text-xs text-neutral-500">{networkUser.actionCount} Actions</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
