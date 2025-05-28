// client/src/pages/AdminPanel.tsx
import { useState, useEffect } from "react"; // Added useEffect
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query"; // Renamed import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Added DialogFooter, DialogClose
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient"; // Renamed import
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Plus, Edit, Trash2, Mail, Building, Target, Calendar, UserPlus, Search, Briefcase, LinkIcon, Info
} from "lucide-react";

// --- Person Schemas (Align with backend: podcast_outreach/api/schemas/person_schemas.py) ---
const personCreateSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required (e.g., client, host)"),
  // dashboard_username and dashboard_password_hash are usually set via specific auth flows or backend logic
  // For simplicity, we might omit them here or make them optional if admin sets them.
  // For now, let's make them optional.
  dashboard_username: z.string().optional(),
  // Password should be handled securely, ideally via a "set password" endpoint after creation.
  // Do not send plain passwords if dashboard_password_hash is expected.
  // For this example, let's assume password is set separately.
  linkedin_profile_url: z.string().url().optional().or(z.literal("")),
  twitter_profile_url: z.string().url().optional().or(z.literal("")),
});
type PersonCreateFormData = z.infer<typeof personCreateSchema>;

interface Person { // Matches PersonInDB from backend
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
  attio_contact_id?: string | null; // Assuming UUID is string here
  created_at: string; // Assuming ISO string
  updated_at: string; // Assuming ISO string
}

// --- Campaign Schemas (Align with backend: podcast_outreach/api/schemas/campaign_schemas.py) ---
const campaignCreateSchema = z.object({
  person_id: z.number().int().positive("Client ID is required"), // This will be the person_id
  campaign_name: z.string().min(1, "Campaign name is required"),
  campaign_type: z.string().optional(),
  campaign_keywords: z.array(z.string()).optional(),
  mock_interview_trancript: z.string().optional(), // Can be GDoc link or text
  media_kit_url: z.string().url().optional().or(z.literal("")),
  goal_note: z.string().optional(),
  instantly_campaign_id: z.string().optional(), // From backend schema
});
type CampaignCreateFormData = z.infer<typeof campaignCreateSchema>;

interface Campaign { // Matches CampaignInDB from backend
  campaign_id: string; // UUID
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null;
  campaign_angles?: string | null;
  campaign_keywords?: string[] | null;
  mock_interview_trancript?: string | null;
  media_kit_url?: string | null;
  goal_note?: string | null;
  instantly_campaign_id?: string | null;
  created_at: string; // Assuming ISO string
}


// --- Create Person Dialog ---
function CreatePersonDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient(); // Use the renamed import

  const form = useForm<PersonCreateFormData>({
    resolver: zodResolver(personCreateSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "client", // Default role
      linkedin_profile_url: "",
      twitter_profile_url: "",
    }
  });

  const createPersonMutation = useMutation({
    mutationFn: async (data: PersonCreateFormData) => {
      // Backend expects dashboard_password_hash, not plain password.
      // This should be handled by a separate "set password" flow or backend logic.
      // For now, we'll send it without password, assuming admin sets it later.
      const payload = { ...data };
      // delete payload.password; // If password field was in form

      return apiRequest("POST", "/people/", payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Person created successfully" });
      form.reset();
      setOpen(false);
      onSuccess(); // This will call appQueryClient.invalidateQueries
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Person",
        description: error.message || "Failed to create person.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: PersonCreateFormData) => {
    createPersonMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Create Person</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Person (Client/Host)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl><Input placeholder="client" {...field} /></FormControl>
                <FormDescription>E.g., client, host, contact</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="linkedin_profile_url" render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="twitter_profile_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter/X URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://x.com/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
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

// --- People Table ---
function PeopleTable({ people, onEditPerson, onDeletePerson }: { people: Person[], onEditPerson: (person: Person) => void, onDeletePerson: (personId: number) => void }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.person_id}>
              <TableCell>{person.full_name || "N/A"}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell><Badge variant="outline">{person.role || "N/A"}</Badge></TableCell>
              <TableCell>{new Date(person.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEditPerson(person)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeletePerson(person.person_id)}>
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

// --- Main Admin Panel Component ---
export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  // Fetch people (clients, hosts, etc.)
  const { data: people = [], isLoading: isLoadingPeople } = useQuery<Person[]>({
    queryKey: ["/people/"], // Ensure trailing slash if backend expects it
    retry: false,
  });

  // Fetch campaigns (you might want to filter by person or show all for admin)
  const { data: campaignsData = [], isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/campaigns/"], // Ensure trailing slash
    retry: false,
  });


  const deletePersonMutation = useMutation({
    mutationFn: async (personId: number) => {
      return apiRequest("DELETE", `/people/${personId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Person deleted successfully" });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Person",
        description: error.message || "Failed to delete person.",
        variant: "destructive"
      });
    }
  });

  const handleDeletePerson = (personId: number) => {
    if (confirm("Are you sure you want to delete this person? This action cannot be undone.")) {
      deletePersonMutation.mutate(personId);
    }
  };
  
  // TODO: Implement Edit Person Dialog and Logic
  const handleEditPerson = (person: Person) => {
    toast({ title: "Edit Person", description: `Editing ${person.full_name} (ID: ${person.person_id}) - Feature to be implemented.`});
    // Open a dialog pre-filled with person data, similar to CreatePersonDialog
    // Use a mutation with PUT /api/people/{person_id}
  };

  const filteredPeople = people.filter((person: Person) =>
    (person.full_name && person.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    totalPeople: people.length,
    totalCampaigns: campaignsData.length,
    // Add more relevant admin stats if needed
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage People and System Settings</p>
        </div>
        <CreatePersonDialog onSuccess={() => tanstackQueryClient.invalidateQueries({ queryKey: ["/people/"] })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total People</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPeople}</p>
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
                <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search people by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {isLoadingPeople ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PeopleTable people={filteredPeople} onEditPerson={handleEditPerson} onDeletePerson={handleDeletePerson} />
          )}
        </CardContent>
      </Card>
      
      {/* TODO: Add Campaign Management Table/Section here, fetching from /api/campaigns/ */}
      {/* TODO: Add System Settings Section (e.g., API keys, default configurations if managed via UI) */}
    </div>
  );
}