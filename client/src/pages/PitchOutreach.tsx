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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // Removed DialogTrigger, DialogClose as they are used within specific components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Edit3, Check, X, ListChecks, MailCheck, MailOpen, RefreshCw, ExternalLink, Eye, MessageSquare, Filter, Search, Lightbulb, Info, Save, LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PitchTemplate } from "@/pages/PitchTemplates.tsx"; // Added .tsx extension

// --- Interfaces (Aligned with expected enriched backend responses) ---

interface ApprovedMatchForPitching { // From GET /match-suggestions/?status=approved (enriched)
  match_id: number;
  campaign_id: string;
  media_id: number;
  status: string;
  media_name?: string | null;
  media_website?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

interface EpisodeAnalysisData { // Define placeholder for expected data structure
  episode_id?: number;
  title?: string | null;
  ai_episode_summary?: string | null;
  episode_themes?: string[] | null;
  episode_keywords?: string[] | null;
  transcript_available?: boolean;
  ai_analysis_done?: boolean;
  // Potentially a link to the episode or transcript viewer
}

interface PitchDraftForReview { // From GET /review-tasks/?task_type=pitch_review&status=pending (enriched)
  review_task_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  draft_text: string;
  subject_line?: string | null; // From associated pitches record
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null; // Added for context
  relevant_episode_analysis?: EpisodeAnalysisData | null; // NEW - To be populated by backend
}

interface PitchReadyToSend { // From GET /pitches/?pitch_state=ready_to_send (enriched)
  pitch_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  final_text?: string | null; // From pitch_generations
  draft_text?: string | null; // Fallback from pitch_generations
  subject_line?: string | null; // From pitches table
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null; // Added for context
}

interface SentPitchStatus { // From GET /pitches/?pitch_state__in=... (enriched)
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
  media_website?: string | null; // Added for context
}

// const pitchTemplateOptions = [ // REMOVE THIS
//     { value: "friendly_intro_template", label: "Friendly Introduction" },
//     // Add more templates as they are created in the backend
// ];

const editDraftSchema = z.object({
  subject_line: z.string().min(1, "Subject line is required."),
  draft_text: z.string().min(50, "Draft text must be at least 50 characters."),
});
type EditDraftFormData = z.infer<typeof editDraftSchema>;


// --- Tab Components ---

function ReadyForDraftTab({
    approvedMatches, onGenerate, isLoadingGenerateForMatchId, templates, isLoadingMatches
}: {
    approvedMatches: ApprovedMatchForPitching[];
    onGenerate: (matchId: number, templateId: string) => void;
    isLoadingGenerateForMatchId: number | null;
    templates: PitchTemplate[];
    isLoadingMatches: boolean;
}) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    useEffect(() => {
        if (templates && templates.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(templates[0].template_id);
        }
    }, [templates, selectedTemplateId]);

