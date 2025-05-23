import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Calendar, 
  Search, 
  Filter,
  Podcast,
  Users,
  ExternalLink,
  Eye,
  MessageSquare
} from "lucide-react";

interface BookingWithPodcast {
  id: number;
  status: string;
  pitchAngle?: string;
  mediaKitUrl?: string;
  scheduledDate?: string;
  recordingDate?: string;
  publishDate?: string;
  episodeUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  podcast: {
    id: number;
    name: string;
    host: string;
    category: string;
    listenerCount: number;
    coverImageUrl?: string;
    website?: string;
    contactEmail?: string;
  };
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-warning text-white",
    icon: Clock,
    description: "Awaiting response from podcast host",
  },
  approved: {
    label: "Approved",
    color: "bg-success text-white",
    icon: CheckCircle,
    description: "Your application has been accepted",
  },
  rejected: {
    label: "Rejected",
    color: "bg-error text-white",
    icon: XCircle,
    description: "Application was declined",
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-500 text-white",
    icon: Calendar,
    description: "Interview has been scheduled",
  },
  completed: {
    label: "Completed",
    color: "bg-green-600 text-white",
    icon: CheckCircle,
    description: "Episode has been recorded and published",
  },
};

function BookingCard({ booking }: { booking: BookingWithPodcast }) {
  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
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
          
          <div className="flex flex-col items-end space-y-2">
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            <span className="text-xs text-gray-500">{getTimeAgo(booking.updatedAt)}</span>
          </div>
        </div>

        {booking.pitchAngle && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Pitch Angle: </span>
            <span className="text-sm text-gray-600">{booking.pitchAngle}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Applied: </span>
            <span className="text-gray-600">{formatDate(booking.createdAt)}</span>
          </div>
          {booking.scheduledDate && (
            <div>
              <span className="font-medium text-gray-700">Scheduled: </span>
              <span className="text-gray-600">{formatDate(booking.scheduledDate)}</span>
            </div>
          )}
          {booking.recordingDate && (
            <div>
              <span className="font-medium text-gray-700">Recorded: </span>
              <span className="text-gray-600">{formatDate(booking.recordingDate)}</span>
            </div>
          )}
        </div>

        {booking.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Notes: </span>
            <p className="text-sm text-gray-600 mt-1">{booking.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{status.description}</p>
          
          <div className="flex space-x-2">
            {booking.podcast.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={booking.podcast.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </a>
              </Button>
            )}
            {booking.episodeUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={booking.episodeUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-1" />
                  Listen
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Contact Host
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusOverview({ bookings }: { bookings: BookingWithPodcast[] }) {
  const statusCounts = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      label: "Total Applications",
      value: bookings.length,
      color: "bg-primary/10 text-primary",
      icon: Podcast,
    },
    {
      label: "Pending Review",
      value: statusCounts.pending || 0,
      color: "bg-warning/10 text-warning",
      icon: Clock,
    },
    {
      label: "Approved",
      value: statusCounts.approved || 0,
      color: "bg-success/10 text-success",
      icon: CheckCircle,
    },
    {
      label: "Completed",
      value: statusCounts.completed || 0,
      color: "bg-green-600/10 text-green-600",
      icon: CheckCircle,
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
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Approvals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading } = useQuery<BookingWithPodcast[]>({
    queryKey: ["/api/bookings"],
  });

  const filteredBookings = (bookings || []).filter((booking) => {
    const matchesSearch = 
      booking.podcast.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.podcast.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.podcast.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const groupedBookings = {
    active: filteredBookings.filter(b => ["pending", "approved", "scheduled"].includes(b.status)),
    completed: filteredBookings.filter(b => b.status === "completed"),
    rejected: filteredBookings.filter(b => b.status === "rejected"),
  };

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
      {bookings && bookings.length > 0 && <StatusOverview bookings={bookings} />}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by podcast name, host, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {bookings && bookings.length > 0 ? (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({groupedBookings.active.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({groupedBookings.completed.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({groupedBookings.rejected.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4 mt-6">
            {groupedBookings.active.length > 0 ? (
              groupedBookings.active.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No active applications</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No applications match your search criteria."
                      : "Start applying to podcasts to see your applications here."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4 mt-6">
            {groupedBookings.completed.length > 0 ? (
              groupedBookings.completed.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No completed episodes</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Episodes you've completed will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4 mt-6">
            {groupedBookings.rejected.length > 0 ? (
              groupedBookings.rejected.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No rejected applications</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Applications that were declined will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Podcast className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No podcast applications yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Start discovering and applying to podcasts to track your applications here.
            </p>
            <Button className="mt-4 bg-primary text-white hover:bg-blue-700">
              <Search className="mr-2 h-4 w-4" />
              Discover Podcasts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
