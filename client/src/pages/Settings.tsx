import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  location: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  podcastMatches: z.boolean(),
  applicationUpdates: z.boolean(),
  weeklyReports: z.boolean(),
  marketingEmails: z.boolean(),
});

const privacySchema = z.object({
  profileVisibility: z.string(),
  dataSharing: z.boolean(),
  analyticsTracking: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type PrivacyFormData = z.infer<typeof privacySchema>;

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "GMT" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Time" },
];

function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: "",
      website: "",
      location: "",
      timezone: "America/New_York",
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync(data);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user?.profileImageUrl || undefined} 
              alt={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
            />
            <AvatarFallback className="bg-gray-300 text-gray-700 text-lg">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <div className="flex space-x-2 mt-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormDescription>
                    This email is used for account notifications and podcast communications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                      disabled={!isEditing}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This bio may be used in your podcast pitches and media kit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" disabled={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" disabled={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Used for scheduling podcast interviews and sending notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProfile.isPending}
                    className="bg-primary text-white hover:bg-blue-700"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  Edit Profile
                </Button>
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

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      podcastMatches: true,
      applicationUpdates: true,
      weeklyReports: false,
      marketingEmails: false,
    },
  });

  const updateNotifications = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      return apiRequest("PATCH", "/api/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification preferences updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification preferences.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: NotificationFormData) => {
    await updateNotifications.mutateAsync(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <FormDescription>
                      Receive email notifications for important updates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="podcastMatches"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Podcast Matches</FormLabel>
                    <FormDescription>
                      Get notified when new podcasts match your criteria
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Application Updates</FormLabel>
                    <FormDescription>
                      Receive updates on your podcast application status
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyReports"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Weekly Reports</FormLabel>
                    <FormDescription>
                      Get weekly summaries of your podcast activity
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing Emails</FormLabel>
                    <FormDescription>
                      Receive tips, news, and promotional content
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={updateNotifications.isPending}
              className="bg-primary text-white hover:bg-yellow-700"
            >
              {updateNotifications.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  const { toast } = useToast();

  const form = useForm<PrivacyFormData>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      profileVisibility: "public",
      dataSharing: false,
      analyticsTracking: true,
    },
  });

  const updatePrivacy = useMutation({
    mutationFn: async (data: PrivacyFormData) => {
      return apiRequest("PATCH", "/api/privacy", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Privacy settings updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update privacy settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PrivacyFormData) => {
    await updatePrivacy.mutateAsync(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                  <FormLabel className="text-base">Profile Visibility</FormLabel>
                  <FormDescription>
                    Control who can see your profile information
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                      <SelectItem value="hosts">Podcast Hosts Only - Only verified hosts</SelectItem>
                      <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataSharing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Data Sharing</FormLabel>
                    <FormDescription>
                      Allow sharing anonymized data with podcast hosts for better matching
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="analyticsTracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Analytics Tracking</FormLabel>
                    <FormDescription>
                      Help us improve the platform by sharing usage analytics
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={updatePrivacy.isPending}
              className="bg-primary text-white hover:bg-blue-700"
            >
              {updatePrivacy.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DataExport() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Success",
        description: "Your data export has been prepared and will be emailed to you shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Download a copy of all your data including profile information, podcast applications, 
          questionnaire responses, and placement history.
        </p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Your export will include:</h4>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Profile information and settings</li>
            <li>Questionnaire responses</li>
            <li>Media kit data</li>
            <li>Podcast applications and status</li>
            <li>Placement tracking data</li>
            <li>Communication history</li>
          </ul>
        </div>
        
        <Button 
          onClick={exportData}
          disabled={isExporting}
          className="bg-primary text-white hover:bg-blue-700"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export My Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountDeletion() {
  const [confirmDelete, setConfirmDelete] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const deleteAccount = async () => {
    if (confirmDelete !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real app, this would call the delete account API
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been received. You will receive a confirmation email.",
      });
      setShowConfirmation(false);
      setConfirmDelete("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
          <p className="text-sm text-gray-600">
            Once you delete your account, there is no going back. This will permanently delete 
            your profile, all your applications, and remove all data from our servers.
          </p>
        </div>
        
        {!showConfirmation ? (
          <Button 
            variant="destructive"
            onClick={() => setShowConfirmation(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm account deletion:
              </label>
              <Input
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder="DELETE"
                className="max-w-xs"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="destructive"
                onClick={deleteAccount}
                disabled={confirmDelete !== "DELETE"}
              >
                Confirm Deletion
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmDelete("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data & Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <PrivacySettings />
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6 mt-6">
          <DataExport />
          <AccountDeletion />
        </TabsContent>
      </Tabs>
    </div>
  );
}
