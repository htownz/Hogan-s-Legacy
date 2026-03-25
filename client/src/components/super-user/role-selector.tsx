import { useState } from "react";
import { useUser } from "@/context/user-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Users, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPER_USER_ROLE } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface RoleSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelector({ open, onOpenChange }: RoleSelectorProps) {
  const { superUser, updateSuperUserRole } = useUser();
  const [selectedRole, setSelectedRole] = useState<string>(superUser?.role || SUPER_USER_ROLE.AMPLIFIER);
  const { toast } = useToast();

  const handleSaveRole = async () => {
    try {
      await updateSuperUserRole(selectedRole);
      toast({
        title: "Role updated",
        description: `Your role has been updated to ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Change Super User Role</DialogTitle>
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            onClick={() => onOpenChange(false)}
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            className={cn(
              "relative rounded-lg border px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-catalyst focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-catalyst",
              selectedRole === SUPER_USER_ROLE.CATALYST
                ? "border-2 border-catalyst bg-white"
                : "border-gray-300 bg-white"
            )}
            onClick={() => setSelectedRole(SUPER_USER_ROLE.CATALYST)}
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-catalyst flex items-center justify-center text-white">
                <Lightbulb className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <a href="#" className="focus:outline-none" onClick={(e) => e.preventDefault()}>
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">Catalyst</p>
                <p className="text-sm text-gray-500 truncate">Knowledge and information specialists</p>
              </a>
            </div>
          </div>
          
          <div
            className={cn(
              "relative rounded-lg border px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-amplifier focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amplifier",
              selectedRole === SUPER_USER_ROLE.AMPLIFIER
                ? "border-2 border-amplifier bg-white"
                : "border-gray-300 bg-white"
            )}
            onClick={() => setSelectedRole(SUPER_USER_ROLE.AMPLIFIER)}
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amplifier flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <a href="#" className="focus:outline-none" onClick={(e) => e.preventDefault()}>
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">Amplifier</p>
                <p className="text-sm text-gray-500 truncate">Network builders and connectors</p>
              </a>
            </div>
          </div>
          
          <div
            className={cn(
              "relative rounded-lg border px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-convincer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-convincer",
              selectedRole === SUPER_USER_ROLE.CONVINCER
                ? "border-2 border-convincer bg-white"
                : "border-gray-300 bg-white"
            )}
            onClick={() => setSelectedRole(SUPER_USER_ROLE.CONVINCER)}
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-convincer flex items-center justify-center text-white">
                <Megaphone className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <a href="#" className="focus:outline-none" onClick={(e) => e.preventDefault()}>
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">Convincer</p>
                <p className="text-sm text-gray-500 truncate">Persuasive communicators and storytellers</p>
              </a>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSaveRole} className="w-full">
            Save Role Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
