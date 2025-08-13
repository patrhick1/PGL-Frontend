import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Send } from 'lucide-react';

interface ManualPitchEditorProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    match_id: number;
    media_name?: string;
    campaign_name?: string;
  };
  onSuccess: () => void;
}

export function ManualPitchEditor({ isOpen, onClose, match, onSuccess }: ManualPitchEditorProps) {
  const [subjectLine, setSubjectLine] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validate inputs
    if (!subjectLine.trim()) {
      toast({
        title: 'Subject Required',
        description: 'Please enter a subject line for your pitch.',
        variant: 'destructive',
      });
      return;
    }

    if (!bodyText.trim()) {
      toast({
        title: 'Body Required',
        description: 'Please enter the content of your pitch.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/pitches/create-manual', {
        match_id: match.match_id,
        subject_line: subjectLine,
        body_text: bodyText,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create pitch' }));
        throw new Error(errorData.detail || 'Failed to create pitch');
      }

      toast({
        title: 'Pitch Created',
        description: 'Your manual pitch has been created successfully.',
      });

      // Reset form
      setSubjectLine('');
      setBodyText('');
      
      // Notify parent of success
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create manual pitch.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Sample templates for inspiration
  const templates = {
    friendly: {
      subject: `Love what you're doing with ${match.media_name || 'your podcast'}!`,
      body: `Hi [Host Name],

I've been following ${match.media_name || 'your podcast'} and really enjoyed your recent episode about [topic]. Your insights on [specific point] really resonated with me.

[Your introduction and value proposition]

I'd love to share my experience with [your expertise] with your audience.

Best regards,
[Your name]`,
    },
    professional: {
      subject: `Partnership Opportunity with ${match.media_name || 'your podcast'}`,
      body: `Dear [Host Name],

I'm reaching out regarding a potential collaboration with ${match.media_name || 'your podcast'}.

[Your credentials and expertise]

I believe I could provide valuable insights on:
• [Topic 1]
• [Topic 2]
• [Topic 3]

Would you be interested in having me as a guest?

Sincerely,
[Your name]`,
    },
  };

  const loadTemplate = (type: 'friendly' | 'professional') => {
    const template = templates[type];
    setSubjectLine(template.subject);
    setBodyText(template.body);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Pitch</DialogTitle>
          <DialogDescription>
            {match.media_name && <span className="font-medium">{match.media_name}</span>}
            {match.campaign_name && <span className="text-sm"> • Campaign: {match.campaign_name}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Quick Start */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <Label className="text-sm font-medium mb-2 block">Start with a template:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplate('friendly')}
              >
                Friendly Approach
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplate('professional')}
              >
                Professional Approach
              </Button>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              placeholder="Enter an engaging subject line..."
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{subjectLine.length}/200 characters</p>
          </div>

          {/* Email Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Email Body *</Label>
            <Textarea
              id="body"
              placeholder="Write your pitch here..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Tip: Personalize your pitch by mentioning specific episodes or topics from the podcast.
            </p>
          </div>

          {/* Writing Tips */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-3">
            <h4 className="font-medium text-sm mb-2">💡 Tips for a great pitch:</h4>
            <ul className="text-xs space-y-1 text-gray-700">
              <li>• Keep it concise - under 150 words is ideal</li>
              <li>• Mention specific episodes to show you've listened</li>
              <li>• Clearly state what value you'll bring to their audience</li>
              <li>• Include your relevant credentials briefly</li>
              <li>• End with a clear call-to-action</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !subjectLine.trim() || !bodyText.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Pitch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}