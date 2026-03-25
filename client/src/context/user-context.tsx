import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, SuperUser } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface UserContextType {
  user: User | null;
  superUser: SuperUser | null;
  isLoading: boolean;
  error: Error | null;
  updateSuperUserRole: (role: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [superUser, setSuperUser] = useState<SuperUser | null>(null);

  const { isLoading, error, data } = useQuery<any>({
    queryKey: ['/api/me'],
    retry: false
  });

  useEffect(() => {
    if (data) {
      setUser(data.user);
      setSuperUser(data.superUser);
    }
  }, [data]);

  const updateSuperUserRole = async (role: string) => {
    if (!superUser) return;
    
    try {
      const res = await apiRequest('PATCH', `/api/super-users/${superUser.userId}`, { role });
      const updatedSuperUser = await res.json();
      setSuperUser(updatedSuperUser);
    } catch (err) {
      console.error('Failed to update super user role:', err);
    }
  };

  return (
    <UserContext.Provider value={{ user, superUser, isLoading, error: error as Error | null, updateSuperUserRole }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
