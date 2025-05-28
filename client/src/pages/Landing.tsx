// client/src/pages/Landing.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, BarChart3, Users, Zap, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const [email, setEmail] = useState(""); // Changed from username to email
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth(); // Get user for redirect check

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (isAuthenticated && user) { // Check if user object exists
    navigate("/");
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email); // Backend /token expects 'username' field for email
      formData.append("password", password);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/token`, {
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
      
      toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
      await queryClient.invalidateQueries({ queryKey: ["/auth/me"] }); 
      navigate("/");

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

  return (
    <div className="min-h-screen" style={{ background: '#a656eb' }}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {/* ... (icon and title) ... */}
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="text-primary text-2xl h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">PGL CRM</h1>
                <p className="text-gray-600">Professional Podcast Booking System</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label> {/* Changed label */}
                  <Input 
                    id="email" 
                    type="email" // Changed type to email
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@example.com" // Updated placeholder
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
                  disabled={isLoading}
                  className="w-full bg-primary text-white hover:bg-secondary-700 py-3 text-lg font-medium"
                >
                  {isLoading ? "Signing In..." : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Add Sign Up Link/Button Here */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => navigate("/signup")} // Or your desired signup route
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Sign Up
                  </button>
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
  );
}