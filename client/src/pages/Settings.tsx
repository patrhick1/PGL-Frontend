// client/src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"; // Import Zod
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Settings as SettingsIcon, User, Bell, Shield, Download, Save, Trash2, AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Commented out problematic import
// import { 
//   userProfileUpdateSchema, UserProfileUpdateFormData,
//   notificationSettingsSchema, NotificationSettingsFormData,
//   privacySettingsSchema, PrivacySettingsFormData,
//   accountDeletionRequestSchema, AccountDeletionRequestFormData,
//   AuthUser 
// } from "./SettingsSchemas"; 

// --- Placeholder Schemas and Types (define properly later or in SettingsSchemas.ts) ---

// User Profile
const userProfileUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional(),
  bio: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  location: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  linkedin_profile_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")).nullable(),
  twitter_profile_url: z.string().url("Invalid Twitter/X URL").optional().or(z.literal("")).nullable(),
  instagram_profile_url: z.string().url("Invalid Instagram URL").optional().or(z.literal("")).nullable(),
  tiktok_profile_url: z.string().url("Invalid TikTok URL").optional().or(z.literal("")).nullable(),
  dashboard_username: z.string().min(1, "Dashboard username is required").optional(),
});
type UserProfileUpdateFormData = z.infer<typeof userProfileUpdateSchema>;

// Notification Settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  podcastMatches: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});
type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Privacy Settings
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'hosts_only', 'private']).optional(),
  dataSharing: z.boolean().optional(),
  analyticsTracking: z.boolean().optional(),
});
type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;

// Account Deletion
const accountDeletionRequestSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion."),
});
type AccountDeletionRequestFormData = z.infer<typeof accountDeletionRequestSchema>;

// --- End Placeholder Schemas ---


interface TimezoneOption {
  value: string;
  label: string;
}

const timezones: TimezoneOption[] = [
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin, Amsterdam, Paris' },
  // Add more timezones as needed
];

