import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { SuperUserRoleType } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, FileText, Video, Users, CheckCircle, Download, Star, Clock, Plus, ExternalLink, ThumbsUp, Award } from "lucide-react";

// Resources by type
const RESOURCES = {
  guides: [
    {
      id: 1,
      title: "Understanding Legislative Process",
      description: "A comprehensive guide to how bills become laws and how to track legislation effectively.",
      type: "guide",
      format: "pdf",
      author: "ActUp Research Team",
      role: "all",
      views: 1245,
      rating: 4.8,
      dateAdded: "June 15, 2023",
      featured: true,
      downloadUrl: "#",
      thumbnail: null,
      minutes: 25
    },
    {
      id: 2,
      title: "Effective Fact Verification Techniques",
      description: "Learn how to verify claims using primary sources and cross-referencing methods.",
      type: "guide",
      format: "pdf",
      author: "Sarah Johnson",
      role: "catalyst",
      views: 842,
      rating: 4.9,
      dateAdded: "July 2, 2023",
      featured: true,
      downloadUrl: "#",
      thumbnail: null,
      minutes: 32
    },
    {
      id: 3,
      title: "Building Action Circles From Scratch",
      description: "Step-by-step instructions for creating and growing effective community action circles.",
      type: "guide",
      format: "pdf",
      author: "Michael Davis",
      role: "amplifier",
      views: 735,
      rating: 4.7,
      dateAdded: "June 28, 2023",
      featured: false,
      downloadUrl: "#",
      thumbnail: null,
      minutes: 28
    },
    {
      id: 4,
      title: "Persuasive Communication for Civic Change",
      description: "Techniques for crafting compelling narratives that inspire action.",
      type: "guide",
      format: "pdf",
      author: "Lisa Wright",
      role: "convincer",
      views: 629,
      rating: 4.5,
      dateAdded: "July 10, 2023",
      featured: false,
      downloadUrl: "#",
      thumbnail: null,
      minutes: 20
    }
  ],
  trainings: [
    {
      id: 1,
      title: "Research Master Class",
      description: "Advanced techniques for analyzing legislation and verifying claims.",
      type: "training",
      format: "video",
      author: "Dr. Emily Chen",
      role: "catalyst",
      views: 612,
      rating: 4.9,
      dateAdded: "July 5, 2023",
      featured: true,
      duration: "45 min",
      thumbnail: null,
      modules: 5
    },
    {
      id: 2,
      title: "Network Growth Strategies",
      description: "Learn how to expand your influence and activate your personal network for civic action.",
      type: "training",
      format: "course",
      author: "James Wilson",
      role: "amplifier",
      views: 542,
      rating: 4.7,
      dateAdded: "June 22, 2023",
      featured: false,
      duration: "2 hours",
      thumbnail: null,
      modules: 8
    },
    {
      id: 3,
      title: "Storytelling for Impact",
      description: "Master the art of crafting narratives that inspire action and change minds.",
      type: "training",
      format: "course",
      author: "Michelle Park",
      role: "convincer",
      views: 487,
      rating: 4.8,
      dateAdded: "July 12, 2023",
      featured: true,
      duration: "1.5 hours",
      thumbnail: null,
      modules: 6
    },
    {
      id: 4,
      title: "Civic Engagement Foundation",
      description: "Essential knowledge and skills for effective participation in local government.",
      type: "training",
      format: "video",
      author: "ActUp Education Team",
      role: "all",
      views: 894,
      rating: 4.6,
      dateAdded: "June 10, 2023",
      featured: false,
      duration: "30 min",
      thumbnail: null,
      modules: 3
    }
  ],
  templates: [
    {
      id: 1,
      title: "Fact Check Template",
      description: "Structured format for analyzing and documenting verification of public claims.",
      type: "template",
      format: "doc",
      author: "ActUp Verification Team",
      role: "catalyst",
      views: 423,
      rating: 4.5,
      dateAdded: "June 25, 2023",
      featured: false,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 2,
      title: "Action Circle Meeting Guide",
      description: "Agenda template and discussion prompts for productive action circle meetings.",
      type: "template",
      format: "doc",
      author: "Robert Johnson",
      role: "amplifier",
      views: 367,
      rating: 4.6,
      dateAdded: "July 8, 2023",
      featured: false,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 3,
      title: "Representative Contact Script",
      description: "Effective scripts for calling, emailing, or meeting with elected officials.",
      type: "template",
      format: "doc",
      author: "Maria Rodriguez",
      role: "convincer",
      views: 621,
      rating: 4.8,
      dateAdded: "June 18, 2023",
      featured: true,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 4,
      title: "Community Survey Kit",
      description: "Templates for gathering community input on local issues and priorities.",
      type: "template",
      format: "zip",
      author: "ActUp Research Team",
      role: "all",
      views: 289,
      rating: 4.4,
      dateAdded: "July 15, 2023",
      featured: false,
      downloadUrl: "#",
      thumbnail: null
    }
  ],
  toolkits: [
    {
      id: 1,
      title: "Civic Action Starter Kit",
      description: "Essential resources for beginning your journey as an engaged citizen.",
      type: "toolkit",
      format: "bundle",
      author: "ActUp Onboarding Team",
      role: "all",
      views: 752,
      rating: 4.7,
      dateAdded: "June 5, 2023",
      featured: true,
      items: 8,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 2,
      title: "Verification Toolkit",
      description: "Complete set of resources for conducting thorough fact-checking and verification.",
      type: "toolkit",
      format: "bundle",
      author: "Sarah Johnson",
      role: "catalyst",
      views: 412,
      rating: 4.9,
      dateAdded: "July 3, 2023",
      featured: true,
      items: 6,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 3,
      title: "Network Building Toolkit",
      description: "Resources for creating and nurturing action-oriented community networks.",
      type: "toolkit",
      format: "bundle",
      author: "James Wilson",
      role: "amplifier",
      views: 378,
      rating: 4.6,
      dateAdded: "June 20, 2023",
      featured: false,
      items: 5,
      downloadUrl: "#",
      thumbnail: null
    },
    {
      id: 4,
      title: "Persuasion Masterclass Bundle",
      description: "Complete toolkit for developing compelling narratives and persuasive communication.",
      type: "toolkit",
      format: "bundle",
      author: "Michelle Park",
      role: "convincer",
      views: 325,
      rating: 4.8,
      dateAdded: "July 7, 2023",
      featured: false,
      items: 7,
      downloadUrl: "#",
      thumbnail: null
    }
  ]
};

