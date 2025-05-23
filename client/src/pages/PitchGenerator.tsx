import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  Copy, 
  RefreshCw, 
  Send, 
  Sparkles, 
  Target,
  MessageSquare,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const pitchGeneratorSchema = z.object({
  podcastName: z.string().min(2, "Podcast name is required"),
  hostName: z.string().min(2, "Host name is required"),
  podcastTopic: z.string().min(2, "Podcast topic is required"),
  audienceSize: z.string().min(1, "Audience size is required"),
  pitchAngle: z.string().min(1, "Select a pitch angle"),
  personalStory: z.string().optional(),
  keyMessage: z.string().min(10, "Key message is required"),
  callToAction: z.string().min(5, "Call to action is required"),
});

type PitchGeneratorFormData = z.infer<typeof pitchGeneratorSchema>;

interface GeneratedPitch {
  subject: string;
  opening: string;
  body: string;
  closing: string;
  fullPitch: string;
}

const pitchAngles = [
  { value: "expertise", label: "Industry Expertise", description: "Highlight your deep knowledge in a specific field" },
  { value: "story", label: "Personal Journey", description: "Share your unique personal or professional story" },
  { value: "trends", label: "Industry Trends", description: "Discuss current trends and future predictions" },
  { value: "lessons", label: "Lessons Learned", description: "Share valuable lessons from failures and successes" },
  { value: "innovation", label: "Innovation & Disruption", description: "Talk about innovative approaches or disruptions" },
  { value: "transformation", label: "Transformation Story", description: "Share how you or your company transformed" },
  { value: "controversy", label: "Contrarian View", description: "Present a contrarian or controversial perspective" },
  { value: "behind-scenes", label: "Behind the Scenes", description: "Reveal behind-the-scenes insights from your industry" },
];

const audienceSizes = [
  { value: "small", label: "Small (Under 1K)" },
  { value: "medium", label: "Medium (1K-10K)" },
  { value: "large", label: "Large (10K-50K)" },
  { value: "very-large", label: "Very Large (50K+)" },
];

const templates = {
  expertise: {
    subject: "Industry Expert Available for {podcastName} - {keyMessage}",
    opening: "Hi {hostName},\n\nI've been following {podcastName} and really appreciate your focus on {podcastTopic}. Your recent episode on [specific topic] really resonated with me.",
    body: "As someone with extensive experience in {expertise}, I'd love to share insights on {keyMessage}. I believe your audience would find value in learning about {specificTopic}.\n\nI can share:\n• Practical strategies that have worked in real-world scenarios\n• Common mistakes to avoid in {field}\n• Future trends and opportunities in {industry}",
    closing: "I'd be happy to provide more details about my background and potential discussion topics. {callToAction}\n\nBest regards,\n[Your Name]"
  },
  story: {
    subject: "Inspiring Story for {podcastName} - From {startPoint} to {endPoint}",
    opening: "Hi {hostName},\n\nI'm a regular listener of {podcastName} and love how you highlight inspiring journeys. I have a story that I think would resonate with your audience.",
    body: "My journey from {startPoint} to {endPoint} has been filled with challenges, breakthroughs, and valuable lessons. I'd love to share:\n\n• The pivotal moment that changed everything\n• Obstacles I faced and how I overcame them\n• Key insights that could help others on similar paths\n• {personalStory}",
    closing: "I believe my story could inspire your listeners who are facing similar challenges. {callToAction}\n\nThank you for your time,\n[Your Name]"
  }
};

