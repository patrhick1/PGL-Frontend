import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoName from "@/img/PGL logo name.png";

const pageInfo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Dashboard",
    description: "Welcome back! Here's your podcast booking overview.",
  },
  "/discover": {
    title: "Discover Podcasts",
    description: "Find and connect with podcasts that match your expertise.",
  },
  "/questionnaire": {
    title: "Questionnaire",
    description: "Complete your profile to get better podcast matches.",
  },
  "/media-kit": {
    title: "Media Kit",
    description: "Create and manage your professional media kit.",
  },
  "/angle-generator": {
    title: "Angle Generator",
    description: "Generate compelling pitch angles for podcast hosts.",
  },
  "/approvals": {
    title: "Approvals",
    description: "Track the status of your podcast applications.",
  },
  "/tracking": {
    title: "Placement Tracking",
    description: "Monitor your podcast appearances and performance.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your account and preferences.",
  },
};

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const currentPage = pageInfo[location] || { 
    title: "PGL CRM", 
    description: "Professional podcast booking system" 
  };

  const handleBookDemo = () => {
    // In a real implementation, this would open a Calendly widget
    window.open("https://calendly.com", "_blank");
  };


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <img src={logoName} alt="Podcast Guest Launch" className="h-8" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">{currentPage.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{currentPage.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-primary text-white hover:bg-black-700"
              onClick={handleBookDemo}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Demo
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={user?.profile_image_url ? `${user.profile_image_url}?t=${Date.now()}` : undefined} 
                alt={user?.full_name || user?.username || "User"}
              />
              <AvatarFallback className="bg-gray-300 text-gray-700">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
