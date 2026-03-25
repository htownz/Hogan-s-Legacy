import React, { useState } from "react";
import { MessageSquare, X, CornerUpRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/api";

// Feedback form schema using zod
const feedbackSchema = z.object({
  type: z.enum(["suggestion", "issue", "praise", "other"], {
    required_error: "Please select a feedback type",
  }),
  message: z.string().min(5, {
    message: "Feedback message must be at least 5 characters",
  }),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export const FeedbackBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "suggestion",
      message: "",
    },
  });

  const toggleFeedback = () => {
    setIsOpen(!isOpen);
    // Reset success state when reopening
    if (!isOpen) {
      setIsSuccess(false);
    }
  };

  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Add current URL to feedback data
      const feedbackData = {
        ...data,
        url: location,
        isAnonymous: true, // Default to anonymous unless user is logged in
      };
      
      // Submit feedback to API
      await apiRequest("/api/feedback", "POST", feedbackData);
      
      // Show success state
      setIsSuccess(true);
      form.reset();
      
      // Show toast notification
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      // Close feedback modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        // Reset success state after closing
        setTimeout(() => setIsSuccess(false), 300);
      }, 2000);
    } catch (error) {
      // Show error toast
      toast({
        title: "Error submitting feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Feedback trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={toggleFeedback}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-[5.5rem] right-6 z-50 w-80 md:w-96 bg-card shadow-xl rounded-lg overflow-hidden"
          >
            <div className="bg-primary p-4 text-primary-foreground">
              <h3 className="text-lg font-medium">Share your feedback</h3>
              <p className="text-sm opacity-80">Help us improve Act Up</p>
            </div>

            {isSuccess ? (
              <div className="p-6 flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <h4 className="text-lg font-medium mb-1">Thank you!</h4>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Your feedback has been successfully submitted.
                </p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedback-type" className="block font-medium">
                      Feedback type
                    </Label>
                    <RadioGroup
                      className="grid grid-cols-2 gap-2"
                      {...form.register("type")}
                      defaultValue={form.getValues("type")}
                      onValueChange={(value) => form.setValue("type", value as any)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="suggestion" id="suggestion" />
                        <Label htmlFor="suggestion" className="cursor-pointer">
                          Suggestion
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="issue" id="issue" />
                        <Label htmlFor="issue" className="cursor-pointer">
                          Issue
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="praise" id="praise" />
                        <Label htmlFor="praise" className="cursor-pointer">
                          Praise
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="cursor-pointer">
                          Other
                        </Label>
                      </div>
                    </RadioGroup>
                    {form.formState.errors.type && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="block font-medium">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you think..."
                      className="resize-none"
                      rows={4}
                      {...form.register("message")}
                    />
                    {form.formState.errors.message && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CornerUpRight className="w-4 h-4" />
                        Submit feedback
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={toggleFeedback}
          />
        )}
      </AnimatePresence>
    </>
  );
};