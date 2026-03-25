import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Award, BookOpen, ArrowRight, CheckCircle2, Gift, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Achievement card that animates when it appears
const AchievementCard = ({ 
  title, 
  description, 
  points, 
  unlocked, 
  icon 
}: { 
  title: string; 
  description: string; 
  points: number; 
  unlocked: boolean; 
  icon: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={cn(
          "relative overflow-hidden transition-all duration-300",
          unlocked ? "bg-gradient-to-br from-primary-50 to-white border-primary-200" : "bg-neutral-50 border-neutral-200"
        )}>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start mb-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                unlocked ? "bg-primary-100 text-primary-600" : "bg-neutral-100 text-neutral-400"
              )}>
                {icon}
              </div>
              <div>
                <h3 className={cn(
                  "font-semibold",
                  unlocked ? "text-primary-900" : "text-neutral-400"
                )}>
                  {title}
                </h3>
                <p className={cn(
                  "text-sm",
                  unlocked ? "text-neutral-600" : "text-neutral-400"
                )}>
                  {description}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Badge variant={unlocked ? "default" : "secondary"} className="font-normal">
                {points} points
              </Badge>
              {unlocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </motion.div>
              )}
            </div>
          </CardContent>
          {unlocked && (
            <motion.div 
              className="absolute top-0 right-0 -mt-1 -mr-1" 
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Badge className="bg-green-500 text-white border-0">Unlocked!</Badge>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Quiz component that tests civic knowledge
const CivicQuiz = ({ 
  question, 
  options, 
  correctAnswer, 
  onAnswer 
}: { 
  question: string; 
  options: string[]; 
  correctAnswer: number; 
  onAnswer: (isCorrect: boolean) => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleAnswer = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === correctAnswer;
    setHasAnswered(true);
    onAnswer(isCorrect);
  };

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-center">Civic Knowledge Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-neutral-800 font-medium mb-4">{question}</div>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div 
              key={index}
              onClick={() => !hasAnswered && setSelectedOption(index)}
              className={cn(
                "p-3 rounded-md border cursor-pointer transition-all",
                selectedOption === index ? "border-primary-300 bg-primary-50" : "border-neutral-200",
                hasAnswered && index === correctAnswer ? "bg-green-50 border-green-300" : "",
                hasAnswered && selectedOption === index && index !== correctAnswer ? "bg-red-50 border-red-300" : "",
                hasAnswered ? "cursor-default" : "hover:bg-neutral-50"
              )}
            >
              {option}
              {hasAnswered && index === correctAnswer && (
                <CheckCircle2 className="h-4 w-4 text-green-500 inline ml-2" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        {!hasAnswered ? (
          <Button onClick={handleAnswer} disabled={selectedOption === null}>
            Submit Answer
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onAnswer(selectedOption === correctAnswer)}>
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Main onboarding game component
export default function OnboardingGame() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'intro' | 'learning' | 'quiz' | 'achievement' | 'reward' | 'complete'>('intro');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);

  // Define interfaces for learning module data
  interface LearningSection {
    id: number;
    title: string;
    content: string;
  }

  interface LearningQuiz {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  }

  interface LearningAchievement {
    id: string;
    title: string;
    description: string;
    points: number;
    icon: React.ReactNode;
  }

  interface LearningModule {
    id: number;
    title: string;
    sections: LearningSection[];
    quizzes: LearningQuiz[];
    achievements: LearningAchievement[];
  }

  // Get learning module for onboarding
  const { data: learningModule, isLoading } = useQuery<LearningModule>({
    queryKey: ['/api/learning/onboarding-module'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/learning/onboarding-module');
        return await response.json();
      } catch (error) {
        // If API is not available, use fallback data
        return {
          id: 1,
          title: "Act Up Civic Engagement 101",
          sections: [
            {
              id: 1,
              title: "Understanding Your Civic Power",
              content: "Civic engagement means taking action to make positive changes in your community. Your voice matters in shaping policies and decisions that affect your daily life."
            },
            {
              id: 2,
              title: "How Bills Become Laws",
              content: "Bills must pass through multiple stages before becoming law: introduction, committee review, floor votes in both chambers, and executive approval."
            },
            {
              id: 3,
              title: "Effective Advocacy Techniques",
              content: "Strategic advocacy involves knowing when to contact officials, organizing groups for collective action, and sharing compelling personal stories."
            }
          ],
          quizzes: [
            {
              id: 1,
              question: "What percentage of a population needs to adopt a new social norm to create unstoppable momentum?",
              options: ["10%", "25%", "51%", "75%"],
              correctAnswer: 1
            },
            {
              id: 2,
              question: "Which of these is NOT one of the Super User roles in Act Up?",
              options: ["Catalyst", "Amplifier", "Convincer", "Collector"],
              correctAnswer: 3
            },
            {
              id: 3,
              question: "What's the most powerful way to communicate with elected officials?",
              options: ["Form emails", "Personal stories", "Social media posts", "Petitions"],
              correctAnswer: 1
            }
          ],
          achievements: [
            {
              id: "civic_scholar",
              title: "Civic Scholar",
              description: "Completed your first learning module",
              points: 25,
              icon: <BookOpen className="h-5 w-5" />
            },
            {
              id: "knowledge_tester",
              title: "Knowledge Tester",
              description: "Successfully answered civic engagement questions",
              points: 35,
              icon: <Award className="h-5 w-5" />
            },
            {
              id: "onboarding_graduate",
              title: "Onboarding Graduate",
              description: "Completed the entire onboarding experience",
              points: 50,
              icon: <Sparkles className="h-5 w-5" />
            }
          ]
        };
      }
    }
  });

  // Save user progress and achievements
  const { mutate: saveProgress } = useMutation({
    mutationFn: async (data: any) => {
      // Using the apiRequest wrapper with post method
      return await fetch('/api/users/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      console.error("Failed to save progress:", error);
    }
  });

  // Learning content
  const currentSection = learningModule?.sections?.[currentStepIndex];
  const currentQuiz = learningModule?.quizzes?.[currentStepIndex];
  
  // Handle advancing through the onboarding flow
  const handleNext = () => {
    if (gameState === 'intro') {
      setGameState('learning');
      setProgress(20);
    } else if (gameState === 'learning') {
      setGameState('quiz');
      setProgress(40);
    } else if (gameState === 'quiz') {
      // After quiz, show achievement
      setGameState('achievement');
      setProgress(60);
      
      // Add appropriate achievement
      if (currentStepIndex === 0) {
        setEarnedAchievements([...earnedAchievements, "civic_scholar"]);
        toast({
          title: "Achievement Unlocked!",
          description: "You've earned the Civic Scholar badge",
          duration: 5000,
        });
      } else if (currentStepIndex === 1) {
        setEarnedAchievements([...earnedAchievements, "knowledge_tester"]);
        toast({
          title: "Achievement Unlocked!",
          description: "You've earned the Knowledge Tester badge",
          duration: 5000,
        });
      }
    } else if (gameState === 'achievement') {
      if (currentStepIndex < 2) {
        // Move to next lesson if we have more
        setCurrentStepIndex(currentStepIndex + 1);
        setGameState('learning');
        setProgress(Math.min(80, 20 + (currentStepIndex + 1) * 20));
      } else {
        // Final reward
        setGameState('reward');
        setProgress(80);
      }
    } else if (gameState === 'reward') {
      // Complete the onboarding
      setGameState('complete');
      setProgress(100);
      setEarnedAchievements([...earnedAchievements, "onboarding_graduate"]);
      
      // Save final progress
      saveProgress({
        completed: true,
        score,
        achievements: earnedAchievements.concat("onboarding_graduate")
      });
      
      toast({
        title: "Congratulations!",
        description: "You've completed the onboarding experience",
        duration: 5000,
      });
    }
  };

  // Handle quiz answers
  const handleQuizAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 10);
      toast({
        description: "Correct! +10 points",
        duration: 2000,
      });
    }
    handleNext();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="w-full">
        <Progress value={progress} className="h-2.5 w-full" />
        <div className="flex justify-between mt-1 text-xs text-neutral-500">
          <span>Start</span>
          <span>Learning</span>
          <span>Quiz</span>
          <span>Rewards</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Game content */}
      <div className="min-h-[400px]">
        {gameState === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-primary-100 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Civic Engagement Journey</h2>
            <p className="text-neutral-600 max-w-lg mx-auto">
              Welcome to your civic learning adventure! Complete challenges, earn badges, and gain the knowledge you 
              need to become an effective advocate for change.
            </p>
            
            {/* Quote card with our core perspective */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-5 rounded-lg border border-primary-200 max-w-lg mx-auto my-4">
              <p className="text-primary-800 italic font-medium">
                "I'm not doing this to change the country. I'm doing it so the country won't change me."
              </p>
              <p className="text-sm text-primary-600 mt-2">
                This is the heart of Act Up — preserving your values and identity while creating space for others to do the same.
              </p>
            </div>
            
            <div className="pt-4">
              <Button size="lg" onClick={handleNext}>
                Begin Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === 'learning' && currentSection && (
          <motion.div
            key={`learning-${currentStepIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <Card className="bg-white shadow-sm border border-neutral-200">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-primary-500 mr-2" />
                  <CardTitle className="text-lg font-medium">
                    {currentSection.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 leading-relaxed">
                  {currentSection.content}
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNext}>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {gameState === 'quiz' && currentQuiz && (
          <motion.div
            key={`quiz-${currentStepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CivicQuiz
              question={currentQuiz.question}
              options={currentQuiz.options}
              correctAnswer={currentQuiz.correctAnswer}
              onAnswer={handleQuizAnswer}
            />
          </motion.div>
        )}

        {gameState === 'achievement' && (
          <motion.div
            key={`achievement-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-center mb-4">Achievements Unlocked!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningModule?.achievements
                .filter(achievement => earnedAchievements.includes(achievement.id))
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    points={achievement.points}
                    unlocked={true}
                    icon={achievement.icon}
                  />
                ))}
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={handleNext}>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === 'reward' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-24 h-24 bg-primary-100 rounded-full mx-auto flex items-center justify-center"
            >
              <Trophy className="h-12 w-12 text-primary-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-neutral-900">Congratulations!</h2>
            
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 max-w-md mx-auto">
              <p className="text-neutral-700 mb-3">
                You've earned <span className="font-bold text-primary-700">{score} points</span> and unlocked:
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>Special profile badge</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>Access to beginner Action Circles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>First level of your Super User journey</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4">
              <Button size="lg" onClick={handleNext}>
                Complete Onboarding
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="max-w-lg mx-auto">
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-30"></div>
                  <div className="relative w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">You're Ready to Stand Firm!</h2>
              
              <p className="text-neutral-600 mb-4">
                Your civic journey has just begun. Remember, we're not here to change the country — 
                we're here so the country won't change us, and to create space for others to do the same.
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 mb-6">
                <p className="text-amber-800 text-sm">
                  By preserving your values while engaging with the civic process, you become part of a 
                  community that maintains its integrity in the face of changing political landscapes.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" size="lg">
                  My Dashboard
                </Button>
                <Button size="lg">
                  Explore Legislation
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Score display */}
      {gameState !== 'intro' && gameState !== 'complete' && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-md border border-neutral-200 py-2 px-4 flex items-center">
          <Trophy className="h-5 w-5 text-primary-500 mr-2" />
          <span className="font-medium">{score} points</span>
        </div>
      )}
    </div>
  );
}