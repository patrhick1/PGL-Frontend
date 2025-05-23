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
  podcastName: string;
  status: 'responded' | 'interested' | 'form_submitted' | 'pending_intro_call' | 'intro_call_booked' | 'pending_podcast_booking' | 'recording_booked' | 'recording' | 'live_link' | 'paid';
  callDate: string;
  hostName: string;
  hostEmail: string;
  interviewBriefLink?: string;
  placementReach: number;
  publishDate: string;
  liveLink?: string;
}

const statusConfig = {
  responded: {
    label: "Responded",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500"
  },
  interested: {
    label: "Interested",
    icon: Eye,
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500"
  },
  form_submitted: {
    label: "Form Submitted",
    icon: CheckCircle,
    color: "bg-cyan-100 text-cyan-800",
    dotColor: "bg-cyan-500"
  },
  pending_intro_call: {
    label: "Pending Intro Call Booking",
    icon: Calendar,
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500"
  },
  intro_call_booked: {
    label: "Intro Call Booked",
    icon: Clock,
    color: "bg-orange-100 text-orange-800",
    dotColor: "bg-orange-500"
  },
  pending_podcast_booking: {
    label: "Pending Podcast Booking",
    icon: Calendar,
    color: "bg-purple-100 text-purple-800",
    dotColor: "bg-purple-500"
  },
  recording_booked: {
    label: "Recording Booked",
    icon: Calendar,
    color: "bg-indigo-100 text-indigo-800",
    dotColor: "bg-indigo-500"
  },
  recording: {
    label: "Recording",
    icon: PlayCircle,
    color: "bg-red-100 text-red-800",
    dotColor: "bg-red-500"
  },
  live_link: {
    label: "Live Link",
    icon: ExternalLink,
    color: "bg-emerald-100 text-emerald-800",
    dotColor: "bg-emerald-500"
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500"
  }
};

