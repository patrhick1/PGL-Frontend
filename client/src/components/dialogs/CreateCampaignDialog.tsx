import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

// --- Person Interface (simplified for client selection) ---
export interface PersonForClientSelection {
  person_id: number;
  full_name: string | null;
  email: string;
  role?: string | null; // To filter for 'client' role
}

// --- Campaign Schemas (Copied from AdminPanel.tsx, ensure alignment with backend) ---
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

export type CampaignCreateFormInput = z.input<typeof campaignCreateSchema>; 
export type CampaignCreatePayload = z.output<typeof campaignCreateSchema>; 

interface CreateCampaignDialogProps {
  people: PersonForClientSelection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCampaignDialog({ people, open, onOpenChange, onSuccess }: CreateCampaignDialogProps) {
  const { toast } = useToast();

  const form = useForm<CampaignCreateFormInput>({
    resolver: zodResolver(campaignCreateSchema),
    defaultValues: {
      campaign_name: "",
      campaign_type: "",
      campaign_keywords_str: "",
      mock_interview_trancript: "",
      media_kit_url: "",
      goal_note: "",
      instantly_campaign_id: ""
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: CampaignCreatePayload) => {
      return apiRequest("POST", "/campaigns/", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign created successfully." });
      form.reset(); 
      onOpenChange(false); 
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error Creating Campaign", description: error.message || "Failed to create campaign.", variant: "destructive" });
    }
  });

  const onSubmit = (formData: CampaignCreateFormInput) => {
    createCampaignMutation.mutate(formData as any); // Zod transform handles this type difference
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Optional: Add a <DialogTrigger asChild><Button>...</Button></DialogTrigger> if used standalone */}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>Fill in the form to create a new client campaign.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="person_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Client (Person)</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {people.filter(p => p.role === 'client').map(p => (
                      <SelectItem key={p.person_id} value={p.person_id.toString()}>{p.full_name} ({p.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="campaign_name" render={({ field }) => (
              <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="Q4 SaaS Outreach" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="campaign_type" render={({ field }) => (
              <FormItem><FormLabel>Campaign Type (Optional)</FormLabel><FormControl><Input placeholder="B2B Tech" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="campaign_keywords_str" render={({ field }) => (
              <FormItem><FormLabel>Keywords (comma-separated)</FormLabel><FormControl><Input placeholder="AI, SaaS, growth" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="mock_interview_trancript" render={({ field }) => (
              <FormItem><FormLabel>Mock Interview Transcript/Link (Optional)</FormLabel><FormControl><Textarea placeholder="Paste transcript or GDoc link..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="media_kit_url" render={({ field }) => (
              <FormItem><FormLabel>Media Kit URL (Optional)</FormLabel><FormControl><Input placeholder="https://link.to/mediakit" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="goal_note" render={({ field }) => (
              <FormItem><FormLabel>Goal/Focus for Campaign (Optional)</FormLabel><FormControl><Textarea placeholder="Primary objectives, key messages..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="instantly_campaign_id" render={({ field }) => (
              <FormItem><FormLabel>Instantly Campaign ID (Optional)</FormLabel><FormControl><Input placeholder="Instantly.ai campaign ID" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createCampaignMutation.isPending}>
                {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 