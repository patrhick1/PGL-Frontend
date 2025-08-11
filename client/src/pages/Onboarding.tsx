import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingTokenData {
  valid: boolean;
  person_id: number;
  campaign_id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const [tokenData, setTokenData] = useState<OnboardingTokenData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = new URLSearchParams(searchParams).get("token");

  useEffect(() => {
    if (!token) {
      navigate("/login?error=invalid-onboarding-link");
      return;
    }

    validateToken(token);
  }, [token, navigate]);

  const validateToken = async (token: string) => {
    try {
      setIsValidating(true);
      setError(null);

      const formData = new URLSearchParams();
      formData.append("token", token);
      formData.append("create_session", "true"); // Create session for accessing protected endpoints

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/validate-onboarding-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          credentials: "include", // Important: This ensures cookies are sent/received
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Invalid or expired link" }));
        throw new Error(errorData.detail || "Invalid or expired link");
      }

      const data = await response.json();
      
      if (!data.valid) {
        throw new Error("This onboarding link is no longer valid");
      }

      setTokenData(data);

      // Auto-login the user if they're not already authenticated
      if (data.person_id && data.email) {
        // The backend should handle auth session creation with the token
        // For now, we'll just proceed with the onboarding flow
        // The user will be properly authenticated after token validation
      }
    } catch (err) {
      console.error("Token validation error:", err);
      setError(err instanceof Error ? err.message : "Failed to validate onboarding link");
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <p className="text-gray-600">Validating your onboarding link...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Invalid Onboarding Link</h2>
              <p className="text-gray-600">
                {error || "This onboarding link is invalid or has expired."}
              </p>
              <p className="text-sm text-gray-500">
                Links expire after 7 days for security reasons.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={() => navigate("/login")}
                  variant="default"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                >
                  Visit Homepage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <OnboardingFlow
      token={token!}
      campaignId={tokenData.campaign_id}
      userName={tokenData.full_name}
      userEmail={tokenData.email}
    />
  );
}