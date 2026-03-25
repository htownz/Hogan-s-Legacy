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

const defaultUser: User = {
  id: 1,
  username: "sarahjohnson",
  password: "password", // In a real app, we would never store passwords in context
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  district: "TX-10",
  profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  createdAt: new Date().toISOString()
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(defaultUser); // Using default user for demo

  const login = async (username: string, password: string) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
      // const userData = await response.json();
      // setUser(userData);

      // For demo purposes, just set the default user
      setUser(defaultUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Login failed");
    }
  };

  const logout = () => {
    // In a real app, this would be an API call
    // fetch("/api/logout", { method: "POST" });
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
