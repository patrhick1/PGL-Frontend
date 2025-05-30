// client/src/pages/CampaignManagement.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as ClientsIcon, Plus, Edit, Trash2, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Import CreateCampaignDialog and EditCampaignDialog from AdminPanel.tsx or a shared components dir
// For this example, I'll assume they are adapted or re-created here if needed.
// You'll need Person and Campaign interfaces (similar to AdminPanel.tsx)

interface PersonSummary {
  person_id: number;
  full_name: string | null;
  email: string;
}
interface CampaignSummary { // Matches CampaignInDB from backend
  campaign_id: string;
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_keywords?: string[] | null;
  created_at: string;
  client_name?: string; // To be populated client-side
}


export default function CampaignManagement() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  // Add states for Create/Edit Campaign Dialogs if you implement them here
  // const [isCreateCampaignDialogOpen, setIsCreateCampaignDialogOpen] = useState(false);
  // const [editingCampaign, setEditingCampaign] = useState<CampaignSummary | null>(null);

  const { data: people = [], isLoading: isLoadingPeople } = useQuery<PersonSummary[]>({
    queryKey: ["/people/"], // Fetch all people to link names
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns, error } = useQuery<CampaignSummary[]>({
    queryKey: ["allCampaignsForManagement"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/campaigns/"); // Fetches all campaigns
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
  });

  const campaignsWithClientNames = campaigns.map(campaign => {
    const client = people.find(p => p.person_id === campaign.person_id);
    return { ...campaign, client_name: client?.full_name || `Client ID: ${campaign.person_id}` };
  });

  const filteredCampaigns = campaignsWithClientNames.filter(campaign =>
    campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.client_name && campaign.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    campaign.campaign_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Delete mutation (similar to AdminPanel.tsx)
  const deleteCampaignMutation = useMutation({ /* ... */ });
  const handleDeleteCampaign = (campaignId: string) => { /* ... */ };


  if (isLoadingPeople || isLoadingCampaigns) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full mb-4" /> {/* Search bar skeleton */}
        <Skeleton className="h-64 w-full" /> {/* Table skeleton */}
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading campaigns: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClientsIcon className="mr-3 h-6 w-6 text-primary" />
            Client & Campaign Management
          </h1>
          <p className="text-gray-600">Oversee all client campaigns and their progress.</p>
        </div>
        {/* <Button onClick={() => setIsCreateCampaignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Campaign
        </Button> */}
        {/* TODO: Add CreateCampaignDialog instance here, passing `people` list for client selection */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns by name, client, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">No campaigns found.</TableCell></TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.campaign_id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>{campaign.client_name}</TableCell>
                      <TableCell>{campaign.campaign_type || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{(campaign.campaign_keywords || []).join(', ') || "N/A"}</TableCell>
                      <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                           <Link href={`/manage/campaigns/${campaign.campaign_id}`}>
                            <Button size="sm" variant="outline" title="View Details">
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                          {/* <Button size="sm" variant="outline" onClick={() => setEditingCampaign(campaign)} title="Edit Campaign">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(campaign.campaign_id)} title="Delete Campaign">
                            <Trash2 className="h-3 w-3" />
                          </Button> */}
                          {/* TODO: Add EditCampaignDialog instance here */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}