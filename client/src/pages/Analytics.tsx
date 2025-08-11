import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import PitchAnalyticsDashboard from '@/components/analytics/PitchAnalyticsDashboard';
import PlacementAnalyticsDashboard from '@/components/analytics/PlacementAnalyticsDashboard';
import { BarChart3, Target, TrendingUp, Calendar } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  client_name?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  
  // Fetch available campaigns
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['/campaigns'],
    select: (data) => data || [],
  });

  const isClient = user?.role?.toLowerCase() === 'client';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600 mt-2">
              Track your podcast outreach performance and placement metrics
            </p>
          </div>
          
          {/* Campaign Selector */}
          {!isClient && campaigns && campaigns.length > 0 && (
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                    {campaign.client_name && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({campaign.client_name})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Campaigns
              </CardTitle>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pitches Sent
              </CardTitle>
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Placements Secured
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Recordings
              </CardTitle>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="pitches" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pitches">Pitch Analytics</TabsTrigger>
          <TabsTrigger value="placements">Placement Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pitches" className="space-y-6">
          <PitchAnalyticsDashboard 
            campaignId={selectedCampaignId === 'all' ? undefined : selectedCampaignId} 
          />
        </TabsContent>

        <TabsContent value="placements" className="space-y-6">
          <PlacementAnalyticsDashboard 
            campaignId={selectedCampaignId === 'all' ? undefined : selectedCampaignId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}