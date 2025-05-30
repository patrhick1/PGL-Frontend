// client/src/pages/CampaignDetail.tsx
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit, ExternalLink, Lightbulb, Search, CheckCircle, Send, TrendingUp,
  ClipboardList, AlertTriangle, Info, Users, FileText, MessageSquare, PlayCircle, ThumbsUp, ThumbsDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// --- Interfaces (Ensure these match your actual backend responses) ---
interface CampaignDetailData {
  campaign_id: string;
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null; // GDoc Link
  campaign_angles?: string | null; // GDoc Link
  campaign_keywords?: string[] | null;
  mock_interview_trancript?: string | null; // Text or GDoc Link
  media_kit_url?: string | null;
  questionnaire_responses?: object | null; // To check if questionnaire is filled
  created_at: string;
  client_full_name?: string; // Populated if needed
}

interface MatchSuggestionForCampaign {
  match_id: number;
  media_id: number;
  media_name?: string | null;
  media_website?: string | null;
  status: string; // 'pending', 'approved', 'rejected', 'pending_internal_review'
  ai_reasoning?: string | null;
  match_score?: number | null;
  created_at: string;
}

interface PitchForCampaign { // Simplified from PitchInDB
  pitch_id: number;
  pitch_gen_id?: number | null;
  media_name?: string | null; // Joined from media table
  subject_line?: string | null;
  pitch_state?: string | null; // e.g., 'generated', 'pending_review', 'ready_to_send', 'sent', 'opened', 'replied'
  send_ts?: string | null;
  reply_ts?: string | null;
  created_at: string;
}

interface PlacementForCampaign { // Simplified from PlacementInDB
  placement_id: number;
  media_name?: string | null; // Joined from media table
  current_status?: string | null;
  go_live_date?: string | null;
  episode_link?: string | null;
  created_at: string;
}
// --- End Interfaces ---


// --- Tab Content Components (Can be moved to separate files) ---

function CampaignOverviewTab({ campaign }: { campaign: CampaignDetailData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Overview</CardTitle>
        <CardDescription>Key details and settings for this campaign.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p><strong>Campaign Name:</strong> {campaign.campaign_name}</p>
        <p><strong>Client:</strong> {campaign.client_full_name || `Person ID: ${campaign.person_id}`}</p>
        <p><strong>Campaign Type:</strong> {campaign.campaign_type || "N/A"}</p>
        <p><strong>Keywords:</strong> {(campaign.campaign_keywords || []).join(', ') || "Not set"}</p>
        <p><strong>Media Kit URL:</strong> 
          {campaign.media_kit_url ? 
            <a href={campaign.media_kit_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              View Media Kit <ExternalLink className="inline h-3 w-3"/>
            </a> 
            : " Not provided"}
        </p>
        <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleDateString()}</p>
        {/* Add Edit button for Staff/Admin */}
      </CardContent>
    </Card>
  );
}

