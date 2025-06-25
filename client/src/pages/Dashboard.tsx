// client/src/pages/Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Added Badge import
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Podcast as PodcastIcon, // Renamed to avoid conflict
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Search, 
  Lightbulb, 
  FolderOpen, 
  ClipboardList,
  ArrowUp,
  ArrowRight,
  CalendarPlus,
  PlayCircle, // For RecentBookingCard
  Users,
  ExternalLink, // Added ExternalLink
  Settings // Added Settings icon
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } // Assuming useAuth provides user role and person_id
    from "@/hooks/useAuth"; 

// --- Interfaces to match backend dashboard_schemas.py ---
interface DashboardStatsOverview {
  active_campaigns: number;
  approved_placements: number;
  pending_reviews: number;
  success_rate_placements: number;
}

interface RecentPlacementItem {
  placement_id: number;
  status?: string | null;
  created_at: string;
  podcast_name?: string | null;
  podcast_category?: string | null;
  podcast_cover_image_url?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

interface RecommendedPodcastItem {
  media_id: number;
  name?: string | null;
  host_names?: string[] | null; // Changed to string array
  category?: string | null;
  audience_size?: number | null;
  description?: string | null;
  image_url?: string | null;
  quality_score?: number | null;
  website?: string | null;
}
// --- End Interfaces ---


function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor 
}: { 
  title: string; 
  value: string | number; 
  change?: string | null; // Made change optional
  icon: React.ElementType; 
  iconColor: string; 
}) {
  const isPositive = change && change.includes("+");
  const isNeutral = !change || change.includes("No change") || change.includes("N/A");
  
  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="text-xl h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change && (
            <div className="mt-4">
            <span className={`inline-flex items-center text-sm ${
                isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600" // Adjusted colors
            }`}>
                {isPositive && <ArrowUp className="mr-1 h-3 w-3" />}
                {!isNeutral && !isPositive && <ArrowUp className="mr-1 h-3 w-3 rotate-180" />} {/* Down arrow */}
                {change}
            </span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ 
  title, 
  icon: Icon, 
  href, 
  colorClass 
}: { 
  title: string; 
  icon: React.ElementType; 
  href: string; 
  colorClass: string; 
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full flex items-center justify-between p-3 text-left ${colorClass} rounded-lg transition-colors h-auto`}
      >
        <div className="flex items-center">
          <Icon className="mr-3 h-5 w-5" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <ArrowRight className="text-gray-400 h-4 w-4" />
      </Button>
    </Link>
  );
}

// Status config for RecentBookingCard (can be shared or defined locally)
const placementStatusConfig: Record<string, { label: string; color: string }> = {
  live: { label: "Live", color: "bg-green-100 text-green-700" },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
  recorded: { label: "Recorded", color: "bg-pink-100 text-pink-700" },
  recording_booked: { label: "Recording Booked", color: "bg-indigo-100 text-indigo-700" },
  meeting_booked: { label: "Meeting Booked", color: "bg-purple-100 text-purple-700" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  default: { label: "Unknown", color: "bg-gray-100 text-gray-700" },
};


function RecentBookingCard({ booking }: { booking: RecentPlacementItem }) {
  const statusKey = booking.status || 'default';
  const currentStatusConfig = placementStatusConfig[statusKey] || placementStatusConfig.default;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {booking.podcast_cover_image_url ? (
            <img
              src={booking.podcast_cover_image_url}
              alt={booking.podcast_name || 'Podcast'}
              className="w-full h-full object-cover"
            />
          ) : (
            <PodcastIcon className="h-6 w-6 text-gray-500" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{booking.podcast_name || 'N/A'}</h4>
          <p className="text-xs text-gray-600">
            Campaign: {booking.campaign_name || 'N/A'} (Client: {booking.client_name || 'N/A'})
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3 text-right">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentStatusConfig.color}`}>
          {currentStatusConfig.label}
        </span>
        <span className="text-xs text-gray-500 min-w-[70px]">{formatDate(booking.created_at)}</span>
      </div>
    </div>
  );
}

