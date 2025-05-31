// client/src/pages/Questionnaire.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { ClipboardList, CheckCircle, Save, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Define Campaign interface to match backend (simplified for this context)
interface ClientCampaign {
  campaign_id: string; // UUID
  campaign_name: string;
  person_id: number;
  questionnaire_responses?: QuestionnaireFormData | null; // To check if already filled
  mock_interview_trancript?: string | null; // To see if it was generated
}

// Zod schema for the questionnaire form
const questionnaireSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(2, "Full name is required"),
    jobTitle: z.string().min(2, "Job title is required"),
    company: z.string().min(2, "Company is required"),
    bio: z.string().min(50, "Bio must be at least 50 characters"),
    expertise: z.array(z.string()).min(1, "Select at least one area of expertise"),
  }),
  experience: z.object({
    yearsOfExperience: z.string().min(1, "Years of experience is required"),
    previousPodcasts: z.string().optional(),
    speakingExperience: z.array(z.string()).optional(),
    achievements: z.string().min(20, "Please describe your achievements"),
  }),
  preferences: z.object({
    preferredTopics: z.array(z.string()).min(1, "Select at least one preferred topic"),
    audienceSize: z.string().min(1, "Audience size preference is required"),
    podcastFormat: z.array(z.string()).optional(),
    availability: z.string().min(1, "Availability is required"),
  }),
  goals: z.object({
    primaryGoals: z.array(z.string()).min(1, "Select at least one primary goal"),
    targetAudience: z.string().min(10, "Describe your target audience"),
    keyMessages: z.string().min(20, "Describe your key messages"),
  }),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

// Constants for checkbox/select options
const expertiseAreas = [ "Business Strategy", "Marketing", "Sales", "Leadership", "Technology", "Entrepreneurship", "Finance", "Personal Development", "Health & Wellness", "Education", "Innovation", "Digital Transformation", "Customer Experience" ];
const speakingExperiences = [ "Corporate Events", "Conferences", "Workshops", "Webinars", "Panel Discussions", "Keynote Speaking", "Industry Events", "Online Summits" ];
const preferredTopics = [ "Business Growth", "Leadership Development", "Marketing Strategies", "Technology Trends", "Innovation", "Entrepreneurship", "Personal Branding", "Industry Insights", "Career Development", "Team Building" ];
const podcastFormats = [ "Interview Format", "Solo Episodes", "Panel Discussions", "Storytelling", "Educational", "News & Analysis" ];
const primaryGoals = [ "Brand Awareness", "Thought Leadership", "Lead Generation", "Book Promotion", "Product Launch", "Network Building", "Industry Recognition", "Speaking Opportunities" ];

interface QuestionnaireProps {
  campaignId: string | null;
  onSuccessfulSubmit?: () => void;
  // We might also pass initialData if ProfileSetup fetches it more centrally, but for now Questionnaire fetches its own based on campaignId.
}

