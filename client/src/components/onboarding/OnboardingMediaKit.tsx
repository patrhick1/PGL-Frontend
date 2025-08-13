import MediaKitTab from "@/components/tabs/MediaKitTab";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Upload, Globe, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface OnboardingMediaKitProps {
  campaignId: string;
  generatedContent: any;
  onComplete: () => void;
}

export default function OnboardingMediaKit({ campaignId, onComplete }: OnboardingMediaKitProps) {
  const [hasUploaded, setHasUploaded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Finalize Your Media Kit
          </h2>
          <p className="text-lg text-gray-600">
            Add your photo and customize your professional media kit
          </p>
        </div>

        {/* Tips Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Quick Setup Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Upload a professional headshot for best results</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Add your company logo if you have one</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Choose a custom URL for easy sharing</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Preview before publishing to ensure it looks perfect</span>
            </div>
          </div>
        </Card>

        {/* Media Kit Component with Onboarding Styling */}
        <div className="onboarding-media-kit">
          <style>{`
            /* Make the media kit tab more prominent in onboarding */
            .onboarding-media-kit .border {
              border-width: 2px !important;
            }
            
            .onboarding-media-kit button {
              min-height: 3rem !important;
            }
            
            /* Highlight upload areas */
            .onboarding-media-kit [class*="border-dashed"] {
              border-width: 2px !important;
              background-color: rgb(239 246 255 / 0.5) !important;
            }
            
            .onboarding-media-kit [class*="border-dashed"]:hover {
              background-color: rgb(219 234 254 / 0.5) !important;
            }
            
            /* Make preview button more prominent */
            .onboarding-media-kit button:has-text("Preview") {
              background-color: rgb(59 130 246) !important;
              color: white !important;
            }
          `}</style>

          <MediaKitTab 
            campaignId={campaignId}
          />
        </div>

        {/* Continue Button */}
        <div className="mt-12 text-center space-y-4">
          <Button
            size="lg"
            onClick={onComplete}
            className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Complete Setup
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Globe className="h-4 w-4" />
            <span>You can always update your media kit later from your dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}