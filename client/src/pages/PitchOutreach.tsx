// client/src/pages/PitchOutreach.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // For editing pitch drafts
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Edit3, Check, X, ListChecks, MailCheck, MailOpen, RefreshCw, ExternalLink, Eye, MessageSquare, Filter, Search, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter"; // For query params

// --- Interfaces (ensure these match backend schemas) ---
interface ApprovedMatchForPitching {
  match_id: number;
  campaign_id: string;
  media_id: number;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null; // Populated by joining with campaign then person
}

interface PitchDraftForReview { // From review_tasks where task_type = 'pitch_review'
  review_task_id: number;
  related_id: number; // This is pitch_gen_id
  pitch_gen_id: number; // same as related_id
  campaign_id: string;
  media_id: number;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  draft_text_preview?: string;
  gdoc_link?: string | null; // If draft_text in pitch_generations is a GDoc link
  current_draft_text?: string; // Full text for editing modal
  subject_line?: string | null; // From associated pitch record
}

interface PitchReadyToSend { // From pitch_generations where send_ready_bool = true
  pitch_gen_id: number;
  pitch_id: number; // Associated pitch.pitch_id (must exist and not be 'sent')
  campaign_id: string;
  media_id: number;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  subject_line_preview?: string | null;
  final_text_preview?: string | null; // Preview of pitch_generations.final_text or draft_text
}

interface SentPitchStatus { // From pitches table
  pitch_id: number;
  media_id: number;
  media_name?: string | null;
  campaign_id: string;
  campaign_name?: string | null;
  client_name?: string | null;
  subject_line?: string | null;
  pitch_state?: string | null;
  send_ts?: string | null;
  reply_ts?: string | null;
  instantly_lead_id?: string | null;
}

const pitchTemplateOptions = [
    { value: "friendly_intro_template", label: "Friendly Introduction" },
    { value: "value_prop_template", label: "Value Proposition Focus" },
    { value: "short_follow_up_template", label: "Short Follow-Up" },
];

// --- Helper components for each tab ---