function ProfileContentTab({ campaign, userRole }: { campaign: CampaignDetailData; userRole: string | null }) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [, navigate] = useLocation();

  const triggerAnglesBioMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/campaigns/${campaignId}/generate-angles-bio`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to trigger generation."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Generation Successful", description: data.message || "Bio & Angles are being generated." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", campaign.campaign_id] });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message || "Could not trigger generation.", variant: "destructive" });
    },
  });

  const handleGenerateBioAngles = () => {
    if (!campaign.mock_interview_trancript && !campaign.questionnaire_responses) { // Check both
        toast({ title: "Missing Prerequisite", description: "Questionnaire must be completed first to provide content for AI.", variant: "destructive"});
        if (userRole === 'client') navigate(`/profile-setup?campaignId=${campaign.campaign_id}&tab=questionnaire`);
        return;
    }
    triggerAnglesBioMutation.mutate(campaign.campaign_id);
  };

  const questionnaireLink = userRole === 'client' ? `/profile-setup?campaignId=${campaign.campaign_id}&tab=questionnaire` : `/admin?tab=campaigns&action=editQuestionnaire&campaignId=${campaign.campaign_id}`; // Admin might edit via a different interface

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Profile & AI-Generated Content</CardTitle>
        <CardDescription>Manage client information and AI-generated assets for this campaign.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-1">Questionnaire / Mock Interview</h4>
          <div className="flex items-center space-x-2">
            {campaign.questionnaire_responses || campaign.mock_interview_trancript ? (
              <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1"/>Completed</Badge>
            ) : (
              <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1"/>Incomplete</Badge>
            )}
            <Link href={questionnaireLink}>
              <Button variant="link" className="p-0 h-auto text-sm">
                {campaign.questionnaire_responses ? "View/Edit Questionnaire" : "Complete Questionnaire"}
              </Button>
            </Link>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-1">AI-Generated Client Bio</h4>
          {campaign.campaign_bio ? (
            <a href={campaign.campaign_bio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-sm">
              <ExternalLink className="h-4 w-4 mr-1"/> View Bio Document
            </a>
          ) : <p className="text-sm text-gray-500">Not generated yet. Complete questionnaire and click below.</p>}
        </div>
         <div>
          <h4 className="font-semibold mb-1">AI-Generated Pitch Angles</h4>
          {campaign.campaign_angles ? (
            <a href={campaign.campaign_angles} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-sm">
              <ExternalLink className="h-4 w-4 mr-1"/> View Angles Document
            </a>
          ) : <p className="text-sm text-gray-500">Not generated yet. Complete questionnaire and click below.</p>}
        </div>
        
        {(userRole === 'staff' || userRole === 'admin') && (
          <Button onClick={handleGenerateBioAngles} disabled={triggerAnglesBioMutation.isPending || (!campaign.questionnaire_responses && !campaign.mock_interview_trancript)}>
            <Lightbulb className="mr-2 h-4 w-4" />
            {triggerAnglesBioMutation.isPending ? "Generating..." : (campaign.campaign_bio ? "Re-generate Bio & Angles" : "Generate Bio & Angles")}
          </Button>
        )}
         {userRole === 'client' && (!campaign.campaign_bio || !campaign.campaign_angles) && (
            <p className="text-sm text-gray-500 italic">
                Once your questionnaire is complete, our team will generate your Bio & Angles.
            </p>
        )}
      </CardContent>
    </Card>
  );
}

function PodcastMatchesTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  const { data: matches = [], isLoading, error } = useQuery<MatchSuggestionForCampaign[]>({
    queryKey: ["campaignMatchesDetail", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/match-suggestions/campaign/${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch match suggestions");
      return response.json();
    },
  });
  
  const approveMatchMutation = useMutation({
    mutationFn: (matchId: number) => apiRequest("PATCH", `/review-tasks/match-approval/${matchId}`), // Assuming a dedicated endpoint or adapt /review-tasks/
    // OR if client directly approves the match_suggestion:
    // mutationFn: (matchId: number) => apiRequest("PATCH", `/match-suggestions/${matchId}/approve`),
    onSuccess: () => {
      toast({ title: "Match Approved", description: "The match has been approved. Our team will draft a pitch." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", campaignId] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] }); // For staff queue
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to approve match.", variant: "destructive" }),
  });

  const rejectMatchMutation = useMutation({
    mutationFn: (matchId: number) => apiRequest("PATCH", `/review-tasks/match-rejection/${matchId}`), // Assuming a dedicated endpoint
    // OR:
    // mutationFn: (matchId: number) => apiRequest("PATCH", `/match-suggestions/${matchId}`, { status: 'rejected_by_client' }),
    onSuccess: () => {
      toast({ title: "Match Rejected", description: "The match has been marked as rejected." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", campaignId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to reject match.", variant: "destructive" }),
  });


  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading matches: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Podcast Matches</CardTitle>
        <CardDescription>Podcasts suggested or vetted for this campaign.</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
            <div className="text-center py-6">
                <Search className="mx-auto h-10 w-10 text-gray-400 mb-2"/>
                <p className="text-gray-600">No podcast matches found for this campaign yet.</p>
                {(userRole === 'staff' || userRole === 'admin') && (
                    <Link href={`/discover?campaignId=${campaignId}`}>
                        <Button variant="link" className="mt-2">Discover Podcasts for this Campaign</Button>
                    </Link>
                )}
            </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => (
              <Card key={match.match_id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <h4 className="font-semibold text-md">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                    <p className="text-xs text-gray-500">Match Score: {match.match_score?.toFixed(2) || "N/A"} | Status: <Badge variant={match.status === 'approved' ? 'default' : 'outline'} className="capitalize">{match.status.replace('_', ' ')}</Badge></p>
                    {match.ai_reasoning && <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">AI Reasoning: {match.ai_reasoning}</p>}
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {match.media_website && <Button variant="ghost" size="sm" asChild><a href={match.media_website} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4"/></a></Button>}
                    {(userRole === 'client' && match.status === 'pending') && ( // Client approves 'pending' matches
                      <>
                        <Button size="sm" onClick={() => approveMatchMutation.mutate(match.match_id)} disabled={approveMatchMutation.isPending} className="bg-green-500 hover:bg-green-600 text-white">
                            <ThumbsUp className="h-4 w-4 mr-1"/> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectMatchMutation.mutate(match.match_id)} disabled={rejectMatchMutation.isPending}>
                            <ThumbsDown className="h-4 w-4 mr-1"/> Reject
                        </Button>
                      </>
                    )}
                     {(userRole === 'staff' || userRole === 'admin') && match.status === 'pending_internal_review' && (
                      <Button size="sm" onClick={() => { /* Staff action to finalize approval */ }}>Vet & Finalize</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PitchesTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { data: pitches = [], isLoading, error } = useQuery<PitchForCampaign[]>({
    queryKey: ["campaignPitches", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/pitches/?campaign_id=${campaignId}`); // Ensure backend supports this filter
      if (!response.ok) throw new Error("Failed to fetch pitches");
      const pitchData: any[] = await response.json();
      // Enrich with media name if not already joined by backend
      return Promise.all(pitchData.map(async p => {
          if (p.media_id && !p.media_name) {
              const mediaRes = await apiRequest("GET", `/media/${p.media_id}`);
              if (mediaRes.ok) p.media_name = (await mediaRes.json()).name;
          }
          return p;
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading pitches: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pitches Sent</CardTitle>
        <CardDescription>Status of pitches sent out for this campaign.</CardDescription>
      </CardHeader>
      <CardContent>
        {pitches.length === 0 ? <p>No pitches sent for this campaign yet.</p> : (
          <div className="space-y-2">
            {pitches.map(pitch => (
              <Card key={pitch.pitch_id} className="p-3">
                <p className="font-medium text-sm">{pitch.media_name || `Media ID: ${pitch.media_id}`}</p>
                <p className="text-xs text-gray-600">Subject: {pitch.subject_line || "N/A"}</p>
                <p className="text-xs">Status: <Badge variant={pitch.pitch_state === 'replied' ? 'default' : 'secondary'}>{pitch.pitch_state || "N/A"}</Badge></p>
                {pitch.send_ts && <p className="text-xs text-gray-500">Sent: {new Date(pitch.send_ts).toLocaleString()}</p>}
                {userRole !== 'client' && (
                    <Link href={`/pitch-outreach?pitchGenId=${pitch.pitch_gen_id}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">View/Manage Pitch</Button>
                    </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlacementsTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { data: placements = [], isLoading, error } = useQuery<PlacementForCampaign[]>({
    queryKey: ["campaignPlacements", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/placements/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch placements");
      const placementData: any[] = (await response.json()).items || []; // Assuming paginated response
       return Promise.all(placementData.map(async p => {
          if (p.media_id && !p.media_name) {
              const mediaRes = await apiRequest("GET", `/media/${p.media_id}`);
              if (mediaRes.ok) p.media_name = (await mediaRes.json()).name;
          }
          return p;
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading placements: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader><CardTitle>Placements & Bookings</CardTitle><CardDescription>Confirmed podcast appearances for this campaign.</CardDescription></CardHeader>
      <CardContent>
        {placements.length === 0 ? <p>No placements recorded for this campaign yet.</p> : (
          <div className="space-y-2">
            {placements.map(placement => (
              <Card key={placement.placement_id} className="p-3">
                <p className="font-medium text-sm">{placement.media_name || `Media ID: ${placement.media_id}`}</p>
                <p className="text-xs">Status: <Badge>{placement.current_status || "N/A"}</Badge></p>
                {placement.go_live_date && <p className="text-xs text-gray-500">Go-Live: {new Date(placement.go_live_date  + 'T00:00:00').toLocaleDateString()}</p>}
                {placement.episode_link && <a href={placement.episode_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Listen to Episode <PlayCircle className="inline h-3 w-3"/></a>}
                {userRole !== 'client' && (
                    <Link href={`/placement-tracking?placementId=${placement.placement_id}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">Manage Placement</Button>
                    </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// --- Main CampaignDetail Component ---
export default function CampaignDetail() {
  const params = useParams();
  const campaignId = params.campaignId;
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient(); // For potential mutations within tabs

  const { data: campaign, isLoading, error } = useQuery<CampaignDetailData>({
    queryKey: ["campaignDetail", campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error("Campaign ID is missing");
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Campaign not found.");
        const errorData = await response.json().catch(() => ({detail: "Failed to fetch campaign details"}));
        throw new Error(errorData.detail);
      }
      const campaignData: CampaignDetailData = await response.json();
      // Fetch client name if not already part of campaignData
      if (campaignData.person_id && !campaignData.client_full_name) {
          try {
            const personRes = await apiRequest("GET", `/people/${campaignData.person_id}`);
            if (personRes.ok) {
                const personData = await personRes.json();
                campaignData.client_full_name = personData.full_name;
            }
          } catch (e) { console.warn("Could not fetch client name for campaign detail"); }
      }
      return campaignData;
    },
    enabled: !!campaignId && !authLoading && !!user, // Ensure user is loaded before fetching campaign
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6 animate-pulse">
        <Skeleton className="h-8 w-1/4 mb-4" /> {/* Back button */}
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/2" /> {/* Title */}
            <Skeleton className="h-10 w-32" /> {/* Action button */}
        </div>
        <Skeleton className="h-10 w-full mb-4" /> {/* TabsList */}
        <Skeleton className="h-64 w-full" /> {/* Tab content area */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-2 text-xl font-semibold text-red-600">Error Loading Campaign</h2>
        <p className="text-red-500">{(error as Error).message}</p>
        <Link href={user?.role === 'client' ? "/my-campaigns" : "/campaign-management"}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
        <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-xl font-semibold text-gray-700">Campaign Not Found</h2>
            <p className="text-gray-500">The requested campaign could not be loaded.</p>
            <Link href={user?.role === 'client' ? "/my-campaigns" : "/campaign-management"}>
            <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
            </Button>
            </Link>
      </div>
    );
  }

  // Determine back link based on role
  const backLink = user?.role === 'client' ? "/my-campaigns" : "/campaign-management";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Link href={backLink}>
        <Button variant="outline" className="mb-4 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns List
        </Button>
      </Link>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{campaign.campaign_name}</h1>
          <p className="text-gray-600">Client: {campaign.client_full_name || `Person ID: ${campaign.person_id}`}</p>
        </div>
        {(user?.role === 'staff' || user?.role === 'admin') && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Link href={`/discover?campaignId=${campaign.campaign_id}`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4"/> Discover Podcasts</Button>
                </Link>
                <Link href={`/pitch-outreach?campaignId=${campaign.campaign_id}`} className="w-full sm:w-auto">
                    <Button className="w-full bg-primary text-primary-foreground"><Send className="mr-2 h-4 w-4"/> Manage Pitches</Button>
                </Link>
            </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profileContent">Profile & Content</TabsTrigger>
          <TabsTrigger value="matches">Podcast Matches</TabsTrigger>
          <TabsTrigger value="pitches">Pitches</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CampaignOverviewTab campaign={campaign} />
        </TabsContent>
        <TabsContent value="profileContent" className="mt-6">
          <ProfileContentTab campaign={campaign} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="matches" className="mt-6">
          <PodcastMatchesTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="pitches" className="mt-6">
          <PitchesTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="placements" className="mt-6">
          <PlacementsTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}