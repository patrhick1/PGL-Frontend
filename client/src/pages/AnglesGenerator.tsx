// client/src/pages/AnglesGenerator.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Link as LinkIcon, // Renamed to avoid conflict with wouter Link
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter"; // For navigation links

interface ClientCampaign {
  campaign_id: string;
  campaign_name: string;
  person_id: number;
  campaign_bio?: string | null;
  campaign_angles?: string | null;
  mock_interview_trancript?: string | null;
  campaign_keywords?: string[] | null;
}

// This interface is a placeholder. The actual angles are generated as GDoc content.
// The backend returns links to these GDocs.
interface GeneratedAngleDisplayInfo {
  title: string; // e.g., "Generated Angles Document"
  link: string;
  type: "angles" | "bio";
}

interface AnglesBioTriggerResponse {
    campaign_id: string;
    status: string; 
    message: string;
    details?: {
        bio_doc_link?: string | null;
        angles_doc_link?: string | null;
        keywords?: string[] | null;
    } | null;
}

export default function AnglesGenerator() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<AnglesBioTriggerResponse['details']>(null);
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const { data: clientCampaigns = [], isLoading: isLoadingCampaigns } = useQuery<ClientCampaign[]>({
    queryKey: ["clientCampaignsForAngles", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) return [];
      const response = await apiRequest("GET", `/campaigns/?person_id=${user.person_id}`);
      if (!response.ok) throw new Error("Failed to fetch client campaigns");
      const campaigns: ClientCampaign[] = await response.json();
      // Filter for campaigns that have a mock interview transcript, indicating questionnaire is likely filled.
      return campaigns.filter(c => c.mock_interview_trancript && c.mock_interview_trancript.trim() !== "");
    },
    enabled: !!user?.person_id && !authLoading,
  });
  
  const selectedCampaignDetails = clientCampaigns.find(c => c.campaign_id === selectedCampaignId);

  const triggerAnglesBioMutation = useMutation({
    mutationFn: async (campaignId: string): Promise<AnglesBioTriggerResponse> => {
      const response = await apiRequest("POST", `/campaigns/${campaignId}/generate-angles-bio`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to trigger generation."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "success" && data.details) {
        setGeneratedContent(data.details);
        toast({ title: "Generation Successful", description: data.message });
      } else {
        setGeneratedContent(null); // Clear previous results if not successful
        toast({ title: "Generation Info", description: data.message, variant: data.status === "error" ? "destructive" : "default" });
      }
      if (selectedCampaignId) {
        tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForAngles", user?.person_id] }); // Refetch to update displayed campaign details
        tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetails", selectedCampaignId] }); // If you have a query for single campaign details
      }
    },
    onError: (error: any) => {
      setGeneratedContent(null);
      toast({ title: "Generation Failed", description: error.message || "Could not trigger angles/bio generation.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedCampaignId) {
      toast({ title: "Campaign Required", description: "Please select a campaign.", variant: "destructive" });
      return;
    }
    const campaign = clientCampaigns.find(c => c.campaign_id === selectedCampaignId);
    if (!campaign || !campaign.mock_interview_trancript || campaign.mock_interview_trancript.trim() === "") {
        toast({ title: "Questionnaire Needed", description: "The selected campaign needs a completed questionnaire (which populates the mock interview transcript) before generating angles/bio.", variant: "destructive" });
        return;
    }
    setGeneratedContent(null); // Clear previous results
    triggerAnglesBioMutation.mutate(selectedCampaignId);
  };

  if (authLoading || isLoadingCampaigns) {
    return <div className="p-6 text-center"><Skeleton className="h-10 w-1/2 mx-auto mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />AI-Powered Bio & Angles Generator</CardTitle>
          <CardDescription>
            Select a campaign with a completed questionnaire. Our AI will analyze the information
            to generate a compelling client bio and targeted pitch angles, saved as Google Docs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="campaign-select-angles" className="text-sm font-medium mb-2 block">
              Select Campaign
            </label>
            {clientCampaigns.length === 0 && !isLoadingCampaigns ? (
                <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200 text-yellow-700 text-sm">
                    <AlertTriangle className="inline h-4 w-4 mr-2" />
                    No campaigns found with completed questionnaires. Please fill out the <Link href="/questionnaire" className="underline hover:text-yellow-800">questionnaire</Link> for a campaign first.
                </div>
            ) : (
              <Select
                value={selectedCampaignId || ""}
                onValueChange={(value) => {
                  setSelectedCampaignId(value === "none" ? null : value);
                  setGeneratedContent(null);
                }}
              >
                <SelectTrigger id="campaign-select-angles" disabled={isLoadingCampaigns}>
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Choose a campaign...</SelectItem>
                  {clientCampaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCampaignDetails && (
            <div className="p-3 border rounded-md bg-gray-50 text-xs text-gray-600 space-y-1">
                <p><strong>Selected Campaign:</strong> {selectedCampaignDetails.campaign_name}</p>
                <p>
                    <strong>Questionnaire/Mock Interview Status:</strong> 
                    {selectedCampaignDetails.mock_interview_trancript ? 
                        <Badge variant="default" className="bg-green-100 text-green-700 ml-1">Ready for Generation</Badge> :
                        <Badge variant="destructive" className="ml-1">Questionnaire Incomplete</Badge>
                    }
                </p>
                {selectedCampaignDetails.campaign_bio && 
                    <p><strong>Current Bio:</strong> <a href={selectedCampaignDetails.campaign_bio} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">View Document</a></p>}
                {selectedCampaignDetails.campaign_angles && 
                    <p><strong>Current Angles:</strong> <a href={selectedCampaignDetails.campaign_angles} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">View Document</a></p>}
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={!selectedCampaignId || triggerAnglesBioMutation.isPending || !selectedCampaignDetails?.mock_interview_trancript}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
          >
            {triggerAnglesBioMutation.isPending ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Generate Bio & Angles</>
            )}
          </Button>
        </CardContent>
      </Card>

      {triggerAnglesBioMutation.isSuccess && generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content for "{selectedCampaignDetails?.campaign_name}"</CardTitle>
            <CardDescription>{triggerAnglesBioMutation.data?.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedContent.bio_doc_link && (
              <div>
                <h3 className="font-semibold mb-1 text-gray-700">Generated Client Bio:</h3>
                <a href={generatedContent.bio_doc_link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 flex items-center text-sm">
                    <LinkIcon className="h-4 w-4 mr-1"/> View Bio Document
                </a>
              </div>
            )}
            {generatedContent.angles_doc_link && (
              <div>
                <h3 className="font-semibold mb-1 text-gray-700">Generated Pitch Angles:</h3>
                <a href={generatedContent.angles_doc_link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 flex items-center text-sm">
                    <LinkIcon className="h-4 w-4 mr-1"/> View Angles Document
                </a>
              </div>
            )}
            {generatedContent.keywords && generatedContent.keywords.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1 text-gray-700">Generated Keywords:</h3>
                <div className="flex flex-wrap gap-2">
                    {generatedContent.keywords.map((kw, idx) => <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>)}
                </div>
              </div>
            )}
            {!generatedContent.bio_doc_link && !generatedContent.angles_doc_link && (!generatedContent.keywords || generatedContent.keywords.length === 0) && (
                <p className="text-sm text-gray-500">No specific content links or keywords were returned by the generation process, but it may have completed successfully. Check the campaign record for updates.</p>
            )}
          </CardContent>
        </Card>
      )}
       <Card className="bg-blue-50 border-blue-200 mt-8">
        <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>How Bio & Angles Generation Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-2">
            <p>1. First, ensure you have selected a campaign and completed its <Link href="/questionnaire" className="font-medium underline hover:text-blue-700">Questionnaire</Link>. This provides the core information (mock interview transcript) our AI needs.</p>
            <p>2. Once a campaign with a completed questionnaire is selected, click the "Generate Bio & Angles" button.</p>
            <p>3. Our AI system (<code>AnglesProcessorPG</code> on the backend) will analyze the mock interview transcript and other campaign details.</p>
            <p>4. It will then generate:</p>
            <ul className="list-disc list-inside pl-4">
                <li>A comprehensive client bio (Full, Summary, Short versions).</li>
                <li>A set of at least 10 potential pitch angles (Topic, Outcome, Description).</li>
                <li>A list of relevant keywords for the campaign.</li>
            </ul>
            <p>5. The generated bio and angles will be saved as new Google Documents, and links to these documents will be stored in the campaign's record in the database. Keywords will also be saved to the campaign.</p>
            <p>6. You will see links to the generated documents and the keywords on this page after successful generation.</p>
        </CardContent>
      </Card>
    </div>
  );
}