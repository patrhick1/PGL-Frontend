// client/src/pages/MediaKit.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as WouterLink, useLocation } from "wouter"; // Renamed to avoid conflict
import {
  BookOpen, Save, Eye, Share2, Settings, AlertTriangle, Info, ExternalLink, PlusCircle, Trash2, RefreshCcw, Image as ImageIcon, Link2
} from "lucide-react";

// --- Zod Schema for Editable Media Kit Content ---
// This schema represents fields the user can directly edit in this UI.
// Bio and Angles are pulled from campaign GDocs by the backend.
const mediaKitEditableContentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").optional().nullable(),
  headline: z.string().min(10, "Headline should be catchy and concise.").optional().nullable(),
  introduction: z.string().min(50, "Introduction should be at least 50 characters.").optional().nullable(),
  key_achievements: z.array(z.object({ value: z.string().min(1, "Achievement cannot be empty.") })).optional().default([]),
  previous_appearances: z.array(z.object({
    podcast_name: z.string().min(1, "Podcast name is required."),
    episode_title: z.string().optional().nullable(),
    link: z.string().url("Must be a valid URL.").optional().nullable(),
  })).optional().default([]),
  headshot_image_urls: z.array(z.object({ url: z.string().url("Must be a valid URL.") })).optional().default([]),
  logo_image_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")).nullable(),
  call_to_action_text: z.string().optional().nullable(),
  contact_information_for_booking: z.string().optional().nullable(),
  theme_preference: z.string().optional().nullable().default("modern"), // e.g., 'modern', 'classic'
  is_public: z.boolean().optional().default(false),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").min(3, "Slug must be at least 3 characters.").optional().nullable(),
});
type MediaKitEditableFormData = z.infer<typeof mediaKitEditableContentSchema>;

// --- Interfaces for Data Structures ---
interface ClientCampaignForMediaKit {
  campaign_id: string;
  campaign_name: string;
  // These are links to GDocs, backend will fetch content from them
  campaign_bio_gdoc_link?: string | null;
  campaign_angles_gdoc_link?: string | null;
}

interface MediaKitData { // Matches MediaKitInDB from backend
  media_kit_id?: number; // Present if already exists
  campaign_id: string;
  person_id: number;
  title?: string | null;
  slug?: string | null;
  is_public?: boolean | null;
  theme_preference?: string | null;
  headline?: string | null;
  introduction?: string | null;
  full_bio_content?: string | null; // Populated by backend from GDoc
  summary_bio_content?: string | null; // Populated by backend
  short_bio_content?: string | null; // Populated by backend
  talking_points?: Array<{ topic: string; outcome?: string; description: string }> | null; // Populated by backend
  key_achievements?: Array<{ value: string }> | null; // Stored as JSONB [{value: "ach1"}, {value: "ach2"}]
  previous_appearances?: Array<{ podcast_name: string; episode_title?: string; link?: string }> | null;
  social_media_stats?: Record<string, { followers?: number; url?: string }> | null; // e.g. {"twitter": {"followers": 1000, "url": "..."}}
  headshot_image_urls?: Array<{ url: string }> | null; // Stored as JSONB [{url: "url1"}, {url: "url2"}]
  logo_image_url?: string | null;
  call_to_action_text?: string | null;
  contact_information_for_booking?: string | null;
  created_at?: string;
  updated_at?: string;
}

const themeOptions = [
    { value: "modern", label: "Modern & Clean" },
    { value: "classic", label: "Classic Professional" },
    { value: "dynamic", label: "Dynamic & Bold" },
];


