import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Podcast, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Search, 
  Lightbulb, 
  FolderOpen, 
  ClipboardList,
  ArrowUp,
  ArrowRight,
  CalendarPlus
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  activeCampaigns: number;
  approvedBookings: number;
  pendingReview: number;
  successRate: number;
}

interface BookingWithPodcast {
  id: number;
  status: string;
  createdAt: string;
  podcast: {
    id: number;
    name: string;
    category: string;
    coverImageUrl?: string;
  };
}

interface PodcastData {
  id: number;
  name: string;
  host: string;
  category: string;
  listenerCount: number;
  description?: string;
  coverImageUrl?: string;
}

function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor 
}: { 
  title: string; 
  value: string | number; 
  change: string; 
  icon: any; 
  iconColor: string; 
}) {
  const isPositive = change.includes("+");
  const isNeutral = change.includes("No change");
  
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
        <div className="mt-4">
          <span className={`inline-flex items-center text-sm ${
            isPositive ? "text-success" : isNeutral ? "text-gray-600" : "text-error"
          }`}>
            {isPositive && <ArrowUp className="mr-1 h-3 w-3" />}
            {!isNeutral && !isPositive && <ArrowUp className="mr-1 h-3 w-3 rotate-180" />}
            {change}
          </span>
        </div>
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
  icon: any; 
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

function RecentBookingCard({ booking }: { booking: BookingWithPodcast }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-white";
      case "pending":
        return "bg-warning text-white";
      case "rejected":
        return "bg-error text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          {booking.podcast.coverImageUrl ? (
            <img
              src={booking.podcast.coverImageUrl}
              alt={booking.podcast.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <Podcast className="h-6 w-6 text-gray-500" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{booking.podcast.name}</h4>
          <p className="text-sm text-gray-600">{booking.podcast.category}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
        <span className="text-sm text-gray-500">{formatDate(booking.createdAt)}</span>
      </div>
    </div>
  );
}

function PodcastRecommendationCard({ podcast }: { podcast: PodcastData }) {
  const getMatchScore = (listenerCount: number) => {
    if (listenerCount > 40000) return { label: "High Match", class: "match-high" };
    if (listenerCount > 25000) return { label: "Medium Match", class: "match-medium" };
    return { label: "Low Match", class: "match-low" };
  };

  const matchScore = getMatchScore(podcast.listenerCount);

  return (
    <Card className="border border-gray-200 hover:border-primary/30 transition-colors cursor-pointer card-hover">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            {podcast.coverImageUrl ? (
              <img
                src={podcast.coverImageUrl}
                alt={podcast.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <Podcast className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{podcast.name}</h4>
            <p className="text-xs text-gray-500">by {podcast.host}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {podcast.description || "No description available"}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{(podcast.listenerCount / 1000).toFixed(0)}K listeners</span>
            <span>•</span>
            <span>{podcast.category}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${matchScore.class}`}>
            {matchScore.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithPodcast[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: podcasts, isLoading: podcastsLoading } = useQuery<PodcastData[]>({
    queryKey: ["/api/podcasts"],
  });

  const handleBookDemo = () => {
    window.open("https://calendly.com", "_blank");
  };

  const recentBookings = bookings?.slice(0, 3) || [];
  const recommendedPodcasts = podcasts?.slice(0, 3) || [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Campaigns"
          value={stats?.activeCampaigns || 0}
          change="+12% from last month"
          icon={Podcast}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Approved Bookings"
          value={stats?.approvedBookings || 0}
          change="+8% from last week"
          icon={CheckCircle}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title="Pending Review"
          value={stats?.pendingReview || 0}
          change="No change"
          icon={Clock}
          iconColor="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          change="+5% from last month"
          icon={TrendingUp}
          iconColor="bg-success/10 text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Podcast Approvals</h3>
            </div>
            <CardContent className="p-6">
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <RecentBookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start discovering podcasts to see your booking activity here.
                  </p>
                </div>
              )}
              
              {recentBookings.length > 0 && (
                <div className="mt-6">
                  <Link href="/approvals">
                    <Button variant="ghost" className="w-full text-primary hover:text-blue-700">
                      View All Approvals
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                <QuickActionButton
                  title="Discover New Podcasts"
                  icon={Search}
                  href="/discover"
                  colorClass="bg-primary/5 hover:bg-primary/10"
                />
                <QuickActionButton
                  title="Generate Pitch Angle"
                  icon={Lightbulb}
                  href="/pitch-generator"
                  colorClass="bg-secondary/5 hover:bg-secondary/10"
                />
                <QuickActionButton
                  title="Update Media Kit"
                  icon={FolderOpen}
                  href="/media-kit"
                  colorClass="bg-success/5 hover:bg-success/10"
                />
                <QuickActionButton
                  title="Take Questionnaire"
                  icon={ClipboardList}
                  href="/questionnaire"
                  colorClass="bg-warning/5 hover:bg-warning/10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Need Help Getting Started?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Book a personalized demo with our podcast booking experts to maximize your success.
              </p>
              <Button
                className="w-full bg-white text-primary font-medium hover:bg-gray-50"
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recommended Podcasts</h3>
          <Link href="/discover">
            <Button variant="ghost" className="text-primary font-medium text-sm hover:text-blue-700">
              View All
            </Button>
          </Link>
        </div>
        <CardContent className="p-6">
          {podcastsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : recommendedPodcasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedPodcasts.map((podcast) => (
                <PodcastRecommendationCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No podcasts available</h3>
              <p className="mt-1 text-sm text-gray-500">
                We're working on finding the best podcast matches for you.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
