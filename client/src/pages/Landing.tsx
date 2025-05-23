import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, BarChart3, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen" style={{ background: '#a656eb' }}>
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

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <span>Comprehensive dashboard analytics</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span>Smart podcast discovery & matching</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span>Automated pitch generation</span>
                </div>
              </div>

              <Button 
                onClick={handleSignIn}
                className="w-full bg-primary text-white hover:bg-blue-700 py-3 text-lg font-medium"
              >
                Sign In to Get Started
              </Button>

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
