import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingWelcome from "./OnboardingWelcome";
import OnboardingQuestionnaire from "./OnboardingQuestionnaire";
import OnboardingGeneration from "./OnboardingGeneration";
import OnboardingMediaKit from "./OnboardingMediaKit";
import OnboardingComplete from "./OnboardingComplete";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type OnboardingStep = "welcome" | "questionnaire" | "generation" | "media-kit" | "complete";

interface OnboardingFlowProps {
  token: string;
  campaignId: string;
  userName: string;
  userEmail: string;
}

export default function OnboardingFlow({ token, campaignId, userName, userEmail }: OnboardingFlowProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Load saved progress from localStorage
  const savedProgress = localStorage.getItem(`onboarding-progress-${campaignId}`);
  const initialState = savedProgress ? JSON.parse(savedProgress) : {
    currentStep: "welcome",
    completedSteps: [],
    questionnaireCompleted: false,
    generationCompleted: false,
    mediaKitCompleted: false
  };
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialState.currentStep);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set(initialState.completedSteps));
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Check campaign status to sync with backend progress
  const { data: campaignStatus } = useQuery({
    queryKey: ["campaign-onboarding-status", campaignId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/campaigns/${campaignId}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!campaignId,
  });

  // Sync with backend status on load - only update completed steps, not current step
  useEffect(() => {
    if (campaignStatus && completedSteps.size === 0) { // Only sync on initial load
      const newCompletedSteps = new Set<OnboardingStep>();
      let shouldUpdateStep = false;
      let newStep = currentStep;
      
      // Always mark welcome as complete if we're past it
      if (currentStep !== "welcome") {
        newCompletedSteps.add("welcome");
      }
      
      // If questionnaire responses exist, mark questionnaire as complete
      if (campaignStatus.questionnaire_responses || campaignStatus.mock_interview_transcript) {
        newCompletedSteps.add("questionnaire");
        
        // If saved state shows earlier step but questionnaire is done, advance
        if (currentStep === "questionnaire" || currentStep === "welcome") {
          newStep = "generation";
          shouldUpdateStep = true;
          
          // Show a toast message explaining why we're advancing
          toast({
            title: "Profile Already Complete",
            description: "Your profile questionnaire has already been completed. Moving to the next step.",
          });
        }
      }
      
      // If media kit exists, mark generation as complete too
      if (campaignStatus.media_kit_id) {
        newCompletedSteps.add("questionnaire"); // Ensure questionnaire is marked complete
        newCompletedSteps.add("generation");
        
        // If saved state shows earlier step but generation is done, advance
        if (currentStep === "generation" || currentStep === "questionnaire" || currentStep === "welcome") {
          newStep = "media-kit";
          shouldUpdateStep = true;
        }
      }
      
      setCompletedSteps(newCompletedSteps);
      
      // Only update current step if we need to advance based on backend data
      if (shouldUpdateStep) {
        setCurrentStep(newStep as OnboardingStep);
        toast({
          title: "Progress Restored",
          description: "Continuing from where you left off.",
        });
      }
    }
  }, [campaignStatus, currentStep, toast]);

  // Calculate progress
  const steps: OnboardingStep[] = ["welcome", "questionnaire", "generation", "media-kit", "complete"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((completedSteps.size + (currentStep === "complete" ? 1 : 0)) / (steps.length - 1)) * 100;

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    const progressData = {
      currentStep,
      completedSteps: Array.from(completedSteps),
      questionnaireCompleted: completedSteps.has("questionnaire"),
      generationCompleted: completedSteps.has("generation"),
      mediaKitCompleted: completedSteps.has("media-kit")
    };
    localStorage.setItem(`onboarding-progress-${campaignId}`, JSON.stringify(progressData));
  }, [currentStep, completedSteps, campaignId]);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep !== "welcome" && currentStep !== "complete") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep]);

  const handleStepComplete = (step: OnboardingStep) => {
    setCompletedSteps(prev => new Set(Array.from(prev).concat(step)));
    
    // Move to next step
    const nextStepIndex = steps.indexOf(step) + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex]);
    }
  };

  const handleQuestionnaireComplete = (data: any) => {
    setQuestionnaireData(data);
    handleStepComplete("questionnaire");
  };

  const handleGenerationComplete = (content: any) => {
    setGeneratedContent(content);
    handleStepComplete("generation");
  };

  const handleMediaKitComplete = () => {
    handleStepComplete("media-kit");
  };

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as complete in backend
      const formData = new URLSearchParams();
      formData.append("token", token);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/complete-onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      toast({
        title: "Welcome aboard! 🎉",
        description: "Your profile is all set up. Let's get you some podcast appearances!",
      });

      // Clear onboarding progress
      localStorage.removeItem(`onboarding-progress-${campaignId}`);

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/my-campaigns");
      }, 2000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExit = () => {
    if (currentStep === "welcome" || currentStep === "complete") {
      navigate("/");
    } else {
      setShowExitDialog(true);
    }
  };

  const confirmExit = () => {
    toast({
      title: "Progress saved",
      description: "You can resume your onboarding anytime within 7 days.",
    });
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="PGL"
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">Profile Setup</h1>
            <p className="text-sm text-gray-500">Step {currentStepIndex + 1} of {steps.length}</p>
          </div>
        </div>
        
        {currentStep !== "complete" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {currentStep !== "welcome" && currentStep !== "complete" && (
        <div className="px-4 py-2 bg-gray-50 border-b">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {currentStep === "welcome" && (
          <OnboardingWelcome
            userName={userName}
            campaignId={campaignId}
            onComplete={() => handleStepComplete("welcome")}
          />
        )}

        {currentStep === "questionnaire" && (
          <OnboardingQuestionnaire
            campaignId={campaignId}
            onComplete={handleQuestionnaireComplete}
          />
        )}

        {currentStep === "generation" && (
          <OnboardingGeneration
            campaignId={campaignId}
            questionnaireData={questionnaireData}
            onComplete={handleGenerationComplete}
          />
        )}

        {currentStep === "media-kit" && (
          <OnboardingMediaKit
            campaignId={campaignId}
            generatedContent={generatedContent}
            onComplete={handleMediaKitComplete}
          />
        )}

        {currentStep === "complete" && (
          <OnboardingComplete
            campaignId={campaignId}
            onComplete={handleOnboardingComplete}
          />
        )}
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress has been saved. You can resume anytime within the next 7 days using the link in your email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Setup</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}