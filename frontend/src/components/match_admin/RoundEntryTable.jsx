import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faClock, faScissors, faChartBar, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import ConfirmationModal from '../common/ConfirmationModal';

const emptySetValues = (count) => Array.from({ length: count }, () => '');

const parseStoredSets = (participant, roundId, count) => {
  const stored = participant.sets?.[roundId];
  if (Array.isArray(stored)) {
    return Array.from({ length: count }, (_, index) => (
      stored[index] == null || stored[index] === '' ? '' : String(stored[index])
    ));
  }
  if (count === 1 && participant.rounds?.[roundId] != null) {
    return [String(participant.rounds[roundId])];
  }
  return emptySetValues(count);
};

const scoreInputClass = (disabled, hasValue) => `
  w-20 h-9 text-center outline-none rounded-lg border text-sm font-semibold
  transition-all
  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
  ${disabled
    ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
    : hasValue
      ? 'border-slate-300 bg-white text-slate-800 focus:border-[#123836] focus:ring-2 focus:ring-[#123836]/10'
      : 'border-slate-200 bg-white text-slate-400 focus:border-[#123836] focus:ring-2 focus:ring-[#123836]/10'
  }
`;

const RoundEntryTable = ({ participants, rounds, onSubmit, onSave, isSubmitting, onOpenStats, setsPerMatch = 1 }) => {
  const gameCount = Math.max(1, Number(setsPerMatch) || 1);
  const isMultiGame = gameCount > 1;
  const defaultRound = rounds.find(r => r.status !== 'Completed') || rounds[rounds.length - 1];
  const [selectedRoundId, setSelectedRoundId] = useState(defaultRound?.id || rounds[0]?.id);
  const [scores, setScores] = useState({});
  const [validationError, setValidationError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const selectedRound = rounds.find(r => r.id === selectedRoundId);
  const isCompleted = selectedRound?.status === 'Completed';
  const isLocked = selectedRound?.rawStatus === 'locked' || selectedRound?.status === 'Upcoming';
  const canEdit = !isCompleted && !isLocked;
  const canSubmit = canEdit && typeof onSubmit === 'function';
  const canSave = canEdit && typeof onSave === 'function';

  const entryParticipants = useMemo(() => {
    if (!selectedRoundId) return [];
    const rosterIds = selectedRound?.rosterCompIds || [];
    const inRoster = (participant) => (
      rosterIds.length === 0 || rosterIds.includes(participant.id)
    );
    if (isCompleted) {
      return participants.filter(p => p.rounds[selectedRoundId] != null && inRoster(p));
    }
    return participants.filter(p => p.status === 'Active' && inRoster(p));
  }, [participants, selectedRoundId, isCompleted, selectedRound?.rosterCompIds]);

  useEffect(() => {
    const fallbackId = defaultRound?.id;
    if (!rounds.some(round => round.id === selectedRoundId) && fallbackId) {
      setSelectedRoundId(fallbackId);
    }
  }, [rounds, selectedRoundId, defaultRound?.id]);

  useEffect(() => {
    const nextScores = {};
    entryParticipants.forEach((participant) => {
      nextScores[participant.id] = parseStoredSets(participant, selectedRoundId, gameCount);
    });
    setScores(nextScores);
    setValidationError(null);
  }, [selectedRoundId, participants, isCompleted, gameCount]);

  useEffect(() => {
    setSaveMessage(null);
  }, [selectedRoundId]);

  let statusBadgeColor = 'bg-slate-100 text-slate-600';
  let statusDotColor = 'bg-slate-400';
  let statusLabel = selectedRound?.status || 'Unknown';

  if (selectedRound?.status === 'In Progress') {
    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    statusDotColor = 'bg-emerald-500';
  } else if (selectedRound?.status === 'Completed') {
    statusBadgeColor = 'bg-blue-50 text-blue-700 border border-blue-100';
    statusDotColor = 'bg-blue-500';
  } else {
    statusBadgeColor = 'bg-slate-50 text-slate-500 border border-slate-200';
    statusDotColor = 'bg-slate-400';
  }

  const handleScoreChange = (participantId, gameIndex, value) => {
    setScores((prev) => {
      const current = prev[participantId] || emptySetValues(gameCount);
      const next = [...current];
      next[gameIndex] = value;
      return { ...prev, [participantId]: next };
    });
    setValidationError(null);
    setSaveMessage(null);
  };

  const parseGameValue = (raw, participantName, gameIndex) => {
    if (raw === undefined || raw === '') {
      throw new Error(
        isMultiGame
          ? `Enter a score for ${participantName} in Game ${gameIndex + 1}.`
          : `Enter a score for ${participantName}.`
      );
    }
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0) {
      throw new Error(
        isMultiGame
          ? `Game ${gameIndex + 1} score for ${participantName} must be a non-negative number.`
          : `Score for ${participantName} must be a non-negative number.`
      );
    }
    return score;
  };

  const buildPayload = () => {
    const payload = [];
    for (const participant of entryParticipants) {
      const values = scores[participant.id] || emptySetValues(gameCount);
      const sets = values.map((raw, index) => parseGameValue(raw, participant.name, index));
      if (isMultiGame) {
        payload.push({ comp_id: participant.id, sets });
      } else {
        payload.push({ comp_id: participant.id, score: sets[0] });
      }
    }
    if (!payload.length) {
      throw new Error('At least one participant score is required.');
    }
    return payload;
  };

  const buildDraftPayload = () => {
    const payload = [];
    let filledCount = 0;

    for (const participant of entryParticipants) {
      const values = scores[participant.id] || emptySetValues(gameCount);
      const sets = values.map((raw, index) => {
        if (raw === undefined || raw === '') return null;
        const score = Number(raw);
        if (!Number.isFinite(score) || score < 0) {
          throw new Error(
            isMultiGame
              ? `Game ${index + 1} score for ${participant.name} must be a non-negative number.`
              : `Score for ${participant.name} must be a non-negative number.`
          );
        }
        filledCount += 1;
        return score;
      });
      payload.push({ comp_id: participant.id, sets });
    }

    if (!payload.length || filledCount === 0) {
      throw new Error('Enter at least one game score before saving.');
    }
    return payload;
  };

  const handleSave = async () => {
    try {
      const payload = buildDraftPayload();
      setValidationError(null);
      await onSave(selectedRound, payload);
      setSaveMessage('Scores saved. Apply cut-off when every game is entered.');
    } catch (err) {
      if (!err.response) {
        setValidationError(err.message || 'Failed to save scores.');
      }
      setSaveMessage(null);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      const payload = buildPayload();
      setValidationError(null);
      await onSubmit(selectedRound, payload);
      setConfirmOpen(false);
    } catch (err) {
      if (!err.response) {
        setValidationError(err.message || 'Failed to submit scores.');
      }
      setConfirmOpen(false);
    }
  };

  const columnCount = 3 + (isMultiGame ? gameCount + 1 : 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Round Entry</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {isMultiGame
              ? `Save game scores as you go. Rankings and cut-off use the total of all ${gameCount} games.`
              : 'Save scores as you go, then apply cut-off when the round is complete'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg focus:ring-[#123836] focus:border-[#123836] px-3 py-2 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
          >
            {rounds.map(round => (
              <option key={round.id} value={round.id}>{round.label}</option>
            ))}
          </select>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusBadgeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`}></span>
            {statusLabel}
          </span>
          {typeof onOpenStats === 'function' && selectedRound && (
            <button
              type="button"
              onClick={() => onOpenStats(selectedRound)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faChartBar} />
              Stats
            </button>
          )}
        </div>
      </div>

      {validationError && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm font-medium">
          {validationError}
        </div>
      )}

      {saveMessage && (
        <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 text-sm font-medium">
          {saveMessage}
        </div>
      )}

      {isLocked && (
        <div className="mx-5 mt-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-sm font-medium">
          This round is locked. Complete the previous round first.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="pl-5 pr-2 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Participant</th>
              {isMultiGame ? (
                <>
                  {Array.from({ length: gameCount }, (_, index) => (
                    <th key={`game-${index}`} className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-24">
                      Game {index + 1}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Total</th>
                </>
              ) : (
                <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Score</th>
              )}
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {entryParticipants.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-5 py-10 text-center text-slate-400 font-medium">
                  No participants available for this round.
                </td>
              </tr>
            ) : entryParticipants.map((p, idx) => {
              const values = scores[p.id] || emptySetValues(gameCount);
              const parsedValues = values.map((value) => {
                if (value === undefined || value === '') return null;
                const numeric = Number(value);
                return Number.isFinite(numeric) ? numeric : null;
              });
              const filledCount = parsedValues.filter((value) => value != null).length;
              const hasAllScores = filledCount === gameCount;
              const total = parsedValues.reduce((sum, value) => sum + (value || 0), 0);
              const inputDisabled = isCompleted || isLocked;

              return (
                <tr
                  key={`${selectedRoundId}-${p.id}`}
                  className={`
                    border-b border-slate-50 transition-colors duration-150
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                    hover:bg-[#123836]/[0.03]
                  `}
                >
                  <td className="pl-5 pr-2 py-3.5">
                    <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
                  </td>

                  <td className="px-3 py-3.5">
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </td>

                  {values.map((value, gameIndex) => (
                    <td key={`${p.id}-game-${gameIndex}`} className="px-3 py-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={value ?? ''}
                        placeholder="0"
                        disabled={inputDisabled}
                        onChange={(e) => handleScoreChange(p.id, gameIndex, e.target.value)}
                        className={scoreInputClass(inputDisabled, value !== undefined && value !== '')}
                      />
                    </td>
                  ))}

                  {isMultiGame && (
                    <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                      {filledCount > 0 ? total : <span className="text-slate-300">-</span>}
                    </td>
                  )}

                  <td className="px-3 py-3.5 text-center">
                    {hasAllScores ? (
                      <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-lg" />
                    ) : (
                      <FontAwesomeIcon icon={faClock} className="text-slate-300 text-lg" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
        {canSave && (
          <button
            type="button"
            disabled={!canSave || isSubmitting || entryParticipants.length === 0}
            onClick={() => {
              try {
                buildDraftPayload();
                setValidationError(null);
                handleSave();
              } catch (err) {
                setValidationError(err.message);
                setSaveMessage(null);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
            {isSubmitting ? 'Saving...' : 'Save Scores'}
          </button>
        )}
        <button
          type="button"
          disabled={!canSubmit || isSubmitting || entryParticipants.length === 0}
          onClick={() => {
            try {
              buildPayload();
              setValidationError(null);
              setSaveMessage(null);
              setConfirmOpen(true);
            } catch (err) {
              setValidationError(err.message);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faScissors} className="text-xs" />
          {isSubmitting ? 'Submitting...' : 'Apply Cut-off'}
        </button>
      </div>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        loading={isSubmitting}
        intent="warning"
        title={`Submit ${selectedRound?.label || 'this round'}?`}
        description="This will rank everyone and eliminate players below the cut-off. This cannot be undone."
        confirmLabel="Submit Scores"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default RoundEntryTable;
