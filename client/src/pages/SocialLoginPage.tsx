import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  MapPin,
  Users,
  Bell,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  Github,
  Twitter,
  Apple,
  Facebook
} from "lucide-react";
import { FaGoogle } from "react-icons/fa";

export default function SocialLoginPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    district: "",
    interests: [] as string[]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    
    try {
      // Simulate social login process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    } finally {
      setIsLoading("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("email");
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLocation("/dashboard");
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsLoading("");
    }
  };

  const civicInterests = [
    "Education Policy", "Healthcare", "Transportation", "Environment", 
    "Criminal Justice", "Economic Development", "Housing", "Immigration",
    "Technology", "Agriculture"
  ];

  const userBenefits = [
    {
      icon: <Bell className="h-5 w-5 text-blue-400" />,
      title: "Smart Bill Alerts",
      description: "Get notified about Texas bills that affect your interests and district"
    },
    {
      icon: <Users className="h-5 w-5 text-green-400" />,
      title: "Representative Tracking",
      description: "Follow your Texas legislators' voting patterns and positions"
    },
    {
      icon: <Shield className="h-5 w-5 text-purple-400" />,
      title: "Ethics Transparency",
      description: "Access authentic campaign finance and lobbying data from Texas Ethics Commission"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-400" />,
      title: "Real-time Updates",
      description: "Stay current with live Texas legislative activity and voting records"
    }
  ];

  const socialProviders = [
    {
      name: "Google",
      icon: <FaGoogle className="h-5 w-5" />,
      color: "bg-red-600 hover:bg-red-700",
      provider: "google"
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
      provider: "facebook"
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      color: "bg-sky-500 hover:bg-sky-600",
      provider: "twitter"
    },
    {
      name: "GitHub",
      icon: <Github className="h-5 w-5" />,
      color: "bg-gray-800 hover:bg-gray-900",
      provider: "github"
    },
    {
      name: "Apple",
      icon: <Apple className="h-5 w-5" />,
      color: "bg-black hover:bg-gray-900",
      provider: "apple"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8">
        
        {/* Left Side - Platform Benefits */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Join the Texas Civic Engagement Revolution
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Get personalized access to authentic Texas government data and take action on issues that matter to you.
            </p>
          </div>

          <div className="space-y-6">
            {userBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-blue-200 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white font-semibold">100% Free & Secure</span>
            </div>
            <p className="text-blue-200 text-sm">
              Act Up is completely free with bank-level security. Your data privacy is protected, 
              and our platform connects directly to official Texas government sources.
            </p>
          </div>
        </div>

        {/* Right Side - Login/Signup Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white mb-4">
                {isLogin ? "Welcome Back" : "Join Act Up"}
              </CardTitle>
              <p className="text-blue-200 mb-6">
                {isLogin 
                  ? "Access your personalized civic engagement dashboard"
                  : "Create your account to start engaging with Texas government"
                }
              </p>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                {socialProviders.map((social) => (
                  <Button
                    key={social.provider}
                    onClick={() => handleSocialLogin(social.provider)}
                    disabled={isLoading !== ""}
                    className={`w-full ${social.color} text-white font-medium py-3 transition-all`}
                    size="lg"
                  >
                    {isLoading === social.provider ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {social.icon}
                        Continue with {social.name}
                      </div>
                    )}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-4 my-6">
                <Separator className="flex-1 bg-white/20" />
                <span className="text-blue-200 text-sm">or</span>
                <Separator className="flex-1 bg-white/20" />
              </div>

              <div className="flex gap-1">
                <Button
                  variant={isLogin ? "default" : "ghost"}
                  onClick={() => setIsLogin(true)}
                  className="text-sm flex-1"
                >
                  Login
                </Button>
                <Button
                  variant={!isLogin ? "default" : "ghost"}
                  onClick={() => setIsLogin(false)}
                  className="text-sm flex-1"
                >
                  Sign Up
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 h-6 w-6 p-0 text-blue-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-white">Texas Legislative District (Optional)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                        <Input
                          id="district"
                          type="text"
                          placeholder="e.g., District 15, Austin, Harris County"
                          value={formData.district}
                          onChange={(e) => handleInputChange("district", e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                        />
                      </div>
                      <p className="text-xs text-blue-300">
                        Help us show you relevant bills and representatives
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Civic Interests (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {civicInterests.map((interest) => (
                          <Badge
                            key={interest}
                            variant={formData.interests.includes(interest) ? "default" : "secondary"}
                            className={`cursor-pointer text-xs py-1 px-2 text-center justify-center transition-all ${
                              formData.interests.includes(interest)
                                ? "bg-blue-600 text-white"
                                : "bg-white/10 text-blue-200 hover:bg-white/20"
                            }`}
                            onClick={() => handleInterestToggle(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-blue-300">
                        Select topics you care about to receive personalized bill alerts
                      </p>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading !== ""}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                  size="lg"
                >
                  {isLoading === "email" ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLogin ? "Signing In..." : "Creating Account..."}
                    </div>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <LogIn className="h-5 w-5 mr-2" />
                          Login to Dashboard
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Create Account
                        </>
                      )}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {isLogin && (
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-blue-300 hover:text-white text-sm"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                )}

                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-sm text-blue-200">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Button
                      variant="link"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-300 hover:text-white p-0 h-auto font-semibold"
                    >
                      {isLogin ? "Sign up here" : "Login here"}
                    </Button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}