    if (isLoadingMatches) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3 mb-4" />
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!approvedMatches || approvedMatches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No matches currently approved and awaiting pitch drafts.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="pitch-template-select" className="text-sm font-medium block mb-2 text-gray-700">Select Pitch Template:</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={!templates || templates.length === 0}>
                  <SelectTrigger id="pitch-template-select" className="w-full md:w-1/2 lg:w-1/3">
                      <SelectValue placeholder="Select pitch template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(!templates || templates.length === 0) && <SelectItem value="" disabled>No templates available. Create one in Pitch Templates.</SelectItem>}
                    {templates && templates.map(opt => <SelectItem key={opt.template_id} value={opt.template_id}>{opt.template_id} (Tone: {opt.tone || 'N/A'})</SelectItem>)}
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
                                onClick={() => onGenerate(match.match_id, selectedTemplateId)}
                                disabled={isLoadingGenerateForMatchId === match.match_id || !selectedTemplateId || !templates || templates.length === 0}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                            >
                                {isLoadingGenerateForMatchId === match.match_id ? <RefreshCw className="h-4 w-4 animate-spin mr-1"/> : <Lightbulb className="h-4 w-4 mr-1"/>}
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
        if (draft && open) {
            form.reset({
                subject_line: draft.subject_line || "",
                draft_text: draft.draft_text || "",
            });
        }
    }, [draft, form, open]);

    const onSubmit = (data: EditDraftFormData) => {
        if (draft) { // Ensure draft is not null
            onSave(draft.pitch_gen_id, data);
        }
    };

    if (!draft) return null; // Add null check for draft

    // Placeholder for displaying relevant episode analysis
    const episodeAnalysis = draft.relevant_episode_analysis;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Pitch Draft for: {draft.media_name}</DialogTitle>
                    <DialogDescription>
                        Campaign: {draft.campaign_name} | Client: {draft.client_name}
                        {draft.media_website && 
                            <a href={draft.media_website} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline text-sm inline-flex items-center">
                                <LinkIcon className="h-3 w-3 mr-1" /> Website
                            </a>
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {/* --- Relevant Episode Analysis Display (Placeholder) --- START */}
                {episodeAnalysis && (
                    <Card className="my-4 bg-slate-50 p-3">
                        <CardHeader className="p-2">
                            <CardTitle className="text-base flex items-center">
                                <Info className="h-4 w-4 mr-2 text-blue-600" /> Relevant Episode Insights: {episodeAnalysis.title || 'Episode Info'}
                                {episodeAnalysis.ai_analysis_done && <Badge variant="secondary" className="ml-2 text-xs">Analyzed</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs p-2 space-y-1">
                            {episodeAnalysis.ai_episode_summary && 
                                <p><span className="font-semibold">Summary:</span> {episodeAnalysis.ai_episode_summary}</p>}
                            {episodeAnalysis.episode_themes && episodeAnalysis.episode_themes.length > 0 && 
                                <div><span className="font-semibold">Themes:</span> {episodeAnalysis.episode_themes.map(t => <Badge key={t} variant="outline" className="mr-1 text-xs">{t}</Badge>)}</div>}
                            {episodeAnalysis.episode_keywords && episodeAnalysis.episode_keywords.length > 0 && 
                                <div><span className="font-semibold">Keywords:</span> {episodeAnalysis.episode_keywords.map(k => <Badge key={k} variant="outline" className="mr-1 text-xs">{k}</Badge>)}</div>}
                            {episodeAnalysis.transcript_available === false && <p className="text-orange-600">Transcript not yet available.</p>}
                        </CardContent>
                    </Card>
                )}
                {/* --- Relevant Episode Analysis Display (Placeholder) --- END */}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField control={form.control} name="subject_line" render={({ field }) => (<FormItem><FormLabel>Subject Line</FormLabel><FormControl><Input placeholder="Enter pitch subject line" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="draft_text" render={({ field }) => (<FormItem><FormLabel>Pitch Body</FormLabel><FormControl><Textarea placeholder="Enter pitch body..." className="min-h-[200px] max-h-[35vh] overflow-y-auto text-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground">{isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4"/>Save Changes</>}</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DraftsReviewTab({
    drafts, onApprove, onEdit, isLoadingApproveForPitchGenId, isLoadingDrafts,
    currentPage, totalPages, onPageChange
}: {
    drafts: PitchDraftForReview[];
    onApprove: (pitchGenId: number) => void;
    onEdit: (draft: PitchDraftForReview) => void;
    isLoadingApproveForPitchGenId: number | null;
    isLoadingDrafts: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (isLoadingDrafts && !drafts.length) { // Show skeleton only on initial load
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!drafts || drafts.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitch drafts currently pending review.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {drafts.map((draft) => (
                    <Card key={draft.review_task_id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                            <div className="flex-1 mb-3 sm:mb-0">
                                <h4 className="font-semibold text-gray-800">{draft.media_name || `Media ID: ${draft.media_id}`}</h4>
                                <p className="text-xs text-gray-500">Campaign: {draft.campaign_name || 'N/A'} (Client: {draft.client_name || 'N/A'})</p>
                                <p className="text-xs text-gray-600 mt-1 italic">Subject: {draft.subject_line || "Not set"}</p>
                                <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Preview: {draft.draft_text?.substring(0, 100) || "No preview."}...</p>
                                {draft.media_website && (
                                    <a href={draft.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">
                                        <ExternalLink className="h-3 w-3 mr-1"/> Visit Podcast
                                    </a>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                                <Button size="sm" variant="outline" onClick={() => onEdit(draft)}><Edit3 className="h-3 w-3 mr-1.5"/> Review/Edit</Button>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => onApprove(draft.pitch_gen_id)}
                                    disabled={isLoadingApproveForPitchGenId === draft.pitch_gen_id}
                                >
                                    {isLoadingApproveForPitchGenId === draft.pitch_gen_id ? <RefreshCw className="h-4 w-4 animate-spin mr-1"/> : <Check className="h-4 w-4 mr-1.5"/>}
                                    Approve Pitch
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || isLoadingDrafts}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoadingDrafts}>Next</Button>
                </div>
            )}
        </div>
    );
}

function ReadyToSendTab({
    pitches, onSend, isLoadingSendForPitchId, isLoadingPitches
}: {
    pitches: PitchReadyToSend[];
    onSend: (pitchId: number) => void;
    isLoadingSendForPitchId: number | null;
    isLoadingPitches: boolean;
}) {
    if (isLoadingPitches) {
        return <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>;
    }
    if (!pitches || pitches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitches currently approved and ready to send.</div>;
    }
    return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {pitches.map((pitch) => (
                <Card key={pitch.pitch_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-1 mb-3 sm:mb-0">
                            <h4 className="font-semibold text-gray-800">{pitch.media_name || `Media ID: ${pitch.media_id}`}</h4>
                            <p className="text-xs text-gray-500">Campaign: {pitch.campaign_name || 'N/A'} (Client: {pitch.client_name || 'N/A'})</p>
                            <p className="text-xs text-gray-600 mt-1 italic">Subject: {pitch.subject_line || "Not set"}</p>
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                                Preview: {(pitch.final_text || pitch.draft_text || "No content").substring(0,100) + "..."}
                            </p>
                             {pitch.media_website && (
                                <a href={pitch.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">
                                    <ExternalLink className="h-3 w-3 mr-1"/> Visit Podcast
                                </a>
                            )}
                        </div>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white mt-2 sm:mt-0 w-full sm:w-auto"
                            onClick={() => onSend(pitch.pitch_id)}
                            disabled={isLoadingSendForPitchId === pitch.pitch_id}
                        >
                            {isLoadingSendForPitchId === pitch.pitch_id ? <RefreshCw className="h-4 w-4 animate-spin mr-1"/> : <Send className="h-4 w-4 mr-1.5"/>}
                            Send Pitch
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function SentPitchesTab({ pitches, isLoadingPitches }: { pitches: SentPitchStatus[]; isLoadingPitches: boolean; }) {
     if (isLoadingPitches) {
        return <div className="border rounded-lg"><Skeleton className="h-48 w-full" /></div>;
    }
    if (!pitches || pitches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitches have been sent yet.</div>;
    }
    return (
        <div className="border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead>Podcast</TableHead>
                        <TableHead>Campaign (Client)</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Replied At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pitches.map((pitch) => (
                        <TableRow key={pitch.pitch_id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">
                                {pitch.media_name || `Media ID: ${pitch.media_id}`}
                                {pitch.media_website && (
                                    <a href={pitch.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-1">
                                        <ExternalLink className="inline h-3 w-3"/>
                                    </a>
                                )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">{pitch.campaign_name || 'N/A'} ({pitch.client_name || 'N/A'})</TableCell>
                            <TableCell className="text-xs text-gray-600 italic">{pitch.subject_line || "N/A"}</TableCell>
                            <TableCell><Badge variant={pitch.pitch_state === 'replied' || pitch.pitch_state === 'replied_interested' ? 'default' : 'secondary'} className="capitalize text-xs">{pitch.pitch_state?.replace('_', ' ') || "N/A"}</Badge></TableCell>
                            <TableCell className="text-xs text-gray-500">{pitch.send_ts ? new Date(pitch.send_ts).toLocaleString() : "-"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{pitch.reply_ts ? new Date(pitch.reply_ts).toLocaleString() : "-"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// --- Main PitchOutreach Component ---
export default function PitchOutreach() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [, navigate] = useLocation(); // Keep for potential future use
  const queryParams = new URLSearchParams(window.location.search);
  const initialCampaignIdFilter = queryParams.get("campaignId"); // Example: ?campaignId=some-uuid

  const [activeTab, setActiveTab] = useState<string>("readyForDraft");
  const [editingDraft, setEditingDraft] = useState<PitchDraftForReview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Per-item loading states
  const [isLoadingGenerateForMatchId, setIsLoadingGenerateForMatchId] = useState<number | null>(null);
  const [isLoadingApproveForPitchGenId, setIsLoadingApproveForPitchGenId] = useState<number | null>(null);
  const [isLoadingSendForPitchId, setIsLoadingSendForPitchId] = useState<number | null>(null);

  // State for pagination for "Review Drafts" tab
  const [reviewDraftsPage, setReviewDraftsPage] = useState(1);
  const REVIEW_DRAFTS_PAGE_SIZE = 10;

  // Fetch pitch templates for the dropdown
  const { data: pitchTemplates = [], isLoading: isLoadingTemplates, error: templatesError } = useQuery<PitchTemplate[]>({
    queryKey: ["/pitch-templates/"],
    queryFn: async () => {
        const response = await apiRequest("GET", "/pitch-templates/");
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to fetch pitch templates" }));
            throw new Error(errorData.detail);
        }
        return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // --- Data Fetching with React Query ---

  // 1. Fetch Approved Matches (for "Ready for Draft" tab)
  const { data: approvedMatchesData, isLoading: isLoadingApprovedMatches, error: approvedMatchesError } = useQuery<ApprovedMatchForPitching[]>({
    queryKey: ["approvedMatchesForPitching", initialCampaignIdFilter], // Add filter to key if used
    queryFn: async ({ queryKey }) => {
      const [, campaignId] = queryKey as [string, string | null];
      let url = `/match-suggestions/?status=approved`;
      if (campaignId) url += `&campaign_id=${campaignId}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch approved matches");
      // Assuming backend /match-suggestions/ (with get_all_match_suggestions_enriched) returns enriched data
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });
  const approvedMatches = approvedMatchesData || [];

  // 2. Fetch Pitch Drafts for Review (paginated)
  const { data: reviewTasksPageData, isLoading: isLoadingPitchDrafts, error: reviewDraftsError } = useQuery<{
    items: PitchDraftForReview[]; total: number; page: number; size: number; pages?: number; // pages might not be returned by all backends
  }>({
    queryKey: ["pitchDraftsForReview", reviewDraftsPage, initialCampaignIdFilter],
    queryFn: async ({ queryKey }) => {
      const [, page, campaignId] = queryKey as [string, number, string | null];
      let url = `/review-tasks/?task_type=pitch_review&status=pending&page=${page}&size=${REVIEW_DRAFTS_PAGE_SIZE}`;
      if (campaignId) url += `&campaign_id=${campaignId}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch pitch drafts for review");
      // Assuming backend /review-tasks/ returns enriched data as PitchDraftForReview
      return response.json();
    },
    staleTime: 1000 * 60 * 1,
  });
  const pitchDraftsForReview = reviewTasksPageData?.items || [];
  const reviewDraftsTotalItems = reviewTasksPageData?.total || 0;
  const reviewDraftsTotalPages = reviewTasksPageData?.pages || Math.ceil(reviewDraftsTotalItems / REVIEW_DRAFTS_PAGE_SIZE);


  // 3. Fetch Pitches Ready to Send
  const { data: pitchesReadyData, isLoading: isLoadingReadyToSend, error: pitchesReadyError } = useQuery<PitchReadyToSend[]>({
    queryKey: ["pitchesReadyToSend", initialCampaignIdFilter],
    queryFn: async ({ queryKey }) => {
      const [, campaignId] = queryKey as [string, string | null];
      let url = `/pitches/?pitch_state=ready_to_send`; // Backend should filter for pitches linked to approved pitch_generations
      if (campaignId) url += `&campaign_id=${campaignId}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch pitches ready to send");
      // Assuming backend /pitches/ returns enriched PitchReadyToSend data
      return response.json();
    },
    staleTime: 1000 * 60 * 1,
  });
  const pitchesReadyToSend = pitchesReadyData || [];

  // 4. Fetch Sent Pitches
  const { data: sentPitchesData, isLoading: isLoadingSentPitches, error: sentPitchesError } = useQuery<SentPitchStatus[]>({
    queryKey: ["sentPitchesStatus", initialCampaignIdFilter],
    queryFn: async ({ queryKey }) => {
      const [, campaignId] = queryKey as [string, string | null];
      let url = `/pitches/?pitch_state__in=sent,opened,replied,clicked,replied_interested,live,paid,lost`; // Use appropriate states
      if (campaignId) url += `&campaign_id=${campaignId}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch sent pitches");
      // Assuming backend /pitches/ returns enriched SentPitchStatus data
      return response.json();
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
  const sentPitches = sentPitchesData || [];


  // --- Mutations ---
  const generatePitchDraftMutation = useMutation({
    mutationFn: async ({ matchId, pitch_template_id }: { matchId: number; pitch_template_id: string }) => {
      setIsLoadingGenerateForMatchId(matchId);
      const response = await apiRequest("POST", "/pitches/generate", { match_id: matchId, pitch_template_id: pitch_template_id });
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
    onSettled: () => { setIsLoadingGenerateForMatchId(null); }
  });

  const approvePitchDraftMutation = useMutation({
    mutationFn: async (pitchGenId: number) => {
      setIsLoadingApproveForPitchGenId(pitchGenId);
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
    onSettled: () => { setIsLoadingApproveForPitchGenId(null); }
  });

  const updatePitchDraftMutation = useMutation({
    mutationFn: async ({ pitchGenId, data }: { pitchGenId: number; data: EditDraftFormData }) => {
      const payload = {
        draft_text: data.draft_text,
        new_subject_line: data.subject_line,
      };
      const response = await apiRequest("PATCH", `/pitches/generations/${pitchGenId}/content`, payload);
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to update draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Draft Updated", description: "Pitch draft and subject line saved." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      setIsEditModalOpen(false); setEditingDraft(null);
    },
    onError: (error: any) => { toast({ title: "Update Failed", description: error.message, variant: "destructive" }); },
  });

  const sendPitchMutation = useMutation({
    mutationFn: async (pitchId: number) => {
        setIsLoadingSendForPitchId(pitchId);
        // Calls POST /pitches/{pitch_id}/send
        const response = await apiRequest("POST", `/pitches/${pitchId}/send`, {});
        if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to send pitch." })); throw new Error(errorData.detail); }
        return response.json();
    },
    onSuccess: (data) => {
        toast({ title: "Pitch Sent", description: data.message || "Pitch has been queued for sending." });
        tanstackQueryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
        tanstackQueryClient.invalidateQueries({ queryKey: ["sentPitchesStatus"] });
    },
    onError: (error: any) => { toast({ title: "Send Failed", description: error.message, variant: "destructive" }); },
    onSettled: () => { setIsLoadingSendForPitchId(null); }
  });


  const handleGeneratePitch = (matchId: number, templateId: string) => {
    if (!templateId) { toast({ title: "Template Required", description: "Please select a pitch template.", variant: "destructive"}); return; }
    generatePitchDraftMutation.mutate({ matchId, pitch_template_id: templateId });
  };
  const handleApprovePitch = (pitchGenId: number) => { approvePitchDraftMutation.mutate(pitchGenId); };
  const handleSendPitch = (pitchId: number) => { sendPitchMutation.mutate(pitchId); };
  const handleOpenEditModal = (draft: PitchDraftForReview) => { setEditingDraft(draft); setIsEditModalOpen(true); };
  const handleSaveEditedDraft = (pitchGenId: number, data: EditDraftFormData) => { updatePitchDraftMutation.mutate({ pitchGenId, data }); };

  const handleReviewDraftsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= reviewDraftsTotalPages) {
        setReviewDraftsPage(newPage);
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
          <TabsTrigger value="draftsReview"><Edit3 className="mr-1.5 h-4 w-4"/>Review Drafts ({isLoadingPitchDrafts ? '...' : reviewDraftsTotalItems})</TabsTrigger>
          <TabsTrigger value="readyToSend"><MailCheck className="mr-1.5 h-4 w-4"/>Ready to Send ({isLoadingReadyToSend ? '...' : pitchesReadyToSend.length})</TabsTrigger>
          <TabsTrigger value="sentPitches"><MailOpen className="mr-1.5 h-4 w-4"/>Sent Pitches ({isLoadingSentPitches ? '...' : sentPitches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="readyForDraft" className="mt-6">
          <ReadyForDraftTab
            approvedMatches={approvedMatches}
            onGenerate={handleGeneratePitch}
            isLoadingGenerateForMatchId={isLoadingGenerateForMatchId}
            templates={pitchTemplates}
            isLoadingMatches={isLoadingApprovedMatches || isLoadingTemplates}
          />
          {approvedMatchesError && <p className="text-red-500 mt-2">Error loading approved matches: {(approvedMatchesError as Error).message}</p>}
          {templatesError && <p className="text-red-500 mt-2">Error loading pitch templates: {(templatesError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="draftsReview" className="mt-6">
          <DraftsReviewTab
            drafts={pitchDraftsForReview}
            onApprove={handleApprovePitch}
            onEdit={handleOpenEditModal}
            isLoadingApproveForPitchGenId={isLoadingApproveForPitchGenId}
            isLoadingDrafts={isLoadingPitchDrafts}
            currentPage={reviewDraftsPage}
            totalPages={reviewDraftsTotalPages}
            onPageChange={handleReviewDraftsPageChange}
          />
          {reviewDraftsError && <p className="text-red-500 mt-2">Error loading drafts for review: {(reviewDraftsError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="readyToSend" className="mt-6">
           <ReadyToSendTab
             pitches={pitchesReadyToSend}
             onSend={handleSendPitch}
             isLoadingSendForPitchId={isLoadingSendForPitchId}
             isLoadingPitches={isLoadingReadyToSend}
           />
           {pitchesReadyError && <p className="text-red-500 mt-2">Error loading pitches ready to send: {(pitchesReadyError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="sentPitches" className="mt-6">
           <SentPitchesTab pitches={sentPitches} isLoadingPitches={isLoadingSentPitches} />
           {sentPitchesError && <p className="text-red-500 mt-2">Error loading sent pitches: {(sentPitchesError as Error).message}</p>}
        </TabsContent>
      </Tabs>

      <EditDraftModal
        draft={editingDraft}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEditedDraft}
        isSaving={updatePitchDraftMutation.isPending}
      />
    </div>
  );
}