import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp,
  Eye,
  AlertCircle
} from "lucide-react";

interface DiscoveryItem {
  discovery_id: number;
  campaign_id: string;
  media_id: number;
  media_name: string;
  discovery_keyword: string;
  enrichment_status: string;
  vetting_status: string;
  overall_status: string;
  vetting_score?: number;
  match_created: boolean;
  review_task_created: boolean;
  discovered_at: string;
  updated_at: string;
  enrichment_error?: string;
  vetting_error?: string;
}

interface DiscoveryStatus {
  items: DiscoveryItem[];
  total: number;
  in_progress: number;
  completed: number;
  failed: number;
}

interface DiscoveryProgressTrackerProps {
  campaignId: string;
  isActive: boolean;
  onComplete?: (data: DiscoveryStatus) => void;
}

export default function DiscoveryProgressTracker({ 
  campaignId, 
  isActive, 
  onComplete 
}: DiscoveryProgressTrackerProps) {
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isActive || !campaignId) {
      setIsPolling(false);
      return;
    }

    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      setIsPolling(true);
      
      pollInterval = setInterval(async () => {
        try {
          const response = await apiRequest("GET", `/match-suggestions/campaigns/${campaignId}/discoveries/status`);
          if (response.ok) {
            const status: DiscoveryStatus = await response.json();
            setDiscoveryStatus(status);
            
            // Check if discovery is complete
            if (status.in_progress === 0 && status.total > 0) {
              setIsPolling(false);
              clearInterval(pollInterval);
              
              const reviewTasksCreated = status.items.filter(i => i.review_task_created).length;
              toast({
                title: "🎉 Discovery Complete!",
                description: `Found ${status.completed} matches. ${reviewTasksCreated} review tasks created and ready for approval.`,
                duration: 6000,
              });
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ["/review-tasks/enhanced"] });
              queryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", campaignId] });
              
              // Call completion callback
              onComplete?.(status);
            }
          }
        } catch (error) {
          console.error('Discovery polling error:', error);
        }
      }, 10000); // Poll every 10 seconds
    };

    startPolling();

    // Cleanup on unmount or when polling stops
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsPolling(false);
    };
  }, [isActive, campaignId, onComplete, toast, queryClient]);

  const refreshStatus = async () => {
    if (!campaignId) return;
    
    try {
      const response = await apiRequest("GET", `/match-suggestions/campaigns/${campaignId}/discoveries/status`);
      if (response.ok) {
        const status: DiscoveryStatus = await response.json();
        setDiscoveryStatus(status);
      }
    } catch (error) {
      console.error('Failed to refresh discovery status:', error);
    }
  };

  if (!isActive || !discoveryStatus) {
    return null;
  }

  const progressPercentage = discoveryStatus.total > 0 
    ? (discoveryStatus.completed / discoveryStatus.total) * 100 
    : 0;

  const statusItems = [
    { label: "✅ Completed", count: discoveryStatus.completed, color: "text-green-600" },
    { label: "⏳ In Progress", count: discoveryStatus.in_progress, color: "text-blue-600" },
    { label: "❌ Failed", count: discoveryStatus.failed, color: "text-red-600" },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Discovery Pipeline Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPolling && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Live Updates
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStatus}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 font-medium">Overall Progress</span>
            <span className="text-blue-600">{discoveryStatus.completed} / {discoveryStatus.total}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Status Counts */}
        <div className="grid grid-cols-3 gap-4">
          {statusItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.count}
              </div>
              <div className="text-xs text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Discoveries */}
        {discoveryStatus.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Recent Discoveries
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {discoveryStatus.items.slice(0, 10).map((item) => (
                <div 
                  key={item.discovery_id} 
                  className="flex items-center justify-between p-2 bg-white rounded border text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.media_name}
                    </div>
                    <div className="text-gray-500">
                      Keyword: {item.discovery_keyword}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {item.vetting_score && (
                      <Badge variant="secondary" className="text-xs">
                        {item.vetting_score.toFixed(1)}/10
                      </Badge>
                    )}
                    {item.overall_status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.overall_status === 'in_progress' && (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    {item.overall_status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {item.review_task_created && (
                      <Badge variant="outline" className="text-xs">
                        Review Ready
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {discoveryStatus.items.some(item => item.enrichment_error || item.vetting_error) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-800 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Recent Errors
            </h4>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {discoveryStatus.items
                .filter(item => item.enrichment_error || item.vetting_error)
                .slice(0, 3)
                .map((item) => (
                  <div key={item.discovery_id} className="p-2 bg-red-50 rounded border text-xs">
                    <div className="font-medium text-red-900">{item.media_name}</div>
                    <div className="text-red-700">
                      {item.enrichment_error || item.vetting_error}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}