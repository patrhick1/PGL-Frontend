import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  FileText, 
  Lightbulb, 
  Star, 
  Target, 
  Users, 
  TrendingUp,
  Eye,
  Edit,
  Plus,
  Download,
  Share,
  Sparkles
} from "lucide-react";

// Combined schemas for both media kit and angle generation
const mediaKitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  expertise: z.array(z.string()).min(1, "At least one expertise area is required"),
  achievements: z.array(z.string()).min(1, "At least one achievement is required"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
  }),
  headshots: z.array(z.string()).optional(),
});

const angleGeneratorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  industry: z.string().min(1, "Industry is required"),
  expertise: z.array(z.string()).min(1, "At least one expertise area is required"),
  businessGoals: z.string().min(10, "Business goals must be detailed"),
  targetAudience: z.string().min(10, "Target audience description is required"),
  placementGoalNumber: z.number().min(1, "Placement goal must be at least 1"),
  previousPodcasts: z.array(z.string()).optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

type MediaKitFormData = z.infer<typeof mediaKitSchema>;
type AngleGeneratorFormData = z.infer<typeof angleGeneratorSchema>;

interface MediaKit {
  id: number;
  title: string;
  bio: string;
  expertise: string[];
  achievements: string[];
  websiteUrl?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  headshots: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedAngle {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  targetAudience: string;
  podcastTypes: string[];
  confidence: number;
}

function MediaKitSection() {
  const { toast } = useToast();
  const [editingKit, setEditingKit] = useState<MediaKit | null>(null);
  const [previewKit, setPreviewKit] = useState<MediaKit | null>(null);

  const { data: mediaKits = [], isLoading } = useQuery<MediaKit[]>({
    queryKey: ['/api/media-kits'],
  });

  const form = useForm<MediaKitFormData>({
    resolver: zodResolver(mediaKitSchema),
    defaultValues: {
      title: "",
      bio: "",
      expertise: [],
      achievements: [],
      websiteUrl: "",
      socialLinks: {
        twitter: "",
        linkedin: "",
        instagram: "",
        facebook: "",
      },
      headshots: [],
    },
  });

  const createMediaKitMutation = useMutation({
    mutationFn: async (data: MediaKitFormData) => {
      const response = await fetch("/api/media-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create media kit");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Media kit created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/media-kits"] });
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create media kit", variant: "destructive" });
    },
  });

  const onSubmit = (data: MediaKitFormData) => {
    createMediaKitMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Kits</h2>
          <p className="text-gray-600">Create professional media kits for podcast pitches</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Media Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Media Kit</DialogTitle>
              <DialogDescription>
                Build a professional media kit to showcase your expertise and achievements.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Executive Media Kit 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write a compelling professional bio..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialLinks.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder="LinkedIn profile URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialLinks.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="Twitter profile URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button type="submit" disabled={createMediaKitMutation.isPending}>
                    {createMediaKitMutation.isPending ? "Creating..." : "Create Media Kit"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Kit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading media kits...</p>
          </div>
        ) : mediaKits.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No media kits created yet</p>
            <p className="text-sm text-gray-500">Create your first media kit to get started</p>
          </div>
        ) : (
          mediaKits.map((kit) => (
            <Card key={kit.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{kit.title}</CardTitle>
                  <Badge variant={kit.isActive ? "default" : "secondary"}>
                    {kit.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {kit.bio}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {kit.expertise.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {kit.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{kit.expertise.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setPreviewKit(kit)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingKit(kit)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AngleGeneratorSection() {
  const { toast } = useToast();
  const [generatedAngles, setGeneratedAngles] = useState<GeneratedAngle[]>([]);

  const form = useForm<AngleGeneratorFormData>({
    resolver: zodResolver(angleGeneratorSchema),
    defaultValues: {
      name: "",
      title: "",
      company: "",
      industry: "",
      expertise: [],
      businessGoals: "",
      targetAudience: "",
      placementGoalNumber: 5,
      previousPodcasts: [],
      socialLinks: {
        website: "",
        linkedin: "",
        twitter: "",
      },
    },
  });

  const generateAnglesMutation = useMutation({
    mutationFn: async (data: AngleGeneratorFormData) => {
      const response = await fetch("/api/angles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to generate angles");
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedAngles(data.angles || []);
      toast({ title: "Success", description: "Pitch angles generated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate angles", variant: "destructive" });
    },
  });

  const onSubmit = (data: AngleGeneratorFormData) => {
    generateAnglesMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pitch Angle Generator</h2>
        <p className="text-gray-600">Generate compelling pitch angles for podcast outreach</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Client Profile
            </CardTitle>
            <CardDescription>
              Provide client details to generate personalized pitch angles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="Technology" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="businessGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the main business objectives and goals..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the ideal podcast audience..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placementGoalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement Goal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={generateAnglesMutation.isPending}
                >
                  {generateAnglesMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Angles...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Pitch Angles
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Generated Angles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Angles</h3>
          
          {generatedAngles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 text-center">No angles generated yet</p>
                <p className="text-sm text-gray-500 text-center">
                  Fill out the form and click "Generate Pitch Angles" to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {generatedAngles.map((angle) => (
                <Card key={angle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{angle.title}</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {Math.round(angle.confidence)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">{angle.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {angle.targetAudience}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {angle.keyPoints.slice(0, 2).map((point, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContentCreator() {
  return (
    <div>
      <Tabs defaultValue="media-kit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="media-kit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Media Kits
          </TabsTrigger>
          <TabsTrigger value="angle-generator" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Angle Generator
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="media-kit" className="mt-6">
          <MediaKitSection />
        </TabsContent>
        
        <TabsContent value="angle-generator" className="mt-6">
          <AngleGeneratorSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}