// client/src/pages/PodcastDiscovery.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Zap, Info, CheckCircle, AlertTriangle, ExternalLink, Podcast as PodcastIcon, Download, Star, ThumbsUp, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Removed appQueryClient, use queryClient directly
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

// --- Interfaces ---
interface CampaignForDiscovery {
  campaign_id: string;
  campaign_name: string;
  campaign_keywords?: string[] | null;
}

interface PodcastPreview { // For client discovery preview
  media_id: number;
  name: string | null;
  image_url?: string | null;
  short_description?: string | null; // e.g., first 150 chars of description
  // Add any other preview-specific fields your backend might return
}

interface ClientDiscoveryStatus {
  daily_discovery_count: number;
  weekly_discovery_count: number;
  daily_limit: number;
  weekly_limit: number;
  plan_type: 'free' | 'paid' | string; // Assuming plan_type is returned
}

// MatchSuggestion interface if you decide to show them after "Request Review"
interface MatchSuggestion {
  match_id: number;
  campaign_id: string;
  media_id: number;
  status: string;
  media_name?: string | null;
  media_website?: string | null;
  // ... other fields if needed
}

export default function PodcastDiscovery() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth(); // Get authenticated user

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [discoveredPodcastPreviews, setDiscoveredPodcastPreviews] = useState<PodcastPreview[]>([]);
  const [selectedForReview, setSelectedForReview] = useState<Set<number>>(new Set()); // Set of media_ids

  // Fetch client's campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<CampaignForDiscovery[]>({
    queryKey: ["clientCampaignsForDiscovery", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) return [];
      // Assuming backend /campaigns/ can be filtered by person_id for clients
      const response = await apiRequest("GET", `/campaigns/?person_id=${user.person_id}`);
      if (!response.ok) throw new Error("Failed to fetch client campaigns");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });

  // Fetch client's discovery status (limits, usage)
  const { data: discoveryStatus, isLoading: isLoadingStatus, refetch: refetchDiscoveryStatus } = useQuery<ClientDiscoveryStatus>({
    queryKey: ["clientDiscoveryStatus", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) throw new Error("User not authenticated for discovery status");
      const response = await apiRequest("GET", `/client/discovery-status`); // New backend endpoint
      if (!response.ok) throw new Error("Failed to fetch discovery status");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });

  // Mutation to trigger discovery preview
  const clientDiscoverPreviewMutation = useMutation({
    mutationFn: async (campaignId: string): Promise<PodcastPreview[]> => {
      const response = await apiRequest("POST", `/client/campaigns/${campaignId}/discover-preview`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch podcast previews." }));
        if (response.status === 429) { // Handle rate limit specifically
            throw new Error(errorData.detail || "Discovery limit reached for today/week.");
        }
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setDiscoveredPodcastPreviews(data);
      toast({
        title: "Discovery Preview Ready",
        description: `Found ${data.length} potential podcasts. Select some to request review.`,
      });
      refetchDiscoveryStatus(); // Refresh usage counts
    },
    onError: (error: any) => {
      setDiscoveredPodcastPreviews([]);
      toast({
        title: "Discovery Failed",
        description: error.message || "Could not fetch podcast previews.",
        variant: "destructive",
      });
    },
  });

  // Mutation to request review for selected podcasts
  const requestReviewMutation = useMutation({
    mutationFn: async (payload: { campaign_id: string; media_ids: number[] }): Promise<any> => { // Define expected success response type
      // This assumes Option 2 for discovery count increment (backend handles it here)
      // If Option 1, this endpoint might just create match_suggestions without limit checks here.
      const response = await apiRequest("POST", `/client/request-match-review`, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to request review." }));
         if (response.status === 429) {
            throw new Error(errorData.detail || "Discovery limit reached. Cannot request more reviews.");
        }
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => { // `data` is the response from your backend
      toast({
        title: "Review Requested",
        description: data.message || `Successfully requested review for ${selectedForReview.size} podcasts. Our team will vet them.`,
      });
      setSelectedForReview(new Set()); // Clear selection
      setDiscoveredPodcastPreviews([]); // Optionally clear previews or update their status
      refetchDiscoveryStatus(); // Refresh usage counts
      tanstackQueryClient.invalidateQueries({ queryKey: ["/match-suggestions/"] }); // If internal team sees these
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Review Failed",
        description: error.message || "Could not request review for selected podcasts.",
        variant: "destructive",
      });
    },
  });

  const handleDiscover = () => {
    if (!selectedCampaignId) {
      toast({ title: "Campaign Required", description: "Please select a campaign.", variant: "destructive" });
      return;
    }
    if (discoveryStatus && discoveryStatus.daily_discovery_count >= discoveryStatus.daily_limit) {
        toast({ title: "Daily Limit Reached", description: `You've reached your daily discovery limit of ${discoveryStatus.daily_limit}.`, variant: "destructive"});
        return;
    }
    if (discoveryStatus && discoveryStatus.weekly_discovery_count >= discoveryStatus.weekly_limit) {
        toast({ title: "Weekly Limit Reached", description: `You've reached your weekly discovery limit of ${discoveryStatus.weekly_limit}.`, variant: "destructive"});
        return;
    }
    setDiscoveredPodcastPreviews([]);
    setSelectedForReview(new Set());
    clientDiscoverPreviewMutation.mutate(selectedCampaignId);
  };

  const toggleSelectForReview = (mediaId: number) => {
    setSelectedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        // Optional: Check against remaining daily/weekly "selection" credits if different from "preview" credits
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleRequestReview = () => {
    if (!selectedCampaignId || selectedForReview.size === 0) {
      toast({ title: "Selection Required", description: "Please select at least one podcast to request review.", variant: "destructive" });
      return;
    }
    // Optional: Add a check here if "selection" counts towards a different limit than "preview"
    // For now, assuming backend /client/request-match-review handles the final limit check for creating matches.
    requestReviewMutation.mutate({ campaign_id: selectedCampaignId, media_ids: Array.from(selectedForReview) });
  };
  
  const selectedCampaignDetails = campaigns.find(c => c.campaign_id === selectedCampaignId);

  const canDiscover = discoveryStatus &&
                      discoveryStatus.daily_discovery_count < discoveryStatus.daily_limit &&
                      discoveryStatus.weekly_discovery_count < discoveryStatus.weekly_limit;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Discover Podcasts
          </CardTitle>
          <CardDescription>
            Select your campaign to find relevant podcasts based on your profile and keywords.
            {discoveryStatus?.plan_type === 'free' && " Free plan users can discover a limited number of podcasts."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="campaign-select-discovery" className="text-sm font-medium mb-2 block">
              Select Your Campaign
            </label>
            {isLoadingCampaigns || authLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCampaignId || ""}
                onValueChange={(value) => {
                  setSelectedCampaignId(value === "none" ? null : value);
                  setDiscoveredPodcastPreviews([]);
                  setSelectedForReview(new Set());
                }}
              >
                <SelectTrigger id="campaign-select-discovery">
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Choose a campaign...</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name} (Keywords: {(campaign.campaign_keywords || []).join(', ') || 'N/A'})
                    </SelectItem>
                  ))}
                  {campaigns.length === 0 && <p className="p-2 text-xs text-gray-500">No campaigns available. Please complete your profile setup.</p>}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCampaignDetails && (
            <div className="p-3 border rounded-md bg-gray-50 text-xs text-gray-600">
                <p><strong>Selected Campaign:</strong> {selectedCampaignDetails.campaign_name}</p>
                <p><strong>Keywords to be used:</strong> {(selectedCampaignDetails.campaign_keywords || []).join(', ') || 'No keywords set (complete questionnaire/bio & angles)'}</p>
            </div>
          )}

          {isLoadingStatus ? (
            <Skeleton className="h-8 w-1/2" />
          ) : discoveryStatus && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Daily Discoveries Used: {discoveryStatus.daily_discovery_count} / {discoveryStatus.daily_limit}</p>
              <p>Weekly Discoveries Used: {discoveryStatus.weekly_discovery_count} / {discoveryStatus.weekly_limit}</p>
              {discoveryStatus.plan_type === 'free' && (!canDiscover || selectedForReview.size > 0) && (
                <p className="mt-1">
                  <Link href="/settings?tab=billing" className="text-primary underline hover:text-primary/80">
                    Upgrade to a paid plan
                  </Link> for more discoveries.
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleDiscover} 
            disabled={!selectedCampaignId || clientDiscoverPreviewMutation.isPending || !canDiscover || (isLoadingCampaigns || authLoading || isLoadingStatus)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
          >
            {clientDiscoverPreviewMutation.isPending ? (
              <><Zap className="mr-2 h-4 w-4 animate-pulse" />Searching for Podcasts...</>
            ) : (
              <><Search className="mr-2 h-4 w-4" />Find Podcasts</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Display Discovered Podcast Previews */}
      {clientDiscoverPreviewMutation.isSuccess && discoveredPodcastPreviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Podcast Previews Found</CardTitle>
            <CardDescription>
              Select podcasts you're interested in, and our team will vet them for outreach.
              You have {discoveryStatus ? discoveryStatus.daily_limit - discoveryStatus.daily_discovery_count : 0} daily selections remaining.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {discoveredPodcastPreviews.map(podcast => (
                <Card 
                  key={podcast.media_id} 
                  className={`p-3 border rounded-lg flex justify-between items-center transition-all cursor-pointer hover:shadow-md ${selectedForReview.has(podcast.media_id) ? 'ring-2 ring-primary bg-primary/5' : 'border-gray-200'}`}
                  onClick={() => toggleSelectForReview(podcast.media_id)}
                >
                  <div className="flex items-center space-x-3">
                    {podcast.image_url ? (
                        <img src={podcast.image_url} alt={podcast.name || ""} className="h-12 w-12 rounded-md object-cover"/>
                    ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center">
                            <PodcastIcon className="h-6 w-6 text-gray-400"/>
                        </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-800">{podcast.name || `Media ID: ${podcast.media_id}`}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{podcast.short_description || "No description available."}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedForReview.has(podcast.media_id) ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {selectedForReview.size > 0 && (
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleRequestReview} 
                  disabled={requestReviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {requestReviewMutation.isPending ? "Requesting..." : `Request Review for ${selectedForReview.size} Podcast(s)`}
                  <Send className="ml-2 h-4 w-4"/>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {clientDiscoverPreviewMutation.isSuccess && discoveredPodcastPreviews.length === 0 && (
        <Card>
            <CardContent className="p-6 text-center text-gray-500">
                <PodcastIcon className="h-10 w-10 mx-auto mb-2 text-gray-400"/>
                No new podcasts found matching your campaign keywords in this run. Try broadening your campaign keywords or check back later.
            </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>How Client Podcast Discovery Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-2">
            <p>1. Select one of your active campaigns. The discovery will use keywords from your completed questionnaire and generated bio/angles.</p>
            <p>2. Click "Find Podcasts". The system will search for relevant shows.</p>
            <p>3. A list of podcast previews will appear. You can select the ones that seem like a good fit.</p>
            <p>4. Click "Request Review for Selected Podcasts". This sends your selections to our internal team.</p>
            <p>5. Our team will then vet these podcasts thoroughly and, if suitable, proceed with drafting pitches.</p>
            <p><strong>Limits:</strong> Free plan users have daily and weekly limits on how many podcasts they can request for review. Your current usage is displayed above the "Find Podcasts" button.</p>
        </CardContent>
      </Card>
    </div>
  );
}