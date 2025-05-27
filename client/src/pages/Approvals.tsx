import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  Filter,
  Podcast,
  Users,
  ExternalLink,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Play,
  Calendar,
  LayoutGrid,
  List
} from "lucide-react";

interface PodcastOpportunity {
  id: number;
  podcastName: string;
  hostName: string;
  podcastFocus: string;
  podcastUrl: string;
  source: 'podscan' | 'listennotes';
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  notes?: string;
  createdAt: string;
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800"
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800"
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-100 text-red-800"
  },
  contacted: {
    label: "Contacted",
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-800"
  }
};

const sourceConfig = {
  podscan: {
    label: "PodScan",
    color: "bg-purple-100 text-purple-800"
  },
  listennotes: {
    label: "Listen Notes",
    color: "bg-blue-100 text-blue-800"
  }
};

function OpportunityCard({ opportunity }: { opportunity: PodcastOpportunity }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/podcast-opportunities/${id}`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/podcast-opportunities'] });
      toast({
        title: "Status updated",
        description: "Podcast opportunity status has been updated successfully.",
      });
    }
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ id: opportunity.id, status: 'approved' });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ id: opportunity.id, status: 'rejected' });
  };

  const StatusIcon = statusConfig[opportunity.status].icon;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={sourceConfig[opportunity.source].color}>
                {sourceConfig[opportunity.source].label}
              </Badge>
              <Badge className={statusConfig[opportunity.status].color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[opportunity.status].label}
              </Badge>
            </div>
            <CardTitle className="text-lg">{opportunity.podcastName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Hosted by {opportunity.hostName}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 line-clamp-3">{opportunity.podcastFocus}</p>
        </div>

        <div className="pt-2">
          <a 
            href={opportunity.podcastUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Podcast
          </a>
        </div>

        {opportunity.status === 'pending' && (
          <div className="flex space-x-2 pt-4 border-t">
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={updateStatusMutation.isPending}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={updateStatusMutation.isPending}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OpportunityTable({ opportunities }: { opportunities: PodcastOpportunity[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/podcast-opportunities/${id}`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/podcast-opportunities'] });
      toast({
        title: "Status updated",
        description: "Podcast opportunity status has been updated successfully.",
      });
    }
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Podcast</TableHead>
            <TableHead>Episode</TableHead>
            <TableHead>Host & Category</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opportunity) => {
            const StatusIcon = statusConfig[opportunity.status].icon;
            return (
              <TableRow key={opportunity.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {opportunity.coverImageUrl ? (
                      <img 
                        src={opportunity.coverImageUrl} 
                        alt={opportunity.podcastName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Podcast className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{opportunity.podcastName}</div>
                      {opportunity.podcastWebsite && (
                        <a 
                          href={opportunity.podcastWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:text-primary/80 flex items-center mt-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium text-sm truncate">{opportunity.episodeTitle}</div>
                    <div className="text-xs text-gray-600 truncate">{opportunity.episodeDescription}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {opportunity.duration} • {new Date(opportunity.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{opportunity.hostName}</div>
                  <div className="text-xs text-gray-600">{opportunity.category}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {opportunity.listenerCount.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`font-semibold ${getRelevanceColor(opportunity.relevanceScore)}`}>
                    {opportunity.relevanceScore}%
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={sourceConfig[opportunity.source].color}>
                    {sourceConfig[opportunity.source].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[opportunity.status].color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[opportunity.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {opportunity.status === 'pending' ? (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(opportunity.id)}
                        className="bg-green-600 hover:bg-green-700 px-2"
                        disabled={updateStatusMutation.isPending}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(opportunity.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 px-2"
                        disabled={updateStatusMutation.isPending}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {opportunity.status === 'approved' && 'Ready to contact'}
                      {opportunity.status === 'rejected' && 'Not suitable'}
                      {opportunity.status === 'contacted' && 'Outreach sent'}
                    </span>
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

export default function Approvals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['/api/podcast-opportunities'],
  });



  const filteredOpportunities = opportunities.filter((opportunity: PodcastOpportunity) => {
    const matchesSearch = opportunity.podcastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.episodeTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    const matchesSource = sourceFilter === "all" || opportunity.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    total: filteredOpportunities.length,
    pending: filteredOpportunities.filter((o: PodcastOpportunity) => o.status === 'pending').length,
    approved: filteredOpportunities.filter((o: PodcastOpportunity) => o.status === 'approved').length,
    rejected: filteredOpportunities.filter((o: PodcastOpportunity) => o.status === 'rejected').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Podcast className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search podcasts, hosts, episodes..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="podscan">PodScan</SelectItem>
                  <SelectItem value="listennotes">Listen Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading podcast opportunities...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Podcast className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No opportunities found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredOpportunities.length} of {displayOpportunities.length} opportunities
            </p>
          </div>

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          ) : (
            <OpportunityTable opportunities={filteredOpportunities} />
          )}
        </div>
      )}
    </div>
  );
}