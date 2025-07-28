import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Loader2,
  ArrowRight,
  Home
} from "lucide-react";

export default function EmailVerification() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [verificationDetails, setVerificationDetails] = useState<any>(null);

  const token = new URLSearchParams(searchParams).get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the URL.");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      console.log("Verifying email with token:", token);
      
      // Create form data for the request
      const formData = new URLSearchParams();
      formData.append("token", token);

      // Use fetch directly to send form-encoded data
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          credentials: "include",
        }
      );

      console.log("Verification response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          detail: "Email verification failed" 
        }));
        throw new Error(errorData.detail || "Email verification failed");
      }

      const data = await response.json();
      console.log("Verification successful:", data);
      
      setVerificationDetails(data);
      setStatus("success");

      // If onboarding email is being sent, show that info
      if (data.onboarding_email_sent) {
        // Auto-redirect to login after a delay
        setTimeout(() => {
          navigate("/login?message=email-verified");
        }, 5000);
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to verify email"
      );
    }
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Verifying Your Email</h2>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
              <p className="text-gray-600">{errorMessage}</p>
              
              <div className="pt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  This link may have expired or already been used.
                </p>
                <p className="text-sm text-gray-500">
                  Verification links expire after 24 hours for security.
                </p>
              </div>

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
                  <Home className="h-4 w-4 mr-2" />
                  Homepage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Email Verified! 🎉</h2>
            <p className="text-gray-600">
              Your email has been successfully verified.
            </p>

            {verificationDetails?.onboarding_email_sent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                <p className="text-sm text-blue-700">
                  We've sent you an onboarding email with a link to set up your podcast guest profile. 
                  Check your inbox and click the link to get started!
                </p>
              </div>
            )}

            <div className="pt-6">
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
                size="lg"
              >
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                {verificationDetails?.onboarding_email_sent 
                  ? "Redirecting to login in 5 seconds..." 
                  : "You can now log in with your credentials."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}