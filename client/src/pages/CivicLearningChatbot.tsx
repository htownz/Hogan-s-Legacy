import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot,
  User,
  Send,
  MessageCircle,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Building,
  Scale,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  Star,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  sources?: string[];
  rating?: "helpful" | "not_helpful";
}

const suggestedTopics = [
  {
    icon: <Building className="h-5 w-5" />,
    title: "How Texas Legislature Works",
    description: "Learn about the structure and process of Texas government",
    prompt: "How does the Texas Legislature work?"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Understanding Bills",
    description: "Learn how bills become laws in Texas",
    prompt: "How does a bill become a law in Texas?"
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "Your Rights & Voting",
    description: "Understand your civic rights and voting process",
    prompt: "What are my voting rights in Texas?"
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Contacting Representatives",
    description: "Learn how to effectively contact your legislators",
    prompt: "How can I contact my Texas representatives?"
  }
];

export default function CivicLearningChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "bot",
      content: "Hi! I'm your Interactive Civic Learning Assistant. I'm here to help you understand Texas government, legislation, and your civic rights. Ask me anything about how the Texas Legislature works, how bills become laws, or how you can get involved in the democratic process!",
      timestamp: new Date(),
      suggestions: [
        "How does the Texas Legislature work?",
        "How can I track a specific bill?",
        "What are my voting rights?",
        "How do I contact my representative?"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call your civic learning AI API
      const response = await fetch('/api/civic-chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          context: "texas_civic_education"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions || [],
          sources: data.sources || []
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "I apologize, but I'm having trouble processing your question right now. Please try asking about Texas government processes, legislation, or civic rights in a different way.",
        timestamp: new Date(),
        suggestions: [
          "How does the Texas Legislature work?",
          "What is the difference between the House and Senate?",
          "How can I find my district representatives?",
          "What are the steps in the legislative process?"
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateMessage = async (messageId: string, rating: "helpful" | "not_helpful") => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));

    try {
      await fetch('/api/civic-chatbot/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          rating,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        content: "Hi! I'm your Interactive Civic Learning Assistant. I'm here to help you understand Texas government, legislation, and your civic rights. Ask me anything about how the Texas Legislature works, how bills become laws, or how you can get involved in the democratic process!",
        timestamp: new Date(),
        suggestions: [
          "How does the Texas Legislature work?",
          "How can I track a specific bill?",
          "What are my voting rights?",
          "How do I contact my representative?"
        ]
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Interactive Civic Learning Chatbot</h1>
          </div>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Learn about Texas government, legislation, and your civic rights through interactive conversation with AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Learning Topics */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Learning Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => handleSendMessage(topic.prompt)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        {topic.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm mb-1">{topic.title}</h4>
                        <p className="text-blue-200 text-xs">{topic.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Tips for Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-blue-200 text-sm space-y-2">
                  <p>• Ask specific questions about Texas government</p>
                  <p>• Request explanations of legislative terms</p>
                  <p>• Learn about your district representatives</p>
                  <p>• Understand the bill-to-law process</p>
                  <p>• Explore your civic rights and responsibilities</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 h-[700px] flex flex-col">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Civic Learning Assistant</CardTitle>
                      <p className="text-blue-200 text-sm">Powered by Texas Government Data</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetConversation}
                    className="text-blue-200 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type === "bot" && (
                        <div className="p-2 bg-blue-500 rounded-full self-start">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white/10 text-white border border-white/20"
                        }`}
                      >
                        <p className="mb-2">{message.content}</p>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <p className="text-xs text-blue-200 mb-2">Sources:</p>
                            <div className="space-y-1">
                              {message.sources.map((source, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <p className="text-xs text-blue-200 mb-2">Suggested questions:</p>
                            <div className="space-y-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendMessage(suggestion)}
                                  className="text-xs text-blue-200 hover:text-white h-auto p-2 justify-start"
                                >
                                  <HelpCircle className="h-3 w-3 mr-2" />
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.type === "bot" && message.id !== "welcome" && (
                          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                            <span className="text-xs text-blue-200">Was this helpful?</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRateMessage(message.id, "helpful")}
                              className={`p-1 h-auto ${
                                message.rating === "helpful" ? "text-green-400" : "text-blue-200"
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRateMessage(message.id, "not_helpful")}
                              className={`p-1 h-auto ${
                                message.rating === "not_helpful" ? "text-red-400" : "text-blue-200"
                              }`}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-blue-300">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {message.type === "user" && (
                        <div className="p-2 bg-green-500 rounded-full self-start">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white/10 text-white border border-white/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" />
                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                          <span className="text-sm text-blue-200">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask me about Texas government, legislation, or civic rights..."
                    disabled={isLoading}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-blue-300 text-center">
                  Ask about Texas government, laws, voting, representatives, and more!
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}