import React from "react";

interface PageHeaderProps {
  title?: string;
  description?: string;
  heading?: string;
  subheading?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, heading, subheading, action }: PageHeaderProps) {
  // For backward compatibility, support both naming conventions
  const displayTitle = heading || title;
  const displayDescription = subheading || description;
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-2 border-b">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{displayTitle}</h1>
        {displayDescription && (
          <p className="text-muted-foreground mt-1">{displayDescription}</p>
        )}
      </div>
      {action && <div className="mt-4 md:mt-0">{action}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ 
  title, 
  description, 
  action, 
  className = ""
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}