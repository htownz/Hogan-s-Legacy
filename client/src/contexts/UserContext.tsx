// @ts-nocheck
import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }
      const userData = await response.json();
      // Never store password on the client
      const { password: _, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      .catch(() => {}); // Best-effort server-side logout
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
