// client/src/App.tsx
import { Switch, Route, Redirect, useLocation } from "wouter"; // Added Redirect and useLocation
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Layout from "@/components/Layout"; // Your main app layout with Sidebar and Header

// --- Page Imports ---
// Common
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import PlacementTracking from "@/pages/PlacementTracking"; // Used by both, data filtered by API

// Client-Specific (or primarily client-focused)
import ClientCampaigns from "@/pages/ClientCampaigns";
import ProfileSetup from "@/pages/ProfileSetup"; // Replaces direct Questionnaire & MediaKit for clients
import Approvals from "@/pages/Approvals"; // UI/data adapts based on role
import PodcastDiscovery from "@/pages/PodcastDiscovery"; // UI/data adapts based on role
import MediaDetail from "@/pages/MediaDetail"; // Import the new page

// Staff/Admin-Specific
import CampaignManagement from "@/pages/CampaignManagement";
import PitchOutreach from "@/pages/PitchOutreach";
import AdminPanel from "@/pages/AdminPanel"; // Admin only
import PitchTemplatesPage from "@/pages/PitchTemplates"; // Added for Phase 5

// Shared Detail Page
import CampaignDetail from "@/pages/CampaignDetail";

// Auth
import SignupPage from "@/pages/Signup";
import LeadMagnetQuestionnaire from "@/pages/LeadMagnetQuestionnaire"; // Added for Lead Magnet
import PublicMediaKitPage from "@/pages/PublicMediaKitPage"; // Added for public media kit viewing
import ResetPasswordPage from "@/pages/ResetPassword"; // Added for password reset
import Onboarding from "@/pages/Onboarding"; // Added for onboarding flow
import EmailVerification from "@/pages/EmailVerification"; // Added for email verification


function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRoleLower = user?.role?.toLowerCase(); // Get lowercase role

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-gray-700">Loading Application...</p>
      </div>
    );
  }

  return (
    <Switch> {/* Outer Switch for auth state */}
      {/* Public routes accessible to everyone */}
      <Route path="/media-kit/:slug" component={PublicMediaKitPage} /> {/* Public media kit route - accessible to all users */}
      <Route path="/onboarding" component={Onboarding} /> {/* Onboarding route - token-based auth */}
      <Route path="/verify-email" component={EmailVerification} /> {/* Email verification route */}
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/reset-password" component={ResetPasswordPage} /> {/* Added reset password route */}
          <Route path="/lead-magnet/questionnaire" component={LeadMagnetQuestionnaire} /> {/* Added public route */}
          {/* Redirect any other path to login if not authenticated */}
          <Route>
            <Redirect to="/" replace />
          </Route>
        </>
      ) : (
        <Layout> {/* Layout includes Sidebar and Header */}
          <Switch> {/* <<< NESTED SWITCH for authenticated routes */}
            {/* Common Routes for all authenticated users */}
            <Route path="/" component={Dashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/placement-tracking" component={PlacementTracking} />
            <Route path="/approvals" component={Approvals} /> 
            {/* Approvals page will internally handle data/UI based on user.role */}


            {/* Client-Specific Routes */}
            {userRoleLower === 'client' && (
              <>
                <Route path="/my-campaigns" component={ClientCampaigns} />
                <Route path="/my-campaigns/:campaignId">{params => <CampaignDetail campaignIdParam={params.campaignId} />}</Route>
                <Route path="/profile-setup" component={ProfileSetup} />
                <Route path="/discover" component={PodcastDiscovery} /> {/* Client's limited discovery */}
                <Route path="/media/:mediaId" component={MediaDetail} /> {/* Add new route */}
              </>
            )}

            {/* Internal Staff/Admin Routes */}
            {(userRoleLower === 'staff' || userRoleLower === 'admin') && (
              <>
                {/* Dashboard for staff might be the same component but fetch different data based on role */}
                <Route path="/campaign-management" component={CampaignManagement} />
                <Route path="/manage/campaigns/:campaignId">{params => <CampaignDetail campaignIdParam={params.campaignId} />}</Route>
                <Route path="/discover" component={PodcastDiscovery} /> {/* Staff's full discovery */}
                <Route path="/pitch-outreach" component={PitchOutreach} />
                <Route path="/pitch-templates" component={PitchTemplatesPage} /> {/* Added for Phase 5 */}
              </>
            )}

            {/* Admin-Only Routes */}
            {userRoleLower === 'admin' && (
              <Route path="/admin" component={AdminPanel} />
            )}
            
            {/* Fallback for authenticated users if no specific route matches their role or path */}
            {/* This ensures that if an authenticated user lands on a non-defined path, they go to their dashboard */}
            <Route path="/:rest*">
              <Redirect to="/" replace />
            </Route>
          </Switch> {/* <<< END NESTED SWITCH */}
        </Layout>
      )}
      {/* Final catch-all for any route not handled above (e.g. if Layout itself is part of a non-matched authenticated route) */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Modified CampaignDetail to accept campaignId as a prop
// This is because wouter's params are passed to the component rendered by <Route>
function CampaignDetailWrapper(props: { params: { campaignId: string } }) {
    return <CampaignDetail campaignIdParam={props.params.campaignId} />;
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