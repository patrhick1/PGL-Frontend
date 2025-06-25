// client/src/pages/Signup.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, UserPlus } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get query parameters for lead magnet feature
  const queryParams = new URLSearchParams(window.location.search);
  const prospectPersonId = queryParams.get("prospect_person_id");
  const prospectCampaignId = queryParams.get("prospect_campaign_id");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        // Include prospect data if available for lead magnet
        ...(prospectPersonId && { prospect_person_id: parseInt(prospectPersonId) }),
        ...(prospectCampaignId && { prospect_campaign_id: prospectCampaignId }),
        // role: "client" // Backend /auth/register sets role to "client" by default
      };
      // Assuming VITE_API_BASE_URL = http://localhost:8000
      const response = await apiRequest("POST", "/auth/register", payload);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Signup failed. Please try again." }));
        throw new Error(errorData.detail || "Signup failed");
      }

      const responseData = await response.json(); // Contains person_id, campaign_id, and message
      console.log("Signup successful:", responseData); // For debugging

      // Show success message based on whether this was a lead magnet conversion
      const isLeadMagnetConversion = prospectPersonId && prospectCampaignId;
      toast({ 
        title: "Signup Successful", 
        description: isLeadMagnetConversion 
          ? "Your account has been created! You can now access your personalized campaign." 
          : "Please log in with your new account." 
      });

      // For lead magnet conversions, redirect to profile setup with the campaign
      if (isLeadMagnetConversion && responseData.campaign_id) {
        navigate(`/login?redirect=/profile-setup&campaignId=${responseData.campaign_id}`);
      } else {
        navigate("/login");
      }

    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--primary))' }}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="text-primary text-2xl h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-600">Join PGL CRM</p>
              </div>

              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-6">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    {...form.register("full_name")}
                    placeholder="John Doe" 
                    className="mt-1"
                  />
                  {form.formState.errors.full_name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...form.register("email")}
                    placeholder="you@example.com" 
                    className="mt-1"
                  />
                   {form.formState.errors.email && <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...form.register("password")}
                    placeholder="Create a password" 
                    className="mt-1"
                  />
                   {form.formState.errors.password && <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...form.register("confirmPassword")}
                    placeholder="Confirm your password" 
                    className="mt-1"
                  />
                   {form.formState.errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base"
                >
                  {isLoading ? "Creating Account..." : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}