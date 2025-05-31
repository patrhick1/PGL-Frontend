import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Edit3, Mic, BarChartBig, ExternalLink, FileText, CheckCircle2, Brain, Users2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth provides user role
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // For transcript modal

// --- Placeholder Interfaces (align with backend schemas when available) ---
interface MediaDetails {
  media_id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  image_url?: string | null;
  rss_feed_url?: string | null;
  author?: string | null;
  language?: string | null;
  categories?: string[] | null;
  last_fetched_at?: string | null;
  latest_episode_date?: string | null;
  // Add other fields from MediaInDB as needed
}

// Using the EpisodeInDB schema provided
interface EpisodeInDB {
    episode_id: number;
    media_id: number;
    title?: string | null;
    publish_date?: string | null; // Assuming date string
    duration_sec?: number | null;
    episode_summary?: string | null;
    ai_episode_summary?: string | null;
    episode_url?: string | null;
    transcript?: string | null;
    transcribe?: boolean | null;
    downloaded?: boolean | null;
    guest_names?: string[] | null;
    source_api?: string | null;
    api_episode_id?: string | null;
    created_at: string;
    updated_at: string;
    episode_themes?: string[] | null;
    episode_keywords?: string[] | null;
    ai_analysis_done?: boolean | null;
}

// --- Transcript Viewer Modal ---
function TranscriptViewerModal({ episodeTitle, transcript }: { episodeTitle?: string | null; transcript?: string | null }) {
  const [open, setOpen] = useState(false);

  if (!transcript) {
    return (
      <Button size="sm" variant="outline" disabled className="text-xs">
        <FileText className="h-3 w-3 mr-1" /> Transcript N/A
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <FileText className="h-3 w-3 mr-1" /> View Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Transcript: {episodeTitle || "Episode Transcript"}</DialogTitle>
          <DialogDescription>Full transcript content for the selected episode.</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow pr-4 mt-2 text-sm whitespace-pre-wrap break-words">
          {transcript}
        </div>
        <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-4 self-end">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export default function MediaDetail() {
  const params = useParams();
  const mediaId = parseInt(params.mediaId || "0");
  const { toast } = useToast();
  const { user } = useAuth(); // Get user for role-based actions
  const userRole = user?.role?.toLowerCase();

  // --- Fetch Media Details ---
  const { data: media, isLoading: isLoadingMedia, error: mediaError } = useQuery<MediaDetails>({
    queryKey: ["/media/", mediaId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/media/${mediaId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch media details" }));
        throw new Error(errorData.detail || "Failed to fetch media details");
      }
      return response.json();
    },
    enabled: !!mediaId,
  });

  // --- Fetch Episodes ---
  const { data: episodes = [], isLoading: isLoadingEpisodes, error: episodesError } = useQuery<EpisodeInDB[]>({
    queryKey: ["/episodes/", { media_id: mediaId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/episodes/?media_id=${mediaId}`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch episodes" }));
        throw new Error(errorData.detail || "Failed to fetch episodes");
      }
      return response.json();
    },
    enabled: !!mediaId,
  });

  // --- Mutations for Actions (placeholder logic) ---
  const taskMutation = useMutation<any, Error, { taskName: string; mediaId?: number }>({
    mutationFn: async (params: { taskName: string; mediaId?: number }) => {
      const endpoint = params.mediaId ? `/tasks/run/${params.taskName}?media_id=${params.mediaId}` : `/tasks/run/${params.taskName}`;
      toast({ title: "Task Triggered", description: `Starting task: ${params.taskName} for media ID: ${params.mediaId || '(global)'}...` });
      const response = await apiRequest("POST", endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Failed to trigger task ${params.taskName}` }));
        throw new Error(errorData.detail || `Failed to trigger task ${params.taskName}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({ title: "Task Success", description: data.message });
      if (variables.taskName === 'fetch_podcast_episodes') {
        queryClient.invalidateQueries({ queryKey: ["/episodes/", { media_id: mediaId }] });
        queryClient.invalidateQueries({ queryKey: ["/media/", mediaId] }); // To refresh last_fetched_at etc.
      }
      // Add more invalidations as needed for other tasks
    },
    onError: (error: Error, variables) => {
      toast({ title: "Task Failed", description: `Error running task '${variables.taskName}': ${error.message}`, variant: "destructive" });
    },
  });

  const handleTriggerEpisodeSync = () => {
    if (!mediaId) return;
    taskMutation.mutate({ taskName: 'fetch_podcast_episodes', mediaId });
  };

  const handleTriggerTranscription = () => {
    if (!mediaId) return;
    // Backend: POST /tasks/run/transcribe_podcast?media_id={id}
    taskMutation.mutate({ taskName: 'transcribe_podcast', mediaId });
  };
  
  const handleTriggerEnrichment = () => {
    if (!mediaId) return;
    // Backend: POST /tasks/run/enrichment_pipeline?media_id={id}
    taskMutation.mutate({ taskName: 'enrichment_pipeline', mediaId });
  };

  // --- Render Logic ---
  if (isLoadingMedia) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (mediaError) {
    return <div className="p-6 text-red-500">Error loading media details: {(mediaError as Error).message}</div>;
  }

  if (!media) {
    return <div className="p-6">Media not found.</div>;
  }

  const getTranscriptionStatus = (episode: EpisodeInDB) => {
    let statusText = "Unknown";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";
    let icon = null;

    if (episode.ai_analysis_done) {
      statusText = "Analysis Complete";
      badgeVariant = "default";
      className = "bg-green-100 text-green-700";
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
    } else if (episode.transcript && episode.transcript.length > 0) {
      statusText = "Transcript Available";
      badgeVariant = "default";
      className = "bg-blue-100 text-blue-700"; // Differentiate from full analysis
      icon = <FileText className="h-3 w-3 mr-1" />;
    } else if (episode.transcribe && (episode.transcript === null || episode.transcript === "")) {
      statusText = "Queued for Transcription";
      badgeVariant = "outline";
      className = "bg-yellow-100 text-yellow-700";
      icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
    } else if (!episode.transcribe && (episode.transcript === null || episode.transcript === "")) {
      statusText = episode.downloaded ? "Not Queued (Audio Downloaded)" : "Not Queued";
      badgeVariant = "secondary";
    } else {
      statusText = "Status Unknown";
      badgeVariant = "outline";
    }

    return <Badge variant={badgeVariant} className={className}>{icon}{statusText}</Badge>;
  };
  
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Link href="/podcast-discovery" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Discovery / Media Library
      </Link>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {media.image_url && <img src={media.image_url} alt={media.name} className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border" />}
            <div className="flex-1">
              <CardTitle className="text-2xl md:text-3xl font-bold">{media.name}</CardTitle>
              {media.author && <CardDescription className="text-lg">By {media.author}</CardDescription>}
              {media.website && (
                <a href={media.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center mt-1">
                  Visit Website <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
               {media.rss_feed_url && (
                <a href={media.rss_feed_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center mt-1 ml-3">
                  RSS Feed <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
          {isAdminOrStaff && (
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 mt-4 md:mt-0 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => alert("Edit media details - TBD (modal or new page)")}>
                <Edit3 className="h-4 w-4 mr-2" /> Edit Details
              </Button>
              {/* More actions can be added here */}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {media.description && <p className="text-gray-700 whitespace-pre-wrap">{media.description}</p>}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Language</p>
              <p>{media.language || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Latest Episode</p>
              <p>{media.latest_episode_date ? new Date(media.latest_episode_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Last Fetched</p>
              <p>{media.last_fetched_at ? new Date(media.last_fetched_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {media.categories && media.categories.length > 0 && (
            <div>
              <p className="font-medium text-gray-500 mb-1">Categories</p>
              <div className="flex flex-wrap gap-2">
                {media.categories.map(category => <Badge key={category} variant="secondary">{category}</Badge>)}
              </div>
            </div>
          )}
           {isAdminOrStaff && (
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-lg">Admin Actions</CardTitle>
                    <CardDescription>Trigger backend processes for this podcast.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={handleTriggerEpisodeSync} disabled={taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'fetch_podcast_episodes'}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'fetch_podcast_episodes' ? 'animate-spin' : ''}`} />
                        {taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'fetch_podcast_episodes' ? 'Syncing...' : 'Sync Episodes'}
                    </Button>
                    <Button size="sm" onClick={handleTriggerTranscription} disabled={taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'transcribe_podcast'}>
                        <Mic className={`h-4 w-4 mr-2 ${taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'transcribe_podcast' ? 'animate-spin' : ''}`} />
                        {taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'transcribe_podcast' ? 'Processing...' : 'Trigger Transcription'}
                    </Button>
                     <Button size="sm" onClick={handleTriggerEnrichment} disabled={taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'enrichment_pipeline'}>
                        <BarChartBig className={`h-4 w-4 mr-2 ${taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'enrichment_pipeline' ? 'animate-spin' : ''}`} />
                        {taskMutation.status === 'pending' && taskMutation.variables?.taskName === 'enrichment_pipeline' ? 'Enriching...' : 'Trigger Enrichment'}
                    </Button>
                </CardContent>
            </Card>
           )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Episodes</CardTitle>
          <CardDescription>List of episodes for {media.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEpisodes && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
            </div>
          )}
          {episodesError && <p className="text-red-500">Error loading episodes: {(episodesError as Error).message}</p>}
          {!isLoadingEpisodes && !episodesError && episodes.length === 0 && (
            <p className="text-gray-500">No episodes found for this podcast yet.</p>
          )}
          {!isLoadingEpisodes && !episodesError && episodes.length > 0 && (
            <div className="space-y-4">
              {episodes.map(episode => (
                <Card key={episode.episode_id} className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <h4 className="font-semibold">{episode.title || `Episode ID: ${episode.episode_id}`}</h4>
                        <p className="text-sm text-gray-500">
                            Published: {episode.publish_date ? new Date(episode.publish_date).toLocaleDateString() : 'N/A'}
                            {episode.duration_sec && `  ·  ${Math.round(episode.duration_sec / 60)} min`}
                        </p>
                    </div>
                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                      {getTranscriptionStatus(episode)}
                    </div>
                  </div>
                  
                  {episode.ai_episode_summary && (
                    <div className="mt-3 pt-2 border-t">
                      <h5 className="text-xs font-semibold text-gray-700 mb-0.5 flex items-center"><Brain className="h-3.5 w-3.5 mr-1.5 text-purple-600" />AI Summary</h5>
                      <p className="text-sm text-gray-600 line-clamp-3">{episode.ai_episode_summary}</p>
                    </div>
                  )}

                  {(episode.episode_keywords && episode.episode_keywords.length > 0) || (episode.episode_themes && episode.episode_themes.length > 0) && (
                    <div className="mt-3 pt-2 border-t">
                      {episode.episode_themes && episode.episode_themes.length > 0 && (
                        <div className="mb-1.5">
                          <h5 className="text-xs font-semibold text-gray-700 mb-0.5">Themes:</h5>
                          <div className="flex flex-wrap gap-1">
                            {episode.episode_themes.map(theme => <Badge key={theme} variant="secondary" className="text-xs">{theme}</Badge>)}
                          </div>
                        </div>
                      )}
                      {episode.episode_keywords && episode.episode_keywords.length > 0 && (
                         <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-0.5">Keywords:</h5>
                          <div className="flex flex-wrap gap-1">
                            {episode.episode_keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs bg-sky-100 text-sky-700">{kw}</Badge>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {episode.guest_names && episode.guest_names.length > 0 && (
                     <div className="mt-3 pt-2 border-t">
                        <h5 className="text-xs font-semibold text-gray-700 mb-0.5 flex items-center"><Users2 className="h-3.5 w-3.5 mr-1.5 text-orange-600" />Identified People:</h5>
                        <div className="flex flex-wrap gap-1">
                            {episode.guest_names.map(name => <Badge key={name} variant="outline" className="text-xs">{name}</Badge>)}
                        </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 pt-2 border-t items-center">
                    {episode.episode_url && (
                        <a href={episode.episode_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center">
                        Listen/Download <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    )}
                    <TranscriptViewerModal episodeTitle={episode.title} transcript={episode.transcript} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 