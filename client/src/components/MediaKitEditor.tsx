import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';

interface TalkingPoint {
  topic: string;
  description: string;
  outcome?: string | null;
}

interface SocialLink {
  platform?: string;
  url?: string;
  handle?: string;
}

interface MediaKitData {
  media_kit_id: string;
  campaign_id: string;
  person_id: number;
  slug: string;
  title: string;
  headline?: string | null;
  custom_intro?: string | null;
  full_bio_content?: string | null;
  summary_bio_content?: string | null;
  short_bio_content?: string | null;
  person_social_links?: SocialLink[] | null;
  talking_points?: TalkingPoint[] | null;
  call_to_action_text?: string | null;
  call_to_action_url?: string | null;
  bio_source?: string | null;
  angles_source?: string | null;
  key_achievements?: string[] | null;
  previous_appearances?: Array<{
    url?: string | null;
    date?: string | null;
    type?: string | null;
    title?: string | null;
    outlet?: string | null;
    episode?: string | null;
    description?: string | null;
  }> | null;
  testimonials_section?: string | null;
  sample_questions?: string[] | null;
}

interface MediaKitEditorProps {
  mediaKit: MediaKitData;
  isOwner: boolean;
  onSave?: () => void;
}

export function MediaKitEditor({ mediaKit, isOwner, onSave }: MediaKitEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<MediaKitData>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    setEditedData({
      title: mediaKit.title,
      headline: mediaKit.headline,
      custom_intro: mediaKit.custom_intro,
      full_bio_content: mediaKit.full_bio_content,
      summary_bio_content: mediaKit.summary_bio_content,
      short_bio_content: mediaKit.short_bio_content,
      talking_points: mediaKit.talking_points ? [...mediaKit.talking_points] : [],
      call_to_action_text: mediaKit.call_to_action_text,
      call_to_action_url: mediaKit.call_to_action_url,
      key_achievements: mediaKit.key_achievements ? [...mediaKit.key_achievements] : [],
      previous_appearances: mediaKit.previous_appearances ? [...mediaKit.previous_appearances] : [],
      testimonials_section: mediaKit.testimonials_section,
      sample_questions: mediaKit.sample_questions ? [...mediaKit.sample_questions] : [],
      person_social_links: mediaKit.person_social_links ? [...mediaKit.person_social_links] : [],
    });
  }, [mediaKit]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<MediaKitData>) => {
      // Use PUT endpoint for updating all media kit fields
      const response = await apiRequest(
        'PUT',
        `/media-kits/${mediaKit.media_kit_id}`,
        data
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update media kit' }));
        throw new Error(error.detail || 'Failed to update media kit');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Media kit updated successfully',
      });
      setEditingSection(null);
      setIsEditing(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['publicMediaKit', mediaKit.slug] });
      queryClient.invalidateQueries({ queryKey: ['/campaigns/', mediaKit.campaign_id, '/media-kit'] });
      
      if (onSave) {
        onSave();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = (section?: string) => {
    if (section) {
      // Save only specific section
      const sectionData: Partial<MediaKitData> = {};
      
      switch (section) {
        case 'header':
          sectionData.title = editedData.title;
          sectionData.headline = editedData.headline;
          break;
        case 'intro':
          sectionData.custom_intro = editedData.custom_intro;
          break;
        case 'bio':
          sectionData.full_bio_content = editedData.full_bio_content;
          sectionData.summary_bio_content = editedData.summary_bio_content;
          sectionData.short_bio_content = editedData.short_bio_content;
          break;
        case 'talking_points':
          sectionData.talking_points = editedData.talking_points;
          break;
        case 'cta':
          sectionData.call_to_action_text = editedData.call_to_action_text;
          sectionData.call_to_action_url = editedData.call_to_action_url;
          break;
        case 'achievements':
          sectionData.key_achievements = editedData.key_achievements;
          break;
        case 'appearances':
          sectionData.previous_appearances = editedData.previous_appearances;
          break;
        case 'testimonials':
          sectionData.testimonials_section = editedData.testimonials_section;
          break;
        case 'questions':
          sectionData.sample_questions = editedData.sample_questions;
          break;
        case 'social_links':
          sectionData.person_social_links = editedData.person_social_links;
          break;
      }
      
      updateMutation.mutate(sectionData);
    } else {
      // Save all changes
      updateMutation.mutate(editedData);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedData({
      title: mediaKit.title,
      headline: mediaKit.headline,
      custom_intro: mediaKit.custom_intro,
      full_bio_content: mediaKit.full_bio_content,
      summary_bio_content: mediaKit.summary_bio_content,
      short_bio_content: mediaKit.short_bio_content,
      talking_points: mediaKit.talking_points ? [...mediaKit.talking_points] : [],
      call_to_action_text: mediaKit.call_to_action_text,
      call_to_action_url: mediaKit.call_to_action_url,
      key_achievements: mediaKit.key_achievements ? [...mediaKit.key_achievements] : [],
      previous_appearances: mediaKit.previous_appearances ? [...mediaKit.previous_appearances] : [],
      testimonials_section: mediaKit.testimonials_section,
      sample_questions: mediaKit.sample_questions ? [...mediaKit.sample_questions] : [],
      person_social_links: mediaKit.person_social_links ? [...mediaKit.person_social_links] : [],
    });
  };

  const addTalkingPoint = () => {
    const newPoints = [...(editedData.talking_points || [])];
    newPoints.push({ topic: '', description: '', outcome: null });
    setEditedData({ ...editedData, talking_points: newPoints });
  };

  const removeTalkingPoint = (index: number) => {
    const newPoints = [...(editedData.talking_points || [])];
    newPoints.splice(index, 1);
    setEditedData({ ...editedData, talking_points: newPoints });
  };

  const updateTalkingPoint = (index: number, field: keyof TalkingPoint, value: string) => {
    const newPoints = [...(editedData.talking_points || [])];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setEditedData({ ...editedData, talking_points: newPoints });
  };

  // Achievement helpers
  const addAchievement = () => {
    const newAchievements = [...(editedData.key_achievements || [])];
    newAchievements.push('');
    setEditedData({ ...editedData, key_achievements: newAchievements });
  };

  const removeAchievement = (index: number) => {
    const newAchievements = [...(editedData.key_achievements || [])];
    newAchievements.splice(index, 1);
    setEditedData({ ...editedData, key_achievements: newAchievements });
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...(editedData.key_achievements || [])];
    newAchievements[index] = value;
    setEditedData({ ...editedData, key_achievements: newAchievements });
  };

  // Previous appearance helpers
  const addAppearance = () => {
    const newAppearances = [...(editedData.previous_appearances || [])];
    newAppearances.push({ title: '', outlet: '', url: '', description: '' });
    setEditedData({ ...editedData, previous_appearances: newAppearances });
  };

  const removeAppearance = (index: number) => {
    const newAppearances = [...(editedData.previous_appearances || [])];
    newAppearances.splice(index, 1);
    setEditedData({ ...editedData, previous_appearances: newAppearances });
  };

  const updateAppearance = (index: number, field: string, value: string) => {
    const newAppearances = [...(editedData.previous_appearances || [])];
    newAppearances[index] = { ...newAppearances[index], [field]: value };
    setEditedData({ ...editedData, previous_appearances: newAppearances });
  };

  // Sample questions helpers
  const addQuestion = () => {
    const newQuestions = [...(editedData.sample_questions || [])];
    newQuestions.push('');
    setEditedData({ ...editedData, sample_questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...(editedData.sample_questions || [])];
    newQuestions.splice(index, 1);
    setEditedData({ ...editedData, sample_questions: newQuestions });
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...(editedData.sample_questions || [])];
    newQuestions[index] = value;
    setEditedData({ ...editedData, sample_questions: newQuestions });
  };

  // Social links helpers
  const addSocialLink = () => {
    const newLinks = [...(editedData.person_social_links || [])];
    newLinks.push({ platform: '', url: '', handle: '' });
    setEditedData({ ...editedData, person_social_links: newLinks });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = [...(editedData.person_social_links || [])];
    newLinks.splice(index, 1);
    setEditedData({ ...editedData, person_social_links: newLinks });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...(editedData.person_social_links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setEditedData({ ...editedData, person_social_links: newLinks });
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Edit Mode Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Media Kit</h3>
        <Button
          variant={isEditing ? 'secondary' : 'default'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel Editing
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Enable Editing
            </>
          )}
        </Button>
      </div>

      {isEditing && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">You are in edit mode</p>
                <p>Click on any section below to edit it. Changes are saved per section.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Section */}
      <Card className={isEditing && editingSection === 'header' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Header Information</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'header' ? null : 'header')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'header' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editedData.title || ''}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  placeholder="Media Kit Title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Headline</label>
                <Input
                  value={editedData.headline || ''}
                  onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
                  placeholder="Professional Headline"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('header')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><span className="font-medium">Title:</span> {mediaKit.title}</p>
              <p><span className="font-medium">Headline:</span> {mediaKit.headline || 'Not set'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Introduction */}
      <Card className={isEditing && editingSection === 'intro' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Custom Introduction</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'intro' ? null : 'intro')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'intro' ? (
            <div className="space-y-4">
              <Textarea
                value={editedData.custom_intro || ''}
                onChange={(e) => setEditedData({ ...editedData, custom_intro: e.target.value })}
                placeholder="Write a custom introduction for your media kit..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleSave('intro')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {mediaKit.custom_intro || 'No custom introduction set'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bio Content */}
      <Card className={isEditing && editingSection === 'bio' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bio Content</CardTitle>
              {mediaKit.bio_source && (
                <Badge variant="outline" className="mt-1">
                  Source: {mediaKit.bio_source.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'bio' ? null : 'bio')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'bio' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Bio</label>
                <Textarea
                  value={editedData.full_bio_content || ''}
                  onChange={(e) => setEditedData({ ...editedData, full_bio_content: e.target.value })}
                  placeholder="Full bio content..."
                  rows={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Summary Bio</label>
                <Textarea
                  value={editedData.summary_bio_content || ''}
                  onChange={(e) => setEditedData({ ...editedData, summary_bio_content: e.target.value })}
                  placeholder="Summary bio content..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Short Bio</label>
                <Textarea
                  value={editedData.short_bio_content || ''}
                  onChange={(e) => setEditedData({ ...editedData, short_bio_content: e.target.value })}
                  placeholder="Short bio content..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('bio')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Full Bio:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {mediaKit.full_bio_content || 'Not available'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Summary Bio:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {mediaKit.summary_bio_content || 'Not available'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Short Bio:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {mediaKit.short_bio_content || 'Not available'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Talking Points */}
      <Card className={isEditing && editingSection === 'talking_points' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Talking Points</CardTitle>
              {mediaKit.angles_source && (
                <Badge variant="outline" className="mt-1">
                  Source: {mediaKit.angles_source.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'talking_points' ? null : 'talking_points')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'talking_points' ? (
            <div className="space-y-4">
              {editedData.talking_points?.map((point, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <Input
                          value={point.topic}
                          onChange={(e) => updateTalkingPoint(index, 'topic', e.target.value)}
                          placeholder="Topic/Title"
                          className="font-medium"
                        />
                        <Textarea
                          value={point.description}
                          onChange={(e) => updateTalkingPoint(index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                        />
                        <Input
                          value={point.outcome || ''}
                          onChange={(e) => updateTalkingPoint(index, 'outcome', e.target.value)}
                          placeholder="Outcome (optional)"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTalkingPoint(index)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={addTalkingPoint}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Talking Point
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('talking_points')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mediaKit.talking_points && mediaKit.talking_points.length > 0 ? (
                mediaKit.talking_points.map((point, index) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <p className="font-medium text-sm">{point.topic}</p>
                    <p className="text-xs text-gray-600 mt-1">{point.description}</p>
                    {point.outcome && (
                      <p className="text-xs text-gray-500 italic mt-1">Outcome: {point.outcome}</p>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No talking points available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className={isEditing && editingSection === 'cta' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Call to Action</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'cta' ? null : 'cta')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'cta' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Button Text</label>
                <Input
                  value={editedData.call_to_action_text || ''}
                  onChange={(e) => setEditedData({ ...editedData, call_to_action_text: e.target.value })}
                  placeholder="e.g., Book a Consultation"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Button URL</label>
                <Input
                  value={editedData.call_to_action_url || ''}
                  onChange={(e) => setEditedData({ ...editedData, call_to_action_url: e.target.value })}
                  placeholder="https://example.com/contact"
                  type="url"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('cta')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><span className="font-medium">Button Text:</span> {mediaKit.call_to_action_text || 'Not set'}</p>
              <p><span className="font-medium">Button URL:</span> {mediaKit.call_to_action_url || 'Not set'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className={isEditing && editingSection === 'social_links' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Social Media Links</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'social_links' ? null : 'social_links')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'social_links' ? (
            <div className="space-y-4">
              {editedData.person_social_links?.map((link, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        value={link.platform || ''}
                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                        placeholder="Platform (e.g., twitter)"
                      />
                      <Input
                        value={link.handle || ''}
                        onChange={(e) => updateSocialLink(index, 'handle', e.target.value)}
                        placeholder="Handle/Username"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={link.url || ''}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSocialLink(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={addSocialLink}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Social Link
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('social_links')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mediaKit.person_social_links && mediaKit.person_social_links.length > 0 ? (
                mediaKit.person_social_links.map((link, index) => (
                  <p key={index}>
                    <span className="font-medium capitalize">{link.platform || 'Unknown'}:</span>{' '}
                    {link.url ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {link.handle || link.url}
                      </a>
                    ) : (
                      link.handle || 'Not set'
                    )}
                  </p>
                ))
              ) : (
                <p className="text-gray-500">No social links added</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Achievements */}
      <Card className={isEditing && editingSection === 'achievements' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Key Achievements</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'achievements' ? null : 'achievements')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'achievements' ? (
            <div className="space-y-4">
              {editedData.key_achievements?.map((achievement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={achievement}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    placeholder="Enter achievement"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAchievement(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addAchievement}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Achievement
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('achievements')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mediaKit.key_achievements && mediaKit.key_achievements.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {mediaKit.key_achievements.map((achievement, index) => (
                    <li key={index} className="text-gray-700">{achievement}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No achievements listed</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Appearances */}
      <Card className={isEditing && editingSection === 'appearances' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Previous Appearances</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'appearances' ? null : 'appearances')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'appearances' ? (
            <div className="space-y-4">
              {editedData.previous_appearances?.map((appearance, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <Input
                          value={appearance.title || ''}
                          onChange={(e) => updateAppearance(index, 'title', e.target.value)}
                          placeholder="Episode/Show Title"
                        />
                        <Input
                          value={appearance.outlet || ''}
                          onChange={(e) => updateAppearance(index, 'outlet', e.target.value)}
                          placeholder="Podcast/Show Name"
                        />
                        <Input
                          value={appearance.url || ''}
                          onChange={(e) => updateAppearance(index, 'url', e.target.value)}
                          placeholder="URL (optional)"
                          type="url"
                        />
                        <Textarea
                          value={appearance.description || ''}
                          onChange={(e) => updateAppearance(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAppearance(index)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={addAppearance}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Appearance
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('appearances')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mediaKit.previous_appearances && mediaKit.previous_appearances.length > 0 ? (
                mediaKit.previous_appearances.map((appearance, index) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <p className="font-medium text-sm">{appearance.title || appearance.outlet || 'Untitled'}</p>
                    {appearance.outlet && appearance.title !== appearance.outlet && (
                      <p className="text-xs text-gray-600">{appearance.outlet}</p>
                    )}
                    {appearance.description && (
                      <p className="text-xs text-gray-500 mt-1">{appearance.description}</p>
                    )}
                    {appearance.url && (
                      <a href={appearance.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                        View Episode
                      </a>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No previous appearances listed</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card className={isEditing && editingSection === 'testimonials' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Testimonials</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'testimonials' ? null : 'testimonials')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'testimonials' ? (
            <div className="space-y-4">
              <Textarea
                value={editedData.testimonials_section || ''}
                onChange={(e) => setEditedData({ ...editedData, testimonials_section: e.target.value })}
                placeholder="Add testimonials (supports markdown formatting)..."
                rows={8}
              />
              <p className="text-xs text-gray-500">Tip: You can use markdown formatting. Example: **Bold text** or *italic text*</p>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('testimonials')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap">
              {mediaKit.testimonials_section || 'No testimonials added yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Questions */}
      <Card className={isEditing && editingSection === 'questions' ? 'ring-2 ring-primary' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sample Interview Questions</CardTitle>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'questions' ? null : 'questions')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'questions' ? (
            <div className="space-y-4">
              {editedData.sample_questions?.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder="Enter sample question"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('questions')} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mediaKit.sample_questions && mediaKit.sample_questions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {mediaKit.sample_questions.map((question, index) => (
                    <li key={index} className="text-gray-700">{question}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No sample questions listed</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save All Changes */}
      {isEditing && !editingSection && (
        <div className="flex justify-end">
          <Button
            onClick={() => handleSave()}
            disabled={updateMutation.isPending}
            className="min-w-[150px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}