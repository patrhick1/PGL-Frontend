// client/src/pages/PodcastDiscovery.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Search, ExternalLink, Lightbulb, Info, AlertTriangle, CheckSquare, Send, RefreshCw, ArrowRight, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import DiscoveryProgressTracker from "@/components/DiscoveryProgressTracker";

// --- Interfaces (simplified based on usage in your plan) ---
interface CampaignForDiscovery {
  campaign_id: string;
  campaign_name: string;
}

interface ClientDiscoveryStatus {
  person_id: number;
  plan_type: string;
  daily_discoveries_used: number;
  daily_discovery_allowance: number;
  weekly_discoveries_used: number;
  weekly_discovery_allowance: number;
  can_discover_today: boolean;
  can_discover_this_week: boolean;
}

interface PodcastPreview { // For client-side display
  media_id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  image_url?: string | null;
  // Add other relevant preview fields
}

// Interface matching MatchSuggestionInDB from backend (or its enriched version)
interface StaffDiscoveredMatch { 
  match_id: number;
  campaign_id: string; 
  media_id: number;
  match_score?: number | null;
  matched_keywords?: string[] | null;
  ai_reasoning?: string | null;
  status: string; 
  client_approved?: boolean; // Optional as it might not always be set by this endpoint
  approved_at?: string | null;
  created_at: string;
  media_name?: string | null;
  media_website?: string | null;
  campaign_name?: string | null; // Should be populated by backend if possible
  client_name?: string | null;   // Should be populated by backend if possible
  // Potentially add best_episode_link or similar if backend provides it for AI reasoning context
}

