import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Podcast, Users, ExternalLink } from "lucide-react";

interface PodcastData {
  id: number;
  name: string;
  host: string;
  category: string;
  listenerCount: number;
  description?: string;
  coverImageUrl?: string;
  website?: string;
  contactEmail?: string;
  averageRating: number;
}

const categories = [
  "All Categories",
  "Business",
  "Technology", 
  "Marketing",
  "Leadership",
  "Entrepreneurship",
  "Innovation",
  "Finance",
  "Personal Development",
  "Health & Wellness",
  "Education",
];

function PodcastCard({ podcast }: { podcast: PodcastData }) {
  const getMatchScore = (listenerCount: number, rating: number) => {
    const score = (listenerCount / 1000) * 0.6 + rating * 0.4;
    if (score > 30) return { label: "High Match", class: "match-high" };
    if (score > 15) return { label: "Medium Match", class: "match-medium" };
    return { label: "Low Match", class: "match-low" };
  };

  const matchScore = getMatchScore(podcast.listenerCount, podcast.averageRating);

  return (
    <Card className="card-hover border border-gray-200 hover:border-primary/30 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {podcast.coverImageUrl ? (
              <img
                src={podcast.coverImageUrl}
                alt={podcast.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <Podcast className="h-8 w-8 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{podcast.name}</h3>
                <p className="text-sm text-gray-600">by {podcast.host}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {podcast.category}
                </Badge>
              </div>
              <Badge className={`ml-2 ${matchScore.class}`}>
                {matchScore.label}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {podcast.description || "No description available"}
            </p>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {(podcast.listenerCount / 1000).toFixed(0)}K listeners
                </div>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full mr-1 ${
                          i < Math.floor(podcast.averageRating)
                            ? "bg-yellow-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1">{podcast.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {podcast.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(podcast.website, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visit
                  </Button>
                )}
                <Button size="sm" className="bg-primary text-white hover:bg-blue-700">
                  Apply to Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PodcastDiscovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);

  const { data: podcasts, isLoading } = useQuery<PodcastData[]>({
    queryKey: ["/api/podcasts", { 
      search: searchTerm || undefined, 
      category: selectedCategory !== "All Categories" ? selectedCategory : undefined 
    }],
  });

  const filteredPodcasts = podcasts || [];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search podcasts by name, host, or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isLoading ? "Loading..." : `${filteredPodcasts.length} Podcasts Found`}
          </h2>
          {(searchTerm || selectedCategory !== "All Categories") && (
            <p className="text-sm text-gray-600 mt-1">
              {searchTerm && `Searching for "${searchTerm}"`}
              {searchTerm && selectedCategory !== "All Categories" && " in "}
              {selectedCategory !== "All Categories" && `${selectedCategory} category`}
            </p>
          )}
        </div>
      </div>

      {/* Podcast Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPodcasts.length > 0 ? (
        <div className="space-y-4">
          {filteredPodcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No podcasts found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search terms or filters to find more podcasts.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