export default function Questionnaire({ campaignId, onSuccessfulSubmit }: QuestionnaireProps) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessingContent, setIsProcessingContent] = useState(false);

  const { data: existingQuestionnaire, isLoading: isLoadingQuestionnaire, refetch: refetchQuestionnaire } = useQuery<QuestionnaireFormData | null>({
    queryKey: ["campaignQuestionnaireData", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) {
        console.warn(`Failed to fetch campaign details for ${campaignId}`);
        return null;
      }
      const campaignData: ClientCampaign = await response.json();
      return campaignData.questionnaire_responses || null;
    },
    enabled: !!campaignId,
  });

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      personalInfo: { fullName: user?.full_name || "", jobTitle: "", company: "", bio: "", expertise: [] },
      experience: { yearsOfExperience: "", previousPodcasts: "", speakingExperience: [], achievements: "" },
      preferences: { preferredTopics: [], audienceSize: "", podcastFormat: [], availability: "" },
      goals: { primaryGoals: [], targetAudience: "", keyMessages: "" },
    },
  });

  useEffect(() => {
    if (campaignId) {
        refetchQuestionnaire();
    }
  }, [campaignId, refetchQuestionnaire]);

  useEffect(() => {
    if (existingQuestionnaire) {
      form.reset(existingQuestionnaire);
    } else {
      form.reset({
        personalInfo: { fullName: user?.full_name || "", jobTitle: "", company: "", bio: "", expertise: [] },
        experience: { yearsOfExperience: "", previousPodcasts: "", speakingExperience: [], achievements: "" },
        preferences: { preferredTopics: [], audienceSize: "", podcastFormat: [], availability: "" },
        goals: { primaryGoals: [], targetAudience: "", keyMessages: "" },
      });
    }
  }, [existingQuestionnaire, form, user?.full_name]);

  const submitQuestionnaireMutation = useMutation({
    mutationFn: async (data: QuestionnaireFormData) => {
      if (!campaignId) throw new Error("No campaign selected.");
      return apiRequest("POST", `/campaigns/${campaignId}/submit-questionnaire`, { questionnaire_data: data });
    },
    onSuccess: () => {
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignQuestionnaireData", campaignId] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaigns", user?.person_id] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id] });
      setIsProcessingContent(true);
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
    },
    onError: (error: any) => {
      toast({ title: "Submission Error", description: error.message || "Failed to submit questionnaire.", variant: "destructive" });
      setIsProcessingContent(false);
    },
  });

  const onSubmit = (data: QuestionnaireFormData) => {
    if (!campaignId) {
        toast({ title: "Error", description: "Please select a campaign first (This should not happen if UI is correct).", variant: "destructive" });
        return;
    }
    submitQuestionnaireMutation.mutate(data);
  };

  const isQuestionnaireCompletedForSelectedCampaign = !!existingQuestionnaire;

  if (authLoading) {
    return <div className="p-6 text-center"><Skeleton className="h-10 w-1/2 mx-auto mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!campaignId) {
    return (
        <Card>
            <CardContent className="p-6 text-center text-gray-500">
                <Info className="mx-auto h-10 w-10 mb-3 text-blue-500" />
                <p>Please select a campaign in the main setup page to fill out its questionnaire.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="personalInfo.fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="personalInfo.jobTitle" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="CEO, Marketing Director, etc." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="personalInfo.company" render={({ field }) => (
              <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Your company name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="personalInfo.bio" render={({ field }) => (
              <FormItem><FormLabel>Professional Bio</FormLabel><FormControl><Textarea placeholder="Tell us about your professional background..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="personalInfo.expertise" render={() => (
              <FormItem>
                <FormLabel>Areas of Expertise</FormLabel>
                <FormDescription>Select all that apply</FormDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {expertiseAreas.map((area) => (
                    <FormField key={area} control={form.control} name="personalInfo.expertise"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl><Checkbox checked={field.value?.includes(area)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), area] : field.value?.filter((v) => v !== area) || [])} /></FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">{area}</FormLabel>
                        </FormItem>
                      )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        {/* Experience Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Experience & Background</h3>
          <div className="space-y-4">
              <FormField control={form.control} name="experience.yearsOfExperience" render={({ field }) => (
              <FormItem><FormLabel>Years of Professional Experience</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger></FormControl>
                  <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem><SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem><SelectItem value="11-15">11-15 years</SelectItem>
                      <SelectItem value="16+">16+ years</SelectItem>
                  </SelectContent>
                  </Select><FormMessage />
              </FormItem>
              )} />
              <FormField control={form.control} name="experience.previousPodcasts" render={({ field }) => (
                  <FormItem><FormLabel>Previous Podcast Appearances (Optional)</FormLabel><FormControl><Textarea placeholder="List any previous podcast appearances, or links to them..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="experience.speakingExperience" render={() => (
                  <FormItem><FormLabel>Other Speaking Experience (Optional)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {speakingExperiences.map((exp) => (
                      <FormField key={exp} control={form.control} name="experience.speakingExperience"
                          render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(exp)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), exp] : field.value?.filter((v) => v !== exp) || [])} /></FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">{exp}</FormLabel>
                          </FormItem>
                          )} />
                      ))}
                  </div><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="experience.achievements" render={({ field }) => (
                  <FormItem><FormLabel>Key Achievements & Recognition</FormLabel><FormControl><Textarea placeholder="Describe your most notable achievements..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Podcast Preferences</h3>
          <div className="space-y-4">
              <FormField control={form.control} name="preferences.preferredTopics" render={() => (
                  <FormItem><FormLabel>Preferred Discussion Topics</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {preferredTopics.map((topic) => (
                      <FormField key={topic} control={form.control} name="preferences.preferredTopics"
                          render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(topic)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), topic] : field.value?.filter((v) => v !== topic) || [])} /></FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">{topic}</FormLabel>
                          </FormItem>
                          )} />
                      ))}
                  </div><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="preferences.audienceSize" render={({ field }) => (
                  <FormItem><FormLabel>Preferred Audience Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select audience size" /></SelectTrigger></FormControl>
                      <SelectContent>
                      <SelectItem value="any">Any Size</SelectItem><SelectItem value="small">Small (&lt;1K)</SelectItem>
                      <SelectItem value="medium">Medium (1K-10K)</SelectItem><SelectItem value="large">Large (10K-50K)</SelectItem>
                      <SelectItem value="very-large">Very Large (50K+)</SelectItem>
                      </SelectContent>
                  </Select><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="preferences.podcastFormat" render={() => (
                  <FormItem><FormLabel>Preferred Podcast Formats (Optional)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {podcastFormats.map((format) => (
                      <FormField key={format} control={form.control} name="preferences.podcastFormat"
                          render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(format)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), format] : field.value?.filter((v) => v !== format) || [])} /></FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">{format}</FormLabel>
                          </FormItem>
                          )} />
                      ))}
                  </div><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="preferences.availability" render={({ field }) => (
                  <FormItem><FormLabel>Availability</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger></FormControl>
                      <SelectContent>
                      <SelectItem value="immediately">Available Immediately</SelectItem><SelectItem value="1-2-weeks">Within 1-2 weeks</SelectItem>
                      <SelectItem value="3-4-weeks">Within 3-4 weeks</SelectItem><SelectItem value="1-2-months">Within 1-2 months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                  </Select><FormMessage />
                  </FormItem>
              )} />
          </div>
        </section>

        {/* Goals Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Goals & Objectives</h3>
          <div className="space-y-4">
              <FormField control={form.control} name="goals.primaryGoals" render={() => (
                  <FormItem><FormLabel>Primary Goals for Podcast Appearances</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {primaryGoals.map((goal) => (
                      <FormField key={goal} control={form.control} name="goals.primaryGoals"
                          render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(goal)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), goal] : field.value?.filter((v) => v !== goal) || [])} /></FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">{goal}</FormLabel>
                          </FormItem>
                          )} />
                      ))}
                  </div><FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="goals.targetAudience" render={({ field }) => (
                  <FormItem><FormLabel>Target Audience Description</FormLabel><FormControl><Textarea placeholder="Describe your ideal audience..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="goals.keyMessages" render={({ field }) => (
                  <FormItem><FormLabel>Key Messages to Convey</FormLabel><FormControl><Textarea placeholder="What are the main messages you want to share?" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitQuestionnaireMutation.isPending || !campaignId} className="bg-primary text-white hover:bg-primary/90">
            {submitQuestionnaireMutation.isPending ? "Submitting..." : (isQuestionnaireCompletedForSelectedCampaign ? "Update Questionnaire" : "Submit Questionnaire")}
          </Button>
        </div>
      </form>
    </Form>
  );
}