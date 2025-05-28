// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient"; // Use the updated getQueryFn

// Define the expected user structure from your Python backend's /auth/me
interface AuthUser {
  username: string; // This is the email
  role: string | null;
  person_id?: number | null;
  full_name?: string | null;
  // You can add an explicit email field if you prefer, though username already holds it
  // email: string; 
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/auth/me"],
    queryFn: getQueryFn<AuthUser | null>({ on401: "returnNull" }), 
    retry: false,
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: true,
  });

  return {
    user, // user.username will be the email
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}