export default function MediaKitPage() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<ClientCampaignForMediaKit[]>({
    queryKey: ["clientCampaignsForMediaKitPage", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) return [];
      // Clients automatically see only their own campaigns
      const response = await apiRequest("GET", "/campaigns/");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });

  const { data: mediaKitData, isLoading: isLoadingMediaKit, refetch: refetchMediaKit } = useQuery<MediaKitData | null>({
    queryKey: ["mediaKitData", selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return null;
      const response = await apiRequest("GET", `/campaigns/${selectedCampaignId}/media-kit`);
      if (response.status === 404) return null; // No media kit created yet for this campaign
      if (!response.ok) throw new Error("Failed to fetch media kit data");
      return response.json();
    },
    enabled: !!selectedCampaignId,
  });

  const form = useForm<MediaKitEditableFormData>({
    resolver: zodResolver(mediaKitEditableContentSchema),
    defaultValues: {
        title: "", headline: "", introduction: "", key_achievements: [], previous_appearances: [],
        headshot_image_urls: [], logo_image_url: "", call_to_action_text: "",
        contact_information_for_booking: "", theme_preference: "modern", is_public: false, slug: ""
    },
  });

  const { fields: achievementFields, append: appendAchievement, remove: removeAchievement } = useFieldArray({ control: form.control, name: "key_achievements" });
  const { fields: appearanceFields, append: appendAppearance, remove: removeAppearance } = useFieldArray({ control: form.control, name: "previous_appearances" });
  const { fields: headshotFields, append: appendHeadshot, remove: removeHeadshot } = useFieldArray({ control: form.control, name: "headshot_image_urls" });


  useEffect(() => {
    if (mediaKitData) {
      form.reset({
        title: mediaKitData.title || campaigns.find(c=>c.campaign_id === selectedCampaignId)?.campaign_name || "",
        headline: mediaKitData.headline || "",
        introduction: mediaKitData.introduction || "",
        key_achievements: mediaKitData.key_achievements || [],
        previous_appearances: mediaKitData.previous_appearances || [],
        headshot_image_urls: mediaKitData.headshot_image_urls || [],
        logo_image_url: mediaKitData.logo_image_url || "",
        call_to_action_text: mediaKitData.call_to_action_text || "",
        contact_information_for_booking: mediaKitData.contact_information_for_booking || "",
        theme_preference: mediaKitData.theme_preference || "modern",
        is_public: mediaKitData.is_public || false,
        slug: mediaKitData.slug || "",
      });
    } else if (selectedCampaignId) { // Reset form if campaign selected but no media kit data yet
        const currentCampaign = campaigns.find(c => c.campaign_id === selectedCampaignId);
        form.reset({
            title: currentCampaign ? `Media Kit for ${currentCampaign.campaign_name}` : "",
            headline: "", introduction: "", key_achievements: [], previous_appearances: [],
            headshot_image_urls: [], logo_image_url: "", call_to_action_text: "",
            contact_information_for_booking: "", theme_preference: "modern", is_public: false, slug: ""
        });
    }
  }, [mediaKitData, form, selectedCampaignId, campaigns]);

  const saveMediaKitMutation = useMutation({
    mutationFn: async (data: MediaKitEditableFormData) => {
      if (!selectedCampaignId) throw new Error("No campaign selected.");
      // Backend POST /campaigns/{campaign_id}/media-kit handles create or update
      const response = await apiRequest("POST", `/campaigns/${selectedCampaignId}/media-kit`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save media kit." }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Media kit saved successfully." });
      refetchMediaKit(); // Refetch to get the latest data including generated slug if new
    },
    onError: (error: any) => {
      toast({ title: "Error Saving Media Kit", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: MediaKitEditableFormData) => {
    saveMediaKitMutation.mutate(data);
  };

  const selectedCampaignDetails = campaigns.find(c => c.campaign_id === selectedCampaignId);

  if (authLoading || isLoadingCampaigns) {
    return <div className="p-6"><Skeleton className="h-12 w-1/2 mb-4" /><Skeleton className="h-screen w-full" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <BookOpen className="mr-3 h-7 w-7 text-primary" />
          Manage Your Media Kit
        </h1>
        {mediaKitData?.slug && mediaKitData.is_public && (
            <Button variant="outline" size="sm" asChild>
                <a href={`/mk/${mediaKitData.slug}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4"/> Preview Public Page
                </a>
            </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Campaign</CardTitle>
          <CardDescription>Choose the campaign for which you want to manage the media kit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCampaignId || ""}
            onValueChange={(value) => setSelectedCampaignId(value === "none" ? null : value)}
          >
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Select a campaign..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Select a campaign...</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
              {campaigns.length === 0 && <p className="p-2 text-sm text-gray-500">No campaigns available.</p>}
            </SelectContent>
          </Select>
          {!selectedCampaignId && campaigns.length > 0 && <p className="text-sm text-red-500 mt-2">Please select a campaign to manage its media kit.</p>}
        </CardContent>
      </Card>

      {isLoadingMediaKit && selectedCampaignId && (
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      )}

      {!isLoadingMediaKit && selectedCampaignId && selectedCampaignDetails && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Media Kit Editor: {selectedCampaignDetails.campaign_name}</CardTitle>
              <CardDescription>
                Fill in the details below. Your Bio and Talking Points will be automatically pulled from the campaign's generated Google Docs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Display Bio and Angles (Read-only from GDocs) */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Client Bio (from Campaign)</h4>
                      {selectedCampaignDetails.campaign_bio_gdoc_link ? (
                        <a href={selectedCampaignDetails.campaign_bio_gdoc_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center">
                          <ExternalLink className="h-4 w-4 mr-1"/> View Bio Document
                        </a>
                      ) : <p className="text-sm text-gray-500 italic">Bio document not yet generated for this campaign. <WouterLink href={`/profile-setup?campaignId=${selectedCampaignId}&tab=aiBioAngles`} className="underline">Generate it now?</WouterLink></p>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Talking Points/Angles (from Campaign)</h4>
                      {selectedCampaignDetails.campaign_angles_gdoc_link ? (
                        <a href={selectedCampaignDetails.campaign_angles_gdoc_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center">
                          <ExternalLink className="h-4 w-4 mr-1"/> View Angles Document
                        </a>
                      ) : <p className="text-sm text-gray-500 italic">Angles document not yet generated for this campaign. <WouterLink href={`/profile-setup?campaignId=${selectedCampaignId}&tab=aiBioAngles`} className="underline">Generate it now?</WouterLink></p>}
                    </div>
                  </div>
                  <hr className="my-6"/>

                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Media Kit Page Title</FormLabel><FormControl><Input placeholder="e.g., John Doe - SaaS Growth Expert" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="headline" render={({ field }) => (
                    <FormItem><FormLabel>Catchy Headline</FormLabel><FormControl><Input placeholder="e.g., Helping SaaS Founders Scale to 7 Figures" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="introduction" render={({ field }) => (
                    <FormItem><FormLabel>Brief Introduction (for the public page)</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="A short, engaging intro about the client..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />

                  {/* Key Achievements */}
                  <FormItem>
                    <FormLabel>Key Achievements (up to 5)</FormLabel>
                    {achievementFields.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <FormField control={form.control} name={`key_achievements.${index}.value`} render={({ field: itemField }) => (
                            <FormControl><Input placeholder={`Achievement ${index + 1}`} {...itemField} /></FormControl>
                        )}/>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAchievement(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </div>
                    ))}
                    {achievementFields.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => appendAchievement({ value: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add Achievement</Button>}
                    <FormMessage>{form.formState.errors.key_achievements?.message || form.formState.errors.key_achievements?.[0]?.value?.message}</FormMessage>
                  </FormItem>

                  {/* Previous Appearances */}
                  <FormItem>
                    <FormLabel>Previous Appearances (up to 3)</FormLabel>
                    {appearanceFields.map((field, index) => (
                      <Card key={field.id} className="p-3 space-y-2">
                        <FormField control={form.control} name={`previous_appearances.${index}.podcast_name`} render={({ field: itemField }) => (
                            <FormItem><FormLabel className="text-xs">Podcast Name *</FormLabel><FormControl><Input placeholder="Podcast Name" {...itemField} /></FormControl><FormMessage/></FormItem>
                        )}/>
                        <FormField control={form.control} name={`previous_appearances.${index}.episode_title`} render={({ field: itemField }) => (
                            <FormItem><FormLabel className="text-xs">Episode Title (Optional)</FormLabel><FormControl><Input placeholder="Episode Title" {...itemField} value={itemField.value ?? ""} /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name={`previous_appearances.${index}.link`} render={({ field: itemField }) => (
                            <FormItem><FormLabel className="text-xs">Link (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...itemField} value={itemField.value ?? ""} /></FormControl><FormMessage/></FormItem>
                        )}/>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAppearance(index)} className="mt-1"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </Card>
                    ))}
                    {appearanceFields.length < 3 && <Button type="button" variant="outline" size="sm" onClick={() => appendAppearance({ podcast_name: "", episode_title: "", link: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add Appearance</Button>}
                  </FormItem>

                  {/* Headshots */}
                  <FormItem>
                    <FormLabel>Headshot Image URLs (up to 3)</FormLabel>
                    {headshotFields.map((field, index) => (
                        <div key={field.id} className="flex items-center space-x-2">
                            <FormField control={form.control} name={`headshot_image_urls.${index}.url`} render={({ field: itemField }) => (
                                <FormControl><Input type="url" placeholder={`Headshot URL ${index + 1}`} {...itemField}/></FormControl>
                            )}/>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeHeadshot(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                    {headshotFields.length < 3 && <Button type="button" variant="outline" size="sm" onClick={() => appendHeadshot({ url: "" })}><ImageIcon className="mr-2 h-4 w-4"/>Add Headshot URL</Button>}
                    <FormMessage>{form.formState.errors.headshot_image_urls?.message}</FormMessage>
                  </FormItem>

                  <FormField control={form.control} name="logo_image_url" render={({ field }) => (
                    <FormItem><FormLabel>Company Logo URL (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://link.to/logo.png" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="call_to_action_text" render={({ field }) => (
                    <FormItem><FormLabel>Call to Action Text (Optional)</FormLabel><FormControl><Input placeholder="e.g., Book Me On Your Podcast!" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contact_information_for_booking" render={({ field }) => (
                    <FormItem><FormLabel>Contact Info for Bookings (Optional)</FormLabel><FormControl><Input placeholder="e.g., booking@example.com or Link to Calendly" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <hr className="my-6"/>
                  <h4 className="font-semibold text-gray-700 mb-1">Public Page Settings</h4>
                   <FormField control={form.control} name="theme_preference" render={({ field }) => (
                    <FormItem><FormLabel>Page Theme</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "modern"}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger></FormControl>
                            <SelectContent>{themeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Shareable Link Slug</FormLabel><FormControl><Input placeholder="e.g., john-doe-expert" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Lowercase letters, numbers, and hyphens only. This creates your public URL: yourdomain.com/mk/your-slug</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="is_public" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5"><FormLabel>Make Media Kit Publicly Viewable</FormLabel><FormDescription>Allow anyone with the link to view this media kit.</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />


                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saveMediaKitMutation.isPending} className="bg-primary text-primary-foreground">
                      {saveMediaKitMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Media Kit</>}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {mediaKitData?.social_media_stats && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Social Media Presence</CardTitle>
                    <CardDescription>Follower counts are updated periodically by the system.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(mediaKitData.social_media_stats).map(([platform, stats]) => (
                        <div key={platform} className="p-3 border rounded-md bg-gray-50">
                            <p className="font-medium capitalize text-sm">{platform}</p>
                            <p className="text-lg font-bold">{stats.followers?.toLocaleString() || "N/A"} <span className="text-xs text-gray-500">followers</span></p>
                            {stats.url && <a href={stats.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Profile</a>}
                        </div>
                    ))}
                    {Object.keys(mediaKitData.social_media_stats).length === 0 && <p className="text-sm text-gray-500 col-span-full text-center">No social media stats available yet.</p>}
                </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}