function PodcastRecommendationCard({ podcast }: { podcast: RecommendedPodcastItem }) {
  const getMatchScoreLabel = (score?: number | null) => {
    if (score === null || typeof score === 'undefined') return { label: "N/A", class: "bg-gray-100 text-gray-700" };
    if (score >= 80) return { label: "High Match", class: "bg-green-100 text-green-700" };
    if (score >= 60) return { label: "Good Match", class: "bg-blue-100 text-blue-700" };
    return { label: "Consider", class: "bg-yellow-100 text-yellow-700" };
  };

  const matchScore = getMatchScoreLabel(podcast.quality_score);

  return (
    <Card className="border border-gray-200 hover:border-primary/30 transition-colors card-hover">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3 mb-2">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {podcast.image_url ? (
              <img src={podcast.image_url} alt={podcast.name || 'Podcast'} className="w-full h-full object-cover" />
            ) : (
              <PodcastIcon className="h-8 w-8 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate text-sm">{podcast.name || 'N/A'}</h4>
            <p className="text-xs text-gray-500 truncate">
              {podcast.host_names && podcast.host_names.length > 0 ? `Host(s): ${podcast.host_names.join(', ')}` : 'Host N/A'}
            </p>
             <div className="mt-1">
                <Badge variant="outline" className="text-xs">{podcast.category || 'N/A'}</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 h-8"> 
          {podcast.description || "No description available."}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {podcast.audience_size ? `${(podcast.audience_size / 1000).toFixed(0)}K listeners` : 'Audience N/A'}
          </span>
          <span className={`px-2 py-0.5 font-medium rounded-full ${matchScore.class}`}>
            PGL Match Score: {podcast.quality_score ? `${Math.round(podcast.quality_score)}/100` : 'N/A'}
          </span>
        </div>
         {podcast.website && (
            <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-xs">
                <a href={podcast.website} target="_blank" rel="noopener noreferrer">
                    Visit Website <ExternalLink className="ml-1 h-3 w-3"/>
                </a>
            </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStatsOverview>({
    queryKey: ["/dashboard/stats", user?.person_id], // Add person_id to queryKey if backend filters by it
    // queryFn will be handled by defaultQueryFn from queryClient, which uses queryKey[0] as URL
    enabled: !!user && !authLoading, // Only fetch if user is loaded
  });

  const { data: recentPlacements, isLoading: placementsLoading, error: placementsError } = useQuery<RecentPlacementItem[]>({
    queryKey: ["/dashboard/recent-placements", user?.person_id],
    enabled: !!user && !authLoading,
  });

  const { data: recommendedPodcasts, isLoading: podcastsLoading, error: podcastsError } = useQuery<RecommendedPodcastItem[]>({
    queryKey: ["/dashboard/recommended-podcasts", user?.person_id], // User context might influence recommendations
    enabled: !!user && !authLoading,
  });

  const handleBookDemo = () => {
    window.open("https://calendly.com", "_blank");
  };

  if (authLoading) {
    return <div className="p-6 text-center">Loading authentication state...</div>;
  }
  if (!user) { // Should be handled by App.tsx router, but as a safeguard
    return <div className="p-6 text-center">Please log in to view the dashboard.</div>;
  }


  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading || statsError ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatsCard title="Active Campaigns" value={stats?.active_campaigns ?? 0} change={null} icon={PodcastIcon} iconColor="bg-primary/10 text-primary" />
            <StatsCard title="Approved Placements" value={stats?.approved_placements ?? 0} change={null} icon={CheckCircle} iconColor="bg-green-500/10 text-green-500" />
            <StatsCard title="Pending Reviews" value={stats?.pending_reviews ?? 0} change={null} icon={Clock} iconColor="bg-yellow-500/10 text-yellow-500" />
            <StatsCard title="Placement Success Rate" value={`${stats?.success_rate_placements ?? 0}%`} change={null} icon={TrendingUp} iconColor="bg-teal-500/10 text-teal-500" />
          </>
        )}
      </div>
      {statsError && <p className="text-sm text-red-500">Failed to load dashboard statistics.</p>}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Recent Placement Updates</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {placementsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : placementsError ? (
                 <p className="text-sm text-red-500 text-center py-4">Failed to load recent placements.</p>
              ) : recentPlacements && recentPlacements.length > 0 ? (
                <div className="space-y-3">
                  {recentPlacements.map((booking) => (
                    <RecentBookingCard key={booking.placement_id} booking={booking} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-10 w-10 mb-2" />
                  <p className="text-sm">No recent placement updates.</p>
                </div>
              )}
              
              {recentPlacements && recentPlacements.length > 0 && (
                <div className="mt-6 text-center">
                  <Link href="/placement-tracking">
                    <Button variant="ghost" className="text-primary hover:text-primary/80">
                      View All Placements <ArrowRight className="ml-1 h-4 w-4"/>
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Demo */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3">
                <QuickActionButton title="Discover New Podcasts" icon={Search} href="/discover" colorClass="hover:bg-primary/5" />
                <QuickActionButton title="My Profile & Content" icon={ClipboardList} href="/profile-setup" colorClass="hover:bg-yellow-500/5" />
                <QuickActionButton title="Campaign Management" icon={FolderOpen} href="/my-campaigns" colorClass="hover:bg-green-500/5" />
                <QuickActionButton title="View Settings" icon={Settings} href="/settings" colorClass="hover:bg-teal-500/5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-purple-700 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Need Help Getting Started?</h3>
              <p className="text-purple-100 text-sm mb-4">
                Book a personalized demo with our podcast booking experts to maximize your success.
              </p>
              <Button
                className="w-full bg-white text-primary font-medium hover:bg-gray-100"
                onClick={handleBookDemo}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Schedule Demo Call
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommended Podcasts */}
      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recommended Podcasts</CardTitle>
          <Link href="/discover">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="ml-1 h-3 w-3"/>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {podcastsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
            </div>
          ) : podcastsError ? (
            <p className="text-sm text-red-500 text-center py-4">Failed to load recommended podcasts.</p>
          ) : recommendedPodcasts && recommendedPodcasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {recommendedPodcasts.map((podcast) => (
                <PodcastRecommendationCard key={podcast.media_id} podcast={podcast} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Search className="mx-auto h-10 w-10 mb-2" />
              <p className="text-sm">No podcast recommendations available at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}