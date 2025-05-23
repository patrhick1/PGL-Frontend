import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Copy, 
  RefreshCw, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Clock,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const angleGeneratorSchema = z.object({
  interviewResponses: z.record(z.string().min(10, "Please provide a detailed response")),
  pastEpisodeTranscripts: z.string().optional(),
  featuredArticles: z.string().optional(),
  socialPosts: z.string().optional(),
});

type AngleGeneratorFormData = z.infer<typeof angleGeneratorSchema>;

interface GeneratedAngle {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  targetAudience: string;
  podcastTypes: string[];
  confidence: number;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  required: boolean;
}

// Mock interview questions based on your provided examples
const mockInterviewQuestions: InterviewQuestion[] = [
  {
    id: "target_audience",
    question: "Who do you want to be famous to?",
    category: "Personal Brand",
    required: true
  },
  {
    id: "unique_value",
    question: "Why you and not someone else?",
    category: "Personal Brand", 
    required: true
  },
  {
    id: "business_pitch",
    question: "How would you pitch your business to your ideal client?",
    category: "Business",
    required: true
  },
  {
    id: "industry_trends",
    question: "What trends are shaping your industry? How are you evolving with the trend?",
    category: "Industry Expertise",
    required: true
  },
  {
    id: "brand_impression",
    question: "What impressions do you hope to make of people when they come in contact with your brand?",
    category: "Personal Brand",
    required: false
  },
  {
    id: "career_experience",
    question: "How does your current role/experience inform your approach to your business?",
    category: "Professional Background",
    required: false
  },
  {
    id: "international_perspective",
    question: "How has your international perspective shaped your understanding of your market?",
    category: "Global Experience",
    required: false
  },
  {
    id: "pivotal_moment",
    question: "Looking back at your career, what's been the most pivotal moment that shaped your approach?",
    category: "Personal Story",
    required: false
  },
  {
    id: "advice_newcomers",
    question: "What advice would you give to someone considering a career in your field?",
    category: "Industry Expertise",
    required: false
  },
  {
    id: "biggest_challenges",
    question: "What are the biggest challenges companies face in your industry, and how do you help them overcome those hurdles?",
    category: "Business Solutions",
    required: false
  }
];

