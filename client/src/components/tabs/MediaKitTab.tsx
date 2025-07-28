import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Image as ImageIcon, Users, BarChart2, Save, Info, Link as LinkIcon, Camera, Edit } from 'lucide-react';
import { Link as RouterLink } from 'wouter';
import { ImageUpload } from '@/components/ImageUpload';
import { MediaKitEditor } from '@/components/MediaKitEditor';

// --- Zod Schema for Editable Media Kit Content (MediaKitEditableContentSchema) ---
const mediaKitEditableContentSchema = z.object({
  title: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  custom_intro: z.string().optional().nullable(),
  call_to_action_text: z.string().optional().nullable(),
  call_to_action_url: z.string().url().optional().or(z.literal('')).nullable(),
  show_contact_form: z.boolean().default(true).optional(),
  is_public: z.boolean().default(false).optional(),
  theme_preference: z.string().default('modern').optional(),
  // primary_color: z.string().optional().nullable(), // Example of more theme options
  // secondary_color: z.string().optional().nullable(),
});
type MediaKitEditableFormData = z.infer<typeof mediaKitEditableContentSchema>;

// --- Interface for Fetched Media Kit Data (MediaKitInDB) ---
interface TalkingPoint {
  topic: string;
  description: string;
  outcome?: string | null;
}
interface SocialMediaStat {
  platform: string;
  username?: string | null;
  url: string;
  followers?: number | null;
  audience_persona?: string | null;
}
interface MediaKitData {
  media_kit_id: string;
  campaign_id: string;
  person_id: number;
  slug: string;
  title: string;
  headline?: string | null;
  custom_intro?: string | null;
  full_bio_content?: string | null;
  summary_bio_content?: string | null;
  short_bio_content?: string | null;
  talking_points?: TalkingPoint[] | null;
  image_urls?: { headshot_url?: string | null; logo_url?: string | null; cover_image_url?: string | null; gallery_image_urls?: string[] | null } | null;
  social_media_stats?: SocialMediaStat[] | null;
  call_to_action_text?: string | null;
  call_to_action_url?: string | null;
  show_contact_form?: boolean;
  is_public?: boolean;
  theme_preference?: string;
  bio_source?: string | null; // NEW
  angles_source?: string | null; // NEW
  created_at: string;
  updated_at: string;
}

interface MediaKitTabProps {
  campaignId: string | null;
  // Pass any other relevant campaign data if needed, e.g., campaign name for display
}

