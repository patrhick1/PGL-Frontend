// client/src/pages/Approvals.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient"; // Use appQueryClient
import { 
  CheckCircle, Clock, XCircle, Search, Filter, Podcast, Users, ExternalLink, ThumbsUp, ThumbsDown, Edit3, Eye, MessageSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // For loading states

export interface ReviewTask {
  review_task_id: number;
  task_type: 'match_suggestion' | 'pitch_review' | string;
  related_id: number;
  campaign_id?: string | null; // UUID string
  assigned_to_id?: number | null; // Corresponds to 'assigned_to' in DB
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  notes?: string | null;
  created_at: string; // ISO datetime string
  completed_at?: string | null; // ISO datetime string

  // --- Frontend populated fields for display ---
  related_entity_name?: string; // e.g., Podcast Name or Pitch Title
  campaign_name?: string;
  client_name?: string;
  media_url?: string; // e.g., podcast website
  pitch_draft_preview?: string;
  // --- Fields for Match Suggestion display ---
  match_score?: number | null;
  ai_reasoning?: string | null;
}

// --- From podcast_outreach/api/schemas/match_schemas.py ---
export interface MatchSuggestion { // MatchSuggestionInDB
  match_id: number;
  campaign_id: string; // UUID string
  media_id: number;
  match_score?: number | null;
  matched_keywords?: string[] | null;
  ai_reasoning?: string | null;
  status: string; // 'pending', 'approved', 'rejected'
  client_approved: boolean;
  approved_at?: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/media_schemas.py ---
export interface Media { // MediaInDB
  media_id: number;
  name: string | null;
  title?: string | null;
  rss_url?: string | null;
  rss_feed_url?: string | null;
  website?: string | null;
  description?: string | null;
  ai_description?: string | null;
  contact_email?: string | null;
  language?: string | null;
  category?: string | null;
  image_url?: string | null;
  company_id?: number | null;
  avg_downloads?: number | null;
  audience_size?: number | null;
  total_episodes?: number | null;
  itunes_id?: string | null;
  podcast_spotify_id?: string | null;
  listen_score?: number | null;
  listen_score_global_rank?: number | null;
  itunes_rating_average?: number | null;
  itunes_rating_count?: number | null;
  spotify_rating_average?: number | null;
  spotify_rating_count?: number | null;
  fetched_episodes?: boolean;
  source_api?: string | null;
  api_id?: string | null; // ID from the source_api
  last_posted_at?: string | null; // ISO datetime string
  podcast_twitter_url?: string | null;
  podcast_linkedin_url?: string | null;
  podcast_instagram_url?: string | null;
  podcast_facebook_url?: string | null;
  podcast_youtube_url?: string | null;
  podcast_tiktok_url?: string | null;
  podcast_other_social_url?: string | null;
  host_names?: string[] | null; // From your DB schema
  // embedding is omitted
  created_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/campaign_schemas.py ---
export interface Campaign { // CampaignInDB
  campaign_id: string; // UUID string
  person_id: number;
  attio_client_id?: string | null; // UUID string
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null; // Link to GDoc or text
  campaign_angles?: string | null; // Link to GDoc or text
  campaign_keywords?: string[] | null;
  compiled_social_posts?: string | null;
  podcast_transcript_link?: string | null;
  compiled_articles_link?: string | null;
  mock_interview_trancript?: string | null;
  // embedding is omitted
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  goal_note?: string | null;
  media_kit_url?: string | null;
  instantly_campaign_id?: string | null; // Added from your backend schema
  created_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/person_schemas.py ---
export interface Person { // PersonInDB
  person_id: number;
  company_id?: number | null;
  full_name: string | null;
  email: string;
  linkedin_profile_url?: string | null;
  twitter_profile_url?: string | null;
  instagram_profile_url?: string | null;
  tiktok_profile_url?: string | null;
  dashboard_username?: string | null;
  // dashboard_password_hash is intentionally omitted for client-side
  attio_contact_id?: string | null; // UUID string
  role?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/pitch_schemas.py ---
export interface PitchGeneration { // PitchGenerationInDB
  pitch_gen_id: number;
  campaign_id: string; // UUID string
  media_id: number;
  template_id: string;
  draft_text: string;
  ai_model_used?: string | null;
  pitch_topic?: string | null;
  temperature?: number | null;
  generated_at: string; // ISO datetime string
  reviewer_id?: string | null;
  reviewed_at?: string | null; // ISO datetime string
  final_text?: string | null;
  send_ready_bool?: boolean | null;
  generation_status?: string | null; // e.g., 'draft', 'approved'
}

const reviewTaskStatusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700", dotColor: "bg-yellow-500" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  default: { label: "Unknown", icon: Clock, color: "bg-gray-100 text-gray-700", dotColor: "bg-gray-500" },
};

// --- ReviewTaskItem Component ---
function ReviewTaskItem({ task }: { task: ReviewTask }) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  const { data: relatedData, isLoading: isLoadingRelated, error: relatedDataError } = useQuery({
    queryKey: [`reviewTaskRelatedData`, task.task_type, task.related_id],
    queryFn: async () => {
      let entityName = "N/A";
      let campaignName = "N/A";
      let clientName = "N/A";
      let mediaUrl: string | undefined = undefined;
      let pitchDraftPreview: string | undefined = undefined;
      let matchScore: number | null | undefined = undefined;
      let aiReasoning: string | null | undefined = undefined;

      try {
        if (task.task_type === 'match_suggestion') {
          const matchRes = await apiRequest("GET", `/match-suggestions/${task.related_id}`);
          if (!matchRes.ok) throw new Error(`Failed to fetch match suggestion (${matchRes.status})`);
          const match: MatchSuggestion = await matchRes.json();
          matchScore = match.match_score;
          aiReasoning = match.ai_reasoning;

          if (match.media_id) {
            const mediaRes = await apiRequest("GET", `/media/${match.media_id}`);
            if (mediaRes.ok) {
              const media: Media = await mediaRes.json();
              entityName = media.name || "Unnamed Podcast";
              mediaUrl = media.website || undefined;
            } else {
              console.warn(`Failed to fetch media ${match.media_id}: ${mediaRes.status} ${mediaRes.statusText}`);
            }
          }
          if (match.campaign_id) {
            const campaignRes = await apiRequest("GET", `/campaigns/${match.campaign_id}`);
            if (campaignRes.ok) {
              const campaign: Campaign = await campaignRes.json();
              campaignName = campaign.campaign_name;
              if (campaign.person_id) {
                  const personRes = await apiRequest("GET", `/people/${campaign.person_id}`);
                  if(personRes.ok) {
                      const person: Person = await personRes.json();
                      clientName = person.full_name || "Unknown Client";
                  } else {
                     console.warn(`Failed to fetch person ${campaign.person_id}: ${personRes.status} ${personRes.statusText}`);
                  }
              }
            } else {
                console.warn(`Failed to fetch campaign ${match.campaign_id}: ${campaignRes.status} ${campaignRes.statusText}`);
            }
          }
        } else if (task.task_type === 'pitch_review') {
          // CORRECTED PATH for fetching pitch generation
          const pitchGenRes = await apiRequest("GET", `/pitches/generations/${task.related_id}`);
          if (!pitchGenRes.ok) throw new Error(`Failed to fetch pitch generation (${pitchGenRes.status})`);
          const pitchGen: PitchGeneration = await pitchGenRes.json();
          
          pitchDraftPreview = pitchGen.draft_text.substring(0, 150) + (pitchGen.draft_text.length > 150 ? "..." : "");

          if (pitchGen.media_id) {
            const mediaRes = await apiRequest("GET", `/media/${pitchGen.media_id}`);
            if (mediaRes.ok) {
              const media: Media = await mediaRes.json();
              entityName = `Pitch for: ${media.name || "Unnamed Podcast"}`;
              mediaUrl = media.website || undefined;
            } else {
              entityName = `Pitch for Media ID: ${pitchGen.media_id}`; // Fallback
              console.warn(`Failed to fetch media ${pitchGen.media_id}: ${mediaRes.status} ${mediaRes.statusText}`);
            }
          }
           if (pitchGen.campaign_id) {
            const campaignRes = await apiRequest("GET", `/campaigns/${pitchGen.campaign_id}`);
            if (campaignRes.ok) {
              const campaign: Campaign = await campaignRes.json();
              campaignName = campaign.campaign_name;
               if (campaign.person_id) {
                  const personRes = await apiRequest("GET", `/people/${campaign.person_id}`);
                  if(personRes.ok) {
                      const person: Person = await personRes.json();
                      clientName = person.full_name || "Unknown Client";
                  } else {
                     console.warn(`Failed to fetch person ${campaign.person_id}: ${personRes.status} ${personRes.statusText}`);
                  }
              }
            } else {
                console.warn(`Failed to fetch campaign ${pitchGen.campaign_id}: ${campaignRes.status} ${campaignRes.statusText}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching related data for task ${task.review_task_id} (Type: ${task.task_type}, Related ID: ${task.related_id}):`, err);
        // Let the error propagate to useQuery's error state
        throw err;
      }
      return { entityName, campaignName, clientName, mediaUrl, pitchDraftPreview, match_score: matchScore, ai_reasoning: aiReasoning };
    },
    enabled: !!task.related_id,
    staleTime: 1000 * 60 * 5,
    retry: 1, // Retry once for fetching related data
  });

  const reviewActionMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: any }) => {
      const response = await apiRequest("PATCH", endpoint, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Action failed" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] });
      tanstackQueryClient.invalidateQueries({ queryKey: [`reviewTaskRelatedData`, task.task_type, task.related_id] });
      toast({ title: "Action Successful", description: `Task ${variables.payload.status || 'processed'}.` });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Could not process the review action.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    if (task.task_type === 'match_suggestion') {
      // This PATCH to /review-tasks/ will trigger backend logic to approve the match
      // and create a new 'pitch_review' task.
      reviewActionMutation.mutate({ 
        endpoint: `/review-tasks/${task.review_task_id}`, 
        payload: { status: 'approved', notes: 'Approved by user via UI' } 
      });
    } else if (task.task_type === 'pitch_review') {
      // This PATCH approves the pitch generation itself.
      // The backend for this should also mark the 'pitch_review' task as completed.
      reviewActionMutation.mutate({ 
        endpoint: `/pitches/generations/${task.related_id}/approve`, 
        payload: {} // Backend gets reviewer_id from authenticated user (Depends(get_current_user))
      });
    }
  };

  const handleReject = () => {
    reviewActionMutation.mutate({ 
      endpoint: `/review-tasks/${task.review_task_id}`, 
      payload: { status: 'rejected', notes: 'Rejected by user via UI' } 
    });
  };

  const currentStatusConfig = reviewTaskStatusConfig[task.status as keyof typeof reviewTaskStatusConfig] || reviewTaskStatusConfig.default;
  const StatusIcon = currentStatusConfig.icon;

  if (isLoadingRelated) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-2/5 mb-2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <div className="flex space-x-2 pt-4 border-t">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-9 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (relatedDataError) {
     return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 text-base">Error loading details for Task ID: {task.review_task_id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">{(relatedDataError as Error).message}</p>
          <p className="text-xs text-gray-500 mt-1">Task Type: {task.task_type}, Related ID: {task.related_id}</p>
        </CardContent>
      </Card>
     );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-150">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1.5">
              <Badge className={`${currentStatusConfig.color} font-medium text-xs px-2 py-0.5`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {currentStatusConfig.label}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs px-2 py-0.5">{task.task_type.replace('_', ' ')}</Badge>
              {task.task_type === 'match_suggestion' && typeof relatedData?.match_score === 'number' && (
                <Badge variant="default" className="text-xs bg-blue-600 text-white">
                    Score: {Math.round(relatedData.match_score * 100)}%
                </Badge>
              )}
            </div>
            <CardTitle className="text-base md:text-md leading-tight">{relatedData?.entityName || `Task for ID: ${task.related_id}`}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Campaign: {relatedData?.campaignName || "N/A"} | Client: {relatedData?.clientName || "N/A"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Created: {new Date(task.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2.5 text-sm pt-0">
        {task.task_type === 'match_suggestion' && relatedData?.ai_reasoning && (
            <div className="bg-indigo-50 p-2.5 rounded-md border border-indigo-200">
                <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> AI-Generated Reasoning:
                </h4>
                <p className="text-indigo-800 text-xs whitespace-pre-wrap">{relatedData.ai_reasoning}</p>
            </div>
        )}
        {task.task_type === 'pitch_review' && relatedData?.pitchDraftPreview && (
          <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-1">PITCH DRAFT PREVIEW:</h4>
            <p className="text-gray-700 italic line-clamp-3 text-xs">{relatedData.pitchDraftPreview}</p>
          </div>
        )}
         {task.notes && (
          <div className="bg-yellow-50 p-2.5 rounded-md border border-yellow-200">
            <h4 className="text-xs font-semibold text-yellow-700 mb-1">NOTES:</h4>
            <p className="text-yellow-800 text-xs">{task.notes}</p>
          </div>
        )}

        {relatedData?.mediaUrl && (
          <div className="pt-1">
            <a 
              href={relatedData.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Media/Source
            </a>
          </div>
        )}

        {task.status === 'pending' && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100 mt-3">
            <Button
              onClick={handleApprove}
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1.5 h-auto"
              disabled={reviewActionMutation.isPending && reviewActionMutation.variables?.payload?.status === 'approved'}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              size="sm"
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs px-2 py-1.5 h-auto"
              disabled={reviewActionMutation.isPending && reviewActionMutation.variables?.payload?.status === 'rejected'}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// --- Main Approvals Page Component ---
export default function Approvals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | "match_suggestion" | "pitch_review">("all");

  // Define the expected structure of the paginated API response for review tasks
  interface PaginatedReviewTasks {
    items: ReviewTask[];
    total: number;
    page: number;
    size: number;
    pages?: number; // Optional, as not all paginated responses might include this
  }

  const { data: reviewTasksData, isLoading, error } = useQuery<PaginatedReviewTasks>({
    queryKey: ["/review-tasks/", { 
      status: statusFilter === "all" ? undefined : statusFilter, 
      task_type: taskTypeFilter === "all" ? undefined : taskTypeFilter 
      // Add page and size parameters here if you implement pagination for this view
    }],
    // queryFn is implicitly handled by your global queryClient setup if using defaultQueryFn
  });
  
  const reviewTasks = reviewTasksData?.items || []; // Correctly access the items array

  const displayedTasks = reviewTasks.filter((task: ReviewTask) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const relatedIdMatch = task.related_id.toString().includes(term);
    const notesMatch = task.notes?.toLowerCase().includes(term);
    // Client-side search on asynchronously loaded fields (related_entity_name, campaign_name) is tricky.
    // For now, this search is limited. Backend search is better.
    return relatedIdMatch || notesMatch;
  });

  const stats = {
    total: reviewTasks.length,
    pending: reviewTasks.filter((task) => task.status === 'pending').length,
    approved: reviewTasks.filter((task) => task.status === 'approved').length,
    completed: reviewTasks.filter((task) => task.status === 'completed').length,
    rejected: reviewTasks.filter((task) => task.status === 'rejected').length,
  };

  if (error) {
    return <div className="text-red-500 p-4">Error loading review tasks: {(error as Error).message}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {(Object.keys(stats) as Array<keyof typeof stats>).map(key => {
          const statusConf = reviewTaskStatusConfig[key as keyof typeof reviewTaskStatusConfig] || reviewTaskStatusConfig.default;
          return (
            <Card key={key} className="shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 capitalize">{statusConf.label || key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{stats[key]}</p>
                  </div>
                  <statusConf.icon className={`h-5 w-5 md:h-6 md:w-6 ${statusConf.color.replace('bg-', 'text-').split(' ')[0]}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">Review Queue</CardTitle>
            <CardDescription>Manage pending match suggestions and pitch drafts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={taskTypeFilter} onValueChange={(value) => setTaskTypeFilter(value as typeof taskTypeFilter)}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Task Types</SelectItem>
                  <SelectItem value="match_suggestion">Match Suggestions</SelectItem>
                  <SelectItem value="pitch_review">Pitch Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
            </div>
          ) : displayedTasks.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-md font-medium text-gray-700">No tasks match your filters</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {displayedTasks.map((task) => (
                <ReviewTaskItem key={task.review_task_id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}