interface ResourceShareModalProps {
  onSubmit: (data: any) => void;
}

function ResourceShareModal({ onSubmit }: ResourceShareModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resourceType: "guide",
    format: "pdf",
    targetRole: "all",
    link: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    setFormData({
      title: "",
      description: "",
      resourceType: "guide",
      format: "pdf",
      targetRole: "all",
      link: ""
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Share Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Share a Resource</DialogTitle>
          <DialogDescription>
            Contribute to the community by sharing helpful resources with fellow Act Up members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Resource Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter resource title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this resource covers and how it helps"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select 
                  value={formData.resourceType} 
                  onValueChange={(value) => handleSelectChange("resourceType", value)}
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="toolkit">Toolkit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(value) => handleSelectChange("format", value)}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="course">Online Course</SelectItem>
                    <SelectItem value="bundle">Resource Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetRole">Best For</Label>
              <Select 
                value={formData.targetRole} 
                onValueChange={(value) => handleSelectChange("targetRole", value)}
              >
                <SelectTrigger id="targetRole">
                  <SelectValue placeholder="Select target role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="catalyst">Catalysts</SelectItem>
                  <SelectItem value="amplifier">Amplifiers</SelectItem>
                  <SelectItem value="convincer">Convincers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Resource Link</Label>
              <Input
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="URL to the resource"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit Resource</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ResourceCardProps {
  resource: any;
  onView: (resource: any) => void;
}

function ResourceCard({ resource, onView }: ResourceCardProps) {
  // Get icon based on resource format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
      case "doc":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "course":
        return <BookOpen className="h-4 w-4" />;
      case "bundle":
      case "zip":
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get role-specific styling
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "catalyst":
        return "bg-success bg-opacity-10 text-success";
      case "amplifier":
        return "bg-primary bg-opacity-10 text-primary";
      case "convincer":
        return "bg-accent bg-opacity-10 text-accent";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div className="space-y-1">
            <CardTitle>{resource.title}</CardTitle>
            <CardDescription className="flex items-center text-xs gap-1">
              <span className="capitalize">{resource.type}</span>
              <span className="mx-1">•</span>
              {getFormatIcon(resource.format)}
              <span className="capitalize">{resource.format}</span>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3" />
              <span>{resource.dateAdded}</span>
            </CardDescription>
          </div>
          
          {resource.featured && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${getRoleStyle(resource.role)}`}
          >
            {resource.role === "all" ? "All Roles" : `For ${resource.role.charAt(0).toUpperCase() + resource.role.slice(1)}s`}
          </Badge>
          
          {resource.type === "training" && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              {resource.modules} modules • {resource.duration}
            </Badge>
          )}
          
          {resource.type === "guide" && resource.minutes && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              {resource.minutes} min read
            </Badge>
          )}
          
          {resource.type === "toolkit" && resource.items && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              {resource.items} resources
            </Badge>
          )}
        </div>
        
        {resource.rating && (
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              <span>{resource.rating}</span>
            </div>
            <span className="mx-2">•</span>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{resource.views} views</span>
            </div>
            <span className="mx-2">•</span>
            <span>By {resource.author}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => onView(resource)}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            Recommend
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onView(resource)}
          >
            {resource.type === "training" ? (
              <>
                <BookOpen className="h-3 w-3 mr-1" />
                Start
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                Download
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function FeaturedResourceSection({ resources, role }: { resources: any[], role?: SuperUserRoleType }) {
  // Filter resources based on role if provided
  const filteredResources = role 
    ? resources.filter(r => r.featured && (r.role === role || r.role === "all"))
    : resources.filter(r => r.featured);
  
  // Find at most 3 featured resources
  const featuredItems = filteredResources.slice(0, 3);
  
  if (featuredItems.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold">Featured Resources</h2>
        {role && (
          <Badge 
            variant="outline" 
            className={`ml-2 ${
              role === "catalyst" ? "bg-success bg-opacity-10 text-success" :
              role === "amplifier" ? "bg-primary bg-opacity-10 text-primary" :
              "bg-accent bg-opacity-10 text-accent"
            }`}
          >
            Recommended for {role.charAt(0).toUpperCase() + role.slice(1)}s
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredItems.map(resource => (
          <ResourceCard 
            key={`${resource.type}-${resource.id}`} 
            resource={resource} 
            onView={() => console.log("View resource", resource)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Resources() {
  const { mainRole } = useSuperUser();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Combine all resources
  const allResources = [
    ...RESOURCES.guides,
    ...RESOURCES.trainings,
    ...RESOURCES.templates,
    ...RESOURCES.toolkits
  ];
  
  // Filter resources based on search query and active tab
  const filteredResources = allResources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "role-specific" && (resource.role === mainRole?.role || resource.role === "all")) ||
      resource.type === activeTab;
    
    return matchesSearch && matchesTab;
  });
  
  const handleResourceSubmit = (data: any) => {
    toast({
      title: "Resource Submitted",
      description: "Thank you for sharing! Your resource will be reviewed by our team.",
    });
    console.log("Resource submitted:", data);
  };
  
  const handleResourceView = (resource: any) => {
    toast({
      title: "Resource Accessed",
      description: `You're now viewing "${resource.title}"`,
    });
    console.log("Viewing resource:", resource);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <ResourceShareModal onSubmit={handleResourceSubmit} />
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search resources by title, description, or author..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Featured Resources for user's role */}
      {mainRole && !searchQuery && activeTab === "all" && (
        <FeaturedResourceSection 
          resources={allResources} 
          role={mainRole.role as SuperUserRoleType} 
        />
      )}
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="role-specific">For Your Role</TabsTrigger>
          <TabsTrigger value="guide">Guides</TabsTrigger>
          <TabsTrigger value="training">Trainings</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="toolkit">Toolkits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          {!searchQuery && <FeaturedResourceSection resources={allResources} />}
          <ResourcesGrid 
            resources={filteredResources} 
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="role-specific" className="pt-4">
          <ResourcesGrid 
            resources={filteredResources}
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="guide" className="pt-4">
          <ResourcesGrid 
            resources={filteredResources}
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="training" className="pt-4">
          <ResourcesGrid 
            resources={filteredResources}
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="template" className="pt-4">
          <ResourcesGrid 
            resources={filteredResources}
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="toolkit" className="pt-4">
          <ResourcesGrid 
            resources={filteredResources}
            onView={handleResourceView}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
      
      {/* Knowledge Advancement Section */}
      {mainRole && (
        <div className={`mt-10 p-6 rounded-lg border ${
          mainRole.role === "catalyst" ? "bg-success bg-opacity-5 border-success border-opacity-20" :
          mainRole.role === "amplifier" ? "bg-primary bg-opacity-5 border-primary border-opacity-20" :
          "bg-accent bg-opacity-5 border-accent border-opacity-20"
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Award className={`h-5 w-5 ${
              mainRole.role === "catalyst" ? "text-success" :
              mainRole.role === "amplifier" ? "text-primary" :
              "text-accent"
            }`} />
            <h2 className="text-lg font-semibold">Knowledge Progression Path</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Recommended resources to advance from Level {mainRole.level} {mainRole.role.charAt(0).toUpperCase() + mainRole.role.slice(1)} to the next level
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Essential</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Research Fundamentals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Verification Techniques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Advanced Analysis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recommended Next</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Policy Impact Assessment</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-1">
                    Start Course
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Next Level Unlock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>Complete <strong>3 more resources</strong> to unlock:</p>
                  <Badge className={`${
                    mainRole.role === "catalyst" ? "bg-success text-white" :
                    mainRole.role === "amplifier" ? "bg-primary text-white" :
                    "bg-accent text-white"
                  }`}>
                    Super Spreader Resources
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResourcesGridProps {
  resources: any[];
  onView: (resource: any) => void;
  searchQuery: string;
}

function ResourcesGrid({ resources, onView, searchQuery }: ResourcesGridProps) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">No Resources Found</h3>
        <p className="text-gray-500 mt-1">
          {searchQuery 
            ? "No resources match your search criteria." 
            : "There are no resources available in this category."}
        </p>
        {searchQuery && (
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Clear Search
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map(resource => (
        <ResourceCard 
          key={`${resource.type}-${resource.id}`} 
          resource={resource} 
          onView={onView}
        />
      ))}
    </div>
  );
}
