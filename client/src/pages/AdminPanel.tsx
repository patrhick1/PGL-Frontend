// client/src/pages/AdminPanel.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Plus, Edit, Trash2, KeyRound, Search, Briefcase, Settings as SettingsIcon, Eye, EyeOff, CheckCircle, LinkIcon, RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateCampaignDialog, { PersonForClientSelection as PersonForCampaignDialogs } from "@/components/dialogs/CreateCampaignDialog";
import EditCampaignDialog from "@/components/dialogs/EditCampaignDialog";


// --- Person Schemas (Align with backend: podcast_outreach/api/schemas/person_schemas.py) ---
const personCreateSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required (e.g., client, host, admin, staff)"),
  dashboard_username: z.string().optional(),
  linkedin_profile_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  twitter_profile_url: z.string().url("Invalid Twitter/X URL").optional().or(z.literal("")),
});
type PersonCreateFormData = z.infer<typeof personCreateSchema>;

const personUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.string().min(1, "Role is required").optional(),
  dashboard_username: z.string().optional(),
  linkedin_profile_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  twitter_profile_url: z.string().url("Invalid Twitter/X URL").optional().or(z.literal("")),
});
type PersonUpdateFormData = z.infer<typeof personUpdateSchema>;

const setPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

interface Person {
  person_id: number;
  full_name: string | null;
  email: string;
  role: string | null;
  company_id?: number | null;
  linkedin_profile_url?: string | null;
  twitter_profile_url?: string | null;
  instagram_profile_url?: string | null;
  tiktok_profile_url?: string | null;
  dashboard_username?: string | null;
  attio_contact_id?: string | null;
  created_at: string;
  updated_at: string;
  dashboard_password_hash?: string | null;
}

// --- Campaign Schemas (Align with backend: podcast_outreach/api/schemas/campaign_schemas.py) ---
const campaignBaseSchemaParts = {
  person_id: z.coerce.number().int().positive("Client (Person ID) is required"),
  campaign_name: z.string().min(1, "Campaign name is required"),
  campaign_type: z.string().optional(),
  campaign_keywords_str: z.string().optional().describe("Comma-separated keywords"),
  mock_interview_trancript: z.string().optional(),
  media_kit_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  goal_note: z.string().optional(),
  instantly_campaign_id: z.string().optional(),
};

const campaignCreateSchema = z.object(campaignBaseSchemaParts)
  .transform(data => ({
    ...data,
    campaign_keywords: data.campaign_keywords_str?.split(',').map((kw: string) => kw.trim()).filter((kw: string) => kw) || [],
  }));

type CampaignCreateFormInput = z.input<typeof campaignCreateSchema>; 
type CampaignCreatePayload = z.output<typeof campaignCreateSchema>; 

const campaignUpdateSchemaContents = {
  person_id: z.coerce.number().int().positive("Client (Person ID) is required").optional(),
  campaign_name: z.string().min(1, "Campaign name is required").optional(),
  campaign_type: z.string().optional().nullable(),
  campaign_keywords_str: z.string().optional().nullable().describe("Comma-separated keywords"),
  mock_interview_trancript: z.string().optional().nullable(),
  media_kit_url: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  goal_note: z.string().optional().nullable(),
  instantly_campaign_id: z.string().optional().nullable(),
};
const campaignUpdateSchema = z.object(campaignUpdateSchemaContents)
  .transform(data => ({
    ...data,
    campaign_keywords: data.campaign_keywords_str?.split(',').map((kw: string) => kw.trim()).filter((kw: string) => kw) || undefined, 
  }));

type CampaignUpdateFormInput = z.input<typeof campaignUpdateSchema>;
type CampaignUpdatePayload = z.output<typeof campaignUpdateSchema>;


interface Campaign {
  campaign_id: string; // UUID
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null;       // Link to GDoc
  campaign_angles?: string | null;    // Link to GDoc
  campaign_keywords?: string[] | null; // Consolidated keywords
  embedding_status?: string | null; // Added
  mock_interview_trancript?: string | null;
  media_kit_url?: string | null;
  goal_note?: string | null;
  instantly_campaign_id?: string | null;
  created_at: string;
  embedding_ready?: boolean; // NEW - Placeholder for embedding status (e.g., true if embedding exists)
  // Potentially add client_name if needed for display and not easily joinable in all contexts
  client_name?: string;
}

