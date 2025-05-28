// client/src/pages/PodcastDiscovery.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Added Input import
import { Search, Zap, Info, CheckCircle, AlertTriangle, ExternalLink, Podcast as PodcastIcon } from "lucide-react"; // Renamed Podcast to PodcastIcon
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  campaign_id: string;
  person_id: number;
  campaign_name: string;
  campaign_keywords?: string[] | null;
}

interface MatchSuggestion { // This now includes optional media_name and media_website
  match_id: number;
  campaign_id: string;
  media_id: number;
  status: string;
  match_score?: number | null;
  ai_reasoning?: string | null;
  media_name?: string | null; // Added
  media_website?: string | null; // Added
  created_at: string;
}

export default function PodcastDiscovery() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  // Store the results from the discovery mutation directly
  const [discoveredMatches, setDiscoveredMatches] = useState<MatchSuggestion[]>([]);

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/campaigns/"],
  });

  const triggerDiscoveryMutation = useMutation({
    mutationFn: async (campaignId: string): Promise<MatchSuggestion[]> => { // Ensure return type
      const response = await apiRequest("POST", `/match-suggestions/campaigns/${campaignId}/discover`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to start discovery."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data: MatchSuggestion[]) => {
      setDiscoveredMatches(data); // Store the directly returned matches
      toast({
        title: "Discovery Complete",
        description: `Podcast discovery finished. Found ${data.length} initial matches.`,
      });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] });
      // No need to invalidate a separate match suggestions query if we display results directly
    },
    onError: (error: any) => {
      setDiscoveredMatches([]); // Clear previous results on error
      toast({
        title: "Discovery Failed",
        description: error.message || "Could not start the discovery process.",
        variant: "destructive",
      });
    },
  });

  const handleDiscover = () => {
    if (!selectedCampaignId) {
      toast({
        title: "Campaign Required",
        description: "Please select a campaign to start discovery.",
        variant: "destructive",
      });
      return;
    }
    setDiscoveredMatches([]); // Clear previous results before new discovery
    triggerDiscoveryMutation.mutate(selectedCampaignId);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Discover Podcasts for Campaign
          </CardTitle>
          <CardDescription>
            Select a campaign to find relevant podcasts using its defined keywords.
            New matches will be created and listed below, and also appear in the Approvals queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="campaign-select" className="text-sm font-medium mb-2 block">
              Select Campaign
            </label>
            {isLoadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCampaignId || ""}
                onValueChange={(value) => {
                  setSelectedCampaignId(value === "none" ? null : value);
                  setDiscoveredMatches([]); // Clear matches when campaign changes
                }}
              >
                <SelectTrigger id="campaign-select">
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a campaign...</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name} (Keywords: {(campaign.campaign_keywords || []).join(', ') || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button 
            onClick={handleDiscover} 
            disabled={!selectedCampaignId || triggerDiscoveryMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
          >
            {triggerDiscoveryMutation.isPending ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                Discovering...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start Discovery & Show Matches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Display Discovered Matches */}
      {selectedCampaignId && (triggerDiscoveryMutation.isSuccess || triggerDiscoveryMutation.isPending || triggerDiscoveryMutation.isError) && (
        <Card>
          <CardHeader>
            <CardTitle>Discovery Results for Selected Campaign</CardTitle>
            <CardDescription>
              {triggerDiscoveryMutation.isPending ? "Fetching matches..." : 
               triggerDiscoveryMutation.isError ? "Failed to fetch matches." :
               `Found ${discoveredMatches.length} new match suggestions.`}
              <br/>
              These have been added to the <Link href="/approvals" className="text-primary underline hover:text-primary/80">Approvals page</Link> for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {triggerDiscoveryMutation.isPending && (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
                </div>
            )}
            {triggerDiscoveryMutation.isError && (
                 <div className="text-red-500 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    Error during discovery: {(triggerDiscoveryMutation.error as Error).message}
                </div>
            )}
            {triggerDiscoveryMutation.isSuccess && discoveredMatches.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {discoveredMatches.map(match => (
                  <div key={match.match_id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {match.media_name || `Media ID: ${match.media_id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Match ID: {match.match_id} | Status: <Badge variant="outline" className="text-xs">{match.status}</Badge>
                      </p>
                       {match.ai_reasoning && (
                        <p className="text-xs text-gray-500 mt-1 italic">Reason: {match.ai_reasoning.substring(0,70)}...</p>
                      )}
                    </div>
                    {match.media_website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={match.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Visit
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {triggerDiscoveryMutation.isSuccess && discoveredMatches.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No new matches found in this discovery run.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>How Discovery Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-2">
            <p>1. Select one of your active campaigns from the dropdown.</p>
            <p>2. The system will use the keywords defined in that campaign to search across multiple podcast databases (ListenNotes, Podscan).</p>
            <p>3. Relevant podcasts found will be automatically added to our system (if new) and a "Match Suggestion" will be created linking the podcast to your campaign.</p>
            <p>4. These new match suggestions will appear in the "Approvals" page with a "Pending" status, ready for your review.</p>
            <p>5. The discovery process can take a few moments. Results will populate asynchronously.</p>
        </CardContent>
      </Card>
    </div>
  );
}