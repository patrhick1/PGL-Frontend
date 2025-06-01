// client/src/pages/Landing.tsx
import { useState, useEffect } from "react"; // Added useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mic, LogIn, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter"; // Added Link
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient"; // appQueryClient is not needed, use queryClient directly

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Get redirect parameters from URL
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get("redirect");
  const campaignId = queryParams.get("campaignId");

  useEffect(() => {
    if (isAuthenticated) {
      // If there's a redirect path, use it; otherwise go to dashboard
      const destinationPath = redirectPath 
        ? (campaignId ? `${redirectPath}?campaignId=${campaignId}` : redirectPath)
        : "/";
      navigate(destinationPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath, campaignId]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  // If already authenticated (e.g. due to useEffect not running yet or race condition), redirect
  if (isAuthenticated) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email); 
      formData.append("password", password);

      // Assuming VITE_API_BASE_URL = http://localhost:8000
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include", 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed. Please check your credentials." }));
        throw new Error(errorData.detail || "Login failed");
      }
      
      // const responseData = await response.json(); // Contains user role, person_id etc.
      // console.log("Login successful, response data:", responseData); // For debugging

      toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
      await queryClient.invalidateQueries({ queryKey: ["/auth/me"] }); // Corrected queryKey
      // The useAuth hook will pick up the new auth state, and App.tsx router will redirect.
      // Explicit navigation might still be good for immediate feedback.
      const destinationPath = redirectPath 
        ? (campaignId ? `${redirectPath}?campaignId=${campaignId}` : redirectPath)
        : "/";
      navigate(destinationPath, { replace: true });

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("email", forgotPasswordEmail);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      // The API always returns 202 for security (doesn't reveal if email exists)
      if (response.status === 202) {
        toast({
          title: "Reset Link Sent",
          description: "If an account with this email exists, a password reset link has been sent.",
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail("");
      } else {
        throw new Error("Failed to send reset email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen" style={{ background: 'hsl(var(--primary))' }}> {/* Use theme color */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="text-primary text-2xl h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">PGL CRM</h1>
                  <p className="text-gray-600">Professional Podcast Booking System</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@example.com"
                      required 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Your password" 
                      required 
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isLoading || authLoading} // Disable if auth check is also loading
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base" // Adjusted size
                  >
                    {isLoading ? "Signing In..." : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <button
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-primary hover:text-primary/80 hover:underline"
                  >
                    Forgot your password?
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                      Sign Up
                    </Link>
                  </p>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Streamline your podcast booking process and grow your audience reach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" />
              Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotPasswordEmail("");
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isResetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}