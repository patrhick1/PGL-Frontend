import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClipboardList, CheckCircle, Save } from "lucide-react";

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
    previousPodcasts: z.string(),
    speakingExperience: z.array(z.string()),
    achievements: z.string().min(20, "Please describe your achievements"),
  }),
  preferences: z.object({
    preferredTopics: z.array(z.string()).min(1, "Select at least one preferred topic"),
    audienceSize: z.string().min(1, "Audience size preference is required"),
    podcastFormat: z.array(z.string()),
    availability: z.string().min(1, "Availability is required"),
  }),
  goals: z.object({
    primaryGoals: z.array(z.string()).min(1, "Select at least one primary goal"),
    targetAudience: z.string().min(10, "Describe your target audience"),
    keyMessages: z.string().min(20, "Describe your key messages"),
  }),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

const expertiseAreas = [
  "Business Strategy", "Marketing", "Sales", "Leadership", "Technology", 
  "Entrepreneurship", "Finance", "Personal Development", "Health & Wellness",
  "Education", "Innovation", "Digital Transformation", "Customer Experience"
];

const speakingExperiences = [
  "Corporate Events", "Conferences", "Workshops", "Webinars", 
  "Panel Discussions", "Keynote Speaking", "Industry Events", "Online Summits"
];

const preferredTopics = [
  "Business Growth", "Leadership Development", "Marketing Strategies", 
  "Technology Trends", "Innovation", "Entrepreneurship", "Personal Branding",
  "Industry Insights", "Career Development", "Team Building"
];

const podcastFormats = [
  "Interview Format", "Solo Episodes", "Panel Discussions", 
  "Storytelling", "Educational", "News & Analysis"
];

const primaryGoals = [
  "Brand Awareness", "Thought Leadership", "Lead Generation", 
  "Book Promotion", "Product Launch", "Network Building", 
  "Industry Recognition", "Speaking Opportunities"
];

export default function Questionnaire() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: existingResponse, isLoading } = useQuery({
    queryKey: ["/api/questionnaire"],
  });

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      personalInfo: {
        fullName: "",
        jobTitle: "",
        company: "",
        bio: "",
        expertise: [],
      },
      experience: {
        yearsOfExperience: "",
        previousPodcasts: "",
        speakingExperience: [],
        achievements: "",
      },
      preferences: {
        preferredTopics: [],
        audienceSize: "",
        podcastFormat: [],
        availability: "",
      },
      goals: {
        primaryGoals: [],
        targetAudience: "",
        keyMessages: "",
      },
    },
  });

  // Load existing data when available
  useState(() => {
    if (existingResponse?.responses) {
      form.reset(existingResponse.responses);
    }
  });

  const saveQuestionnaire = useMutation({
    mutationFn: async (data: QuestionnaireFormData) => {
      return apiRequest("POST", "/api/questionnaire", { responses: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
      toast({
        title: "Success",
        description: "Your questionnaire has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save questionnaire.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: QuestionnaireFormData) => {
    setIsSubmitting(true);
    try {
      await saveQuestionnaire.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCompleted = !!existingResponse;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <ClipboardList className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isCompleted ? "Update Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="text-gray-600">
              {isCompleted 
                ? "Your profile is complete. You can update your information anytime."
                : "Help us find the perfect podcast matches for you."
              }
            </p>
          </div>
        </div>
        
        {isCompleted && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success mr-2" />
              <span className="text-success font-medium">Profile Complete</span>
            </div>
            <p className="text-success/80 text-sm mt-1">
              Your questionnaire was completed on {new Date(existingResponse.completedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="personalInfo.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="personalInfo.jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO, Marketing Director, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="personalInfo.company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Your company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalInfo.bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your professional background, achievements, and what makes you unique..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used in your pitch to podcast hosts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalInfo.expertise"
                render={() => (
                  <FormItem>
                    <FormLabel>Areas of Expertise</FormLabel>
                    <FormDescription>Select all that apply</FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {expertiseAreas.map((area) => (
                        <FormField
                          key={area}
                          control={form.control}
                          name="personalInfo.expertise"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(area)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), area]
                                      : field.value?.filter((value) => value !== area) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {area}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Experience & Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="experience.yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Professional Experience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="16+">16+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience.previousPodcasts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Podcast Appearances</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List any previous podcast appearances, or write 'None' if this is your first time..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience.speakingExperience"
                render={() => (
                  <FormItem>
                    <FormLabel>Speaking Experience</FormLabel>
                    <FormDescription>Select all types of speaking experience you have</FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {speakingExperiences.map((experience) => (
                        <FormField
                          key={experience}
                          control={form.control}
                          name="experience.speakingExperience"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(experience)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), experience]
                                      : field.value?.filter((value) => value !== experience) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {experience}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience.achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Achievements & Recognition</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your most notable achievements, awards, recognitions, or accomplishments..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Podcast Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="preferences.preferredTopics"
                render={() => (
                  <FormItem>
                    <FormLabel>Preferred Discussion Topics</FormLabel>
                    <FormDescription>Select topics you're most comfortable discussing</FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {preferredTopics.map((topic) => (
                        <FormField
                          key={topic}
                          control={form.control}
                          name="preferences.preferredTopics"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(topic)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), topic]
                                      : field.value?.filter((value) => value !== topic) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {topic}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferences.audienceSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Audience Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience size preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any Size</SelectItem>
                        <SelectItem value="small">Small (Under 1K)</SelectItem>
                        <SelectItem value="medium">Medium (1K-10K)</SelectItem>
                        <SelectItem value="large">Large (10K-50K)</SelectItem>
                        <SelectItem value="very-large">Very Large (50K+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferences.podcastFormat"
                render={() => (
                  <FormItem>
                    <FormLabel>Preferred Podcast Formats</FormLabel>
                    <FormDescription>Select formats you're comfortable with</FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {podcastFormats.map((format) => (
                        <FormField
                          key={format}
                          control={form.control}
                          name="preferences.podcastFormat"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(format)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), format]
                                      : field.value?.filter((value) => value !== format) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {format}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferences.availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediately">Available Immediately</SelectItem>
                        <SelectItem value="1-2-weeks">Within 1-2 weeks</SelectItem>
                        <SelectItem value="3-4-weeks">Within 3-4 weeks</SelectItem>
                        <SelectItem value="1-2-months">Within 1-2 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Goals & Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="goals.primaryGoals"
                render={() => (
                  <FormItem>
                    <FormLabel>Primary Goals for Podcast Appearances</FormLabel>
                    <FormDescription>What do you hope to achieve through podcast appearances?</FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {primaryGoals.map((goal) => (
                        <FormField
                          key={goal}
                          control={form.control}
                          name="goals.primaryGoals"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(goal)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), goal]
                                      : field.value?.filter((value) => value !== goal) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {goal}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals.targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your ideal audience and who you want to reach through podcast appearances..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals.keyMessages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Messages</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What are the main messages or insights you want to share with podcast audiences?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isCompleted ? "Update Profile" : "Save Profile"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
