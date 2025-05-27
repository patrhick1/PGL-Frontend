import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import PodcastDiscovery from "@/pages/PodcastDiscovery";
import Questionnaire from "@/pages/Questionnaire";
import MediaKit from "@/pages/MediaKit";
import PitchGenerator from "@/pages/PitchGenerator";
import ContentCreator from "@/pages/ContentCreator";
import Approvals from "@/pages/Approvals";
import PlacementTracking from "@/pages/PlacementTracking";
import Settings from "@/pages/Settings";
import AdminPanel from "@/pages/AdminPanel";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/discover" component={PodcastDiscovery} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/content-creator" component={ContentCreator} />
          <Route path="/media-kit" component={MediaKit} />
          <Route path="/angle-generator" component={PitchGenerator} />
          <Route path="/approvals" component={Approvals} />
          <Route path="/placement-tracking" component={PlacementTracking} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/settings" component={Settings} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
