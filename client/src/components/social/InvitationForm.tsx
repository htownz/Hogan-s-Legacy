import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UserInvitation } from "@/lib/types";

// Form validation schema
const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter a name").max(255),
  message: z.string().optional(),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

interface InvitationFormProps {
  onSuccess?: () => void;
}

export function InvitationForm({ onSuccess }: InvitationFormProps) {
  const queryClient = useQueryClient();
  
  // Form definition
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      name: "",
      message: `Hi! I'd like to invite you to join Act Up, a platform for civic engagement and legislative advocacy. Join me in making a difference!`,
    },
  });

  // Create invitation mutation
  const inviteMutation = useMutation<UserInvitation, Error, InvitationFormValues>({
    mutationFn: async (values) => {
      const res = await apiRequest("POST", "/api/invitations", values);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form
      form.reset();
      
      // Show success toast
      toast({
        title: "Invitation sent!",
        description: "Your invitation has been sent successfully.",
        variant: "default",
      });
      
      // Invalidate invitations cache
      queryClient.invalidateQueries({
        queryKey: ["/api/users/me/invitations"],
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: InvitationFormValues) => {
    inviteMutation.mutate(values);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-xl font-semibold mb-4">Invite Someone to Join Act Up</h3>
      <p className="text-sm text-neutral-600 mb-6">
        Help grow the movement by inviting people who care about civic engagement.
        Each invitation counts toward your impact statistics.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="friend@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add a personal message to your invitation..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Personalize your invitation with a message explaining why you're inviting them.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}