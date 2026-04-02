import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, SuperUserRole, SuperUserRoleType } from '@/lib/types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  superUserRole: SuperUserRole | null;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  name: string;
  district?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [superUserRole, setSuperUserRole] = useState<SuperUserRole | null>(null);

  // Fetch current user
  const {
    data: user,
    isLoading,
    isError,
    refetch: refetchUser
  } = useQuery<User | null>({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      try {
        return await apiRequest<User>('/api/users/me');
      } catch (error) {
        return null;
      }
    }
  });

  // Fetch user's super user role when user is available
  const {
    data: roleData,
    refetch: refetchRole
  } = useQuery<SuperUserRole | null>({
    queryKey: ['/api/users/me/role'],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await apiRequest<SuperUserRole>('/api/users/me/role');
      } catch (error) {
        return null;
      }
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return apiRequest<User>('/api/auth/login', 'POST', { username, password });
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(['/api/users/me'], data);
      toast({
        title: 'Success',
        description: 'You have been logged in successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again',
        variant: 'destructive',
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      return apiRequest<User>('/api/auth/register', 'POST', userData);
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(['/api/users/me'], data);
      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please check your information and try again',
        variant: 'destructive',
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<void>('/api/auth/logout', 'POST');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/users/me'], null);
      setSuperUserRole(null);
      // Clear any user-related data from localStorage
      localStorage.removeItem('actupUser');
      localStorage.removeItem('recentSearches');
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout Failed',
        description: error.message || 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  });

  // Refresh user and role data
  const refreshUser = () => {
    refetchUser();
    if (user) {
      refetchRole();
    }
  };

  // Wrapper functions for mutations
  const login = async (username: string, password: string): Promise<User> => {
    return loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData): Promise<User> => {
    return registerMutation.mutateAsync(userData);
  };

  const logout = async (): Promise<void> => {
    return logoutMutation.mutateAsync();
  };

  // Sync superUserRole with queried data
  useEffect(() => {
    if (roleData && typeof roleData === 'object' && 'id' in roleData) {
      setSuperUserRole(roleData as SuperUserRole);
    }
  }, [roleData]);

  const value = {
    user: user || null,
    isLoading,
    isError,
    superUserRole,
    login,
    register,
    logout,
    refreshUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}