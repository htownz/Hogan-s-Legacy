import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function MobileActionButton({
  children,
  onClick,
  variant = "primary",
  size = "lg",
  fullWidth = false,
  icon,
  disabled = false,
  loading = false,
  className
}: MobileActionButtonProps) {
  const baseClasses = "touch-manipulation select-none transition-all duration-150 active:scale-95 font-semibold shadow-lg";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-blue-200",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border border-gray-300 shadow-gray-200",
    success: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-green-200",
    warning: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-orange-200",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-red-200"
  };

  const sizeClasses = {
    sm: "h-10 px-4 text-sm min-w-20",
    md: "h-12 px-6 text-base min-w-24", 
    lg: "h-14 px-8 text-lg min-w-32"
  };

  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading && (
        <div className="mr-2 animate-spin">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </div>
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </Button>
  );
}