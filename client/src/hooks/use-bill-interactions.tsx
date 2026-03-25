import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BillNote, 
  InsertBillNote,
  BillHighlight,
  InsertBillHighlight,
  BillShare, 
  InsertBillShare 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ---- BILL NOTES HOOKS ----

export function useBillNotes(billId: string | undefined) {
  return useQuery<any>({
    queryKey: ['/api/bills', billId, 'notes'],
    queryFn: async () => {
      if (!billId) return [];
      const res = await apiRequest('GET', `/api/bills/${billId}/notes`);
      return await res.json() as BillNote[];
    },
    enabled: !!billId,
  });
}

export function useUserBillNotes(billId: string | undefined) {
  return useQuery<any>({
    queryKey: ['/api/users/me/bills', billId, 'notes'],
    queryFn: async () => {
      if (!billId) return [];
      const res = await apiRequest('GET', `/api/users/me/bills/${billId}/notes`);
      return await res.json() as BillNote[];
    },
    enabled: !!billId,
  });
}

export function useCreateBillNote(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertBillNote, 'billId'>) => {
      if (!billId) throw new Error('Bill ID is required');
      
      const res = await apiRequest('POST', `/api/bills/${billId}/notes`, data);
      return await res.json() as BillNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'notes'] });
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBillNote(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noteId, data }: { noteId: number, data: Partial<BillNote> }) => {
      if (!billId) throw new Error('Bill ID is required');
      
      const res = await apiRequest('PUT', `/api/bills/notes/${noteId}`, data);
      return await res.json() as BillNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'notes'] });
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBillNote(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (noteId: number) => {
      if (!billId) throw new Error('Bill ID is required');
      
      await apiRequest('DELETE', `/api/bills/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'notes'] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ---- BILL HIGHLIGHTS HOOKS ----

export function useBillHighlights(billId: string | undefined) {
  return useQuery<any>({
    queryKey: ['/api/bills', billId, 'highlights'],
    queryFn: async () => {
      if (!billId) return [];
      const res = await apiRequest('GET', `/api/bills/${billId}/highlights`);
      return await res.json() as BillHighlight[];
    },
    enabled: !!billId,
  });
}

export function useUserBillHighlights(billId: string | undefined) {
  return useQuery<any>({
    queryKey: ['/api/users/me/bills', billId, 'highlights'],
    queryFn: async () => {
      if (!billId) return [];
      const res = await apiRequest('GET', `/api/users/me/bills/${billId}/highlights`);
      return await res.json() as BillHighlight[];
    },
    enabled: !!billId,
  });
}

export function useCreateBillHighlight(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertBillHighlight, 'billId'>) => {
      if (!billId) throw new Error('Bill ID is required');
      
      const res = await apiRequest('POST', `/api/bills/${billId}/highlights`, data);
      return await res.json() as BillHighlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'highlights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'highlights'] });
      toast({
        title: "Text highlighted",
        description: "Your highlight has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to highlight text",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBillHighlight(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ highlightId, data }: { highlightId: number, data: Partial<BillHighlight> }) => {
      if (!billId) throw new Error('Bill ID is required');
      
      const res = await apiRequest('PUT', `/api/bills/highlights/${highlightId}`, data);
      return await res.json() as BillHighlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'highlights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'highlights'] });
      toast({
        title: "Highlight updated",
        description: "Your highlight has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBillHighlight(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (highlightId: number) => {
      if (!billId) throw new Error('Bill ID is required');
      
      await apiRequest('DELETE', `/api/bills/highlights/${highlightId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'highlights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bills', billId, 'highlights'] });
      toast({
        title: "Highlight deleted",
        description: "Your highlight has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ---- BILL SHARES HOOKS ----

export function useUserBillShares() {
  return useQuery<any>({
    queryKey: ['/api/users/me/shares'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/me/shares`);
      return await res.json() as BillShare[];
    },
  });
}

export function useCreateBillShare(billId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertBillShare, 'billId'>) => {
      if (!billId) throw new Error('Bill ID is required');
      
      const res = await apiRequest('POST', `/api/bills/${billId}/share`, data);
      return await res.json() as BillShare & { shareUrl: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/shares'] });
      toast({
        title: "Bill shared",
        description: `Share link generated: ${data.shareUrl}`,
      });
      return data.shareUrl;
    },
    onError: (error) => {
      toast({
        title: "Failed to share bill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRecordShareClick() {
  return useMutation({
    mutationFn: async (shareId: number) => {
      await apiRequest('POST', `/api/shares/${shareId}/click`);
    },
  });
}

export function useDeleteBillShare() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (shareId: number) => {
      await apiRequest('DELETE', `/api/shares/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/shares'] });
      toast({
        title: "Share deleted",
        description: "Your share has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete share",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}