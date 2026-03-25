import { ReactNode, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useUser();

  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login using Redirect component
  if (!user) {
    return <Redirect to="/login" />;
  }

  // If authenticated, render children
  return <>{children}</>;
}