export default function PodcastDiscovery() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const userRoleLower = user?.role?.toLowerCase();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [staffDiscoveredMatches, setStaffDiscoveredMatches] = useState<StaffDiscoveredMatch[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('desc'); // For match_score sorting
  const [maxMatchesInput, setMaxMatchesInput] = useState<string>(""); // State for max_matches input
  const [showProgressTracker, setShowProgressTracker] = useState(false);

  // --- Client-Specific State & Queries ---
  const [clientDiscoveredPodcastPreviews, setClientDiscoveredPodcastPreviews] = useState<PodcastPreview[]>([]);
  const [selectedForReview, setSelectedForReview] = useState<Set<number>>(new Set());

  const { data: clientCampaigns = [], isLoading: isLoadingClientCampaigns } = useQuery<CampaignForDiscovery[]>({
    queryKey: ["campaignsForDiscovery", user?.person_id, userRoleLower], 
    queryFn: async () => {
      if (!user?.person_id && userRoleLower === 'client') return []; // Client needs person_id
      const endpoint = userRoleLower === 'client' ? `/campaigns/?person_id=${user!.person_id}` : '/campaigns/'; 
      const response = await apiRequest("GET", endpoint);
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });

  const { data: discoveryStatus, isLoading: isLoadingStatus, refetch: refetchDiscoveryStatus } = useQuery<ClientDiscoveryStatus>({
    queryKey: ["clientDiscoveryStatus", user?.person_id, userRoleLower], // Added userRoleLower to key
    queryFn: async () => {
      if (userRoleLower !== 'client' || !user?.person_id) {
        return {
            person_id: user?.person_id || 0,
            plan_type: userRoleLower || 'unknown', 
            daily_discoveries_used: 0,
            daily_discovery_allowance: Infinity,
            weekly_discoveries_used: 0,
            weekly_discovery_allowance: Infinity,
            can_discover_today: true,
            can_discover_this_week: true,
        };
      }
      // Temporarily return default values until backend endpoint is ready
      return {
          person_id: user?.person_id || 0,
          plan_type: 'client', 
          daily_discoveries_used: 0,
          daily_discovery_allowance: Infinity,
          weekly_discoveries_used: 0,
          weekly_discovery_allowance: Infinity,
          can_discover_today: true,
          can_discover_this_week: true,
      };
      // TODO: Re-enable when backend endpoint is ready
      // const response = await apiRequest("GET", `/client/discovery-status`);
      // if (!response.ok) throw new Error("Failed to fetch discovery status");
      // return response.json();
    },
    enabled: !!user && !authLoading,
  });

  // --- Client-Specific Mutations ---
  const clientDiscoverPreviewMutation = useMutation({
    mutationFn: async (campaignId: string) => {
          const response = await apiRequest("POST", `/client/client/campaigns/${campaignId}/discover-preview`, {});
        if (!response.ok) { const errorData = await response.json().catch(() => ({detail: "Failed to get discovery preview"})); throw new Error(errorData.detail);}
        return response.json();
    },
    onSuccess: (data: PodcastPreview[]) => {
        setClientDiscoveredPodcastPreviews(data);
        setSelectedForReview(new Set());
        refetchDiscoveryStatus();
        toast({title: "Discovery Preview Ready", description: `Found ${data.length} potential podcasts. Select up to 5 for full review.`});
    },
    onError: (error: any) => {toast({title: "Discovery Failed", description: error.message, variant: "destructive"});}
  });

  const requestReviewMutation = useMutation({
      mutationFn: async (payload: { campaign_id: string; media_ids: number[] }) => {
        const response = await apiRequest("POST", `/client/request-discovery-review`, payload);
        if (!response.ok) { const errorData = await response.json().catch(() => ({detail: "Failed to request review"})); throw new Error(errorData.detail);}
        return response.json();
    },
    onSuccess: (data) => {
        setClientDiscoveredPodcastPreviews([]);
        setSelectedForReview(new Set());
        toast({title: "Review Requested", description: data.message || "Selected podcasts sent for review.",});
    },
    onError: (error: any) => {toast({title: "Review Request Failed", description: error.message, variant: "destructive"});}
  });

  // --- Staff/Admin Specific Mutation for discovering matches for a campaign ---
  const staffAdminDiscoverForCampaignMutation = useMutation({
    mutationFn: async (params: { campaignId: string; maxMatches?: number }) => { 
      const { campaignId, maxMatches } = params;
      if (!campaignId) {
        throw new Error("A campaign must be selected to discover matches.");
      }
      const payload: { max_matches?: number } = {};
      if (maxMatches && maxMatches > 0) {
        payload.max_matches = maxMatches;
      }
      const response = await apiRequest("POST", `/match-suggestions/campaigns/${campaignId}/discover`, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to discover matches for campaign." }));
        throw new Error(errorData.detail);
      }
      return response.json(); 
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "🚀 Discovery Pipeline Started", 
        description: data.message || `Automated discovery initiated for campaign. Podcasts will be discovered → enriched → vetted → matched automatically.` 
      });
      
      
      // Invalidate queries that would show the results of discovery
      if (selectedCampaignId) {
        tanstackQueryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", selectedCampaignId] });
        tanstackQueryClient.invalidateQueries({ queryKey: ["matchSuggestions", selectedCampaignId] }); 
        tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] }); 
        // Show progress tracker
        setShowProgressTracker(true);
      }
      setStaffDiscoveredMatches([]); 
    },
    onError: (error: any) => {
      setStaffDiscoveredMatches([]);
      toast({ title: "Discovery Failed", description: error.message, variant: "destructive" });
    },
  });

  // --- Event Handlers ---
  const handleClientDiscover = () => { 
      if (!selectedCampaignId) {
          toast({title: "Campaign Required", description: "Please select a campaign to start discovery.", variant: "destructive"});
          return;
      }
      if (userRoleLower === 'client') {
        clientDiscoverPreviewMutation.mutate(selectedCampaignId);
      }
  };
  const handleToggleSelectForReview = (mediaId: number) => { 
      setSelectedForReview(prev => {
          const next = new Set(prev);
          if (next.has(mediaId)) next.delete(mediaId);
          else if (next.size < 5) next.add(mediaId); // Limit to 5 selections
          else toast({title: "Selection Limit", description: "You can select up to 5 podcasts for review.", variant: "default"});
          return next;
      });
  };
  const handleClientRequestReview = () => { 
      if (!selectedCampaignId || selectedForReview.size === 0) {
          toast({title: "Selection Required", description: "Please select a campaign and at least one podcast to review.", variant: "destructive"});
          return;
      }
      if (userRoleLower === 'client') {
        requestReviewMutation.mutate({ campaign_id: selectedCampaignId, media_ids: Array.from(selectedForReview)});
      }
  };

  const handleStaffAdminDiscover = () => {
    if (!selectedCampaignId) { 
      toast({ title: "Campaign Required", description: "Please select a client campaign to run discovery for.", variant: "destructive" });
      return;
    }
    
    const maxMatches = parseInt(maxMatchesInput, 10);
    const mutationParams: { campaignId: string; maxMatches?: number } = { campaignId: selectedCampaignId };
    if (!isNaN(maxMatches) && maxMatches > 0) {
      mutationParams.maxMatches = maxMatches;
    } else if (maxMatchesInput !== "") { // If input is not empty but not a valid positive number
      toast({ title: "Invalid Input", description: "Max Matches must be a positive number.", variant: "destructive" });
      return;
    }

    setStaffDiscoveredMatches([]); 
    setSortOrder('desc'); 
    staffAdminDiscoverForCampaignMutation.mutate(mutationParams);
  };

  const sortedStaffDiscoveredMatches = [...staffDiscoveredMatches].sort((a, b) => {
    if (sortOrder === 'none') return 0;
    const scoreA = a.match_score ?? -1; // Treat null/undefined as lowest score
    const scoreB = b.match_score ?? -1;
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  const handleDiscoveryComplete = () => {
    setShowProgressTracker(false);
    toast({
      title: "🎉 Discovery Pipeline Complete!",
      description: "New review tasks are ready in the Approvals page."
    });
    // Additional success actions can be added here
  };

  // --- Render Logic ---
  if (authLoading || (userRoleLower === 'client' && (isLoadingClientCampaigns || isLoadingStatus))) {
    return <div className="p-6"><Skeleton className="h-12 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (userRoleLower !== 'client' && isLoadingClientCampaigns) { // For staff/admin, campaign list might load separately
    return <div className="p-6"><Skeleton className="h-12 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }


  const canClientDiscover = userRoleLower === 'client' && discoveryStatus &&
                           discoveryStatus.can_discover_today && discoveryStatus.can_discover_this_week;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* --- UI for CLIENTS --- */}
      {userRoleLower === 'client' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Discover Podcasts for Your Campaign</CardTitle>
              <CardDescription>Select your campaign to find relevant podcasts based on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCampaignId || ""} onValueChange={(value) => setSelectedCampaignId(value === "none" ? null : value)} disabled={clientCampaigns.length === 0}>
                <SelectTrigger disabled={isLoadingClientCampaigns || clientCampaigns.length === 0}>
                    <SelectValue placeholder="Select your active campaign..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none" disabled>Select your active campaign...</SelectItem>
                    {clientCampaigns.map((campaign) => (
                        <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                            {campaign.campaign_name}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {discoveryStatus && (
                <div className="text-sm text-gray-600 border p-3 rounded-md bg-gray-50">
                    <p>Daily Discoveries: {discoveryStatus.daily_discoveries_used} / {discoveryStatus.daily_discovery_allowance === Infinity ? 'Unlimited' : discoveryStatus.daily_discovery_allowance}</p>
                    <p>Weekly Discoveries: {discoveryStatus.weekly_discoveries_used} / {discoveryStatus.weekly_discovery_allowance === Infinity ? 'Unlimited' : discoveryStatus.weekly_discovery_allowance}</p>
                    {!discoveryStatus.can_discover_today && <p className="text-orange-600">Daily limit reached.</p>}
                    {!discoveryStatus.can_discover_this_week && <p className="text-red-600">Weekly limit reached.</p>}
                </div>
              )}
              <Button onClick={handleClientDiscover} disabled={!selectedCampaignId || clientDiscoverPreviewMutation.isPending || !canClientDiscover} className="w-full sm:w-auto bg-primary text-primary-foreground">
                {clientDiscoverPreviewMutation.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin"/>Searching...</> : <><Lightbulb className="mr-2 h-4 w-4"/>Find Podcast Previews</>}
              </Button>
            </CardContent>
          </Card>

          {clientDiscoverPreviewMutation.isSuccess && clientDiscoveredPodcastPreviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Podcast Previews Found</CardTitle>
                <CardDescription>Select up to 5 podcasts to request a full review by our team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientDiscoveredPodcastPreviews.map(podcast => (
                    <Card key={podcast.media_id} className={`p-3 border rounded-md flex items-start gap-3 transition-all ${selectedForReview.has(podcast.media_id) ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`}>
                        <Checkbox id={`podcast-${podcast.media_id}`} checked={selectedForReview.has(podcast.media_id)} onCheckedChange={() => handleToggleSelectForReview(podcast.media_id)} className="mt-1"/>
                        <div className="flex-1">
                            <label htmlFor={`podcast-${podcast.media_id}`} className="font-medium text-sm cursor-pointer">{podcast.name}</label>
                            {podcast.website && <a href={podcast.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block"><ExternalLink className="inline h-3 w-3 mr-0.5"/>Visit Website</a>}
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{podcast.description || "No description available."}</p>
                        </div>
                    </Card>
                ))}
                 {selectedForReview.size > 0 && (
                    <Button onClick={handleClientRequestReview} disabled={requestReviewMutation.isPending} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white mt-4">
                        {requestReviewMutation.isPending ? "Submitting..." : <><Send className="mr-2 h-4 w-4"/>Request Full Review ({selectedForReview.size} Selected)</>}
                    </Button>
                )}
              </CardContent>
            </Card>
          )}
           {clientDiscoverPreviewMutation.isSuccess && clientDiscoveredPodcastPreviews.length === 0 && (
            <Card><CardContent className="p-6 text-center text-gray-500">No relevant podcast previews found for this campaign based on your current profile.</CardContent></Card>
          )}
        </>
      )}

      {/* --- UI for STAFF/ADMIN --- */}
      {(userRoleLower === 'staff' || userRoleLower === 'admin') && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Podcast Discovery for Campaign (Staff/Admin)</CardTitle>
              <CardDescription>
                Select a client campaign. The system will use its keywords to find podcasts and initiate the match suggestion process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedCampaignId || ""}
                onValueChange={(value) => {
                  setSelectedCampaignId(value === "none" ? null : value);
                  setStaffDiscoveredMatches([]); 
                  setMaxMatchesInput(""); // Reset max matches input when campaign changes
                }}
                disabled={isLoadingClientCampaigns || clientCampaigns.length === 0}
              >
                 <SelectTrigger className="w-full md:w-2/3">
                    <SelectValue placeholder="Select Client Campaign to Run Discovery For..." />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="none" disabled>Select Client Campaign...</SelectItem>
                    {clientCampaigns.map((campaign) => (
                        <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                            {campaign.campaign_name} 
                        </SelectItem>
                    ))}
                    {clientCampaigns.length === 0 && <div className="p-2 text-sm text-gray-500">No campaigns available.</div>}
                 </SelectContent>
              </Select>

              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-grow sm:flex-grow-0 sm:w-1/3">
                  <label htmlFor="maxMatches" className="block text-sm font-medium text-gray-700 mb-1">
                    Max New Matches (Optional)
                  </label>
                  <Input
                    id="maxMatches"
                    type="number"
                    placeholder="e.g., 10"
                    value={maxMatchesInput}
                    onChange={(e) => setMaxMatchesInput(e.target.value)}
                    className="w-full"
                    min="1"
                  />
                </div>
                <Button
                  onClick={handleStaffAdminDiscover}
                  disabled={!selectedCampaignId || staffAdminDiscoverForCampaignMutation.isPending}
                  className="w-full sm:w-auto bg-primary text-primary-foreground flex-shrink-0"
                >
                  {staffAdminDiscoverForCampaignMutation.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin"/>Starting Discovery...</> : <><Search className="mr-2 h-4 w-4"/>Run Discovery for Campaign</>}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Automated discovery pipeline: Podcasts will be discovered → AI analysis → quality vetting → match creation → review tasks generated.
                Leave Max Matches blank for default behavior (~50 matches).
              </p>
            </CardContent>
          </Card>

          {/* Progress Tracker Component */}
          {showProgressTracker && selectedCampaignId && (
            <DiscoveryProgressTracker 
              campaignId={selectedCampaignId}
              isActive={showProgressTracker}
              onComplete={handleDiscoveryComplete}
            />
          )}
          
          {/* Success Message */}
          {staffAdminDiscoverForCampaignMutation.isSuccess && !showProgressTracker && staffDiscoveredMatches.length === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-green-800">Discovery Pipeline Started!</h3>
                  <p className="text-sm text-green-600 max-w-md">
                    The automated discovery system is now finding and analyzing podcasts for your campaign. 
                    Review tasks will appear in the <Link href="/approvals" className="underline font-medium">Approvals page</Link> when ready.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* The section for displaying staffDiscoveredMatches (if any are loaded from another source or kept from previous logic) */}
          {staffDiscoveredMatches.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <CardTitle>Discovery Results & Suggestions Created ({staffDiscoveredMatches.length})</CardTitle>
                    <CardDescription>
                      Displaying matches for '{clientCampaigns.find(c => c.campaign_id === selectedCampaignId)?.campaign_name || 'Selected Campaign'}'.
                    </CardDescription>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                      <SelectTrigger className="w-full sm:w-[180px] text-xs h-9">
                        <SelectValue placeholder="Sort by score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Score: High to Low</SelectItem>
                        <SelectItem value="asc">Score: Low to High</SelectItem>
                        <SelectItem value="none">Default Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {sortedStaffDiscoveredMatches.map(match => ( 
                    <Card key={match.match_id} className="p-4 text-sm border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between">
                            <div className="flex-1 mb-2 sm:mb-0">
                                <h4 className="font-semibold text-gray-800">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                                <p className="text-xs text-gray-500">
                                    Campaign: {match.campaign_name || 'N/A'} (Client: {match.client_name || 'N/A'})
                                </p>
                                {match.media_website && (
                                    <a
                                        href={match.media_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                                    >
                                        <ExternalLink className="inline h-3 w-3 mr-1"/>Visit Website
                                    </a>
                                )}
                            </div>
                            <div className="flex-shrink-0 sm:text-right">
                                {typeof match.match_score === 'number' && (
                                    <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700 text-white mb-1 sm:ml-auto block w-fit px-2.5 py-1">
                                        Match Score: {Math.round(match.match_score * 100)}%
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs capitalize block w-fit sm:ml-auto">
                                    Status: {match.status ? match.status.replace('_', ' ') : 'N/A'}
                                </Badge>
                                <p className="text-xs text-gray-400 mt-1">
                                    Created: {new Date(match.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {match.ai_reasoning && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <h5 className="text-xs font-semibold text-gray-600 mb-0.5 flex items-center">
                                  <Lightbulb className="inline h-3.5 w-3.5 mr-1 text-yellow-500 shrink-0" /> AI Reasoning:
                                </h5> 
                                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-pre-wrap break-words">{match.ai_reasoning}</p>
                            </div>
                        )}
                        {match.matched_keywords && match.matched_keywords.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <span className="text-xs font-medium text-gray-500">Matched Keywords: </span>
                                {match.matched_keywords.map(kw => (
                                    <Badge key={kw} variant="secondary" className="mr-1 text-xs">{kw}</Badge>
                                ))}
                            </div>
                        )}
                        <div className="mt-3 text-right">
                            <Link href={`/approvals?match_id=${match.match_id}`}> 
                                <Button size="sm" variant="ghost" className="text-xs text-primary hover:text-primary/80">
                                    View/Review Suggestion <ArrowRight className="ml-1 h-3 w-3"/>
                                </Button>
                            </Link>
                            <Link href={`/media/${match.media_id}`}> 
                                <Button size="sm" variant="outline" className="text-xs ml-2">
                                    View Podcast Details <ExternalLink className="ml-1 h-3 w-3"/>
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader><CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>How Discovery Works</CardTitle></CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-1">
            <p><strong>For Clients:</strong> Select your active campaign. Our AI analyzes your campaign goals and profile (from the Questionnaire) to find relevant podcast previews. You can then select up to 5 previews to request a full review by our team. Your discovery usage is subject to plan limits.</p>
            <p><strong>For Staff/Admins:</strong> Select a client campaign. The system will use its existing profile and keywords to find podcasts, automatically create match suggestions, and generate review tasks for the team.</p>
        </CardContent>
      </Card>
    </div>
  );
}