function ReadyForDraftTab({ approvedMatches, onGenerate, isLoadingGenerate, selectedTemplate, onTemplateChange }: {
    approvedMatches: ApprovedMatchForPitching[];
    onGenerate: (matchId: number) => void;
    isLoadingGenerate: boolean;
    selectedTemplate: string;
    onTemplateChange: (template: string) => void;
}) {
    if (isLoadingGenerate && !approvedMatches.length) return <Skeleton className="h-40 w-full" />;
    if (!approvedMatches || approvedMatches.length === 0) return <p className="text-center py-4 text-gray-500">No matches currently approved and awaiting pitch drafts.</p>;
    
    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label htmlFor="pitch-template-select" className="text-sm font-medium block mb-1">Select Pitch Template:</label>
                <Select value={selectedTemplate} onValueChange={onTemplateChange}>
                  <SelectTrigger id="pitch-template-select" className="w-full md:w-1/2"><SelectValue placeholder="Select pitch template" /></SelectTrigger>
                  <SelectContent>
                    {pitchTemplateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {approvedMatches.map((match: ApprovedMatchForPitching) => (
                    <Card key={match.match_id} className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div className="mb-2 sm:mb-0">
                                <h4 className="font-semibold">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                                <p className="text-xs text-gray-500">For Campaign: {match.campaign_name || `ID: ${match.campaign_id.substring(0,8)}...`} (Client: {match.client_name || 'N/A'})</p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => onGenerate(match.match_id)} 
                                disabled={isLoadingGenerate}
                                className="bg-primary text-primary-foreground w-full sm:w-auto"
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

function DraftsReviewTab({ drafts, onApprove, onEdit, isLoadingApprove, isLoadingEdit }: {
    drafts: PitchDraftForReview[];
    onApprove: (pitchGenId: number) => void;
    onEdit: (draft: PitchDraftForReview) => void;
    isLoadingApprove: boolean;
    isLoadingEdit: boolean;
}) {
    if (isLoadingEdit && !drafts.length) return <Skeleton className="h-40 w-full" />;
    if (!drafts || drafts.length === 0) return <p className="text-center py-4 text-gray-500">No pitch drafts currently pending review.</p>;

    return (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {drafts.map((draft: PitchDraftForReview) => (
                <Card key={draft.review_task_id} className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-1 mb-2 sm:mb-0">
                            <h4 className="font-semibold">{draft.media_name || `Media ID: ${draft.media_id}`}</h4>
                            <p className="text-xs text-gray-500">Campaign: {draft.campaign_name || 'N/A'} (Client: {draft.client_name || 'N/A'})</p>
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Preview: {draft.draft_text_preview || "No preview."}</p>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                            {draft.gdoc_link && (
                                <Button size="sm" variant="outline" asChild>
                                    <a href={draft.gdoc_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1"/> View/Edit GDoc</a>
                                </Button>
                            )}
                            <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600 text-white" 
                                onClick={() => onApprove(draft.pitch_gen_id)} 
                                disabled={isLoadingApprove}
                            >
                                {isLoadingApprove ? <RefreshCw className="h-4 w-4 animate-spin mr-1"/> : <Check className="h-3 w-3 mr-1"/>} Approve
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ... Implement ReadyToSendTab and SentPitchesTab similarly ...
// ReadyToSendTab: lists pitch_generations, button to call sendPitchMutation
// SentPitchesTab: lists pitches, shows status, send_ts, reply_ts

export default function PitchOutreach() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [location, navigate] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const initialCampaignIdFilter = queryParams.get("campaignId"); // For pre-filtering if navigated from CampaignDetail

  const [selectedPitchTemplate, setSelectedPitchTemplate] = useState<string>(pitchTemplateOptions[0].value);
  // Add state for campaign filter if needed for this page
  // const [campaignFilter, setCampaignFilter] = useState<string | "all">(initialCampaignIdFilter || "all");


  // --- Queries ---
  const { data: approvedMatchesData, isLoading: isLoadingApprovedMatches } = useQuery<ApprovedMatchForPitching[]>({
    queryKey: ["approvedMatchesForPitching"], // Add campaignFilter if filtering
    queryFn: async () => { /* ... API call ... */ return []; },
  });
  const approvedMatches = approvedMatchesData || [];

  const { data: pitchDraftsData, isLoading: isLoadingPitchDrafts } = useQuery<PitchDraftForReview[]>({
    queryKey: ["pitchDraftsForReview"], // Add campaignFilter if filtering
    queryFn: async () => { /* ... API call ... */ return []; },
  });
  const pitchDraftsForReview = pitchDraftsData || [];
  
  // ... (Queries for ReadyToSend and SentPitches) ...
  const pitchesReadyToSend: PitchReadyToSend[] = []; // Placeholder
  const sentPitches: SentPitchStatus[] = []; // Placeholder
  const isLoadingReadyToSend = false;
  const isLoadingSentPitches = false;


  // --- Mutations ---
  const generatePitchDraftMutation = useMutation({ /* ... (from previous example) ... */ });
  const approvePitchDraftMutation = useMutation({ /* ... (from previous example) ... */ });
  const sendPitchMutation = useMutation({ /* ... (from previous example) ... */ });

  const handleGeneratePitch = (matchId: number) => {
    generatePitchDraftMutation.mutate(matchId as any); // Temp cast if definition is not ready
  };
  const handleApprovePitch = (pitchGenId: number) => {
    approvePitchDraftMutation.mutate(pitchGenId as any); // Temp cast
  };
  const handleSendPitch = (pitchId: number) => {
    sendPitchMutation.mutate(pitchId as any); // Temp cast
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
        {/* Optional: Button to create a one-off pitch if needed, or link to campaign management */}
      </div>

      <Tabs defaultValue="readyForDraft" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="readyForDraft">
            <Lightbulb className="mr-1.5 h-4 w-4"/>Ready for Draft ({approvedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="draftsReview">
            <Edit3 className="mr-1.5 h-4 w-4"/>Review Drafts ({pitchDraftsForReview.length})
          </TabsTrigger>
          <TabsTrigger value="readyToSend">
            <MailCheck className="mr-1.5 h-4 w-4"/>Ready to Send ({pitchesReadyToSend.length})
          </TabsTrigger>
          <TabsTrigger value="sentPitches">
            <MailOpen className="mr-1.5 h-4 w-4"/>Sent Pitches ({sentPitches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readyForDraft" className="mt-6">
          <ReadyForDraftTab 
            approvedMatches={approvedMatches} 
            onGenerate={handleGeneratePitch}
            isLoadingGenerate={generatePitchDraftMutation.isPending}
            selectedTemplate={selectedPitchTemplate}
            onTemplateChange={setSelectedPitchTemplate}
          />
        </TabsContent>

        <TabsContent value="draftsReview" className="mt-6">
          <DraftsReviewTab 
            drafts={pitchDraftsForReview}
            onApprove={handleApprovePitch}
            onEdit={(draft: PitchDraftForReview) => { console.log("Edit draft:", draft);}}
            isLoadingApprove={approvePitchDraftMutation.isPending}
            isLoadingEdit={isLoadingPitchDrafts} 
          />
        </TabsContent>

        <TabsContent value="readyToSend" className="mt-6">
          {/* <ReadyToSendTab pitches={pitchesReadyToSend} onSend={handleSendPitch} isLoadingSend={sendPitchMutation.isPending ? sendPitchMutation.variables : null} /> */}
           <Card><CardHeader><CardTitle>Approved & Ready to Send</CardTitle></CardHeader><CardContent><p>Placeholder for Ready to Send Pitches.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="sentPitches" className="mt-6">
          {/* <SentPitchesTab pitches={sentPitches} /> */}
           <Card><CardHeader><CardTitle>Sent Pitch Status</CardTitle></CardHeader><CardContent><p>Placeholder for Sent Pitches.</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}