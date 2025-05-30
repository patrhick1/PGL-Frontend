// client/src/pages/ProfileSetup.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardList, BookOpen, Save, AlertTriangle, Lightbulb, Info, ArrowLeft } from "lucide-react";
import Questionnaire from "./Questionnaire"; // Assuming Questionnaire.tsx is now a component for the form logic
import AnglesGenerator from "./AnglesGenerator"; // Assuming AnglesGenerator.tsx is now a component

// Schema for just the Media Kit URL part
const mediaKitUrlSchema = z.object({
  media_kit_url: z.string().url("Please enter a valid URL for your media kit.").optional().or(z.literal("")).nullable(),
});
type MediaKitUrlFormData = z.infer<typeof mediaKitUrlSchema>;

interface ClientCampaignForSetup {
  campaign_id: string;
  campaign_name: string;
  media_kit_url?: string | null;
  questionnaire_responses?: object | null;
  mock_interview_trancript?: string | null; // Added to check if questionnaire was processed
  campaign_bio?: string | null;
  campaign_angles?: string | null;
  campaign_keywords?: string[] | null; // Added
}

export default function ProfileSetup() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation(); // For navigation
  
  const queryParams = new URLSearchParams(window.location.search);
  const initialCampaignIdFromUrl = queryParams.get("campaignId");

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignIdFromUrl);
  const [activeTab, setActiveTab] = useState<string>("questionnaire");


  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<ClientCampaignForSetup[]>({
    queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) return [];
      const response = await apiRequest("GET", `/campaigns/?person_id=${user.person_id}`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });
  
  const selectedCampaignData = campaigns.find(c => c.campaign_id === selectedCampaignId);

  // Form for Media Kit URL
  const mediaKitUrlForm = useForm<MediaKitUrlFormData>({
    resolver: zodResolver(mediaKitUrlSchema),
    defaultValues: { media_kit_url: "" },
  });

  useEffect(() => {
    if (selectedCampaignData) {
      mediaKitUrlForm.reset({ media_kit_url: selectedCampaignData.media_kit_url || "" });
      // If campaign from URL is valid and exists in fetched campaigns, keep it.
      // Otherwise, if no valid campaign is selected, and campaigns list is available, select the first one.
      if (!campaigns.find(c => c.campaign_id === selectedCampaignId) && campaigns.length > 0) {
        // setSelectedCampaignId(campaigns[0].campaign_id); // Auto-select first if URL one is bad
      }
    } else if (!selectedCampaignId && campaigns.length > 0 && !initialCampaignIdFromUrl) {
      // If no campaign is selected (neither from URL nor state) and campaigns are loaded, select the first one.
      // setSelectedCampaignId(campaigns[0].campaign_id);
    } else if (!selectedCampaignId && campaigns.length === 0 && !isLoadingCampaigns) {
        // No campaigns, do nothing or show a message
    }
  }, [selectedCampaignData, mediaKitUrlForm, campaigns, selectedCampaignId, isLoadingCampaigns, initialCampaignIdFromUrl]);


  const updateMediaKitUrlMutation = useMutation({
    mutationFn: async (data: MediaKitUrlFormData) => {
      if (!selectedCampaignId) throw new Error("No campaign selected.");
      const currentCampaign = campaigns.find(c => c.campaign_id === selectedCampaignId);
      const payload = { 
        media_kit_url: data.media_kit_url || null,
        // Preserve other fields that might be on the update schema but not part of this form
        campaign_keywords: currentCampaign?.campaign_keywords, 
      };
      return apiRequest("PUT", `/campaigns/${selectedCampaignId}`, payload);
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update media kit URL." }));
        throw new Error(errorData.detail);
      }
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", selectedCampaignId] }); // If CampaignDetail uses this
      toast({ title: "Success", description: "Media kit URL updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update media kit URL.", variant: "destructive" });
    },
  });

  const handleCampaignChange = (campaignId: string) => {
    const newId = campaignId === "none" ? null : campaignId;
    setSelectedCampaignId(newId);
    if (newId) {
      navigate(`/profile-setup?campaignId=${newId}`, { replace: true }); // Update URL
    } else {
      navigate(`/profile-setup`, { replace: true });
    }
  };


  if (authLoading || isLoadingCampaigns) {
    return (
        <div className="space-y-6 p-4 md:p-6 animate-pulse">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      <Link href="/my-campaigns">
        <Button variant="outline" className="mb-4 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Campaigns
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Client Profile & Campaign Content Setup</CardTitle>
          <CardDescription>
            Complete the questionnaire for your campaign, manage your media kit link, and generate AI-powered bio & angles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormItem className="mb-6">
            <FormLabel>Select Campaign to Setup/Update</FormLabel>
            <Select 
                onValueChange={(value: string) => setSelectedCampaignId(value === "none" ? null : value)}
                value={selectedCampaignId || ""}
            >
              <FormControl><SelectTrigger disabled={isLoadingCampaigns || campaigns.length === 0}>
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none" disabled>Select a campaign...</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                    {campaign.campaign_name}
                    {campaign.questionnaire_responses || campaign.mock_interview_trancript ? " (Questionnaire Started/Filled)" : " (Questionnaire Pending)"}
                  </SelectItem>
                ))}
                {campaigns.length === 0 && <div className="p-2 text-sm text-gray-500">No campaigns found. Please ask your account manager to create one.</div>}
              </SelectContent>
            </Select>
            {!selectedCampaignId && campaigns.length > 0 && <FormDescription className="text-red-500 pt-1">Please select a campaign to proceed.</FormDescription>}
          </FormItem>

          {selectedCampaignId && selectedCampaignData ? (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="questionnaire"><ClipboardList className="mr-2 h-4 w-4"/>Questionnaire</TabsTrigger>
                <TabsTrigger value="mediaKitUrl"><BookOpen className="mr-2 h-4 w-4"/>Media Kit Link</TabsTrigger>
                <TabsTrigger value="aiBioAngles" disabled={!selectedCampaignData?.questionnaire_responses && !selectedCampaignData?.mock_interview_trancript}>
                    <Lightbulb className="mr-2 h-4 w-4"/>AI Bio & Angles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questionnaire" className="mt-6">
                {/* Pass selectedCampaignId and selectedCampaignData to Questionnaire if it needs them */}
                <Questionnaire 
                  // campaignId={selectedCampaignId} 
                  // initialData={selectedCampaignData.questionnaire_responses} 
                />
              </TabsContent>

              <TabsContent value="mediaKitUrl" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Media Kit Link</CardTitle>
                    <CardDescription>Provide a link to your existing media kit (e.g., Google Drive, Dropbox, personal website page).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...mediaKitUrlForm}>
                      <form onSubmit={mediaKitUrlForm.handleSubmit(data => updateMediaKitUrlMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={mediaKitUrlForm.control}
                          name="media_kit_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Media Kit URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/my-media-kit" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={updateMediaKitUrlMutation.isPending} className="bg-primary text-primary-foreground">
                          {updateMediaKitUrlMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4"/>Save Media Kit Link</>}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="aiBioAngles" className="mt-6">
                {selectedCampaignData?.questionnaire_responses || selectedCampaignData?.mock_interview_trancript ? (
                    // AnglesGenerator needs to be adapted to take selectedCampaignId or be aware of it
                    <AnglesGenerator /* campaignId={selectedCampaignId} */ />
                ) : (
                    <Card>
                        <CardContent className="p-6 text-center text-gray-500">
                            <AlertTriangle className="mx-auto h-10 w-10 mb-2 text-yellow-500"/>
                            Please complete the Questionnaire for this campaign before generating Bio & Angles.
                        </CardContent>
                    </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            campaigns.length > 0 && <p className="text-center text-gray-500 py-6">Select a campaign above to manage its profile content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}