function PlacementTable({ placements }: { placements: PlacementRecord[] }) {
  const [editingField, setEditingField] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (placement: PlacementRecord, field: string) => {
    setEditingField({ id: placement.id, field });
    // Set current value based on field
    switch(field) {
      case 'callDate':
        setEditValue(placement.callDate);
        break;
      case 'interviewBriefLink':
        setEditValue(placement.interviewBriefLink || '');
        break;
      case 'placementReach':
        setEditValue(placement.placementReach.toString());
        break;
      case 'publishDate':
        setEditValue(placement.publishDate);
        break;
      case 'liveLink':
        setEditValue(placement.liveLink || '');
        break;
    }
  };

  const handleSave = () => {
    // Here you would normally save to your API
    console.log('Saving:', editingField, editValue);
    setEditingField(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-900">Podcast</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Call Date</TableHead>
            <TableHead className="font-semibold text-gray-900">Host Name</TableHead>
            <TableHead className="font-semibold text-gray-900">Host Email</TableHead>
            <TableHead className="font-semibold text-gray-900">Interview Brief</TableHead>
            <TableHead className="font-semibold text-gray-900">Placement Reach</TableHead>
            <TableHead className="font-semibold text-gray-900">Publish Date</TableHead>
            <TableHead className="font-semibold text-gray-900">Live Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placements.map((placement) => {
            const StatusIcon = statusConfig[placement.status].icon;
            return (
              <TableRow key={placement.id} className="hover:bg-gray-50">
                {/* Read-only: Podcast */}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Podcast className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="font-medium text-gray-900">{placement.podcastName}</div>
                  </div>
                </TableCell>
                
                {/* Read-only: Status */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[placement.status].dotColor}`}></div>
                    <Badge className={statusConfig[placement.status].color}>
                      {statusConfig[placement.status].label}
                    </Badge>
                  </div>
                </TableCell>
                
                {/* Editable: Call Date */}
                <TableCell>
                  {editingField?.id === placement.id && editingField?.field === 'callDate' ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm w-32"
                      />
                      <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="text-gray-900 cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEdit(placement, 'callDate')}
                    >
                      {new Date(placement.callDate).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
                
                {/* Read-only: Host Name */}
                <TableCell>
                  <div className="text-gray-900">{placement.hostName}</div>
                </TableCell>
                
                {/* Read-only: Host Email */}
                <TableCell>
                  <a 
                    href={`mailto:${placement.hostEmail}`}
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    {placement.hostEmail}
                  </a>
                </TableCell>
                
                {/* Editable: Interview Brief */}
                <TableCell>
                  {editingField?.id === placement.id && editingField?.field === 'interviewBriefLink' ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="url"
                        placeholder="Brief link"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm w-40"
                      />
                      <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEdit(placement, 'interviewBriefLink')}
                    >
                      {placement.interviewBriefLink ? (
                        <a 
                          href={placement.interviewBriefLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Brief
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Click to add</span>
                      )}
                    </div>
                  )}
                </TableCell>
                
                {/* Editable: Placement Reach */}
                <TableCell>
                  {editingField?.id === placement.id && editingField?.field === 'placementReach' ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm w-24"
                      />
                      <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center text-gray-900 cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEdit(placement, 'placementReach')}
                    >
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {placement.placementReach.toLocaleString()}
                    </div>
                  )}
                </TableCell>
                
                {/* Editable: Publish Date */}
                <TableCell>
                  {editingField?.id === placement.id && editingField?.field === 'publishDate' ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm w-32"
                      />
                      <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="text-gray-900 cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEdit(placement, 'publishDate')}
                    >
                      {new Date(placement.publishDate).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
                
                {/* Editable: Live Link */}
                <TableCell>
                  {editingField?.id === placement.id && editingField?.field === 'liveLink' ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="url"
                        placeholder="Live link"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm w-40"
                      />
                      <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEdit(placement, 'liveLink')}
                    >
                      {placement.liveLink ? (
                        <a 
                          href={placement.liveLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />
                          Listen
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Click to add</span>
                      )}
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

  // Sample data for client placement tracking
  const mockPlacements: PlacementRecord[] = [
    {
      id: 1,
      podcastName: "AI Leadership Podcast",
      status: "paid",
      callDate: "2024-01-15",
      hostName: "Sarah Chen",
      hostEmail: "sarah@aileadership.com",
      interviewBriefLink: "https://docs.google.com/document/d/abc123",
      placementReach: 45000,
      publishDate: "2024-01-22",
      liveLink: "https://aileadership.com/episodes/responsible-ai"
    },
    {
      id: 2,
      podcastName: "Future of Work Today",
      status: "live_link",
      callDate: "2024-01-08",
      hostName: "Mike Rodriguez",
      hostEmail: "mike@futureofwork.com",
      interviewBriefLink: "https://docs.google.com/document/d/def456",
      placementReach: 32000,
      publishDate: "2024-01-15",
      liveLink: "https://futureofwork.com/episodes/ai-transformation"
    },
    {
      id: 3,
      podcastName: "Tech Innovators",
      status: "recording",
      callDate: "2024-01-20",
      hostName: "Jessica Park",
      hostEmail: "jessica@techinnovators.io",
      interviewBriefLink: "https://docs.google.com/document/d/ghi789",
      placementReach: 28000,
      publishDate: "2024-01-25"
    },
    {
      id: 4,
      podcastName: "Startup Stories",
      status: "recording_booked",
      callDate: "2024-01-25",
      hostName: "David Kim",
      hostEmail: "david@startupstories.com",
      placementReach: 18000,
      publishDate: "2024-02-01"
    },
    {
      id: 5,
      podcastName: "Business Growth Show",
      status: "intro_call_booked",
      callDate: "2024-01-30",
      hostName: "Jennifer Lopez",
      hostEmail: "jen@businessgrowth.com",
      placementReach: 25000,
      publishDate: "2024-02-05"
    },
    {
      id: 6,
      podcastName: "Marketing Minds",
      status: "form_submitted",
      callDate: "2024-02-02",
      hostName: "Tom Wilson",
      hostEmail: "tom@marketingminds.net",
      placementReach: 15000,
      publishDate: "2024-02-08"
    }
  ];

  const displayPlacements = isLoading ? [] : mockPlacements;

  const filteredPlacements = displayPlacements.filter(placement => {
    const matchesSearch = placement.podcastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.hostName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || placement.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: displayPlacements.length,
    paid: displayPlacements.filter(p => p.status === 'paid').length,
    totalReach: displayPlacements.reduce((sum, p) => sum + p.placementReach, 0),
    averageReach: displayPlacements.length > 0 ? displayPlacements.reduce((sum, p) => sum + p.placementReach, 0) / displayPlacements.length : 0
  };

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
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
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
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="form_submitted">Form Submitted</SelectItem>
                  <SelectItem value="pending_intro_call">Pending Intro Call</SelectItem>
                  <SelectItem value="intro_call_booked">Intro Call Booked</SelectItem>
                  <SelectItem value="pending_podcast_booking">Pending Podcast Booking</SelectItem>
                  <SelectItem value="recording_booked">Recording Booked</SelectItem>
                  <SelectItem value="recording">Recording</SelectItem>
                  <SelectItem value="live_link">Live Link</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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