function ProfileSettings() {
  const { user, isLoading: authLoading } = useAuth(); // useAuth provides the current user
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UserProfileUpdateFormData>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        // email: user.username, // Email is typically not editable by user directly or needs verification
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        timezone: user.timezone || "America/New_York",
        linkedin_profile_url: user.linkedin_profile_url || "",
        twitter_profile_url: user.twitter_profile_url || "",
        instagram_profile_url: user.instagram_profile_url || "",
        tiktok_profile_url: user.tiktok_profile_url || "",
        dashboard_username: user.dashboard_username || user.username, // Default to email if not set
      });
    }
  }, [user, form, isEditing]); // Re-populate form if user data changes or edit mode toggles

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileUpdateFormData) => {
      // Filter out empty strings for optional fields to send them as null or not at all
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== "" && value !== undefined)
      );
      return apiRequest("PATCH", "/users/me/profile", payload);
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update profile." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    },
  });

  const onSubmit = (data: UserProfileUpdateFormData) => {
    updateProfileMutation.mutate(data);
  };
  
  const getInitials = (fullName?: string | null) => {
    if (!fullName) return user?.username?.[0]?.toUpperCase() || "U";
    const names = fullName.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return names[0][0].toUpperCase();
  };

  if (authLoading) return <Skeleton className="h-96 w-full" />;
  if (!user) return <p>Please log in to view your profile settings.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" />Profile Information</CardTitle>
        <CardDescription>Update your personal details and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            {/* <AvatarImage src={user.profileImageUrl} alt={user.full_name || user.username} /> */}
            <AvatarFallback className="bg-gray-300 text-gray-700 text-lg">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{user.full_name || user.username}</h3>
            <p className="text-sm text-gray-600">{user.username}</p> {/* Email is username */}
          </div>
        </div>
        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="dashboard_username" render={({ field }) => (
              <FormItem><FormLabel>Dashboard Username</FormLabel><FormControl><Input {...field} disabled={!isEditing} value={field.value ?? ""} /></FormControl><FormDescription>This is how you log in. Can be different from your email.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us about yourself..." className="min-h-[100px]" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://yourwebsite.com" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City, Country" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="timezone" render={({ field }) => (
              <FormItem><FormLabel>Timezone</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={!isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select your timezone" /></SelectTrigger></FormControl>
                  <SelectContent>{timezones.map((tz) => (<SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>))}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="linkedin_profile_url" render={({ field }) => (
                <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="twitter_profile_url" render={({ field }) => (
                <FormItem><FormLabel>Twitter/X URL</FormLabel><FormControl><Input placeholder="https://x.com/..." disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            {/* Add Instagram and TikTok if desired */}

            <div className="flex justify-end space-x-4 pt-4">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => { setIsEditing(false); form.reset(user ? { ...user, full_name: user.full_name || "", dashboard_username: user.dashboard_username || user.username } : {}); }}>Cancel</Button>
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {updateProfileMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Edit Profile</Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true, podcastMatches: true, applicationUpdates: true,
      weeklyReports: false, marketingEmails: false,
    },
  });

  useEffect(() => {
    if (user?.notification_settings) {
      form.reset(user.notification_settings);
    }
  }, [user, form]);

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationSettingsFormData) => apiRequest("PATCH", "/users/me/notification-settings", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update settings." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      toast({ title: "Success", description: "Notification preferences updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update preferences.", variant: "destructive" });
    },
  });

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" />Notification Preferences</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updateNotificationsMutation.mutate(data))} className="space-y-6">
            {Object.keys(notificationSettingsSchema.shape).map((key) => (
              <FormField key={key} control={form.control} name={key as keyof NotificationSettingsFormData}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                      <FormDescription>Receive updates for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={updateNotificationsMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {updateNotificationsMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();

  const form = useForm<PrivacySettingsFormData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: { profileVisibility: "public", dataSharing: false, analyticsTracking: true },
  });

  useEffect(() => {
    if (user?.privacy_settings) {
      form.reset(user.privacy_settings);
    }
  }, [user, form]);

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: PrivacySettingsFormData) => apiRequest("PATCH", "/users/me/privacy-settings", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update settings." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      toast({ title: "Success", description: "Privacy settings updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update settings.", variant: "destructive" });
    },
  });
  
  if (authLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5" />Privacy & Security</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updatePrivacyMutation.mutate(data))} className="space-y-6">
            <FormField control={form.control} name="profileVisibility" render={({ field }) => (
              <FormItem className="rounded-lg border p-4">
                <FormLabel className="text-base">Profile Visibility</FormLabel>
                <FormDescription>Control who can see your profile information.</FormDescription>
                <Select onValueChange={field.onChange} value={field.value ?? "public"}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="hosts_only">Podcast Hosts Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dataSharing" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><FormLabel className="text-base">Data Sharing</FormLabel><FormDescription>Allow sharing anonymized data for better matching.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="analyticsTracking" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><FormLabel className="text-base">Analytics Tracking</FormLabel><FormDescription>Help us improve by sharing usage analytics.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <Button type="submit" disabled={updatePrivacyMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {updatePrivacyMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Settings</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DataAndAccount() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<AccountDeletionRequestFormData>({
    resolver: zodResolver(accountDeletionRequestSchema),
    defaultValues: { password: "" },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/users/export-data"),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to request data export." }));
        throw new Error(errorData.detail);
      }
      toast({ title: "Export Requested", description: "Your data export has been initiated. You will receive an email shortly." });
    },
    onError: (error: any) => {
      toast({ title: "Export Error", description: error.message || "Could not request data export.", variant: "destructive" });
    },
    onSettled: () => setIsExporting(false),
  });

  const deleteAccountRequestMutation = useMutation({
    mutationFn: (data: AccountDeletionRequestFormData) => apiRequest("POST", "/users/delete-account-request", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to request account deletion." }));
        throw new Error(errorData.detail);
      }
      toast({ title: "Deletion Requested", description: "A confirmation email has been sent to you to complete the account deletion." });
      setShowDeleteConfirm(false); form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Deletion Error", description: error.message || "Could not request account deletion.", variant: "destructive" });
    },
    onSettled: () => setIsDeleting(false),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center"><Download className="mr-2 h-5 w-5" />Data Export</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Request a copy of all your data.</p>
          <Button onClick={() => { setIsExporting(true); exportDataMutation.mutate(); }} disabled={isExporting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isExporting ? "Requesting Export..." : <><Download className="mr-2 h-4 w-4" />Request Data Export</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5" />Account Deletion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />Request Account Deletion
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => { setIsDeleting(true); deleteAccountRequestMutation.mutate(data); })} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter your password to confirm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex space-x-2">
                  <Button type="submit" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Processing..." : "Confirm Deletion Request"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowDeleteConfirm(false); form.reset(); }}>Cancel</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data & Account</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileSettings /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationSettings /></TabsContent>
        <TabsContent value="privacy" className="mt-6"><PrivacySettings /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataAndAccount /></TabsContent>
      </Tabs>
    </div>
  );
}