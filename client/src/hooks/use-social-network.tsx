import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  UserInvitation, 
  UserConnection, 
  ConnectionActivity,
  UserNetworkImpact
} from "@/lib/types";

/**
 * Hook to access and manage social network functionality
 */
export function useSocialNetwork() {
  const queryClient = useQueryClient();

  // Get user invitations
  const {
    data: sentInvitations,
    isLoading: isLoadingSentInvitations,
    error: sentInvitationsError,
  } = useQuery<UserInvitation[]>({
    queryKey: ["/api/users/me/invitations"],
    retry: 1,
  });

  // Get user connections
  const {
    data: connections,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useQuery<UserConnection[]>({
    queryKey: ["/api/users/me/connections"],
    retry: 1,
  });

  // Get user connection activities
  const {
    data: connectionActivities,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery<ConnectionActivity[]>({
    queryKey: ["/api/users/me/connection-activities"],
    retry: 1,
  });

  // Get user network impact
  const {
    data: networkImpact,
    isLoading: isLoadingNetworkImpact,
    error: networkImpactError,
  } = useQuery<UserNetworkImpact>({
    queryKey: ["/api/users/me/network-impact"],
    retry: 1,
  });

  // Get connection strength with specific user
  const getConnectionStrength = (connectionId: number) => {
    return useQuery<UserConnection>({
      queryKey: ["/api/users/me/connections", connectionId],
      retry: 1,
    });
  };

  // Create new invitation
  const createInvitation = useMutation<
    UserInvitation,
    Error,
    { email: string; name: string; message?: string }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/invitations", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Your invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/invitations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/network-impact"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation<void, Error, number>({
    mutationFn: async (invitationId) => {
      await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "Your invitation has been cancelled.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/invitations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/network-impact"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error cancelling invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept invitation
  const acceptInvitation = useMutation<void, Error, string>({
    mutationFn: async (inviteCode) => {
      await apiRequest("POST", `/api/invitations/${inviteCode}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation accepted",
        description: "You have successfully joined Act Up.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error accepting invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create connection with another user
  const createConnection = useMutation<
    UserConnection,
    Error,
    { connectedUserId: number }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/connections", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection created",
        description: "You have connected with another user.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/connections"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/network-impact"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating connection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove connection with another user
  const removeConnection = useMutation<void, Error, number>({
    mutationFn: async (connectionId) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Connection removed",
        description: "You have removed a connection.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/connections"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/network-impact"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing connection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Log connection activity
  const logConnectionActivity = useMutation<
    ConnectionActivity,
    Error,
    { connectedUserId: number; activityType: string; description: string }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/connection-activities", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/connection-activities"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/connections"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/network-impact"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    sentInvitations,
    isLoadingSentInvitations,
    sentInvitationsError,
    connections,
    isLoadingConnections,
    connectionsError,
    connectionActivities,
    isLoadingActivities,
    activitiesError,
    networkImpact,
    isLoadingNetworkImpact,
    networkImpactError,
    getConnectionStrength,

    // Mutations
    createInvitation,
    cancelInvitation, 
    acceptInvitation,
    createConnection,
    removeConnection,
    logConnectionActivity,
  };
}