function PitchAngleCard({ 
  angle, 
  isSelected, 
  onSelect 
}: { 
  angle: typeof pitchAngles[0]; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/30"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSelected ? "bg-primary text-white" : "bg-gray-100"
          }`}>
            <Target className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{angle.label}</h3>
            <p className="text-sm text-gray-600 mt-1">{angle.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GeneratedPitchDisplay({ pitch }: { pitch: GeneratedPitch }) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Pitch copied to clipboard.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Generated Pitch
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(pitch.fullPitch)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="full">Full Pitch</TabsTrigger>
            <TabsTrigger value="subject">Subject</TabsTrigger>
            <TabsTrigger value="opening">Opening</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          
          <TabsContent value="full" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Complete Email Pitch</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pitch.fullPitch)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {pitch.fullPitch}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="subject" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Email Subject Line</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pitch.subject)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-800">{pitch.subject}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="opening" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Opening Paragraph</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pitch.opening)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{pitch.opening}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="body" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Main Body</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pitch.body)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{pitch.body}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function PitchGenerator() {
  const [selectedAngle, setSelectedAngle] = useState<string>("");
  const [generatedPitch, setGeneratedPitch] = useState<GeneratedPitch | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: questionnaire } = useQuery({
    queryKey: ["/api/questionnaire"],
  });

  const form = useForm<PitchGeneratorFormData>({
    resolver: zodResolver(pitchGeneratorSchema),
    defaultValues: {
      podcastName: "",
      hostName: "",
      podcastTopic: "",
      audienceSize: "",
      pitchAngle: "",
      personalStory: "",
      keyMessage: "",
      callToAction: "",
    },
  });

  const generatePitch = async (data: PitchGeneratorFormData) => {
    setIsGenerating(true);
    
    try {
      // Simulate pitch generation (in real app, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedAngleData = pitchAngles.find(a => a.value === data.pitchAngle);
      const template = templates[data.pitchAngle as keyof typeof templates] || templates.expertise;
      
      // Generate personalized pitch based on form data and questionnaire
      const personalInfo = questionnaire?.responses?.personalInfo;
      const experience = questionnaire?.responses?.experience;
      
      const subject = template.subject
        .replace("{podcastName}", data.podcastName)
        .replace("{keyMessage}", data.keyMessage);
      
      const opening = template.opening
        .replace("{hostName}", data.hostName)
        .replace("{podcastName}", data.podcastName)
        .replace("{podcastTopic}", data.podcastTopic);
      
      let body = template.body
        .replace("{keyMessage}", data.keyMessage)
        .replace("{expertise}", personalInfo?.expertise?.join(", ") || "my field")
        .replace("{specificTopic}", data.podcastTopic)
        .replace("{field}", data.podcastTopic)
        .replace("{industry}", data.podcastTopic)
        .replace("{personalStory}", data.personalStory || "my unique experience");
      
      if (data.pitchAngle === "story") {
        body = body
          .replace("{startPoint}", "where I started")
          .replace("{endPoint}", personalInfo?.jobTitle || "where I am today");
      }
      
      const closing = template.closing
        .replace("{callToAction}", data.callToAction);
      
      const fullPitch = `Subject: ${subject}\n\n${opening}\n\n${body}\n\n${closing}`;
      
      setGeneratedPitch({
        subject,
        opening,
        body,
        closing,
        fullPitch,
      });
      
      toast({
        title: "Success!",
        description: "Your personalized pitch has been generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate pitch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: PitchGeneratorFormData) => {
    await generatePitch(data);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Pitch Generator</h1>
        <p className="text-gray-600 mt-2">
          Create compelling, personalized pitches for podcast hosts in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="podcastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Podcast Name</FormLabel>
                          <FormControl>
                            <Input placeholder="The Marketing Show" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hostName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="podcastTopic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Topic/Niche</FormLabel>
                        <FormControl>
                          <Input placeholder="Digital Marketing, Business Strategy, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audienceSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {audienceSizes.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keyMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Message/Value Proposition</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What's the main insight or value you want to share with their audience?"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be the core of your pitch - what makes you unique and valuable to their audience.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="callToAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call to Action</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="I'd love to schedule a quick 15-minute call to discuss this further."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Pitch Angles Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Pitch Angle</CardTitle>
              <p className="text-sm text-gray-600">
                Select the approach that best fits your expertise and the podcast's audience.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pitchAngles.map((angle) => (
                  <PitchAngleCard
                    key={angle.value}
                    angle={angle}
                    isSelected={selectedAngle === angle.value}
                    onSelect={() => {
                      setSelectedAngle(angle.value);
                      form.setValue("pitchAngle", angle.value);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedAngle === "story" && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Story Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="personalStory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Story/Journey</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your personal or professional journey that would be compelling to share..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share the key elements of your story that would resonate with the podcast audience.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isGenerating || !selectedAngle}
          className="bg-primary text-white hover:bg-blue-700 px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Your Perfect Pitch...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Generate My Pitch
            </>
          )}
        </Button>
      </div>

      {/* Generated Pitch Display */}
      {generatedPitch && (
        <div className="space-y-6">
          <GeneratedPitchDisplay pitch={generatedPitch} />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <MessageSquare className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-blue-900">Next Steps</h3>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• Review and customize the generated pitch to match your voice</li>
                  <li>• Research the specific podcast episode topics to add relevant references</li>
                  <li>• Send your pitch to the podcast host or their booking contact</li>
                  <li>• Follow up professionally if you don't hear back within 2 weeks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
