import Questionnaire from "@/pages/Questionnaire";
import { Card } from "@/components/ui/card";

interface OnboardingQuestionnaireProps {
  campaignId: string;
  onComplete: (data: any) => void;
}

export default function OnboardingQuestionnaire({ campaignId, onComplete }: OnboardingQuestionnaireProps) {
  const handleQuestionnaireSubmit = () => {
    // The questionnaire component already handles submission
    // We just need to notify the parent that it's complete
    // Add a small delay to ensure the success message is shown
    setTimeout(() => {
      onComplete({});
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-4 py-2">
        {/* Onboarding-specific header - made very compact */}
        <div className="text-center mb-3 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Tell Us About Yourself
          </h2>
          <p className="text-sm text-gray-600">
            This information helps us create your professional bio and find the perfect podcasts for you
          </p>
          <p className="text-xs text-gray-500 mt-2">
            💡 Don't worry about perfect answers - you can edit your media kit after it's generated!
          </p>
        </div>

        {/* Wrap the existing questionnaire with custom styling */}
        <div className="onboarding-questionnaire">
          <style>{`
            .onboarding-questionnaire .text-xl,
            .onboarding-questionnaire .text-2xl {
              font-size: 1.875rem !important;
              line-height: 2.25rem !important;
            }
            
            .onboarding-questionnaire textarea,
            .onboarding-questionnaire input {
              font-size: 1rem !important;
              padding: 0.75rem !important;
            }
            
            .onboarding-questionnaire .space-y-6 > * {
              margin-bottom: 2rem !important;
            }
            
            /* Hide the back to campaigns button in onboarding mode */
            .onboarding-questionnaire > div > a:first-child {
              display: none !important;
            }
            
            /* Make progress bar more prominent */
            .onboarding-questionnaire [role="progressbar"] {
              height: 0.5rem !important;
            }
            
            /* Larger buttons */
            .onboarding-questionnaire button {
              min-height: 3rem !important;
              font-size: 1rem !important;
            }
            
            /* Make the whole questionnaire area use full width */
            .onboarding-questionnaire > div {
              max-width: none !important;
              width: 100% !important;
            }
            
            /* Make mode toggle card much smaller and compact */
            .onboarding-questionnaire > div > div:first-child {
              max-width: 600px !important;
              margin: 0 auto 0.5rem auto !important;
              padding: 0 !important;
            }
            
            .onboarding-questionnaire > div > div:first-child .card-header {
              padding: 0.5rem 1rem !important;
            }
            
            .onboarding-questionnaire > div > div:first-child h3.card-title {
              font-size: 0.875rem !important;
              font-weight: 600 !important;
              margin: 0 !important;
            }
            
            .onboarding-questionnaire > div > div:first-child p.card-description {
              font-size: 0.75rem !important;
              margin-top: 0.125rem !important;
            }
            
            /* Make toggle buttons smaller */
            .onboarding-questionnaire .toggle-group {
              height: 2rem !important;
            }
            
            .onboarding-questionnaire .toggle-group button {
              padding: 0.25rem 0.75rem !important;
              font-size: 0.75rem !important;
              min-height: 2rem !important;
            }
            
            .onboarding-questionnaire .toggle-group svg {
              width: 0.875rem !important;
              height: 0.875rem !important;
            }
            
            .onboarding-questionnaire .badge {
              font-size: 0.625rem !important;
              padding: 0.125rem 0.375rem !important;
            }
            
            /* Make chat interface much bigger in onboarding */
            .onboarding-questionnaire .chat-interface-container {
              height: calc(100vh - 180px) !important;
              min-height: 750px !important;
              max-height: 1000px !important;
              width: 100% !important;
              max-width: 1400px !important;
              margin: 0 auto !important;
            }
            
            /* Remove any width constraints on parent containers */
            .onboarding-questionnaire > div > :last-child {
              max-width: none !important;
              width: 100% !important;
            }
            
            /* Adjust chat message area */
            .onboarding-questionnaire .chat-interface-container > div:nth-child(2) {
              padding: 1.5rem 2rem !important;
              max-width: 1000px !important;
              margin: 0 auto !important;
            }
            
            /* Better mobile spacing */
            @media (max-width: 640px) {
              .onboarding-questionnaire {
                margin: 0 -1rem;
              }
              
              .onboarding-questionnaire .chat-interface-container {
                height: calc(100vh - 150px) !important;
                min-height: 500px !important;
              }
            }
          `}</style>

          <Questionnaire
            campaignId={campaignId}
            onSuccessfulSubmit={handleQuestionnaireSubmit}
            isOnboarding={true}
          />
        </div>
      </div>
    </div>
  );
}