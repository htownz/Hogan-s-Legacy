import { useState } from "react";
import { MessageCircle, ThumbsUp, ThumbsDown, X, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

type Sentiment = "positive" | "negative" | null;

export const FeedbackBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const { toast } = useToast();

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset form after animation completes
    setTimeout(() => {
      setSentiment(null);
      setComment("");
      setShowThanks(false);
    }, 300);
  };

  const handleSentimentClick = (newSentiment: Sentiment) => {
    setSentiment(newSentiment);
  };

  const handleSubmit = async () => {
    if (!sentiment) {
      toast({
        title: "Please select a sentiment",
        description: "Let us know if your experience was positive or negative",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call API to submit feedback
      await apiRequest("/api/feedback", "POST", {
        sentiment,
        comment: comment.trim() || null,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });

      // Show thanks message
      setShowThanks(true);
      
      // Close after delay
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
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
    <div className="fixed bottom-5 right-5 z-50">
      {/* Closed state - just the bubble */}
      {!isOpen && (
        <motion.button
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-all"
          onClick={handleOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}

      {/* Open state - feedback form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-card text-card-foreground p-4 rounded-lg shadow-xl w-80"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">How's your experience?</h3>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {showThanks ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-xl mb-2">🙏</div>
                <p className="text-center">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 justify-center mb-4">
                  <Button
                    variant={sentiment === "positive" ? "default" : "outline"}
                    className={`flex-1 ${sentiment === "positive" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => handleSentimentClick("positive")}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    Good
                  </Button>
                  <Button
                    variant={sentiment === "negative" ? "default" : "outline"}
                    className={`flex-1 ${sentiment === "negative" ? "bg-red-600 hover:bg-red-700" : ""}`}
                    onClick={() => handleSentimentClick("negative")}
                  >
                    <ThumbsDown className="h-5 w-5 mr-2" />
                    Bad
                  </Button>
                </div>

                <Textarea
                  placeholder="Tell us more (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] mb-4"
                />

                <Button 
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Send Feedback"}
                  {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackBubble;