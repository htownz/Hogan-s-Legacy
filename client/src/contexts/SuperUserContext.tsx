// @ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SuperUserRole, SuperUserRoleType, SuperUserRoleWithLevel } from "../lib/types";
import { DEFAULT_SUPER_USER_ROLES } from "../lib/constants";
import { mapLevelNumberToType } from "../lib/utils/progressUtils";
import { useUser } from "./UserContext";

interface SuperUserContextType {
  roles: SuperUserRoleWithLevel[];
  mainRole: SuperUserRoleWithLevel | null;
  isLoading: boolean;
  setMainRole: (roleType: SuperUserRoleType) => void;
  updateRoleProgress: (roleId: number, progress: number) => void;
  getRoleByType: (roleType: SuperUserRoleType) => SuperUserRoleWithLevel | undefined;
  levelUp: (roleId: number) => void;
}

const SuperUserContext = createContext<SuperUserContextType>({
  roles: [],
  mainRole: null,
  isLoading: true,
  setMainRole: () => {},
  updateRoleProgress: () => {},
  getRoleByType: () => undefined,
  levelUp: () => {},
});

export function SuperUserProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [roles, setRoles] = useState<SuperUserRoleWithLevel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // In a real app, fetch from API
        // const response = await fetch(`/api/users/${user.id}/roles`);
        // const data = await response.json();
        
        // For demo, use static data
        const mockRoles = DEFAULT_SUPER_USER_ROLES.map((role: any, index: any) => ({
          ...role,
          id: index + 1,
          userId: user.id,
          levelName: mapLevelNumberToType(role.level),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as SuperUserRoleWithLevel));

        setRoles(mockRoles);
      } catch (error) {
        console.error("Failed to fetch super user roles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const mainRole = roles.find(role => role.selectedAsMain) || roles[0] || null;

  const setMainRole = (roleType: SuperUserRoleType) => {
    setRoles(prevRoles => 
      prevRoles.map(role => ({
        ...role,
        selectedAsMain: role.role === roleType
      }))
    );
  };

  const updateRoleProgress = (roleId: number, progress: number) => {
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === roleId 
          ? { ...role, progressToNextLevel: progress } 
          : role
      )
    );
  };

  const getRoleByType = (roleType: SuperUserRoleType) => {
    return roles.find(role => role.role === roleType);
  };

  const levelUp = (roleId: number) => {
    setRoles(prevRoles => 
      prevRoles.map(role => {
        if (role.id === roleId) {
          const newLevel = Math.min(4, role.level + 1);
          return {
            ...role,
            level: newLevel,
            levelName: mapLevelNumberToType(newLevel),
            progressToNextLevel: 0
          };
        }
        return role;
      })
    );
  };

  return (
    <SuperUserContext.Provider
      value={{
        roles,
        mainRole,
        isLoading,
        setMainRole,
        updateRoleProgress,
        getRoleByType,
        levelUp,
      }}
    >
      {children}
    </SuperUserContext.Provider>
  );
}

export function useSuperUser() {
  return useContext(SuperUserContext);
}
