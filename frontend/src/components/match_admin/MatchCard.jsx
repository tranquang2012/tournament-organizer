import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarDays, faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import InputField from '../common/InputField';
import ConfirmationModal from '../common/ConfirmationModal';
import { scheduleMatch, updateMatch } from '../../services/MatchService';
import MatchStatModal from './MatchStatModal';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

const MatchCard = ({ match, onUpdate, variant = 'versus' }) => {
  const isScoring = variant === 'scoring';
  const { status, round, team1, team2, startTime, endTime, date, autoStartAt, autoStopAt, id } = match;

  const isLive = status === 'Live';
  const isUpcoming = status === 'Upcoming';
  const isCompleted = status === 'Completed';

  const [scheduleDate, setScheduleDate] = useState(date || '');
  const [scheduleStart, setScheduleStart] = useState(startTime || '');
  const [scheduleEnd, setScheduleEnd] = useState(endTime || '');
  const [localScore1, setLocalScore1] = useState(team1?.score || 0);
  const [localScore2, setLocalScore2] = useState(team2?.score || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalContent, setModalContent] = useState(null); 
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleScoreBlur = async () => {
    if (isScoring) return;
    if (localScore1 === (team1?.score || 0) && localScore2 === (team2?.score || 0)) return;
    try {
      setIsUpdating(true);
      await updateMatch(id, { score1: Number(localScore1), score2: Number(localScore2) });
      if (onUpdate) onUpdate();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Error updating score';
      setModalContent({ title: 'Update Failed', description: msg, intent: 'danger' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      setIsUpdating(true);
      await updateMatch(id, { status: 'running' });
      if (onUpdate) onUpdate();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Error starting match';
      setModalContent({ title: 'Start Failed', description: msg, intent: 'danger' });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmEndMatch = async () => {
    try {
      setIsUpdating(true);
      const s1 = Number(localScore1);
      const s2 = Number(localScore2);
      
      let winnerId = null;
      let isDraw = false;
      
      if (s1 > s2) winnerId = team1.id;
      else if (s2 > s1) winnerId = team2.id;
      else isDraw = true;

      await updateMatch(id, { 
        score1: s1, 
        score2: s2, 
        winning_competitor_id: winnerId,
        is_draw: isDraw,
        status: 'completed'
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Error ending match';
      setModalContent({ title: 'End Match Failed', description: msg, intent: 'danger' });
    } finally {
      setIsUpdating(false);
      setModalContent(null);
    }
  };

  const handleEndMatchClick = () => {
    setModalContent({
      title: 'Confirm Match End',
      description: 'Are you sure you want to end this match? This will lock the scores and officially determine the winner.',
      intent: 'warning',
      confirmLabel: 'End Match',
      cancelLabel: 'Cancel',
      action: confirmEndMatch
    });
  };

  const handleScheduleUpdate = async () => {
    try {
      if (!scheduleDate || !scheduleStart || !scheduleEnd) {
        setModalContent({ title: 'Validation Error', description: 'Please fill in Date, Start Time, and End Time.', intent: 'danger' });
        return;
      }
      setIsUpdating(true);
      const [sYear, sMonth, sDay] = scheduleDate.split('-');
      const [sHour, sMin] = scheduleStart.split(':');
      const startIso = new Date(sYear, sMonth - 1, sDay, sHour, sMin).toISOString();

      const [eHour, eMin] = scheduleEnd.split(':');
      const endIso = new Date(sYear, sMonth - 1, sDay, eHour, eMin).toISOString();
      const res = await scheduleMatch(id, startIso, endIso);
      const warning = res?.data?.conflict_warning;
      if (warning) {
        setModalContent({ title: 'Schedule Conflict Detected', description: warning, intent: 'warning' });
      } else {
        if (onUpdate) onUpdate();
        else window.location.reload();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Error updating schedule';
      setModalContent({ title: 'Update Failed', description: msg, intent: 'danger' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseModal = () => {
    if (modalContent?.intent === 'warning' && !modalContent?.action) {
      if (onUpdate) onUpdate();
      else window.location.reload();
    }
    setModalContent(null);
  };

  let borderColor = 'border-slate-200';
  let badgeColor = 'bg-slate-100 text-slate-600';
  let badgeDot = 'bg-slate-400';
  let leftBorderColor = 'border-l-slate-300';
  
  if (isLive) {
    borderColor = 'border-emerald-400/50';
    leftBorderColor = 'border-l-emerald-500';
    badgeColor = 'bg-emerald-100 text-emerald-700';
    badgeDot = 'bg-emerald-500';
  } else if (isUpcoming) {
    borderColor = 'border-blue-200';
    leftBorderColor = 'border-l-blue-400';
    badgeColor = 'bg-blue-50 text-blue-700';
    badgeDot = 'bg-blue-500';
  } else if (isCompleted) {
    borderColor = 'border-slate-200';
    leftBorderColor = 'border-l-slate-300';
    badgeColor = 'bg-slate-100 text-slate-600';
    badgeDot = 'bg-slate-400';
  }

  return (
    <div className={`bg-white rounded-xl border ${borderColor} ${leftBorderColor} border-l-[6px] shadow-sm mb-4 overflow-hidden relative transition-all duration-200`}>
      {/* Header section: Status, Round, Date/Time */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${badgeDot} ${isLive ? 'animate-pulse' : ''}`}></div>
            {status}
          </div>
          <span className="text-sm font-semibold text-slate-400">{round}</span>
        </div>
      </div>

      {/* Main content: Teams and Scores (versus only) */}
      {!isScoring && (
      <div className="px-5 py-5 flex items-center justify-between">
        
        {/* Team 1 */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {team1.logo ? (
              <img src={team1.logo} alt={team1.name} className="w-10 h-10 object-cover rounded-full border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm font-bold shadow-sm">?</div>
            )}
            <div>
              <span className={`text-lg font-bold ${team1.winner ? 'text-emerald-600' : 'text-slate-800'}`}>
                {team1.name}
              </span>
              {team1.winner && (
                <div className="text-emerald-500 text-xs font-semibold flex items-center gap-1 mt-0.5">
                  <FontAwesomeIcon icon={faCheckCircle} /> Winner
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scores & VS */}
        <div className="flex items-center justify-center gap-4 px-6">
          <input 
            type="number"
            value={localScore1}
            onChange={(e) => setLocalScore1(e.target.value)}
            onBlur={handleScoreBlur}
            disabled={!isLive || isUpdating}
            className={`w-14 h-12 text-center outline-none rounded-lg border-2 text-xl font-bold focus:ring-2 focus:ring-[#123836]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isCompleted ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
          />
          <div className="text-slate-400 font-bold text-sm">VS</div>
          <input 
            type="number"
            value={localScore2}
            onChange={(e) => setLocalScore2(e.target.value)}
            onBlur={handleScoreBlur}
            disabled={!isLive || isUpdating}
            className={`w-14 h-12 text-center outline-none rounded-lg border-2 text-xl font-bold focus:ring-2 focus:ring-[#123836]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isCompleted ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
          />
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex justify-end">
          <div className="flex flex-row-reverse items-center gap-3 text-right">
            {team2.logo ? (
              <img src={team2.logo} alt={team2.name} className="w-10 h-10 object-cover rounded-full border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm font-bold shadow-sm">?</div>
            )}
            <div>
              <span className={`text-lg font-bold ${team2.winner ? 'text-emerald-600' : 'text-slate-800'}`}>
                {team2.name}
              </span>
              {team2.winner && (
                <div className="text-emerald-500 text-xs font-semibold flex flex-row-reverse items-center gap-1 mt-0.5">
                  <FontAwesomeIcon icon={faCheckCircle} /> Winner
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Footer section: Controls & Action buttons */}
      <div 
        className={`px-5 py-4 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${isLive ? 'bg-emerald-50/30' : 'bg-slate-50/50'}`}
      >
        
        {/* Left: Input controls for schedule / auto notes */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 text-sm" />
                <InputField
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-40"
                  disabled={isCompleted || isUpdating}
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Start</span>
                <InputField
                  type="time"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="w-32"
                  disabled={isCompleted || isUpdating}
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">End</span>
                <InputField
                  type="time"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  className="w-32"
                  disabled={isCompleted || isUpdating}
                />
             </div>
             {(scheduleDate !== (date || '') || scheduleStart !== (startTime || '') || scheduleEnd !== (endTime || '')) && (
               <button 
                 onClick={handleScheduleUpdate}
                 disabled={isUpdating}
                 className="px-3 py-1.5 bg-[#123836] text-white text-xs font-bold rounded-lg hover:bg-[#123836]/80 transition-colors shadow-sm cursor-pointer"
               >
                 {isUpdating ? 'Saving...' : 'Save Schedule'}
               </button>
             )}
          </div>
          {isLive && autoStopAt && (
            <span className="text-[11px] font-medium text-emerald-600 ml-5">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Auto-stops at {autoStopAt}
            </span>
          )}
          {isUpcoming && autoStartAt && (
             <span className="text-[11px] font-medium text-slate-400 ml-5">
               <FontAwesomeIcon icon={faClock} className="mr-1" /> Auto-starts at {autoStartAt} {autoStopAt && `- Auto-stops at ${autoStopAt}`}
             </span>
          )}
        </div>

        {/* Right: Action Buttons (versus only) */}
        {!isScoring && (
        <div className="flex items-center gap-3">
          {(isLive || isCompleted) && (
            <button 
              onClick={() => setShowStatsModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faChartBar} />
              Stats
            </button>
          )}

          {isLive && (
            <>
              <button 
                onClick={handleEndMatchClick}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                End Match
              </button>
            </>
          )}
          
          {isUpcoming && (
            <>
              <button 
                onClick={handleStartMatch}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Start Now
              </button>
            </>
          )}
          
        </div>
        )}

      </div>

      <ConfirmationModal
        open={!!modalContent}
        onClose={handleCloseModal}
        onConfirm={modalContent?.action || handleCloseModal}
        title={modalContent?.title}
        description={modalContent?.description}
        intent={modalContent?.intent}
        confirmLabel={modalContent?.confirmLabel || "Understood"}
        cancelLabel={modalContent?.cancelLabel || "Close"}
      />

      {showStatsModal && !isScoring && (
        <MatchStatModal
          matchId={id}
          team1={team1}
          team2={team2}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
};

export default MatchCard;
