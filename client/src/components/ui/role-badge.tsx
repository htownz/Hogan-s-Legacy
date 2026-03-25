import { cn } from "@/lib/utils";
import { SUPER_USER_ROLE } from "@/lib/constants";

type Role = "catalyst" | "amplifier" | "convincer";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RoleBadge({ role, size = "md", className }: RoleBadgeProps) {
  const getBgColor = (role: Role) => {
    switch (role) {
      case SUPER_USER_ROLE.CATALYST:
        return "bg-primary-50";
      case SUPER_USER_ROLE.AMPLIFIER:
        return "bg-secondary-50";
      case SUPER_USER_ROLE.CONVINCER:
        return "bg-alert-50";
      default:
        return "bg-neutral-50";
    }
  };

  const getTextColor = (role: Role) => {
    switch (role) {
      case SUPER_USER_ROLE.CATALYST:
        return "text-primary-600";
      case SUPER_USER_ROLE.AMPLIFIER:
        return "text-secondary-600";
      case SUPER_USER_ROLE.CONVINCER:
        return "text-alert-600";
      default:
        return "text-neutral-600";
    }
  };

  const getDotColor = (role: Role) => {
    switch (role) {
      case SUPER_USER_ROLE.CATALYST:
        return "bg-primary-600";
      case SUPER_USER_ROLE.AMPLIFIER:
        return "bg-secondary-600";
      case SUPER_USER_ROLE.CONVINCER:
        return "bg-alert-600";
      default:
        return "bg-neutral-600";
    }
  };

  const sizeClasses = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-1.5 px-3",
    lg: "text-base py-2 px-4",
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5 mr-1.5",
    md: "w-2 h-2 mr-2",
    lg: "w-2.5 h-2.5 mr-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide",
        getBgColor(role),
        getTextColor(role),
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          "rounded-full",
          getDotColor(role),
          dotSizeClasses[size]
        )}
      />
      <span className="capitalize">{role}</span>
    </span>
  );
}
