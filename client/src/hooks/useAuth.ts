// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface AuthUser {
  username: string; // This is the email
  role: string | null;
  person_id: number | null; // Changed from optional to match backend session data more closely
  full_name: string | null; // Changed from optional
  // Fields from Person schema / settings page
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  timezone?: string | null;
  linkedin_profile_url?: string | null;
  twitter_profile_url?: string | null;
  instagram_profile_url?: string | null;
  tiktok_profile_url?: string | null;
  dashboard_username?: string | null;
  profileImageUrl?: string | null; // Was already commented, making it active
  notification_settings?: Record<string, any> | null; // Assuming object, adjust if different
  privacy_settings?: Record<string, any> | null;    // Assuming object, adjust if different
}

export function useAuth() {
  const { data: user, isLoading, error, isSuccess } = useQuery<AuthUser | null>({
    queryKey: ["/auth/me"], // Corrected path to match backend auth.router
    queryFn: getQueryFn<AuthUser | null>({ on401: "returnNull" }), 
    retry: false,
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: true,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error && isSuccess, // Ensure query was successful
    error,
  };
}