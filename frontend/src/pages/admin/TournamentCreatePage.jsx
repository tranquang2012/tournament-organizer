import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import SetupWizardStepper from '../../components/tournament_admin/SetupWizardStepper';
import GeneralDetailsStep from '../../components/tournament_admin/steps/GeneralDetailsStep';
import SportParticipantsStep from '../../components/tournament_admin/steps/SportParticipantsStep';
import FormatConfigStep from '../../components/tournament_admin/steps/FormatConfigStep';
import ReviewPublishStep from '../../components/tournament_admin/steps/ReviewPublishStep';
import NotificationToast from '../../components/common/NotificationToast';

const STEPS = [
  { label: 'General Details' },
  { label: 'Sport & Participants' },
  { label: 'Format Config' },
  { label: 'Review & Publish' },
];

const INITIAL_DATA = {
  /* Step 1 */
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  banner: null,

  /* Step 2 */
  sport: '',
  customSport: '',
  participantType: 'individual',
  participants: [],
  teamMode: 'predefine',
  teams: [],
  numberOfTeams: '',

  /* Step 3 */
  format: '',
  numberOfMatches: '',
  matchesPerDay: '',
};

const TournamentCreatePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [toast, setToast] = useState(null);
  const [publishing, setPublishing] = useState(false);

  /* Navigation */
  const goToStep = (idx) => {
    if (idx >= 0 && idx < STEPS.length) {
      setCurrentStep(idx);
    }
  };

  const handleNext = () => {
    /* Validate required fields for current step */
    if (currentStep === 0) {
      if (!formData.name.trim()) {
        setToast({ message: 'Tournament name is required', type: 'error' });
        return;
      }
      if (!formData.startDate) {
        setToast({ message: 'Start date is required', type: 'error' });
        return;
      }
      if (!formData.endDate) {
        setToast({ message: 'End date is required', type: 'error' });
        return;
      }
    }

    goToStep(currentStep + 1);
  };

  const handleBack = () => goToStep(currentStep - 1);

  /* Step data updaters */
  const updateStep1 = (data) => setFormData((prev) => ({ ...prev, ...data }));
  const updateStep2 = (data) => setFormData((prev) => ({ ...prev, ...data }));
  const updateStep3 = (data) => setFormData((prev) => ({ ...prev, ...data }));

  /* Publish (mock) */
  const handlePublish = async () => {
    setPublishing(true);
    /* Simulate API call */
    await new Promise((r) => setTimeout(r, 1200));
    setPublishing(false);
    setToast({ message: 'Tournament published successfully!', type: 'success' });
  };

  /* Render active step */
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <GeneralDetailsStep data={formData} onChange={updateStep1} />;
      case 1:
        return <SportParticipantsStep data={formData} onChange={updateStep2} />;
      case 2:
        return <FormatConfigStep data={formData} onChange={updateStep3} />;
      case 3:
        return (
          <ReviewPublishStep
            data={formData}
            onGoToStep={goToStep}
            onPublish={handlePublish}
            publishing={publishing}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      {/* Toast */}
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">
          Setup New Tournament
        </h1>
        <p className="text-sm text-slate-400 mt-1 m-0">
          Follow the steps below to create and publish your tournament
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        <SetupWizardStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation buttons */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              border border-slate-200 cursor-pointer transition-all duration-200
              ${currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
              }
            `}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
              bg-[#123836] text-white border-none cursor-pointer
              transition-all duration-200 hover:bg-[#1a4f4c] active:bg-[#0e2c2a]
              shadow-sm hover:shadow-md
            "
          >
            Next
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </button>
        </div>
      )}

      {/* Back button on Review step */}
      {currentStep === STEPS.length - 1 && (
        <div className="flex items-center mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              bg-white text-slate-600 border border-slate-200 cursor-pointer
              transition-all duration-200 hover:bg-slate-50 active:bg-slate-100
            "
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentCreatePage;
