import { useMemo, useState } from 'react';
import InputField from '../../common/InputField';
import Button from '../../common/Button';
import ConfirmationModal from '../../common/ConfirmationModal';
import { NotificationToast } from '../../common/NotificationToast';
import { pauseTournament, resumeTournament } from '../../../services/TournamentService';

const getErrorMessage = (error) => (
  error?.response?.data?.error?.message || error?.message || 'Something went wrong'
);

const toDateInput = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDateInput = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToInput = (dateInput, days) => {
  if (!dateInput) return '';
  const d = new Date(`${dateInput}T00:00:00`);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const clampPauseDate = (startDate, endDate, candidate) => {
  const start = toDateInput(startDate);
  const end = toDateInput(endDate);
  const latestPause = end ? addDaysToInput(end, -1) : '';
  let value = candidate || todayDateInput();

  if (start && value < start) value = start;
  if (latestPause && value > latestPause) value = latestPause;
  return value;
};

const EditActionsTab = ({ tournamentId, tournament, onTournamentRefresh }) => {
  const tourStatus = (tournament?.tour_status || '').toLowerCase();
  const isOngoing = tourStatus === 'ongoing';
  const isPaused = tourStatus === 'paused';

  const defaultPauseDate = useMemo(
    () => clampPauseDate(tournament?.tour_startdate, tournament?.tour_enddate, todayDateInput()),
    [tournament?.tour_startdate, tournament?.tour_enddate],
  );

  const minResumeDate = useMemo(() => {
    const pauseRef = tournament?.tour_pausedate || defaultPauseDate;
    return addDaysToInput(toDateInput(pauseRef), 1);
  }, [tournament?.tour_pausedate, defaultPauseDate]);

  const [pauseDate, setPauseDate] = useState(defaultPauseDate);
  const [resumeDate, setResumeDate] = useState(minResumeDate);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const pauseMin = toDateInput(tournament?.tour_startdate);
  const pauseMax = tournament?.tour_enddate
    ? addDaysToInput(toDateInput(tournament.tour_enddate), -1)
    : '';

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      if (confirmAction === 'pause') {
        await pauseTournament(tournamentId, pauseDate);
        setToast({ type: 'success', message: 'Tournament paused successfully.' });
      } else {
        await resumeTournament(tournamentId, resumeDate);
        setToast({ type: 'success', message: 'Tournament resumed. Schedules have been updated.' });
      }
      setConfirmAction(null);
      await onTournamentRefresh?.();
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const renderUnavailable = (message) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
      {message}
    </div>
  );

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

      <ConfirmationModal
        open={confirmAction === 'pause'}
        onClose={() => !loading && setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Pause tournament?"
        description={`Active matches will be paused starting ${pauseDate}. Match schedules will be shifted when you resume.`}
        intent="warning"
        confirmLabel="Pause Tournament"
        loading={loading}
      />

      <ConfirmationModal
        open={confirmAction === 'resume'}
        onClose={() => !loading && setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Resume tournament?"
        description={`The tournament will resume on ${resumeDate}. The end date and paused match schedules will be extended based on the pause duration.`}
        intent="warning"
        confirmLabel="Resume Tournament"
        loading={loading}
      />

      <div className="pt-2">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {isPaused ? 'Resume Tournament' : 'Pause Tournament'}
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-amber-800 m-0 leading-relaxed">
            <strong>Note:</strong> Pausing stops active matches immediately. Schedules are only
            shifted when you resume, based on the time between pause and resume dates.
          </p>
        </div>

        {isOngoing && (
          <div className="max-w-sm flex flex-col items-start gap-4">
            <div className="w-full">
              <InputField
                label="Pause date"
                type="date"
                value={pauseDate}
                onChange={(e) => setPauseDate(e.target.value)}
                min={pauseMin}
                max={pauseMax}
              />
            </div>
            <Button
              type="button"
              onClick={() => setConfirmAction('pause')}
              disabled={!pauseDate || loading}
              className="bg-amber-500 hover:bg-amber-600 text-white border-none px-6 shadow-sm"
            >
              Pause Tournament
            </Button>
          </div>
        )}

        {isPaused && (
          <div className="max-w-sm flex flex-col items-start gap-4">
            <p className="text-sm text-slate-600 m-0">
              Paused since:{' '}
              <strong>{toDateInput(tournament.tour_pausedate) || '—'}</strong>
            </p>
            <div className="w-full">
              <InputField
                label="Resume date"
                type="date"
                value={resumeDate}
                onChange={(e) => setResumeDate(e.target.value)}
                min={minResumeDate}
              />
            </div>
            <Button
              type="button"
              onClick={() => setConfirmAction('resume')}
              disabled={!resumeDate || loading}
              className="bg-[#123836] hover:bg-[#0f2e2c] text-white border-none px-6 shadow-sm"
            >
              Resume Tournament
            </Button>
          </div>
        )}

        {!isOngoing && !isPaused && renderUnavailable(
          tourStatus === 'draft' || tourStatus === 'ready'
            ? 'Publish the tournament before you can pause it.'
            : tourStatus === 'completed'
              ? 'Completed tournaments cannot be paused.'
              : `Pause is only available for ongoing tournaments (current status: ${tourStatus || 'unknown'}).`,
        )}
      </div>
    </div>
  );
};

export default EditActionsTab;
