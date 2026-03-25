import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "minimal";
  touchOptimized?: boolean;
}

export function MobileCard({
  title,
  description,
  children,
  icon,
  className,
  headerActions,
  variant = "default",
  touchOptimized = true
}: MobileCardProps) {
  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-sm",
    elevated: "bg-white border-0 shadow-lg shadow-gray-200/50",
    outlined: "bg-white border-2 border-gray-300 shadow-none",
    minimal: "bg-gray-50 border-0 shadow-none"
  };

  const touchClasses = touchOptimized 
    ? "active:scale-[0.98] transition-transform duration-150" 
    : "";

  return (
    <Card className={cn(
      "rounded-xl overflow-hidden",
      variantClasses[variant],
      touchClasses,
      className
    )}>
      {(title || description || icon || headerActions) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {icon && (
                <div className="flex-shrink-0 mt-1">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex-shrink-0 ml-3">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={title || description ? "pt-0" : "pt-6"}>
        {children}
      </CardContent>
    </Card>
  );
}