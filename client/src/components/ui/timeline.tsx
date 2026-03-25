import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItemIndicatorProps 
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface TimelineItemContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface TimelineItemTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface TimelineItemDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface TimelineItemProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4 relative", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex relative pb-8 last:pb-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

const TimelineItemIndicator = React.forwardRef<HTMLDivElement, TimelineItemIndicatorProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("flex-shrink-0 z-10", className)}
        {...props}
      >
        <div className={cn(
          "w-9 h-9 rounded-full border-2 flex items-center justify-center",
          "relative after:absolute after:top-[2.25rem] after:left-1/2 after:-translate-x-1/2",
          "after:h-full after:w-0.5 after:bg-gray-200 after:z-[-1]",
          children ? "text-gray-600" : ""
        )}
        style={
          { 
            "--timeline-connector-display": "block",
            ...style as any 
          } as React.CSSProperties
        } 
        >
          {children}
        </div>
      </div>
    );
  }
);
TimelineItemIndicator.displayName = "TimelineItemIndicator";

const TimelineItemContent = React.forwardRef<HTMLDivElement, TimelineItemContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-grow ml-4 pt-1", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineItemContent.displayName = "TimelineItemContent";

const TimelineItemTitle = React.forwardRef<HTMLHeadingElement, TimelineItemTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h4
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
      >
        {children}
      </h4>
    );
  }
);
TimelineItemTitle.displayName = "TimelineItemTitle";

const TimelineItemDescription = React.forwardRef<HTMLParagraphElement, TimelineItemDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-600 mt-1", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
TimelineItemDescription.displayName = "TimelineItemDescription";

export {
  Timeline,
  TimelineItem,
  TimelineItemIndicator,
  TimelineItemContent,
  TimelineItemTitle,
  TimelineItemDescription
};