function AngleCard({ angle }: { angle: GeneratedAngle }) {
  const { toast } = useToast();

  const copyAngle = () => {
    const angleText = `${angle.title}\n\n${angle.description}\n\nKey Points:\n${angle.keyPoints.map(point => `• ${point}`).join('\n')}\n\nTarget Audience: ${angle.targetAudience}\nBest for: ${angle.podcastTypes.join(', ')}`;
    navigator.clipboard.writeText(angleText);
    toast({
      title: "Copied!",
      description: "Pitch angle copied to clipboard.",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100 text-green-800";
    if (confidence >= 75) return "bg-blue-100 text-blue-800";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center">
              <Target className="mr-2 h-5 w-5 text-primary" />
              {angle.title}
            </CardTitle>
            <Badge className={`mt-2 ${getConfidenceColor(angle.confidence)}`}>
              {angle.confidence}% Match
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyAngle}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">{angle.description}</p>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Discussion Points:</h4>
            <ul className="space-y-1">
              {angle.keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <ChevronRight className="h-4 w-4 text-primary mr-1 mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900">Target Audience:</span>
                <p className="text-gray-600">{angle.targetAudience}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Best For:</span>
                <p className="text-gray-600">{angle.podcastTypes.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InterviewQuestionCard({ 
  question, 
  value, 
  onChange, 
  error 
}: { 
  question: InterviewQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Card className="hover:shadow-sm transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Badge variant={question.required ? "default" : "secondary"}>
                {question.category}
              </Badge>
              {question.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
            <h3 className="font-medium text-gray-900 mt-2">{question.question}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your detailed response here..."
          className={`min-h-[120px] ${error ? 'border-red-500' : ''}`}
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnglesGenerator() {
  const [currentStep, setCurrentStep] = useState<'interview' | 'angles'>('interview');
  const [generatedAngles, setGeneratedAngles] = useState<GeneratedAngle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<AngleGeneratorFormData>({
    resolver: zodResolver(angleGeneratorSchema),
    defaultValues: {
      clientBio: "",
      interviewResponses: {},
      pastEpisodeTranscripts: "",
      featuredArticles: "",
      socialPosts: "",
    },
  });

  const generateAngles = async (data: AngleGeneratorFormData) => {
    setIsGenerating(true);
    
    try {
      // Simulate AI processing of interview responses
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate professional angles based on authentic content analysis
      const angles: GeneratedAngle[] = [
        {
          id: "1",
          title: "From R&D to Revenue: Overcoming the AI Implementation Gap",
          description: "Help listeners learn actionable strategies to move AI projects from pilot phases to revenue-generating deployments, based on your real-world Fortune 500 experience.",
          keyPoints: [
            "Common pitfalls that prevent AI projects from scaling beyond pilot phases",
            "Proven roadmap for successful AI implementation with measurable ROI",
            "Real-world case studies from Fortune 500 transformations",
            "Data quality and governance strategies that ensure AI success",
            "Building stakeholder buy-in for AI initiatives across organizations"
          ],
          targetAudience: "C-suite executives, CTOs, and business leaders implementing AI",
          podcastTypes: ["Business Technology", "AI/ML", "Digital Transformation", "Enterprise Strategy"],
          confidence: 94
        },
        {
          id: "2", 
          title: "Building AI Guardrails: Ensuring Safety, Compliance, and Ethical Use",
          description: "Share your expertise in responsible AI deployment, helping listeners understand how to build safety and compliance into AI systems from the ground up.",
          keyPoints: [
            "Critical principles of Responsible AI and bias mitigation strategies",
            "Building governance frameworks that enable rather than restrict innovation",
            "Real-time monitoring and regulatory compliance (EU AI Act, etc.)",
            "Transparency and explainability in AI decision-making",
            "Risk management frameworks for AI deployment at scale"
          ],
          targetAudience: "Risk managers, compliance officers, and responsible AI practitioners",
          podcastTypes: ["AI Ethics", "RegTech", "Risk Management", "Corporate Governance"],
          confidence: 91
        },
        {
          id: "3",
          title: "The Customer-Centric AI Revolution: 'Grokking' Your Way to Growth",
          description: "Discuss how to deeply understand customer needs and use AI to create personalized experiences that drive engagement and loyalty, drawing from your upcoming book insights.",
          keyPoints: [
            "The concept of 'grokking' the customer for deeper understanding",
            "Using AI to deliver personalized experiences at scale",
            "Data-driven customer journey optimization strategies",
            "Balancing automation with human touch in customer interactions",
            "Practical go-to-market strategies for AI-powered customer solutions"
          ],
          targetAudience: "Marketing leaders, customer experience professionals, and growth strategists",
          podcastTypes: ["Marketing Technology", "Customer Experience", "Growth Strategy", "SaaS"],
          confidence: 89
        }
      ];
      
      setGeneratedAngles(angles);
      setCurrentStep('angles');
      
      toast({
        title: "Success!",
        description: `Generated ${angles.length} personalized pitch angles based on your interview responses.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate angles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: AngleGeneratorFormData) => {
    await generateAngles(data);
  };

  const restartInterview = () => {
    setCurrentStep('interview');
    setGeneratedAngles([]);
    form.reset({ interviewResponses: {} });
  };

  const requiredQuestions = mockInterviewQuestions.filter(q => q.required);
  const optionalQuestions = mockInterviewQuestions.filter(q => !q.required);

  if (currentStep === 'angles') {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-700">Generated Angles</h1>
          <p className="text-gray-600 mt-2">
            Based on your interview responses, here are personalized pitch angles for podcast outreach.
          </p>
          <Button
            variant="outline"
            onClick={restartInterview}
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Create New Angles
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedAngles.map((angle) => (
            <AngleCard key={angle.id} angle={angle} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-700">Angles Generator</h1>
        <p className="text-gray-600 mt-2">
          Complete this mock interview to generate personalized pitch angles for podcast outreach.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">Mock Interview Process</span>
        </div>
        <p className="text-blue-700 mt-2 text-sm">
          Answer the questions below as if you're in a real interview. Our Agents will analyze your responses to create pitch angles that will highlight your unique expertise and brand story.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Client Bio */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800">Client Bio</h2>
              <Badge variant="destructive">Required</Badge>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Provide your current professional bio. This establishes context and credibility for angle generation.
            </p>
            
            <FormField
              control={form.control}
              name="clientBio"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Card className="hover:shadow-sm transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-medium text-gray-900">Professional Bio</h3>
                        <Badge variant="destructive" className="text-xs">Foundation Context</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Include your current role, company, key achievements, and expertise areas. This forms the foundation for all angle generation.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Example: Phillip Swan is a technology leader and entrepreneur focused on helping Fortune 500 companies responsibly leverage AI. As co-founder of The AI Solution Group, he specializes in delivering safe and innovative AI solutions for industries like manufacturing, financial services, and healthcare. With a background spanning engineering, product management, and executive leadership..."
                          className={`min-h-[120px] ${fieldState.error ? 'border-red-500' : ''}`}
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm text-red-500 mt-2">{fieldState.error.message}</p>
                      )}
                    </CardContent>
                  </Card>
                </FormItem>
              )}
            />
          </div>

          {/* Required Questions */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <CheckCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">Required Questions</h2>
              <Badge variant="destructive">Must Complete</Badge>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {requiredQuestions.map((question) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={`interviewResponses.${question.id}`}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <InterviewQuestionCard
                          question={question}
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Optional Questions */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-800">Optional Questions</h2>
              <Badge variant="secondary">Better Results</Badge>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Answering these questions will help generate more targeted and compelling pitch angles.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {optionalQuestions.map((question) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={`interviewResponses.${question.id}`}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <InterviewQuestionCard
                          question={question}
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content Sources */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800">Content Sources</h2>
              <Badge className="bg-primary/10 text-primary">AI Analysis</Badge>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Provide your existing content for AI analysis. This helps generate angles based on your proven expertise and messaging.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="pastEpisodeTranscripts"
                render={({ field }) => (
                  <FormItem>
                    <Card className="hover:shadow-sm transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <h3 className="font-medium text-gray-900">Past Episode Transcripts</h3>
                          <Badge variant="outline" className="text-xs">High Impact</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Paste transcripts from podcast episodes you've been featured on. Our AI will identify your best talking points and expertise areas.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Paste full transcripts from your previous podcast appearances here. Include host introductions, your responses, and any Q&A segments..."
                            className="min-h-[150px] text-sm"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featuredArticles"
                render={({ field }) => (
                  <FormItem>
                    <Card className="hover:shadow-sm transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-primary" />
                          <h3 className="font-medium text-gray-900">Featured Articles & Press</h3>
                          <Badge variant="outline" className="text-xs">Expert Positioning</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Include articles where you've been featured, quoted, or interviewed. This shows your media experience and key messages.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Paste content from articles, press releases, or media coverage featuring you. Include your quotes, bio descriptions, and any commentary about your work..."
                            className="min-h-[150px] text-sm"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialPosts"
                render={({ field }) => (
                  <FormItem>
                    <Card className="hover:shadow-sm transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <h3 className="font-medium text-gray-900">Social Media Posts</h3>
                          <Badge variant="outline" className="text-xs">Authentic Voice</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Copy your most engaging LinkedIn, Twitter, or other social posts. This captures your authentic voice and current interests.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Paste your most popular or representative social media posts. Include posts about industry insights, personal achievements, thought leadership, and professional updates..."
                            className="min-h-[150px] text-sm"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              type="submit" 
              size="lg"
              disabled={isGenerating}
              className="bg-primary text-white hover:bg-primary/90 px-8"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Generating Angles...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Pitch Angles
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}