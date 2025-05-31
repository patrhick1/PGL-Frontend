// client/src/pages/ClientCampaigns.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, ArrowRight, AlertTriangle, TrendingUp } from "lucide-react"; // Added TrendingUp and AlertTriangle
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

// Interface for the campaign data expected from the backend
// This should align with your backend's CampaignInDB schema,
// potentially with added client_name if your /campaigns/ endpoint enriches it.
interface ClientCampaignSummary {
  campaign_id: string; // UUID
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  created_at: string; // ISO datetime string
  campaign_keywords?: string[] | null;
  embedding_status?: string | null;
  active_placements_count?: number;
  pending_approvals_count?: number; // Number of match_suggestions or pitch_reviews pending client approval
}

export default function ClientCampaigns() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch campaigns for the currently authenticated client
  const { data: campaigns = [], isLoading: campaignsLoading, error } = useQuery<ClientCampaignSummary[]>({
    queryKey: ["clientCampaignsList", user?.person_id], // Query key includes person_id for caching specific to user
    queryFn: async () => {
      if (!user?.person_id) {
        console.warn("ClientCampaigns: No person_id available for fetching campaigns.");
        return [];
      }
      // The backend endpoint /campaigns/ should filter by person_id if provided
      const response = await apiRequest("GET", `/campaigns/?person_id=${user.person_id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch campaigns." }));
        throw new Error(errorData.detail || "Failed to fetch campaigns");
      }
      return response.json();
    },
    enabled: !!user && !!user.person_id && !authLoading, // Only run query if user and person_id are available and auth is not loading
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (authLoading || (campaignsLoading && !campaigns.length && !error)) { // Show detailed loading if campaigns are loading for the first time and no error
    return (
      <div className="space-y-6 p-4 md:p-6 animate-pulse">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" /> {/* Title skeleton */}
            <Skeleton className="h-4 w-72" /> {/* Description skeleton */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-2/5 mb-3" />
                <Skeleton className="h-5 w-3/5 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Campaigns</h2>
            <p className="text-red-500 mb-4">{(error as Error).message || "An unexpected error occurred."}</p>
            <Link href="/">
                <Button variant="outline">Go to Dashboard</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FolderOpen className="mr-3 h-6 w-6 text-primary" />
            My Campaigns
          </h1>
          <p className="text-gray-600">
            Here are your podcast outreach campaigns. Click "View Details" to see progress and manage specific actions.
          </p>
        </div>
        {/* Clients typically don't create campaigns. This is an admin/staff function.
            If clients *can* initiate a campaign request, this button would be enabled.
        <Link href="/request-new-campaign"> // Example path
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Request New Campaign
          </Button>
        </Link> 
        */}
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No Campaigns Yet</h3>
            <p className="text-gray-500 mt-2">
              It looks like you don't have any active campaigns right now.
              <br />
              If you've recently signed up, your account manager will be in touch to set up your first campaign.
            </p>
            <p className="text-gray-500 mt-2">
                Need help? <a href="/contact-support" className="text-primary underline">Contact Support</a>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.campaign_id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg truncate" title={campaign.campaign_name}>
                  {campaign.campaign_name}
                </CardTitle>
                <CardDescription className="flex flex-col sm:flex-row sm:justify-between text-xs">
                  <span>Type: {campaign.campaign_type || "General Outreach"}</span>
                  <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  {campaign.embedding_status && (
                    <div className="text-sm">
                      <span className="font-medium">Profile Strength: </span>
                      <Badge 
                        variant={
                          campaign.embedding_status === 'completed' ? 'default' :
                          campaign.embedding_status === 'pending' ? 'outline' :
                          campaign.embedding_status === 'failed' ? 'destructive' :
                          campaign.embedding_status === 'not_enough_content' ? 'secondary' :
                          'secondary'
                        }
                        className={`capitalize ${campaign.embedding_status === 'completed' ? 'bg-green-100 text-green-700' : campaign.embedding_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : campaign.embedding_status === 'not_enough_content' ? 'bg-orange-100 text-orange-700' : ''}`}
                       >
                         {campaign.embedding_status.replace(/_/g, ' ')}
                       </Badge>
                       {campaign.embedding_status === 'not_enough_content' && 
                         <p className="text-xs text-orange-500 mt-0.5">Complete profile setup for best results.</p> }
                    </div>
                  )}
                  {typeof campaign.active_placements_count === 'number' && (
                    <p className="text-sm text-gray-600">
                      <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" /> 
                      Active Placements: <span className="font-semibold">{campaign.active_placements_count}</span>
                    </p>
                  )}
                  {typeof campaign.pending_approvals_count === 'number' && campaign.pending_approvals_count > 0 && (
                    <p className="text-sm text-yellow-700">
                      <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-500" /> 
                      Pending Your Approval: <span className="font-semibold">{campaign.pending_approvals_count}</span>
                    </p>
                  )}
                </div>
                <Link href={`/my-campaigns/${campaign.campaign_id}`} className="block w-full">
                  <Button variant="outline" className="w-full">
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}