export default function MediaKitTab({ campaignId }: MediaKitTabProps) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [showInlineEditor, setShowInlineEditor] = useState(false);

  const { data: mediaKitData, isLoading: isLoadingMediaKit, error: mediaKitError, refetch: refetchMediaKit } = useQuery<MediaKitData>({
    queryKey: ["/campaigns/", campaignId, "/media-kit"],
    queryFn: async () => {
      if (!campaignId) throw new Error("Campaign ID is required to fetch media kit.");
      const response = await apiRequest("GET", `/campaigns/${campaignId}/media-kit`);
      if (response.status === 404) return null; // No media kit created yet
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch media kit." }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    enabled: !!campaignId,
    retry: 1,
  });

  const mediaKitForm = useForm<MediaKitEditableFormData>({
    resolver: zodResolver(mediaKitEditableContentSchema),
    defaultValues: {
      title: "",
      headline: "",
      custom_intro: "",
      call_to_action_text: "",
      call_to_action_url: "",
      show_contact_form: true,
      is_public: false,
      theme_preference: "modern",
    },
  });

  useEffect(() => {
    if (mediaKitData) {
      mediaKitForm.reset({
        title: mediaKitData.title || "", // Title should ideally always exist if kit exists
        headline: mediaKitData.headline || "",
        custom_intro: mediaKitData.custom_intro || "",
        call_to_action_text: mediaKitData.call_to_action_text || "",
        call_to_action_url: mediaKitData.call_to_action_url || "",
        show_contact_form: mediaKitData.show_contact_form !== undefined ? mediaKitData.show_contact_form : true,
        is_public: mediaKitData.is_public !== undefined ? mediaKitData.is_public : false,
        theme_preference: mediaKitData.theme_preference || "modern",
      });
    }
  }, [mediaKitData, mediaKitForm]);

  const upsertMediaKitMutation = useMutation({
    mutationFn: async (formData: MediaKitEditableFormData) => {
      if (!campaignId) throw new Error("Campaign ID is required.");
      
      // Determine if we're creating or updating
      const isUpdate = !!mediaKitData;
      const method = isUpdate ? "PATCH" : "POST";
      const endpoint = isUpdate 
        ? `/campaigns/${campaignId}/media-kit/settings`
        : `/campaigns/${campaignId}/media-kit`;
      
      console.log(`Sending ${method} request to:`, endpoint);
      console.log('Request body:', JSON.stringify(formData, null, 2));
      console.log('Is update?', isUpdate);
      
      const response = await apiRequest(method, endpoint, formData);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save media kit." }));
        console.error('Error response:', errorData);
        throw new Error(errorData.detail);
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);
      return responseData;
    },
    onSuccess: (data, variables) => {
      const isUpdate = !!mediaKitData;
      toast({ 
        title: "Success", 
        description: isUpdate ? "Media kit settings updated successfully!" : "Media kit created successfully!" 
      });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/", campaignId, "/media-kit"] });
      // Potentially invalidate general campaign list if it shows media kit status
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage"] }); 
    },
    onError: (error: Error) => {
      toast({ title: "Error Saving Media Kit", description: error.message, variant: "destructive" });
    },
  });

  const handleFormSubmit = (data: MediaKitEditableFormData) => {
    console.log('MediaKit Form Submission Data:', data);
    console.log('Campaign ID:', campaignId);
    console.log('API Endpoint:', `/campaigns/${campaignId}/media-kit`);
    upsertMediaKitMutation.mutate(data);
  };

  if (!campaignId) {
    return <Card><CardContent className="pt-6 text-center text-gray-500">Please select a campaign first to manage its media kit.</CardContent></Card>;
  }

  if (isLoadingMediaKit) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (mediaKitError) {
    return <Card><CardContent className="pt-6 text-red-500">Error loading media kit: {(mediaKitError as Error).message}</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Form {...mediaKitForm}>
        <form onSubmit={mediaKitForm.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editable Media Kit Content</CardTitle>
              <CardDescription>Customize the presentational elements of your media kit. Bio and talking points are sourced automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={mediaKitForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Media Kit Title</FormLabel><FormControl><Input placeholder="e.g., John Doe - Public Speaker" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={mediaKitForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input placeholder="e.g., Expert in SaaS Growth" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={mediaKitForm.control} name="custom_intro" render={({ field }) => (<FormItem><FormLabel>Custom Introduction (Optional)</FormLabel><FormControl><Textarea placeholder="A brief, engaging introduction for your media kit..." {...field} value={field.value || ""} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={mediaKitForm.control} name="call_to_action_text" render={({ field }) => (<FormItem><FormLabel>Call to Action Button Text</FormLabel><FormControl><Input placeholder="e.g., Book a Consultation" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={mediaKitForm.control} name="call_to_action_url" render={({ field }) => (<FormItem><FormLabel>Call to Action URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com/contact" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <FormField control={mediaKitForm.control} name="is_public" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Make Media Kit Public</FormLabel><FormDescription>Allow anyone with the link to view this media kit.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <FormField control={mediaKitForm.control} name="show_contact_form" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Show Contact Form</FormLabel><FormDescription>Display a contact form on your public media kit page.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              </div>
               {/* <FormField control={mediaKitForm.control} name="theme_preference" render={({ field }) => (<FormItem><FormLabel>Theme Preference</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger></FormControl><SelectContent><SelectItem value="modern">Modern</SelectItem><SelectItem value="classic">Classic</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} /> */}
              
              <Button type="submit" disabled={upsertMediaKitMutation.isPending} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> {upsertMediaKitMutation.isPending ? "Saving..." : "Save Media Kit Settings"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>

      {mediaKitData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Media Kit Images</CardTitle>
              <CardDescription>Upload a professional headshot and a company logo for your media kit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Client Headshot</label>
                        <ImageUpload
                            campaignId={campaignId!}
                            uploadContext="media_kit_headshot"
                            currentImageUrl={mediaKitData?.image_urls?.headshot_url}
                            onUploadComplete={(url) => {
                                // This will trigger a re-fetch, which will then update the image URL display
                                tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/", campaignId, "/media-kit"] });
                            }}
                        />
                        <p className="text-sm text-muted-foreground">A professional, high-resolution headshot. Recommended size: 500x500px.</p>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Company or Brand Logo</label>
                         <ImageUpload
                            campaignId={campaignId!}
                            uploadContext="media_kit_logo"
                            currentImageUrl={mediaKitData?.image_urls?.logo_url}
                            onUploadComplete={(url) => {
                                tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/", campaignId, "/media-kit"] });
                            }}
                        />
                        <p className="text-sm text-muted-foreground">Your company's logo. A transparent PNG is recommended. Recommended size: 300x150px.</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Generated & Sourced Content</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInlineEditor(!showInlineEditor)}
                  >
                    <Edit className="h-3 w-3 mr-1.5"/> 
                    {showInlineEditor ? 'Hide Editor' : 'Edit Content'}
                  </Button>
                  {mediaKitData.is_public && mediaKitData.slug && (
                      <a href={`/media-kit/${mediaKitData.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1.5"/> View Public Media Kit</Button>
                      </a>
                  )}
                </div>
              </div>
              <CardDescription>This content is automatically derived from your campaign questionnaire or GDocs. Edit those sources to update this section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Bio Information 
                  {mediaKitData.bio_source && <Badge variant="outline" className="ml-2 text-xs">Sourced from: {mediaKitData.bio_source.replace(/_/g, ' ')}</Badge>}
                </h4>
                <div className="p-3 border rounded-md bg-gray-50 text-sm space-y-2">
                    <p><span className="font-medium">Full Bio:</span> {mediaKitData.full_bio_content || <span className="text-gray-400">Not available.</span>}</p>
                    <p><span className="font-medium">Summary Bio:</span> {mediaKitData.summary_bio_content || <span className="text-gray-400">Not generated.</span>}</p>
                    <p><span className="font-medium">Short Bio:</span> {mediaKitData.short_bio_content || <span className="text-gray-400">Not generated.</span>}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Talking Points & Angles
                  {mediaKitData.angles_source && <Badge variant="outline" className="ml-2 text-xs">Sourced from: {mediaKitData.angles_source.replace(/_/g, ' ')}</Badge>}
                </h4>
                {mediaKitData.talking_points && mediaKitData.talking_points.length > 0 ? (
                  <div className="space-y-2">
                    {mediaKitData.talking_points.map((point, index) => (
                      <Card key={index} className="p-3 bg-gray-50">
                        <p className="font-medium text-sm">{point.topic}</p>
                        <p className="text-xs text-gray-600">{point.description}</p>
                        {point.outcome && <p className="text-xs text-gray-500 italic">Outcome: {point.outcome}</p>}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 p-3 border rounded-md bg-gray-50">No talking points available. Complete questionnaire or GDocs.</p>
                )}
              </div>
              {/* Optional: Display Image URLs and Social Stats if needed in this view */}
            </CardContent>
          </Card>

          {/* Inline Media Kit Editor */}
          {showInlineEditor && (
            <MediaKitEditor
              mediaKit={mediaKitData}
              isOwner={true}
              onSave={() => {
                refetchMediaKit();
                toast({
                  title: "Success",
                  description: "Media kit updated successfully!",
                });
              }}
            />
          )}
        </>
      )}
      {!mediaKitData && !isLoadingMediaKit && (
          <Card className="mt-6">
              <CardContent className="pt-6 text-center">
                  <Info className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-700">Media Kit Not Yet Created</p>
                  <p className="text-sm text-gray-500">Fill in and save the editable fields above to generate your media kit.</p>
              </CardContent>
          </Card>
      )}
    </div>
  );
} 