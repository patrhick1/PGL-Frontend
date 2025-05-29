// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface AuthUser {
  username: string; // This is the email
  role: string | null;
  person_id: number | null; // Changed from optional to match backend session data more closely
  full_name: string | null; // Changed from optional
  // profileImageUrl?: string; // Add if your backend /me returns this
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