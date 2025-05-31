// client/src/pages/PitchTemplates.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, FileText, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for the form (matches PitchTemplateCreate/Update from backend)
const pitchTemplateFormSchema = z.object({
  template_id: z.string().min(3, "Template ID must be at least 3 characters (e.g., friendly-v1)"),
  media_type: z.string().optional().nullable(),
  target_media_type: z.string().optional().nullable(),
  language_code: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  prompt_body: z.string().min(50, "Prompt body must be at least 50 characters."),
  // created_by will be set by backend based on logged-in user
});
type PitchTemplateFormData = z.infer<typeof pitchTemplateFormSchema>;

export interface PitchTemplate extends PitchTemplateFormData { // Exporting for use in PitchOutreach
  created_at?: string; // Comes from PitchTemplateInDB
}

function PitchTemplateForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  isEditMode = false,
}: {
  initialData?: PitchTemplate | null;
  onSubmit: (data: PitchTemplateFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  isEditMode?: boolean;
}) {
  const form = useForm<PitchTemplateFormData>({
    resolver: zodResolver(pitchTemplateFormSchema),
    defaultValues: initialData || {
      template_id: "",
      prompt_body: "",
      media_type: "",
      target_media_type: "",
      language_code: "en",
      tone: "professional",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({ // Default for new
        template_id: "", prompt_body: "", media_type: "", target_media_type: "", language_code: "en", tone: "professional",
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="template_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template ID *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., friendly-short-v1" {...field} disabled={isEditMode} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt_body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Body (with placeholders like {'{{podcast_name}}'}, {'{{client_name}}'}) *</FormLabel>
              <FormControl>
                <Textarea placeholder="Dear {host_name},nI loved your episode on {episode_title}..." {...field} rows={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add other fields like tone, media_type as dropdowns or inputs if needed */}
        {/* For simplicity, including tone as a text input for now. Could be Select. */}
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone (e.g., friendly, formal, data-driven)</FormLabel>
              <FormControl>
                <Input placeholder="professional" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="media_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Type (Optional, e.g. Podcast, Blog)</FormLabel>
              <FormControl>
                <Input placeholder="Podcast" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_media_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Media Type (Optional, e.g. Podcast, Newsletter)</FormLabel>
              <FormControl>
                <Input placeholder="Podcast" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language Code (e.g., en, es)</FormLabel>
              <FormControl>
                <Input placeholder="en" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/80">
            {isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Create Template")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function PitchTemplatesPage() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PitchTemplate | null>(null);

  const { data: templates = [], isLoading, error } = useQuery<PitchTemplate[]>({
    queryKey: ["/pitch-templates/"],
    queryFn: async () => {
        const response = await apiRequest("GET", "/pitch-templates/");
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to fetch pitch templates" }));
            throw new Error(errorData.detail);
        }
        return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: PitchTemplateFormData) => {
        const response = await apiRequest("POST", "/pitch-templates/", data);
        if (!response.ok) { const err = await response.json().catch(() => ({detail: "Failed to create template."})); throw new Error(err.detail); }
        return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pitch template created." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/pitch-templates/"] });
      setIsFormOpen(false); setEditingTemplate(null);
    },
    onError: (err: any) => toast({ title: "Error Creating Template", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PitchTemplateFormData }) => {
      const response = await apiRequest("PUT", `/pitch-templates/${id}`, data);
      if (!response.ok) { const err = await response.json().catch(() => ({detail: "Failed to update template."})); throw new Error(err.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pitch template updated." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/pitch-templates/"] });
      setIsFormOpen(false); setEditingTemplate(null);
    },
    onError: (err: any) => toast({ title: "Error Updating Template", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/pitch-templates/${id}`);
      // DELETE often returns 204 No Content on success, which means .json() will fail.
      // Check for ok status and specific no content status if applicable.
      if (!response.ok) { 
          const err = await response.json().catch(()=>({detail: "Failed to delete template."})); 
          throw new Error(err.detail); 
      }
      return response; // Or handle 204 specifically
    },
    onSuccess: (response) => {
      // if (response.status === 204) {
      //   toast({ title: "Success", description: "Pitch template deleted." });
      // } else { // Assuming other success statuses might return JSON
      //   toast({ title: "Success", description: "Pitch template deleted." }); // Simplified
      // }
      toast({ title: "Success", description: "Pitch template deleted." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/pitch-templates/"] });
    },
    onError: (err: any) => toast({ title: "Error Deleting Template", description: err.message, variant: "destructive" }),
  });

  const handleFormSubmit = (data: PitchTemplateFormData) => {
    if (editingTemplate && editingTemplate.template_id) {
      updateMutation.mutate({ id: editingTemplate.template_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-10 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <div className="p-6 text-red-500">Error loading pitch templates: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="mr-3 h-6 w-6 text-primary" /> Pitch Templates
        </h1>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingTemplate(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Plus className="mr-2 h-4 w-4" /> Create New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Pitch Template" : "Create New Pitch Template"}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? `Modify the template '${editingTemplate.template_id}'.` : "Define a new reusable pitch template."}
              </DialogDescription>
            </DialogHeader>
            <PitchTemplateForm
              initialData={editingTemplate}
              onSubmit={handleFormSubmit}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              onCancel={() => { setIsFormOpen(false); setEditingTemplate(null); }}
              isEditMode={!!editingTemplate}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>Manage your pitch email templates here. Click on a row to edit or use actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Template ID</TableHead>
                  <TableHead>Tone</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Target Media</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="min-w-[300px]">Prompt Snippet</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    No pitch templates created yet.
                    </TableCell></TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.template_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditingTemplate(template); setIsFormOpen(true); }}>
                      <TableCell className="font-medium">{template.template_id}</TableCell>
                      <TableCell>{template.tone || "N/A"}</TableCell>
                      <TableCell>{template.media_type || "Any"}</TableCell>
                      <TableCell>{template.target_media_type || "Any"}</TableCell>
                      <TableCell>{template.language_code || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate" title={template.prompt_body}>
                        {template.prompt_body.substring(0, 80)}{template.prompt_body.length > 80 ? "..." : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); setIsFormOpen(true); }} className="mr-1 h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} disabled={deleteMutation.isPending && deleteMutation.variables === template.template_id} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete the template "{template.template_id}"? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button variant="destructive" onClick={() => handleDelete(template.template_id)} disabled={deleteMutation.isPending && deleteMutation.variables === template.template_id}>
                                        {deleteMutation.isPending && deleteMutation.variables === template.template_id ? "Deleting..." : "Delete"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
       <Card className="bg-blue-50 border-blue-200 mt-4">
        <CardHeader><CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>Using Placeholders in Prompt Body</CardTitle></CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-1">
            <p>In your "Prompt Body", you can use placeholders that will be dynamically filled with data from the client's campaign and the target media. Examples:</p>
            <ul className="list-disc list-inside pl-4 space-y-0.5">
                <li><code>{`{{podcast_name}}`}</code> - Name of the podcast/media.</li>
                <li><code>{`{{host_name}}`}</code> - Podcast host's name (if available).</li>
                <li><code>{`{{episode_title}}`}</code> - Title of a relevant episode (if applicable).</li>
                <li><code>{`{{episode_summary}}`}</code> - Short summary of a relevant episode.</li>
                <li><code>{`{{ai_summary_of_best_episode}}`}</code> - AI-generated summary of a relevant episode.</li>
                <li><code>{`{{client_name}}`}</code> - Your client's full name.</li>
                <li><code>{`{{client_bio_summary}}`}</code> - A summary of your client's bio (from campaign).</li>
                <li><code>{`{{client_key_talking_point_1}}`}</code>, <code>{`{{client_key_talking_point_2}}`}</code>, etc. - Key talking points.</li>
                <li><code>{`{{link_to_client_media_kit}}`}</code> - Public URL to the client's media kit.</li>
                <li><code>{`{{campaign_goal}}`}</code> - The primary goal of the client's campaign.</li>
                <li><code>{`{{specific_pitch_angle}}`}</code> - A specific angle tailored for this outreach (can be auto-suggested).</li>
                <li><code>{`{{latest_news_from_podcast}}`}</code> - Recent updates or news about the podcast.</li>
            </ul>
            <p className="mt-2">The system will attempt to replace these with actual data before sending the prompt to the AI for final pitch generation. Ensure your placeholders match what the backend expects.</p>
        </CardContent>
      </Card>
    </div>
  );
}
