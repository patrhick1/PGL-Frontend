// client/src/pages/PitchOutreach.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Edit3, Check, X, ListChecks, MailCheck, MailOpen, RefreshCw, ExternalLink, Eye, MessageSquare, Filter, Search, Lightbulb, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

// --- Interfaces (ensure these match backend schemas) ---

interface ReviewTask {
  review_task_id: number;
  task_type: string;
  related_id: number;
  campaign_id: string;
  status: string;
}

interface PitchGenerationDetails {
    pitch_gen_id: number;
    draft_text: string;
    pitch_topic?: string | null;
    media_id: number;
    campaign_id: string;
}

interface CampaignDetails {
    campaign_id: string;
    campaign_name: string;
    person_id: number;
}

interface PersonDetails {
    person_id: number;
    full_name: string | null;
}

interface MediaDetails {
    media_id: number;
    name: string | null;
    website?: string | null;
}

interface PitchDraftForReview {
  review_task_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  draft_text: string;
  subject_line?: string | null;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null;
}

const editDraftSchema = z.object({
  subject_line: z.string().min(1, "Subject line is required."),
  draft_text: z.string().min(50, "Draft text must be at least 50 characters."),
});
type EditDraftFormData = z.infer<typeof editDraftSchema>;

interface ApprovedMatchForPitching {
  match_id: number;
  campaign_id: string;
  media_id: number;
  status: string;
  media_name?: string | null;
  media_website?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

interface PitchReadyToSend {
  pitch_gen_id: number;
  pitch_id: number;
  campaign_id: string;
  media_id: number;
  final_text?: string | null;
  subject_line?: string | null;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

interface SentPitchStatus {
  pitch_id: number;
  media_id: number;
  campaign_id: string;
  pitch_state?: string | null;
  send_ts?: string | null;
  reply_ts?: string | null;
  instantly_lead_id?: string | null;
  subject_line?: string | null;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

const pitchTemplateOptions = [
    { value: "friendly_intro_template", label: "Friendly Introduction" },
];

function ReadyForDraftTab({
    approvedMatches,
    onGenerate,
    isLoadingGenerate,
    selectedTemplate,
    onTemplateChange,
    isLoadingMatches
}: {
    approvedMatches: ApprovedMatchForPitching[];
    onGenerate: (matchId: number, templateName: string) => void;
    isLoadingGenerate: boolean;
    selectedTemplate: string;
    onTemplateChange: (template: string) => void;
    isLoadingMatches: boolean;
}) {
    if (isLoadingMatches) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2 mb-4" />
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!approvedMatches || approvedMatches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No matches currently approved and awaiting pitch drafts.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="pitch-template-select" className="text-sm font-medium block mb-2 text-gray-700">
                    Select Pitch Template:
                </label>
                <Select value={selectedTemplate} onValueChange={onTemplateChange}>
                  <SelectTrigger id="pitch-template-select" className="w-full md:w-1/2 lg:w-1/3">
                    <SelectValue placeholder="Select pitch template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pitchTemplateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {approvedMatches.map((match) => (
                    <Card key={match.match_id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div className="mb-3 sm:mb-0 flex-1">
                                <h4 className="font-semibold text-gray-800">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                                <p className="text-xs text-gray-500">
                                    For Campaign: {match.campaign_name || `ID: ${match.campaign_id.substring(0,8)}...`}
                                    {match.client_name && ` (Client: ${match.client_name})`}
                                </p>
                                {match.media_website && (
                                    <a href={match.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">
                                        <ExternalLink className="h-3 w-3 mr-1"/> Visit Podcast
                                    </a>
                                )}
                            </div>
                            <Button
                                size="sm"
                                onClick={() => onGenerate(match.match_id, selectedTemplate)}
                                disabled={isLoadingGenerate}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                            >
                                {isLoadingGenerate ? <RefreshCw className="h-4 w-4 animate-spin mr-1"/> : <Lightbulb className="h-4 w-4 mr-1"/>}
                                Generate Pitch Draft
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function EditDraftModal({ draft, open, onOpenChange, onSave, isSaving }: {
    draft: PitchDraftForReview | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (pitchGenId: number, data: EditDraftFormData) => void;
    isSaving: boolean;
}) {
    const form = useForm<EditDraftFormData>({
        resolver: zodResolver(editDraftSchema),
        defaultValues: { subject_line: "", draft_text: "" },
    });

    useEffect(() => {
        if (draft) {
            form.reset({
                subject_line: draft.subject_line || "",
                draft_text: draft.draft_text || "",
            });
        }
    }, [draft, form, open]);

    if (!draft) return null;

    const onSubmit = (data: EditDraftFormData) => {
        onSave(draft.pitch_gen_id, data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Pitch Draft for {draft.media_name || 'Podcast'}</DialogTitle>
                    <DialogDescription>Review and edit the subject line and draft text before approval.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="subject_line" render={({ field }) => (<FormItem><FormLabel>Subject Line</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="draft_text" render={({ field }) => (<FormItem><FormLabel>Draft Text</FormLabel><FormControl><Textarea {...field} className="min-h-[200px] max-h-[40vh] overflow-y-auto" /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DraftsReviewTab({ drafts, onApprove, onEdit, isLoadingApprove, isLoadingDrafts }: {
    drafts: PitchDraftForReview[];
    onApprove: (pitchGenId: number) => void;
    onEdit: (draft: PitchDraftForReview) => void;
    isLoadingApprove: boolean;
    isLoadingDrafts: boolean;
}) {
    if (isLoadingDrafts) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!drafts || drafts.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitch drafts currently pending review.</div>;
    }

    return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {drafts.map((draft) => (
                <Card key={draft.review_task_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-1 mb-3 sm:mb-0">
                            <h4 className="font-semibold text-gray-800">{draft.media_name || `Media ID: ${draft.media_id}`}</h4>
                            <p className="text-xs text-gray-500">Campaign: {draft.campaign_name || 'N/A'} (Client: {draft.client_name || 'N/A'})</p>
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Subject: {draft.subject_line || "Not set"}</p>
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Preview: {draft.draft_text?.substring(0, 100) || "No preview."}...</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                            <Button size="sm" variant="outline" onClick={() => onEdit(draft)}><Edit3 className="h-3 w-3 mr-1.5"/> Review/Edit</Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(draft.pitch_gen_id)} disabled={isLoadingApprove}><Check className="h-4 w-4 mr-1.5"/>{isLoadingApprove ? "Approving..." : "Approve Pitch"}</Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

export default function PitchOutreach() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [, navigate] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  
  const [selectedPitchTemplate, setSelectedPitchTemplate] = useState<string>(pitchTemplateOptions[0].value);
  const [activeTab, setActiveTab] = useState<string>("readyForDraft");
  const [reviewDraftsPage, setReviewDraftsPage] = useState(1);

  const [editingDraft, setEditingDraft] = useState<PitchDraftForReview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: approvedMatchesData, isLoading: isLoadingApprovedMatches, error: approvedMatchesError } = useQuery<ApprovedMatchForPitching[]>({
    queryKey: ["approvedMatchesForPitching"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/match-suggestions/?status=approved`);
      if (!response.ok) throw new Error("Failed to fetch approved matches");
      const matches: ApprovedMatchForPitching[] = await response.json();
      return Promise.all(matches.map(async (match) => {
        if (!match.media_name && match.media_id) {
            try { const mediaRes = await apiRequest("GET", `/media/${match.media_id}`); if (mediaRes.ok) { const d = await mediaRes.json(); match.media_name = d.name; match.media_website = d.website; }} catch (e) { console.warn(`Failed to fetch media for ${match.media_id}`); }
        }
        if (!match.campaign_name && match.campaign_id) {
            try { const campRes = await apiRequest("GET", `/campaigns/${match.campaign_id}`); if (campRes.ok) { const campData = await campRes.json(); match.campaign_name = campData.campaign_name; if (campData.person_id && !match.client_name) { const personRes = await apiRequest("GET", `/people/${campData.person_id}`); if (personRes.ok) match.client_name = (await personRes.json()).full_name;}}} catch (e) { console.warn(`Failed to fetch campaign/client for ${match.campaign_id}`); }
        }
        return match;
      }));
    },
    staleTime: 1000 * 60 * 2,
  });
  const approvedMatches = approvedMatchesData || [];

  const { data: reviewTasksData, isLoading: isLoadingPitchDrafts, error: reviewDraftsError } = useQuery<{
    items: PitchDraftForReview[];
    total: number;
    page: number;
    size: number;
    pages: number;
  } >({
    queryKey: ["pitchDraftsForReview", reviewDraftsPage],
    queryFn: async ({ queryKey }) => {
      const [, page] = queryKey as [string, number];
      const response = await apiRequest("GET", `/review-tasks/?task_type=pitch_review&status=pending&page=${page}&size=10`);
      if (!response.ok) throw new Error("Failed to fetch pitch drafts for review");
      const tasksResponse = await response.json();
      
      const enrichedItems: PitchDraftForReview[] = await Promise.all(tasksResponse.items.map(async (task: ReviewTask) => {
        let pitchGenDetails: PitchGenerationDetails | null = null;
        let campaignDetails: CampaignDetails | null = null;
        let clientDetails: PersonDetails | null = null;
        let mediaDetails: MediaDetails | null = null;

        try {
          const pgRes = await apiRequest("GET", `/pitches/generations/${task.related_id}`);
          if (pgRes.ok) pitchGenDetails = await pgRes.json();
        } catch (e) { console.warn(`Failed to fetch pitch gen ${task.related_id}`, e); }

        if (pitchGenDetails) {
          try {
            const campRes = await apiRequest("GET", `/campaigns/${pitchGenDetails.campaign_id}`);
            if (campRes.ok) campaignDetails = await campRes.json();
          } catch (e) { console.warn(`Failed to fetch campaign ${pitchGenDetails.campaign_id}`, e); }

          if (campaignDetails) {
            try {
              const personRes = await apiRequest("GET", `/people/${campaignDetails.person_id}`);
              if (personRes.ok) clientDetails = await personRes.json();
            } catch (e) { console.warn(`Failed to fetch person ${campaignDetails.person_id}`, e); }
          }
          try {
            const mediaRes = await apiRequest("GET", `/media/${pitchGenDetails.media_id}`);
            if (mediaRes.ok) mediaDetails = await mediaRes.json();
          } catch (e) { console.warn(`Failed to fetch media ${pitchGenDetails.media_id}`, e); }
        }
        
        return {
          review_task_id: task.review_task_id,
          pitch_gen_id: task.related_id,
          campaign_id: pitchGenDetails?.campaign_id || task.campaign_id,
          media_id: pitchGenDetails?.media_id || 0,
          draft_text: pitchGenDetails?.draft_text || "Error fetching draft text.",
          subject_line: pitchGenDetails?.pitch_topic || "Error fetching subject.",
          media_name: mediaDetails?.name,
          media_website: mediaDetails?.website,
          campaign_name: campaignDetails?.campaign_name,
          client_name: clientDetails?.full_name,
        };
      }));
      return { ...tasksResponse, items: enrichedItems };
    },
    staleTime: 1000 * 60 * 1,
  });
  const pitchDraftsForReview = reviewTasksData?.items || [];
  const reviewDraftsTotalPages = reviewTasksData?.pages || 1;

  const pitchesReadyToSend: PitchReadyToSend[] = [];
  const sentPitches: SentPitchStatus[] = [];
  const isLoadingReadyToSend = false;
  const isLoadingSentPitches = false;

  const generatePitchDraftMutation = useMutation({
    mutationFn: async ({ matchId, templateName }: { matchId: number; templateName: string }) => {
      const response = await apiRequest("POST", "/pitches/generate", { match_id: matchId, pitch_template_name: templateName });
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to generate pitch draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Pitch Draft Generated", description: data.message || "Draft created and is ready for review." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      setActiveTab("draftsReview");
    },
    onError: (error: any) => { toast({ title: "Generation Failed", description: error.message, variant: "destructive" }); },
  });

  const approvePitchDraftMutation = useMutation({
    mutationFn: async (pitchGenId: number) => {
      const response = await apiRequest("PATCH", `/pitches/generations/${pitchGenId}/approve`, {});
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to approve draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Pitch Approved", description: "Pitch draft approved and moved to 'Ready to Send'." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
      setActiveTab("readyToSend");
    },
    onError: (error: any) => { toast({ title: "Approval Failed", description: error.message, variant: "destructive" }); },
  });
  
  const updatePitchDraftMutation = useMutation({
    mutationFn: async ({ pitchGenId, data }: { pitchGenId: number; data: EditDraftFormData }) => {
      const payload = {
        draft_text: data.draft_text,
        pitch_topic: data.subject_line,
      };
      const response = await apiRequest("PUT", `/pitches/generations/${pitchGenId}`, payload);
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to update draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Draft Updated", description: "Pitch draft has been saved." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      setIsEditModalOpen(false);
      setEditingDraft(null);
    },
    onError: (error: any) => { toast({ title: "Update Failed", description: error.message, variant: "destructive" }); },
  });

  const handleGeneratePitch = (matchId: number, templateName: string) => {
    if (!templateName) { toast({ title: "Template Required", description: "Please select a pitch template.", variant: "destructive"}); return; }
    generatePitchDraftMutation.mutate({ matchId, templateName });
  };

  const handleOpenEditModal = (draft: PitchDraftForReview) => {
    setEditingDraft(draft);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedDraft = (pitchGenId: number, data: EditDraftFormData) => {
    updatePitchDraftMutation.mutate({ pitchGenId, data });
  };
  
  const handleApprovePitch = (pitchGenId: number) => {
    approvePitchDraftMutation.mutate(pitchGenId);
  };

  const handleReviewDraftsNextPage = () => {
    if (reviewDraftsPage < (reviewDraftsTotalPages || 1)) {
      setReviewDraftsPage(prev => prev + 1);
    }
  };
  const handleReviewDraftsPrevPage = () => {
    if (reviewDraftsPage > 1) {
      setReviewDraftsPage(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Send className="mr-3 h-6 w-6 text-primary" />
                Pitch Outreach & Management
            </h1>
            <p className="text-gray-600">Oversee the entire pitch lifecycle from drafting to sending and tracking.</p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="readyForDraft"><Lightbulb className="mr-1.5 h-4 w-4"/>Ready for Draft ({isLoadingApprovedMatches ? '...' : approvedMatches.length})</TabsTrigger>
          <TabsTrigger value="draftsReview"><Edit3 className="mr-1.5 h-4 w-4"/>Review Drafts ({isLoadingPitchDrafts ? '...' : reviewTasksData?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="readyToSend"><MailCheck className="mr-1.5 h-4 w-4"/>Ready to Send ({isLoadingReadyToSend ? '...' : pitchesReadyToSend.length})</TabsTrigger>
          <TabsTrigger value="sentPitches"><MailOpen className="mr-1.5 h-4 w-4"/>Sent Pitches ({isLoadingSentPitches ? '...' : sentPitches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="readyForDraft" className="mt-6">
          <ReadyForDraftTab
            approvedMatches={approvedMatches}
            onGenerate={handleGeneratePitch}
            isLoadingGenerate={generatePitchDraftMutation.isPending}
            selectedTemplate={selectedPitchTemplate}
            onTemplateChange={setSelectedPitchTemplate}
            isLoadingMatches={isLoadingApprovedMatches}
          />
          {approvedMatchesError && <p className="text-red-500 mt-2">Error loading approved matches: {(approvedMatchesError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="draftsReview" className="mt-6">
          <DraftsReviewTab
            drafts={pitchDraftsForReview}
            onApprove={handleApprovePitch}
            onEdit={handleOpenEditModal}
            isLoadingApprove={approvePitchDraftMutation.isPending}
            isLoadingDrafts={isLoadingPitchDrafts}
          />
          {reviewDraftsError && <p className="text-red-500 mt-2">Error loading drafts for review: {(reviewDraftsError as Error).message}</p>}
          {reviewTasksData && reviewTasksData.pages > 1 && (
            <div className="mt-4 flex justify-center items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleReviewDraftsPrevPage} disabled={reviewDraftsPage <= 1}>Previous</Button>
              <span className="text-sm text-gray-600">Page {reviewDraftsPage} of {reviewTasksData.pages}</span>
              <Button variant="outline" size="sm" onClick={handleReviewDraftsNextPage} disabled={reviewDraftsPage >= reviewTasksData.pages}>Next</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="readyToSend" className="mt-6">
           <Card><CardHeader><CardTitle>Approved & Ready to Send</CardTitle></CardHeader><CardContent><p className="text-center py-4 text-gray-500">UI for sending approved pitches to be implemented.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="sentPitches" className="mt-6">
           <Card><CardHeader><CardTitle>Sent Pitch Status</CardTitle></CardHeader><CardContent><p className="text-center py-4 text-gray-500">UI for tracking sent pitches to be implemented.</p></CardContent></Card>
        </TabsContent>
      </Tabs>
      <EditDraftModal draft={editingDraft} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSave={handleSaveEditedDraft} isSaving={updatePitchDraftMutation.isPending} />
    </div>
  );
}