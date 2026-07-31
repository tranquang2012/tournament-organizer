import { useState, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import SetupWizardStepper from '../../components/tournament_admin/SetupWizardStepper';
import GeneralDetailsStep from '../../components/tournament_admin/steps/GeneralDetailsStep';
import SportParticipantsStep from '../../components/tournament_admin/steps/SportParticipantsStep';
import FormatConfigStep from '../../components/tournament_admin/steps/FormatConfigStep';
import ReviewPublishStep from '../../components/tournament_admin/steps/ReviewPublishStep';
import NotificationToast from '../../components/common/NotificationToast';
import {
  createGeneralDetails,
  updateGeneralDetails,
  saveSportAndParticipants,
  saveFormatConfig,
  publishTournament,
  discardTournamentDraft,
  buildRandomizedTeamParticipants,
} from '../../services/TournamentService';
import { getAccessToken } from '../../services/AuthService';
import { getAllSports } from '../../services/SportService';

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
  hybridGroups: '',
  hybridAdvancing: '',
  hybridSecondRound: '',
};

const getErrorMessage = (error) => (
  error?.response?.data?.error?.message || error?.message || 'Something went wrong'
);

const TournamentCreatePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [tournamentId, setTournamentId] = useState(null);
  const [savingStep, setSavingStep] = useState(false);
  const [toast, setToast] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [sportsConfig, setSportsConfig] = useState([]);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  const currentSportConfig = sportsConfig.find(
    (s) => s.name.toLowerCase() === formData.sport?.toLowerCase()
  );

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const handleDiscardAndLeave = async () => {
    if (tournamentId) {
      setDiscarding(true);
      try {
        await discardTournamentDraft(tournamentId);
      } catch (error) {
        console.error('Failed to discard draft:', error);
      } finally {
        setDiscarding(false);
      }
    }
    setIsDirty(false);
    blocker.proceed?.();
  };

  const tokenRef = useRef(null);

  useEffect(() => {
    const updateToken = async () => {
      try {
        const token = await getAccessToken();
        tokenRef.current = token;
      } catch (err) {
        console.error('Failed to pre-fetch access token for unload/refresh:', err);
      }
    };
    updateToken();

    const fetchSports = async () => {
      try {
        const res = await getAllSports();
        setSportsConfig(res.data || res || []);
      } catch (err) {
        console.error('Failed to fetch sports config:', err);
      }
    };
    fetchSports();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleUnload = () => {
      if (isDirty && tournamentId && tokenRef.current) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const url = `${baseUrl}/api/tournaments/${tournamentId}/discard`;
        fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
          },
          keepalive: true,
        }).catch((err) => {
          console.error('Error discarding draft on unload:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isDirty, tournamentId]);

  useEffect(() => {
    if (currentSportConfig) {
      let updates = {};
      let hasUpdates = false;

      const checkSupported = (supportedList, key) => {
        if (!supportedList || !key) return true;
        if (Array.isArray(supportedList)) return supportedList.some(s => s.toLowerCase() === key.toLowerCase());
        if (typeof supportedList === 'string') return supportedList.toLowerCase().includes(key.toLowerCase());
        return true;
      };

      const checkSupportedFormat = (supportedList, val) => {
        const FORMAT_CATEGORIES = {
          'single_elimination': 'versus',
          'double_elimination': 'versus',
          'round_robin': 'versus',
          'round_scoring': 'scoring',
          'hybrid': 'versus',
        };
        const category = FORMAT_CATEGORIES[val];
        if (!supportedList || !category) return true;
        if (Array.isArray(supportedList)) return supportedList.some(s => s.toLowerCase() === category.toLowerCase());
        if (typeof supportedList === 'string') return supportedList.toLowerCase().includes(category.toLowerCase());
        return true;
      };

      if (formData.participantType && currentSportConfig.types && !checkSupported(currentSportConfig.types, formData.participantType)) {
        updates.participantType = '';
        hasUpdates = true;
      }
      if (formData.format && currentSportConfig.format && !checkSupportedFormat(currentSportConfig.format, formData.format)) {
        updates.format = '';
        hasUpdates = true;
      }

      if (hasUpdates) {
        setFormData((prev) => ({ ...prev, ...updates }));
        setIsDirty(true);
      }
    }
  }, [formData.sport, currentSportConfig, formData.participantType, formData.format]);

  /* Validation */
  const isStepCompleted = (idx) => {
    if (idx === 0) {
      return !!(formData.name.trim() && formData.startDate && formData.endDate);
    }
    if (idx === 1) {
      if (!formData.sport) return false;
      if (formData.participantType === 'individual') {
        return formData.participants?.length > 0;
      }
      if (formData.participantType === 'team') {
        if (formData.teamMode === 'randomize') {
          if (!formData.membersPerTeam || formData.membersPerTeam <= 0) return false;
          return formData.participants?.length > 0;
        } else {
          return formData.teams?.length > 0;
        }
      }
      return false;
    }
    if (idx === 2) {
      if (formData.format === 'hybrid') {
        return !!formData.hybridSecondRound && !!formData.hybridGroups && !!formData.hybridAdvancing;
      }
      return !!formData.format;
    }
    return false; // Step 3 (Review) is not marked as complete
  };

  const canGoToStep = (idx) => {
    if (idx === currentStep) return true;
    if (idx === 3) return true; // Always allow going to the Review step
    for (let i = 0; i < idx; i++) {
      if (!isStepCompleted(i)) return false;
    }
    return true;
  };

  /* Navigation */
  const goToStep = (idx) => {
    if (idx >= 0 && idx < STEPS.length) {
      if (canGoToStep(idx)) {
        setCurrentStep(idx);
      } else if (idx > currentStep) {
        setToast({ message: 'Please complete all required fields in previous steps', type: 'error' });
      }
    }
  };

  const validateCurrentStep = () => {
    /* Validate required fields for current step */
    if (currentStep === 0) {
      if (!formData.name.trim()) {
        setToast({ message: 'Tournament name is required', type: 'error' });
        return false;
      }
      if (!formData.startDate) {
        setToast({ message: 'Start date is required', type: 'error' });
        return false;
      }
      if (!formData.endDate) {
        setToast({ message: 'End date is required', type: 'error' });
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.sport) {
        setToast({ message: 'Sport is required', type: 'error' });
        return false;
      }

      if (formData.participantType === 'individual' && !formData.participants.length) {
        setToast({ message: 'At least one participant is required', type: 'error' });
        return false;
      }

      if (formData.participantType === 'team' && formData.teamMode === 'predefine') {
        if (!formData.teams.length) {
          setToast({ message: 'At least one team is required', type: 'error' });
          return false;
        }

        if (formData.teams.some((team) => !team.members.length)) {
          setToast({ message: 'Every team needs at least one member', type: 'error' });
          return false;
        }
      }

      if (formData.participantType === 'team' && formData.teamMode === 'randomize') {
        const playerPoolCount = formData.participants?.length || 0;
        const membersPerTeam = Number(formData.membersPerTeam) || 0;

        if (membersPerTeam <= 0) {
          setToast({ message: 'Number of members in a team must be greater than 0', type: 'error' });
          return false;
        }

        if (playerPoolCount === 0) {
          setToast({ message: 'Player pool cannot be empty', type: 'error' });
          return false;
        }

        if (playerPoolCount % membersPerTeam !== 0) {
          setToast({
            message: `Player pool (${playerPoolCount} players) cannot be divided equally into teams of ${membersPerTeam}.`,
            type: 'error',
          });
          return false;
        }

        // Set calculated numberOfTeams on the form data
        formData.numberOfTeams = playerPoolCount / membersPerTeam;
      }
    }

    if (currentStep === 2) {
      if (!formData.format) {
        setToast({ message: 'Tournament format is required', type: 'error' });
        return false;
      }
      if (formData.format === 'hybrid') {
        if (!formData.hybridGroups || !formData.hybridAdvancing) {
          setToast({ message: 'Please configure the first round groups', type: 'error' });
          return false;
        }
        if (!formData.hybridSecondRound) {
          setToast({ message: 'Please select a format for the second round', type: 'error' });
          return false;
        }
      }
    }

    return true;
  };

  const persistCurrentStep = async () => {
    if (currentStep === 0) {
      const response = tournamentId
        ? await updateGeneralDetails(tournamentId, formData)
        : await createGeneralDetails(formData);

      if (!tournamentId) {
        setTournamentId(response.data?.tour_id);
      }
    }

    if (currentStep === 1) {
      await saveSportAndParticipants(tournamentId, formData);
    }

    if (currentStep === 2) {
      await saveFormatConfig(tournamentId, formData);
    }
  };

  const handleNext = async (bypassWarning = false) => {
    if (!validateCurrentStep()) return;

    const shouldBypass = bypassWarning === true;

    if (currentStep === 1 && formData.participantType === 'team' && formData.teamMode === 'randomize' && !shouldBypass) {
      const teams = buildRandomizedTeamParticipants(formData.participants, formData.numberOfTeams);
      if (teams.finalGap > 1.0) {
        setShowBalanceWarning(true);
        return;
      }
    }

    setShowBalanceWarning(false);
    setSavingStep(true);
    try {
      await persistCurrentStep();
      setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSavingStep(false);
    }
  };

  const handleBack = () => goToStep(currentStep - 1);

  /* Step data updaters */
  const updateStep1 = (data) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, ...data }));
  };
  const updateStep2 = (data) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, ...data }));
  };
  const updateStep3 = (data) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (!tournamentId) {
        throw new Error('Tournament has not been saved yet');
      }

      await publishTournament(tournamentId);
      setIsDirty(false);
      setToast({ message: 'Tournament published successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  /* Render active step */
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <GeneralDetailsStep data={formData} onChange={updateStep1} />;
      case 1:
        return <SportParticipantsStep data={formData} onChange={updateStep2} currentSportConfig={currentSportConfig} />;
      case 2:
        return <FormatConfigStep data={formData} onChange={updateStep3} currentSportConfig={currentSportConfig} />;
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

      {/* Navigation blocker modal */}
      <ConfirmationModal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={handleDiscardAndLeave}
        title="Leave Tournament Setup?"
        description="You are in the middle of setting up a tournament. Are you sure you want to leave? Your progress won't be published until you finish."
        intent="warning"
        confirmLabel={discarding ? "Discarding..." : "Discard & Leave"}
        cancelLabel="Continue Editing"
        loading={discarding}
      />

      {/* Balance warning modal */}
      <ConfirmationModal
        open={showBalanceWarning}
        onClose={() => setShowBalanceWarning(false)}
        onConfirm={() => handleNext(true)}
        title="Unbalanced Teams Warning"
        description="The experience distribution of the player pool makes it difficult to balance the teams perfectly. Do you want to proceed anyway?"
        intent="warning"
        confirmLabel="Proceed Anyway"
        cancelLabel="Adjust Players"
      />
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
          isStepCompleted={isStepCompleted}
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
            disabled={currentStep === 0 || savingStep}
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
            disabled={savingStep}
            className="
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
              bg-[#123836] text-white border-none cursor-pointer
              transition-all duration-200 hover:bg-[#1a4f4c] active:bg-[#0e2c2a]
              shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {savingStep ? 'Saving...' : 'Next'}
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
            disabled={publishing}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              bg-white text-slate-600 border border-slate-200 cursor-pointer
              transition-all duration-200 hover:bg-slate-50 active:bg-slate-100
              disabled:opacity-50 disabled:cursor-not-allowed
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
