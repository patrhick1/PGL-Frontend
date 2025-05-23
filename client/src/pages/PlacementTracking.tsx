import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  MessageSquare,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface PlacementRecord {
  id: number;
  clientName: string;
  podcastName: string;
  hostName: string;
  episodeTitle: string;
  category: string;
  recordingDate: string;
  publishDate: string;
  episodeUrl?: string;
  status: 'scheduled' | 'recorded' | 'published' | 'live';
  listenerCount: number;
  duration: string;
  platformLinks: {
    spotify?: string;
    apple?: string;
    google?: string;
    website?: string;
  };
  notes?: string;
  rating?: number;
  downloads?: number;
  engagement?: {
    shares: number;
    comments: number;
    likes: number;
  };
}

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500"
  },
  recorded: {
    label: "Recorded",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500"
  },
  published: {
    label: "Published",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500"
  },
  live: {
    label: "Live",
    icon: PlayCircle,
    color: "bg-purple-100 text-purple-800",
    dotColor: "bg-purple-500"
  }
};

function PlacementTable({ placements }: { placements: PlacementRecord[] }) {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-900">Client</TableHead>
            <TableHead className="font-semibold text-gray-900">Podcast</TableHead>
            <TableHead className="font-semibold text-gray-900">Episode</TableHead>
            <TableHead className="font-semibold text-gray-900">Host</TableHead>
            <TableHead className="font-semibold text-gray-900">Category</TableHead>
            <TableHead className="font-semibold text-gray-900">Recording Date</TableHead>
            <TableHead className="font-semibold text-gray-900">Publish Date</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Audience</TableHead>
            <TableHead className="font-semibold text-gray-900">Links</TableHead>
            <TableHead className="font-semibold text-gray-900">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placements.map((placement) => {
            const StatusIcon = statusConfig[placement.status].icon;
            return (
              <TableRow key={placement.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">{placement.clientName}</div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Podcast className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{placement.podcastName}</div>
                      <div className="text-sm text-gray-500">{placement.duration}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{placement.episodeTitle}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-gray-900">{placement.hostName}</div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="bg-gray-50">
                    {placement.category}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="text-gray-900">
                    {new Date(placement.recordingDate).toLocaleDateString()}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-gray-900">
                    {new Date(placement.publishDate).toLocaleDateString()}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[placement.status].dotColor}`}></div>
                    <Badge className={statusConfig[placement.status].color}>
                      {statusConfig[placement.status].label}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-gray-900">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    {placement.listenerCount.toLocaleString()}
                  </div>
                  {placement.downloads && (
                    <div className="text-sm text-gray-500 mt-1">
                      {placement.downloads.toLocaleString()} downloads
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {placement.platformLinks.spotify && (
                      <a 
                        href={placement.platformLinks.spotify} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                        title="Spotify"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </a>
                    )}
                    {placement.platformLinks.apple && (
                      <a 
                        href={placement.platformLinks.apple} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-700"
                        title="Apple Podcasts"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </a>
                    )}
                    {placement.episodeUrl && (
                      <a 
                        href={placement.episodeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                        title="Episode URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {placement.engagement && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Share2 className="w-3 h-3 mr-1" />
                        {placement.engagement.shares}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {placement.engagement.comments}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="w-3 h-3 mr-1" />
                        {placement.engagement.likes}
                      </div>
                    </div>
                  )}
                  {placement.rating && (
                    <div className="flex items-center text-sm text-yellow-600 mt-2">
                      ⭐ {placement.rating}/5
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PlacementTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['/api/placements'],
  });

  // Sample data matching Airtable structure
  const mockPlacements: PlacementRecord[] = [
    {
      id: 1,
      clientName: "Phillip Swan",
      podcastName: "AI Leadership Podcast",
      hostName: "Sarah Chen",
      episodeTitle: "Building Responsible AI at Scale",
      category: "Technology",
      recordingDate: "2024-01-15",
      publishDate: "2024-01-22",
      episodeUrl: "https://aileadership.com/episodes/responsible-ai",
      status: "published",
      listenerCount: 45000,
      duration: "52 min",
      platformLinks: {
        spotify: "https://spotify.com/episode/123",
        apple: "https://podcasts.apple.com/episode/123",
        website: "https://aileadership.com/episodes/responsible-ai"
      },
      downloads: 12500,
      engagement: {
        shares: 234,
        comments: 89,
        likes: 456
      },
      rating: 5
    },
    {
      id: 2,
      clientName: "Phillip Swan",
      podcastName: "Future of Work Today",
      hostName: "Mike Rodriguez",
      episodeTitle: "AI Transformation in Enterprise",
      category: "Business",
      recordingDate: "2024-01-08",
      publishDate: "2024-01-15",
      status: "published",
      listenerCount: 32000,
      duration: "38 min",
      platformLinks: {
        spotify: "https://spotify.com/episode/124",
        apple: "https://podcasts.apple.com/episode/124"
      },
      downloads: 8900,
      engagement: {
        shares: 178,
        comments: 45,
        likes: 312
      },
      rating: 4
    },
    {
      id: 3,
      clientName: "John Smith",
      podcastName: "Tech Innovators",
      hostName: "Jessica Park",
      episodeTitle: "Customer-Centric AI Solutions",
      category: "Technology",
      recordingDate: "2024-01-20",
      publishDate: "2024-01-25",
      status: "recorded",
      listenerCount: 28000,
      duration: "45 min",
      platformLinks: {}
    },
    {
      id: 4,
      clientName: "Maria Garcia",
      podcastName: "Startup Stories",
      hostName: "David Kim",
      episodeTitle: "Scaling AI in Healthcare",
      category: "Healthcare",
      recordingDate: "2024-01-25",
      publishDate: "2024-02-01",
      status: "scheduled",
      listenerCount: 18000,
      duration: "40 min",
      platformLinks: {}
    }
  ];

  const displayPlacements = isLoading ? [] : mockPlacements;

  const filteredPlacements = displayPlacements.filter(placement => {
    const matchesSearch = placement.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.podcastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.episodeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.hostName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || placement.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || placement.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: displayPlacements.length,
    published: displayPlacements.filter(p => p.status === 'published').length,
    totalReach: displayPlacements.reduce((sum, p) => sum + p.listenerCount, 0),
    averageRating: displayPlacements.filter(p => p.rating).reduce((sum, p) => sum + (p.rating || 0), 0) / displayPlacements.filter(p => p.rating).length || 0
  };

  const categories = [...new Set(displayPlacements.map(p => p.category))];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-700">Placement Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor and analyze podcast appearance performance</p>
        </div>
        <Button className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Placement
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Placements</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Podcast className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReach.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}/5</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients, podcasts, episodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="recorded">Recorded</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading placement data...</p>
        </div>
      ) : filteredPlacements.length === 0 ? (
        <div className="text-center py-12">
          <Podcast className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No placements found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredPlacements.length} of {displayPlacements.length} placements
            </p>
          </div>

          <PlacementTable placements={filteredPlacements} />
        </div>
      )}
    </div>
  );
}