// --- Create Person Dialog ---
function CreatePersonDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PersonCreateFormData>({
    resolver: zodResolver(personCreateSchema),
    defaultValues: {
      full_name: "", email: "", role: "client", dashboard_username: "",
      linkedin_profile_url: "", twitter_profile_url: "",
    }
  });

  const createPersonMutation = useMutation({
    mutationFn: (data: PersonCreateFormData) => apiRequest("POST", "/people/", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Person created successfully. You can now set their password." });
      form.reset(); setOpen(false); onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Person",
        description: error.message || "Failed to create person.", variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Create Person</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Person</DialogTitle>
          <DialogDescription>Fill in the form below to add a new person to the system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => createPersonMutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="client / staff / admin" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dashboard_username" render={({ field }) => (
              <FormItem><FormLabel>Dashboard Username (Optional)</FormLabel><FormControl><Input placeholder="Leave blank to use email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="linkedin_profile_url" render={({ field }) => (
              <FormItem><FormLabel>LinkedIn URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="twitter_profile_url" render={({ field }) => (
              <FormItem><FormLabel>Twitter/X URL (Optional)</FormLabel><FormControl><Input placeholder="https://x.com/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createPersonMutation.isPending}>
                {createPersonMutation.isPending ? "Creating..." : "Create Person"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Person Dialog ---
function EditPersonDialog({ person, open, onOpenChange, onSuccess }: { person: Person | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void; }) {
  const { toast } = useToast();
  const form = useForm<PersonUpdateFormData>({
    resolver: zodResolver(personUpdateSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (person && open) { // Reset form only when dialog opens with a person
      form.reset({
        full_name: person.full_name || "",
        email: person.email || "",
        role: person.role || "",
        dashboard_username: person.dashboard_username || "",
        linkedin_profile_url: person.linkedin_profile_url || "",
        twitter_profile_url: person.twitter_profile_url || "",
      });
    }
  }, [person, form, open]);

  const editPersonMutation = useMutation({
    mutationFn: (data: PersonUpdateFormData) => apiRequest("PUT", `/people/${person!.person_id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Person updated successfully." });
      onOpenChange(false); onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error Updating Person", description: error.message || "Failed to update person.", variant: "destructive" });
    }
  });

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Person: {person.full_name || person.email}</DialogTitle>
          <DialogDescription>Edit the details for this person.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => editPersonMutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dashboard_username" render={({ field }) => (
              <FormItem><FormLabel>Dashboard Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="linkedin_profile_url" render={({ field }) => (
              <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="twitter_profile_url" render={({ field }) => (
              <FormItem><FormLabel>Twitter/X URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={editPersonMutation.isPending}>
                {editPersonMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Set Password Dialog ---
function SetPasswordDialog({ personId, personName, open, onOpenChange, onSuccess }: { personId: number | null; personName: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess?: () => void; }) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const setPasswordMutation = useMutation({
    mutationFn: (data: { password: string }) => apiRequest("PUT", `/people/${personId}/set-password`, data),
    onSuccess: () => {
      toast({ title: "Success", description: `Password set for ${personName || 'user'}.` });
      form.reset(); onOpenChange(false); onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Error Setting Password", description: error.message || "Failed to set password.", variant: "destructive" });
    }
  });

  if (!personId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Password for {personName || `Person ID: ${personId}`}</DialogTitle>
          <DialogDescription>Enter and confirm the new password for this user.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => setPasswordMutation.mutate({ password: data.password }))} className="space-y-4">
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} {...field} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                 <FormControl>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={setPasswordMutation.isPending}>
                {setPasswordMutation.isPending ? "Setting..." : "Set Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- People Table ---
function PeopleTable({ people, onEditPerson, onDeletePerson, onSetPassword }: { 
  people: Person[]; 
  onEditPerson: (person: Person) => void; 
  onDeletePerson: (personId: number) => void;
  onSetPassword: (personId: number, personName: string | null) => void;
}) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Password Set?</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-4">No people found.</TableCell></TableRow>
          )}
          {people.map((person) => (
            <TableRow key={person.person_id}>
              <TableCell>{person.person_id}</TableCell>
              <TableCell>{person.full_name || "N/A"}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell><Badge variant={person.role === 'admin' ? 'destructive' : person.role === 'staff' ? 'secondary' : 'outline'}>{person.role || "N/A"}</Badge></TableCell>
              <TableCell>{person.dashboard_username || "N/A"}</TableCell>
              <TableCell className="text-center">
                {person.dashboard_password_hash ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>{new Date(person.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button size="sm" variant="outline" onClick={() => onEditPerson(person)} title="Edit Person">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onSetPassword(person.person_id, person.full_name)} title="Set Password">
                    <KeyRound className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeletePerson(person.person_id)} title="Delete Person">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Campaigns Table ---
function CampaignsTable({ 
  campaigns, onEditCampaign, onDeleteCampaign, onTriggerContentProcessing 
}: { 
  campaigns: Campaign[];
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onTriggerContentProcessing: (campaignId: string) => void;
}) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign Name</TableHead>
            <TableHead>Client ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Embedding Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-4">No campaigns found.</TableCell></TableRow>
          )}
          {campaigns.map((campaign) => (
            <TableRow key={campaign.campaign_id}>
              <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
              <TableCell>{campaign.person_id}</TableCell>
              <TableCell>{campaign.campaign_type || "N/A"}</TableCell>
              <TableCell className="max-w-xs text-xs">
                {(campaign.campaign_keywords && campaign.campaign_keywords.length > 0) 
                  ? campaign.campaign_keywords.slice(0, 3).map(kw => <Badge key={kw} variant="secondary" className="mr-1 mb-1">{kw}</Badge>)
                  : "N/A"}
                {campaign.campaign_keywords && campaign.campaign_keywords.length > 3 && <Badge variant="outline">+{campaign.campaign_keywords.length - 3} more</Badge>}
              </TableCell>
              <TableCell className="text-center">
                {campaign.embedding_status ? (
                    <Badge 
                      variant={
                        campaign.embedding_status === 'completed' ? 'default' :
                        campaign.embedding_status === 'pending' ? 'outline' :
                        campaign.embedding_status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                      className={`capitalize text-xs ${campaign.embedding_status === 'completed' ? 'bg-green-100 text-green-700' : campaign.embedding_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}`}
                    >
                        {campaign.embedding_status.replace(/_/g, ' ')}
                    </Badge>
                    ) : <Badge variant="secondary" className="text-xs">N/A</Badge>}
              </TableCell>
              <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button size="sm" variant="outline" onClick={() => onTriggerContentProcessing(campaign.campaign_id)} title="Re-process Campaign Content & Embedding">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEditCampaign(campaign)} title="Edit Campaign">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteCampaign(campaign.campaign_id)} title="Delete Campaign">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Task Status Interfaces (based on your plan) ---
interface TaskStatus {
  task_name: string;
  last_run_start_time?: string | null;
  last_run_end_time?: string | null;
  last_run_status?: "completed" | "failed" | "running" | "never_run" | string; // string for flexibility
  last_run_details?: string | null;
  next_scheduled_run?: string | null;
}

// --- Main Admin Panel Component ---
export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  const [isCreatePersonDialogOpen, setIsCreatePersonDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isEditPersonDialogOpen, setIsEditPersonDialogOpen] = useState(false);
  const [passwordPerson, setPasswordPerson] = useState<{ id: number; name: string | null } | null>(null);
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = useState(false);

  // State for refactored campaign dialogs
  const [isCreateCampaignDialogOpen, setIsCreateCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditCampaignDialogOpen, setIsEditCampaignDialogOpen] = useState(false);

  // State for running tasks
  const [runningTasks, setRunningTasks] = useState<Record<string, boolean>>({});

  const { data: people = [], isLoading: isLoadingPeople, error: peopleError } = useQuery<Person[]>({
    queryKey: ["/people/"], retry: 1,
  });
  const { data: campaignsData = [], isLoading: isLoadingCampaigns, error: campaignsError } = useQuery<Campaign[]>({
    queryKey: ["/campaigns/"], retry: 1,
  });

  const campaignsWithClientNames = useMemo(() => {
    if (!campaignsData || !people) return [];
    return campaignsData.map(campaign => {
      const client = people.find(p => p.person_id === campaign.person_id);
      return { 
        ...campaign, 
        client_name: client?.full_name || `Client ID: ${campaign.person_id}` 
      };
    });
  }, [campaignsData, people]);

  const filteredCampaigns = useMemo(() => {
    if (!campaignsWithClientNames) return [];
    return campaignsWithClientNames.filter(campaign =>
      campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaign_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.campaign_type && campaign.campaign_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.client_name && campaign.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [campaignsWithClientNames, searchTerm]);

  // --- Queries for Task Statuses ---
  const { data: episodeSyncStatus, isLoading: isLoadingEpisodeSyncStatus } = useQuery<TaskStatus>({
    queryKey: ["/tasks/status/fetch_podcast_episodes"],
    queryFn: async () => { 
      const response = await apiRequest("GET", "/tasks/status/fetch_podcast_episodes");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch episode sync status" }));
        throw new Error(errorData.detail || "Failed to fetch episode sync status");
      }
      return response.json();
    },
    retry: 1,
  });

  const { data: transcriptionTaskStatus, isLoading: isLoadingTranscriptionTaskStatus } = useQuery<TaskStatus>({
    queryKey: ["/tasks/status/transcribe_podcast"], // Or transcribe_podcast_episodes if that's the backend task name
    queryFn: async () => { 
      const response = await apiRequest("GET", "/tasks/status/transcribe_podcast");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch transcription status" }));
        throw new Error(errorData.detail || "Failed to fetch transcription status");
      }
      return response.json();
    },
    retry: 1,
  });

  // --- Task Management Logic --- START
  const triggerTaskMutation = useMutation<any, Error, string, unknown>({
    mutationFn: async (taskName: string) => {
      toast({ title: "Task Triggered", description: `Attempting to start task: ${taskName}...` });
      const response = await apiRequest("POST", `/tasks/run/${taskName}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Failed to trigger task ${taskName}` }));
        throw new Error(errorData.detail || `Failed to trigger task ${taskName}`);
      }
      return response.json(); 
    },
    // Note: onSuccess and onError for useMutation are handled per-call in handleTriggerTask for more specific feedback
  });

  const handleTriggerTask = (taskName: string) => {
    setRunningTasks(prev => ({ ...prev, [taskName]: true }));
    triggerTaskMutation.mutate(taskName, {
      onSuccess: (data) => {
        toast({ title: "Task Success", description: data.message });
        setRunningTasks(prev => ({ ...prev, [taskName]: false }));
        // Potentially invalidate queries related to system status or the task's output here
        // e.g., tanstackQueryClient.invalidateQueries({ queryKey: ["systemStatus"] });
      },
      onError: (error: Error) => {
        toast({ title: "Task Failed", description: `Error running task '${taskName}': ${error.message}`, variant: "destructive" });
        setRunningTasks(prev => ({ ...prev, [taskName]: false }));
      },
    });
  };

  const isTaskRunning = (taskName: string): boolean => !!runningTasks[taskName];
  // --- Task Management Logic --- END

  const deletePersonMutation = useMutation({
    mutationFn: (personId: number) => apiRequest("DELETE", `/people/${personId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Person deleted successfully" });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] });
    },
    onError: (error: any) => {
      toast({ title: "Error Deleting Person", description: error.message || "Failed to delete person.", variant: "destructive" });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiRequest("DELETE", `/campaigns/${campaignId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign deleted successfully" });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/"] });
    },
    onError: (error: any) => {
      toast({ title: "Error Deleting Campaign", description: error.message || "Failed to delete campaign.", variant: "destructive" });
    }
  });

  const handleDeletePerson = (personId: number) => {
    if (window.confirm("Are you sure you want to delete this person? This action cannot be undone and might affect associated campaigns.")) {
      deletePersonMutation.mutate(personId);
    }
  };
  
  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const openEditPersonDialog = (person: Person) => { setEditingPerson(person); setIsEditPersonDialogOpen(true); };
  const openSetPasswordDialog = (personId: number, personName: string | null) => { setPasswordPerson({ id: personId, name: personName }); setIsSetPasswordDialogOpen(true); };
  const openEditCampaignDialog = (campaign: Campaign) => { setEditingCampaign(campaign); setIsEditCampaignDialogOpen(true); };


  const filteredPeople = people.filter((person: Person) =>
    (person.full_name && person.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (person.dashboard_username && person.dashboard_username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    person.person_id.toString().includes(searchTerm)
  );
  // Client-side filtering for campaigns is now implemented with filteredCampaigns

  const stats = {
    totalPeople: people.length,
    totalCampaigns: campaignsData.length,
  };

  const handleTriggerCampaignContentProcessing = (campaignId: string) => {
    // Construct the specific task name or directly use the new API structure
    // New API: POST /tasks/run/process_campaign_content?campaign_id={campaignId}
    // Using the generic task handler by constructing a specific task name is one way, 
    // but since this task structure is different, we might need a dedicated mutation or adapt handleTriggerTask.
    // For now, let's adapt handleTriggerTask to allow passing query params as part of the task name for simplicity if it can handle it
    // OR create a new mutation specifically for this.

    // Simpler: Create a new mutation for this specific task structure
    processCampaignContentMutation.mutate(campaignId);
  };

  const processCampaignContentMutation = useMutation<any, Error, string>({
    mutationFn: async (campaignId: string) => {
      toast({ title: "Task Triggered", description: `Attempting to process content for campaign: ${campaignId}...` });
      const response = await apiRequest("POST", `/tasks/run/process_campaign_content?campaign_id=${campaignId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Failed to trigger content processing for campaign ${campaignId}` }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      toast({ title: "Task Success", description: data.message || `Campaign content processing initiated for ${campaignId}.` });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/"] }); // Invalidate the main campaigns list
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", campaignId] }); // Invalidate specific campaign detail if viewed
    },
    onError: (error: Error, campaignId) => {
      toast({ title: "Task Failed", description: `Error processing content for campaign '${campaignId}': ${error.message}`, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage People, Campaigns, and System Settings</p>
        </div>
        {/* Add Create Person Dialog Trigger here */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total People</p>
                <div className="text-3xl font-bold text-gray-900">{isLoadingPeople ? <Skeleton className="h-8 w-16 inline-block"/> : stats.totalPeople}</div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <div className="text-3xl font-bold text-gray-900">{isLoadingCampaigns ? <Skeleton className="h-8 w-16 inline-block"/> : stats.totalCampaigns}</div>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>People Management</CardTitle>
                <CardDescription>View, create, edit, and manage users (clients, staff, admins).</CardDescription>
            </div>
            <CreatePersonDialog onSuccess={() => tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] })} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search people by ID, name, email, role, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {isLoadingPeople ? (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : peopleError ? (
            <p className="text-red-500">Error loading people: {(peopleError as Error).message}</p>
          ) : (
            <PeopleTable 
              people={filteredPeople} 
              onEditPerson={openEditPersonDialog} 
              onDeletePerson={handleDeletePerson}
              onSetPassword={openSetPasswordDialog}
            />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Campaign Management</CardTitle>
                <CardDescription>Overview of all client campaigns. You can trigger content reprocessing here.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateCampaignDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Campaign</Button>
        </CardHeader>
        <CardContent>
          {isLoadingCampaigns ? (
             <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : campaignsError ? (
            <p className="text-red-500">Error loading campaigns: {(campaignsError as Error).message}</p>
          ) : (
            <CampaignsTable 
                campaigns={filteredCampaigns} 
                onEditCampaign={openEditCampaignDialog}
                onDeleteCampaign={handleDeleteCampaign}
                onTriggerContentProcessing={handleTriggerCampaignContentProcessing}
            />
          )}
        </CardContent>
      </Card>

      {isEditPersonDialogOpen && editingPerson && (
        <EditPersonDialog
          person={editingPerson}
          open={isEditPersonDialogOpen}
          onOpenChange={setIsEditPersonDialogOpen}
          onSuccess={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] });
            setEditingPerson(null);
          }}
        />
      )}

      {isSetPasswordDialogOpen && passwordPerson && (
        <SetPasswordDialog
          personId={passwordPerson.id}
          personName={passwordPerson.name}
          open={isSetPasswordDialogOpen}
          onOpenChange={setIsSetPasswordDialogOpen}
          onSuccess={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] });
            setPasswordPerson(null);
          }}
        />
      )}

      {isCreateCampaignDialogOpen && (
        <CreateCampaignDialog 
            people={people as PersonForCampaignDialogs[]} 
            open={isCreateCampaignDialogOpen} 
            onOpenChange={setIsCreateCampaignDialogOpen} 
            onSuccess={() => tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/"] })}
        />
      )}
      
      {isEditCampaignDialogOpen && editingCampaign && (
        <EditCampaignDialog
          campaign={editingCampaign as any}
          people={people as PersonForCampaignDialogs[]}
          open={isEditCampaignDialogOpen}
          onOpenChange={setIsEditCampaignDialogOpen}
          onSuccess={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/"] });
            setEditingCampaign(null);
          }}
        />
      )}
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><SettingsIcon className="mr-2 h-5 w-5"/>System Task Status</CardTitle>
            <CardDescription>Overview of automated background task statuses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">Episode Sync (fetch_podcast_episodes):</h4>
            {isLoadingEpisodeSyncStatus ? <Skeleton className="h-5 w-3/4 mt-1" /> : (
              episodeSyncStatus ? (
                <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                  <p>Last Run: {episodeSyncStatus.last_run_end_time ? new Date(episodeSyncStatus.last_run_end_time).toLocaleString() : 'N/A'}</p>
                  <p>Status: <Badge variant={episodeSyncStatus.last_run_status === 'completed' ? 'default' : episodeSyncStatus.last_run_status === 'running' ? 'outline' : 'destructive'} className={episodeSyncStatus.last_run_status === 'completed' ? 'bg-green-100 text-green-700' : episodeSyncStatus.last_run_status === 'running' ? 'bg-blue-100 text-blue-700' : '' }>{episodeSyncStatus.last_run_status || 'N/A'}</Badge></p>
                  {episodeSyncStatus.last_run_details && <p>Details: {episodeSyncStatus.last_run_details}</p>}
                  {episodeSyncStatus.next_scheduled_run && <p>Next Run: {new Date(episodeSyncStatus.next_scheduled_run).toLocaleString()}</p>}
                </div>
              ) : <p className="text-sm text-gray-500 mt-1">Could not load status.</p>
            )}
          </div>
          <div className="pt-3 border-t">
            <h4 className="font-medium">Transcription & Analysis (transcribe_podcast):</h4>
            {isLoadingTranscriptionTaskStatus ? <Skeleton className="h-5 w-3/4 mt-1" /> : (
              transcriptionTaskStatus ? (
                <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                  <p>Last Run: {transcriptionTaskStatus.last_run_end_time ? new Date(transcriptionTaskStatus.last_run_end_time).toLocaleString() : (transcriptionTaskStatus.last_run_start_time ? `${new Date(transcriptionTaskStatus.last_run_start_time).toLocaleString()} (Still Running)` : 'N/A')}</p>
                  <p>Status: <Badge variant={transcriptionTaskStatus.last_run_status === 'completed' ? 'default' : transcriptionTaskStatus.last_run_status === 'running' ? 'outline' : 'destructive'} className={transcriptionTaskStatus.last_run_status === 'completed' ? 'bg-green-100 text-green-700' : transcriptionTaskStatus.last_run_status === 'running' ? 'bg-blue-100 text-blue-700' : '' }>{transcriptionTaskStatus.last_run_status || 'N/A'}</Badge></p>
                  {transcriptionTaskStatus.last_run_details && <p>Details: {transcriptionTaskStatus.last_run_details}</p>}
                  {transcriptionTaskStatus.next_scheduled_run && <p>Next Run: {new Date(transcriptionTaskStatus.next_scheduled_run).toLocaleString()}</p>}
                </div>
              ) : <p className="text-sm text-gray-500 mt-1">Could not load status.</p>
            )}
          </div>
          {/* Add more task statuses as needed here */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><SettingsIcon className="mr-2 h-5 w-5"/>Manual Task Triggers</CardTitle>
            <CardDescription>Manually initiate system processes. These are global triggers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Podcast Episode Ingestion</h4>
            <p className="text-sm text-gray-600 mb-2">
              Manually trigger a global sync for all podcasts.
              For specific podcast sync, go to its Media Detail page.
            </p>
            <Button
              size="sm"
              onClick={() => handleTriggerTask('fetch_podcast_episodes')}
              disabled={isTaskRunning('fetch_podcast_episodes') || (triggerTaskMutation.status === 'pending' && triggerTaskMutation.variables === 'fetch_podcast_episodes')}
            >
              { (isTaskRunning('fetch_podcast_episodes') || (triggerTaskMutation.status === 'pending' && triggerTaskMutation.variables === 'fetch_podcast_episodes')) ? <><SettingsIcon className="mr-2 h-4 w-4 animate-spin" /> Syncing All...</> : "Sync All Podcast Episodes"}
            </Button>
          </div>
          {/* --- Transcription & Analysis Task --- START */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-1">Episode Transcription & Analysis</h4>
            <p className="text-sm text-gray-600 mb-2">
              Manually trigger transcription & analysis for episodes needing it.
              For specific podcast transcription, go to its Media Detail page.
            </p>
            <Button 
              size="sm"
              onClick={() => handleTriggerTask('transcribe_podcast')}
              disabled={isTaskRunning('transcribe_podcast') || (triggerTaskMutation.status === 'pending' && triggerTaskMutation.variables === 'transcribe_podcast')}
            >
              { (isTaskRunning('transcribe_podcast') || (triggerTaskMutation.status === 'pending' && triggerTaskMutation.variables === 'transcribe_podcast')) ? <><SettingsIcon className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Process Transcriptions & Analysis"}
            </Button>
          </div>
          {/* --- Transcription & Analysis Task --- END */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><SettingsIcon className="mr-2 h-5 w-5"/>System Settings</CardTitle>
            <CardDescription>Configure global system parameters (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-gray-500">System settings management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}