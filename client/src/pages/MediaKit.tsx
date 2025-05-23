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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  Globe, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Facebook,
  Save,
  Trash2,
  ExternalLink
} from "lucide-react";

const mediaKitSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  bio: z.string().min(100, "Bio must be at least 100 characters"),
  expertise: z.array(z.string()).min(1, "Add at least one area of expertise"),
  achievements: z.array(z.string()).min(1, "Add at least one achievement"),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
  }),
  headshots: z.array(z.string()).optional(),
});

type MediaKitFormData = z.infer<typeof mediaKitSchema>;

interface MediaKit {
  id: number;
  title: string;
  bio: string;
  expertise: string[];
  achievements: string[];
  websiteUrl?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  headshots: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function MediaKitCard({ mediaKit, onEdit, onPreview }: { 
  mediaKit: MediaKit; 
  onEdit: (mediaKit: MediaKit) => void;
  onPreview: (mediaKit: MediaKit) => void;
}) {
  const { toast } = useToast();

  const deleteMediaKit = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/media-kits/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-kits"] });
      toast({
        title: "Success",
        description: "Media kit deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media kit.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this media kit?")) {
      await deleteMediaKit.mutateAsync(mediaKit.id);
    }
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{mediaKit.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Created {new Date(mediaKit.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {mediaKit.isActive && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Active
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{mediaKit.bio}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {mediaKit.expertise.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {mediaKit.expertise.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{mediaKit.expertise.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{mediaKit.achievements.length} achievements</span>
            <span>•</span>
            <span>{Object.values(mediaKit.socialLinks).filter(Boolean).length} social links</span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(mediaKit)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(mediaKit)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-error hover:text-error hover:border-error"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaKitForm({ 
  mediaKit, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  mediaKit?: MediaKit | null; 
  onSave: (data: MediaKitFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [newExpertise, setNewExpertise] = useState("");
  const [newAchievement, setNewAchievement] = useState("");

  const form = useForm<MediaKitFormData>({
    resolver: zodResolver(mediaKitSchema),
    defaultValues: {
      title: mediaKit?.title || "",
      bio: mediaKit?.bio || "",
      expertise: mediaKit?.expertise || [],
      achievements: mediaKit?.achievements || [],
      websiteUrl: mediaKit?.websiteUrl || "",
      socialLinks: {
        twitter: mediaKit?.socialLinks?.twitter || "",
        linkedin: mediaKit?.socialLinks?.linkedin || "",
        instagram: mediaKit?.socialLinks?.instagram || "",
        facebook: mediaKit?.socialLinks?.facebook || "",
      },
      headshots: mediaKit?.headshots || [],
    },
  });

  const addExpertise = () => {
    if (newExpertise.trim()) {
      const currentExpertise = form.getValues("expertise");
      form.setValue("expertise", [...currentExpertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const removeExpertise = (index: number) => {
    const currentExpertise = form.getValues("expertise");
    form.setValue("expertise", currentExpertise.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      const currentAchievements = form.getValues("achievements");
      form.setValue("achievements", [...currentAchievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    const currentAchievements = form.getValues("achievements");
    form.setValue("achievements", currentAchievements.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Kit Title</FormLabel>
              <FormControl>
                <Input placeholder="Professional Media Kit - Your Name" {...field} />
              </FormControl>
              <FormDescription>
                This will be the main title displayed on your media kit.
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
              <FormLabel>Professional Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write a compelling professional bio that highlights your expertise, experience, and unique value proposition..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This bio will be featured prominently in your media kit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Areas of Expertise</FormLabel>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add an area of expertise"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                  />
                  <Button type="button" onClick={addExpertise} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeExpertise(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="achievements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Achievements</FormLabel>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a key achievement"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                  />
                  <Button type="button" onClick={addAchievement} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {field.value.length > 0 && (
                  <div className="space-y-2">
                    {field.value.map((achievement, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{achievement}</span>
                        <button
                          type="button"
                          onClick={() => removeAchievement(index)}
                          className="text-error hover:text-error/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://yourwebsite.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Social Media Links</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/username" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/username" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/username" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary text-white hover:bg-blue-700">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Media Kit
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MediaKitPreview({ mediaKit }: { mediaKit: MediaKit }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{mediaKit.title}</h1>
        <div className="w-24 h-1 bg-primary mx-auto"></div>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
        <p className="text-gray-700 leading-relaxed">{mediaKit.bio}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Areas of Expertise</h2>
        <div className="flex flex-wrap gap-2">
          {mediaKit.expertise.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Achievements</h2>
        <ul className="space-y-2">
          {mediaKit.achievements.map((achievement, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700">{achievement}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Connect</h2>
        <div className="flex flex-wrap gap-3">
          {mediaKit.websiteUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={mediaKit.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Website
              </a>
            </Button>
          )}
          {mediaKit.socialLinks.twitter && (
            <Button variant="outline" size="sm" asChild>
              <a href={mediaKit.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </a>
            </Button>
          )}
          {mediaKit.socialLinks.linkedin && (
            <Button variant="outline" size="sm" asChild>
              <a href={mediaKit.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </a>
            </Button>
          )}
          {mediaKit.socialLinks.instagram && (
            <Button variant="outline" size="sm" asChild>
              <a href={mediaKit.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </a>
            </Button>
          )}
          {mediaKit.socialLinks.facebook && (
            <Button variant="outline" size="sm" asChild>
              <a href={mediaKit.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MediaKit() {
  const [editingMediaKit, setEditingMediaKit] = useState<MediaKit | null>(null);
  const [previewMediaKit, setPreviewMediaKit] = useState<MediaKit | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const { data: mediaKits, isLoading } = useQuery<MediaKit[]>({
    queryKey: ["/api/media-kits"],
  });

  const saveMediaKit = useMutation({
    mutationFn: async (data: MediaKitFormData) => {
      const url = editingMediaKit ? `/api/media-kits/${editingMediaKit.id}` : "/api/media-kits";
      const method = editingMediaKit ? "PATCH" : "POST";
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-kits"] });
      setEditingMediaKit(null);
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: `Media kit ${editingMediaKit ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save media kit.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async (data: MediaKitFormData) => {
    await saveMediaKit.mutateAsync(data);
  };

  const handleEdit = (mediaKit: MediaKit) => {
    setEditingMediaKit(mediaKit);
    setShowCreateForm(true);
  };

  const handlePreview = (mediaKit: MediaKit) => {
    setPreviewMediaKit(mediaKit);
  };

  const handleCancel = () => {
    setEditingMediaKit(null);
    setShowCreateForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingMediaKit ? "Edit Media Kit" : "Create Media Kit"}
          </h1>
          <p className="text-gray-600 mt-2">
            {editingMediaKit 
              ? "Update your professional media kit information."
              : "Create a professional media kit to showcase your expertise."
            }
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <MediaKitForm
              mediaKit={editingMediaKit}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={saveMediaKit.isPending}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Kits</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your professional media kits for podcast pitches.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Media Kit
        </Button>
      </div>

      {mediaKits && mediaKits.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mediaKits.map((mediaKit) => (
            <MediaKitCard
              key={mediaKit.id}
              mediaKit={mediaKit}
              onEdit={handleEdit}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No media kits yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first media kit to start pitching to podcasts professionally.
            </p>
            <Button 
              className="mt-4 bg-primary text-white hover:bg-blue-700"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Media Kit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewMediaKit} onOpenChange={() => setPreviewMediaKit(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Kit Preview</DialogTitle>
            <DialogDescription>
              This is how your media kit will appear to podcast hosts.
            </DialogDescription>
          </DialogHeader>
          
          {previewMediaKit && <MediaKitPreview mediaKit={previewMediaKit} />}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewMediaKit(null)}>
              Close
            </Button>
            <Button className="bg-primary text-white hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
