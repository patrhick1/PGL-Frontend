import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  PlayCircle, 
  BarChart3,
  Download,
  ExternalLink,
  Podcast,
  Eye,
  Share2,
  MessageSquare
} from "lucide-react";

interface BookingWithPodcast {
  id: number;
  status: string;
  scheduledDate?: string;
  recordingDate?: string;
  publishDate?: string;
  episodeUrl?: string;
  createdAt: string;
  podcast: {
    id: number;
    name: string;
    host: string;
    category: string;
    listenerCount: number;
    coverImageUrl?: string;
    website?: string;
  };
}

interface PlacementStats {
  totalPlacements: number;
  totalReach: number;
  averageRating: number;
  completionRate: number;
  monthlyPlacements: Array<{
    month: string;
    count: number;
    reach: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

function PlacementCard({ booking }: { booking: BookingWithPodcast }) {
  const isPublished = booking.status === "completed" && booking.episodeUrl;
  const isRecorded = booking.recordingDate && !isPublished;
  const isScheduled = booking.scheduledDate && !booking.recordingDate;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusInfo = () => {
    if (isPublished) {
      return {
        status: "Published",
        color: "bg-success text-white",
        icon: PlayCircle,
        date: booking.publishDate,
        description: "Episode is live and available to listeners",
      };
    } else if (isRecorded) {
      return {
        status: "Recorded",
        color: "bg-blue-500 text-white",
        icon: Calendar,
        date: booking.recordingDate,
        description: "Episode recorded, awaiting publication",
      };
    } else if (isScheduled) {
      return {
        status: "Scheduled",
        color: "bg-warning text-white",
        icon: Calendar,
        date: booking.scheduledDate,
        description: "Interview scheduled",
      };
    }
    return {
      status: "Confirmed",
      color: "bg-primary text-white",
      icon: Calendar,
      date: booking.createdAt,
      description: "Booking confirmed",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Mock performance metrics (in real app, these would come from analytics)
  const mockMetrics = {
    listens: Math.floor(booking.podcast.listenerCount * 0.4),
    shares: Math.floor(booking.podcast.listenerCount * 0.02),
    engagement: Math.floor(Math.random() * 30) + 70, // 70-100%
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              {booking.podcast.coverImageUrl ? (
                <img
                  src={booking.podcast.coverImageUrl}
                  alt={booking.podcast.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <Podcast className="h-8 w-8 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{booking.podcast.name}</h3>
              <p className="text-sm text-gray-600">by {booking.podcast.host}</p>
              <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {(booking.podcast.listenerCount / 1000).toFixed(0)}K listeners
                </span>
                <span>•</span>
                <span>{booking.podcast.category}</span>
              </div>
            </div>
          </div>
          
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Date: </span>
            <span className="text-gray-600">{formatDate(statusInfo.date)}</span>
          </div>
          {booking.recordingDate && (
            <div>
              <span className="font-medium text-gray-700">Recorded: </span>
              <span className="text-gray-600">{formatDate(booking.recordingDate)}</span>
            </div>
          )}
          {booking.publishDate && (
            <div>
              <span className="font-medium text-gray-700">Published: </span>
              <span className="text-gray-600">{formatDate(booking.publishDate)}</span>
            </div>
          )}
        </div>

        {isPublished && (
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{mockMetrics.listens.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Listens</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{mockMetrics.shares}</div>
              <div className="text-xs text-gray-600">Shares</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{mockMetrics.engagement}%</div>
              <div className="text-xs text-gray-600">Engagement</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
          
          <div className="flex space-x-2">
            {booking.podcast.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={booking.podcast.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Podcast
                </a>
              </Button>
            )}
            {booking.episodeUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={booking.episodeUrl} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Listen
                </a>
              </Button>
            )}
            {isPublished && (
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsOverview({ bookings }: { bookings: BookingWithPodcast[] }) {
  const publishedBookings = bookings.filter(b => b.status === "completed" && b.episodeUrl);
  const totalReach = publishedBookings.reduce((sum, booking) => sum + booking.podcast.listenerCount, 0);
  const completionRate = bookings.length > 0 ? (publishedBookings.length / bookings.length) * 100 : 0;

  const stats = [
    {
      label: "Total Placements",
      value: publishedBookings.length,
      subtitle: `${bookings.length} total bookings`,
      color: "bg-primary/10 text-primary",
      icon: Podcast,
    },
    {
      label: "Total Reach",
      value: (totalReach / 1000).toFixed(0) + "K",
      subtitle: "Combined audience size",
      color: "bg-success/10 text-success",
      icon: Users,
    },
    {
      label: "Completion Rate",
      value: completionRate.toFixed(0) + "%",
      subtitle: "Bookings that aired",
      color: "bg-blue-500/10 text-blue-500",
      icon: TrendingUp,
    },
    {
      label: "Avg. Audience",
      value: publishedBookings.length > 0 ? (totalReach / publishedBookings.length / 1000).toFixed(0) + "K" : "0",
      subtitle: "Per placement",
      color: "bg-secondary/10 text-secondary",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CategoryBreakdown({ bookings }: { bookings: BookingWithPodcast[] }) {
  const categories = bookings.reduce((acc, booking) => {
    const category = booking.podcast.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categories)
    .map(([category, count]) => ({
      category,
      count,
      percentage: (count / bookings.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Top Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCategories.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{item.category}</span>
                <span className="text-gray-600">{item.count} placements</span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlacementTracking() {
  const [timeRange, setTimeRange] = useState("all");
  const [category, setCategory] = useState("all");

  const { data: bookings, isLoading } = useQuery<BookingWithPodcast[]>({
    queryKey: ["/api/bookings"],
  });

  const filteredBookings = (bookings || []).filter((booking) => {
    // Filter by category
    const matchesCategory = category === "all" || booking.podcast.category === category;
    
    // Filter by time range
    let matchesTimeRange = true;
    if (timeRange !== "all" && booking.publishDate) {
      const publishDate = new Date(booking.publishDate);
      const now = new Date();
      
      switch (timeRange) {
        case "30d":
          matchesTimeRange = publishDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          matchesTimeRange = publishDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          matchesTimeRange = publishDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    return matchesCategory && matchesTimeRange;
  });

  const groupedBookings = {
    published: filteredBookings.filter(b => b.status === "completed" && b.episodeUrl),
    recorded: filteredBookings.filter(b => b.recordingDate && b.status !== "completed"),
    scheduled: filteredBookings.filter(b => b.scheduledDate && !b.recordingDate),
  };

  const categories = Array.from(new Set((bookings || []).map(b => b.podcast.category)));

  if (isLoading) {
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
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings && bookings.length > 0 && <StatsOverview bookings={filteredBookings} />}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Time Range:</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Category:</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Placement Timeline */}
          {bookings && bookings.length > 0 ? (
            <Tabs defaultValue="published" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="published">
                  Published ({groupedBookings.published.length})
                </TabsTrigger>
                <TabsTrigger value="recorded">
                  Recorded ({groupedBookings.recorded.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled">
                  Scheduled ({groupedBookings.scheduled.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="published" className="space-y-4 mt-6">
                {groupedBookings.published.length > 0 ? (
                  groupedBookings.published.map((booking) => (
                    <PlacementCard key={booking.id} booking={booking} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No published episodes</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Episodes you've completed will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="recorded" className="space-y-4 mt-6">
                {groupedBookings.recorded.length > 0 ? (
                  groupedBookings.recorded.map((booking) => (
                    <PlacementCard key={booking.id} booking={booking} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No recorded episodes</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Episodes you've recorded but not yet published will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="scheduled" className="space-y-4 mt-6">
                {groupedBookings.scheduled.length > 0 ? (
                  groupedBookings.scheduled.map((booking) => (
                    <PlacementCard key={booking.id} booking={booking} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No scheduled interviews</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Your upcoming scheduled interviews will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No placements to track yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Start applying to podcasts to track your placements and performance here.
                </p>
                <Button className="mt-4 bg-primary text-white hover:bg-blue-700">
                  <Podcast className="mr-2 h-4 w-4" />
                  Discover Podcasts
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          {bookings && bookings.length > 0 && <CategoryBreakdown bookings={filteredBookings} />}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Most popular category:</span>
                  <span className="font-medium">
                    {categories.length > 0 ? categories[0] : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Largest audience reached:</span>
                  <span className="font-medium">
                    {bookings && bookings.length > 0 
                      ? (Math.max(...bookings.map(b => b.podcast.listenerCount)) / 1000).toFixed(0) + "K"
                      : "0"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average response time:</span>
                  <span className="font-medium">3-5 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
