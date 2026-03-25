import { createContext, ReactNode, useContext } from "react";
import { User, SuperUserRole } from "@/lib/types";
import { useUser } from "./use-user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  userRole?: SuperUserRole | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isError, superUserRole } = useUser();

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isError, 
      userRole: superUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}