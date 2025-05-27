import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ExternalLink, Plus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PodcastDiscoveryResult {
  id: string;
  name: string;
  description: string;
  category: string;
  hostName: string;
  website?: string;
  rssUrl?: string;
  imageUrl?: string;
  avgDownloads?: number;
  audienceSize?: number;
  language: string;
  relevanceScore?: number;
  source: 'listennotes' | 'podscan' | 'internal';
}

interface SearchFilters {
  query: string;
  category: string;
  language: string;
  minAudienceSize: string;
}

export default function PodcastDiscovery() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    language: 'en',
    minAudienceSize: ''
  });

  const { data: searchResults, isLoading: isSearching, refetch } = useQuery({
    queryKey: ['/api/discovery/search', filters],
    enabled: false
  });

  const addToSystemMutation = useMutation({
    mutationFn: async (podcast: PodcastDiscoveryResult) => {
      return await apiRequest('/api/podcasts', {
        method: 'POST',
        body: {
          name: podcast.name,
          description: podcast.description,
          category: podcast.category,
          hostName: podcast.hostName,
          website: podcast.website,
          rssUrl: podcast.rssUrl,
          imageUrl: podcast.imageUrl,
          avgDownloads: podcast.avgDownloads,
          audienceSize: podcast.audienceSize,
          language: podcast.language,
          source: podcast.source
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Podcast Added",
        description: "Podcast has been added to your system for outreach."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/podcasts'] });
    }
  });

  const handleSearch = () => {
    if (!filters.query.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term to discover podcasts.",
        variant: "destructive"
      });
      return;
    }
    refetch();
  };

  const handleAddPodcast = (podcast: PodcastDiscoveryResult) => {
    addToSystemMutation.mutate(podcast);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Podcasts
          </CardTitle>
          <CardDescription>
            Discover podcasts from multiple sources including ListenNotes and Podscan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Query</label>
              <Input
                placeholder="e.g., entrepreneurship, technology"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="health">Health & Fitness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select value={filters.language} onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Min Audience</label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.minAudienceSize}
                onChange={(e) => setFilters(prev => ({ ...prev, minAudienceSize: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="bg-[#A553EA] hover:bg-[#8A2BE2]"
          >
            {isSearching ? "Searching..." : "Search Podcasts"}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Discovery Results</h2>
            <Badge variant="secondary">
              {searchResults?.length || 0} podcasts found
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults?.map((podcast: PodcastDiscoveryResult) => (
              <Card key={podcast.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{podcast.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Host: {podcast.hostName}
                      </CardDescription>
                    </div>
                    {podcast.imageUrl && (
                      <img 
                        src={podcast.imageUrl} 
                        alt={podcast.name}
                        className="w-12 h-12 rounded-lg object-cover ml-3"
                      />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {podcast.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{podcast.category}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {podcast.source}
                    </Badge>
                    {podcast.relevanceScore && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {Math.round(podcast.relevanceScore * 100)}%
                      </Badge>
                    )}
                  </div>

                  {(podcast.audienceSize || podcast.avgDownloads) && (
                    <div className="text-sm text-gray-600">
                      {podcast.audienceSize && (
                        <div>Audience: {podcast.audienceSize.toLocaleString()}</div>
                      )}
                      {podcast.avgDownloads && (
                        <div>Avg Downloads: {podcast.avgDownloads.toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAddPodcast(podcast)}
                      disabled={addToSystemMutation.isPending}
                      size="sm"
                      className="flex-1 bg-[#A553EA] hover:bg-[#8A2BE2]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to System
                    </Button>
                    
                    {podcast.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(podcast.website, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No podcasts found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find relevant podcasts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}