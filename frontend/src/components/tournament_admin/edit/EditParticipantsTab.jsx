import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUser,
  faChevronDown,
  faChevronUp,
  faPenToSquare,
  faArrowRightArrowLeft,
  faCheck,
  faXmark,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import Button from '../../common/Button';
import EditMemberInlineModal from './EditMemberInlineModal';
import { updateMember, saveSportAndParticipants } from '../../../services/TournamentService';

const EXP_COLORS = {
  Beginner:     { text: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Intermediate: { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  Advanced:     { text: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  Professional: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  Pro:          { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const expStyle = (exp) => EXP_COLORS[exp] || EXP_COLORS.Beginner;

/* Individual participants list */
const IndividualList = ({ participants, onEdit }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 w-10">#</th>
          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Name</th>
          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 text-center">Experience</th>
          <th className="w-20" />
        </tr>
      </thead>
      <tbody>
        {participants.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-300">
              No participants found
            </td>
          </tr>
        ) : (
          participants.map((p, idx) => {
            const exp = expStyle(p.mem_expe || p.experience);
            return (
              <tr key={p.mem_id || p.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 text-sm text-slate-400">{idx + 1}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-700">
                  {p.mem_name || p.name}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ color: exp.text, background: exp.bg }}
                  >
                    {p.mem_expe || p.experience || 'Beginner'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-[#123836] hover:text-[#123836] hover:bg-[rgba(18,56,54,0.04)] transition-all duration-200 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
                    Edit
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

const EXP_VALUES = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Professional: 4,
  Pro: 4,
};

const getAverageExperience = (members = []) => {
  if (members.length === 0) return null;
  const sum = members.reduce((acc, m) => acc + (EXP_VALUES[m.mem_expe || m.experience] || 1), 0);
  return (sum / members.length).toFixed(1);
};

/*  Team card  */
const TeamCard = ({ team, expanded, onToggle, onEdit, swapMode, dragHandlers, draggingMemberId }) => {
  const memberCount = team.members?.length ?? 0;
  const avgExp = getAverageExperience(team.members);

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        swapMode ? 'border-[#123836]/30 shadow-sm' : 'border-slate-200/80'
      }`}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer bg-transparent border-none text-left"
      >
        {/* Team icon */}
        <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faUsers} className="text-[#123836] text-xs" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight truncate">{team.comp_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
            {avgExp !== null && ` · Avg Exp: ${avgExp}`}
          </p>
        </div>

        <FontAwesomeIcon
          icon={expanded ? faChevronUp : faChevronDown}
          className="text-slate-400 text-xs shrink-0"
        />
      </button>

      {/* Expanded member list */}
      {expanded && (
        <div className="border-t border-slate-100">
          {memberCount === 0 ? (
            <p className="text-xs text-slate-300 text-center py-5">No members</p>
          ) : (
            team.members.map((m) => {
              const exp = expStyle(m.mem_expe || m.experience);
              return (
                <div
                  key={m.mem_id || m.id}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 transition-all duration-200 ${
                    swapMode
                      ? 'cursor-grab active:cursor-grabbing hover:bg-[rgba(18,56,54,0.04)]'
                      : 'hover:bg-slate-50/40'
                  } ${
                    (m.mem_id || m.id) === draggingMemberId
                      ? 'opacity-40 scale-95 bg-slate-100 rounded-lg shadow-inner ring-1 ring-slate-200'
                      : ''
                  }`}
                  draggable={swapMode}
                  onDragStart={swapMode ? (e) => dragHandlers.onDragStart(e, m, team.comp_id) : undefined}
                  onDragOver={swapMode ? (e) => dragHandlers.onDragOver(e, team.comp_id) : undefined}
                  onDragLeave={swapMode ? dragHandlers.onDragLeave : undefined}
                  onDrop={swapMode ? (e) => dragHandlers.onDrop(e, m, team.comp_id) : undefined}
                  onDragEnd={swapMode ? dragHandlers.onDragEnd : undefined}
                >
                  {swapMode && (
                    <FontAwesomeIcon
                      icon={faArrowRightArrowLeft}
                      className="text-slate-300 text-xs shrink-0 cursor-grab"
                    />
                  )}
                  <FontAwesomeIcon icon={faUser} className="text-slate-300 text-xs shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 font-medium truncate">
                    {m.mem_name || m.name}
                  </span>
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    style={{ color: exp.text, background: exp.bg }}
                  >
                    {m.mem_expe || m.experience || 'Beginner'}
                  </span>
                  {!swapMode && (
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-[#123836] hover:text-[#123836] hover:bg-[rgba(18,56,54,0.04)] transition-all duration-200 cursor-pointer shrink-0"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
                      Edit
                    </button>
                  )}
                </div>
              );
            })
          )}

        </div>
      )}
    </div>
  );
};

/* Main component */

/**
 * Tab 2 of TournamentEditPage.
 */
const EditParticipantsTab = ({ tournamentData }) => {
  const participantType = Number(tournamentData?.team_size) === 1
    ? 'individual'
    : 'team';

  // Build initial participant state from API data
  const initTeams = () =>
    (tournamentData?.competitors || []).map((c) => ({
      ...c,
      members: (c.members || []).map((m) => ({ ...m })),
    }));

  const [teams, setTeams] = useState(initTeams);
  const [expandedTeams, setExpandedTeams] = useState(() => {
    const init = {};
    (tournamentData?.competitors || []).forEach((c) => { init[c.comp_id] = true; });
    return init;
  });

  /* Edit modal */
  const [editingMember, setEditingMember] = useState(null);

  /* Swap mode */
  const [swapMode, setSwapMode] = useState(false);
  const [swapPending, setSwapPending] = useState([]); // array of { memberId, fromTeam, toTeam }
  const [confirmingSwap, setConfirmingSwap] = useState(false);
  const [draggingMemberId, setDraggingMemberId] = useState(null);
  const dragRef = useRef({ member: null, fromTeam: null });

  /* Individual participants (flat list from members inside competitors) */
  const individuals = (tournamentData?.competitors || []).flatMap((c) =>
    (c.members || []).map((m) => ({ ...m, comp_name: c.comp_name }))
  );
  const [indivList, setIndivList] = useState(individuals);

  /* Helpers */
  const toggleTeam = (id) =>
    setExpandedTeams((prev) => ({ ...prev, [id]: !prev[id] }));

  /* Member rename (both types)  */
  const handleSaveMemberName = async (memberId, newName, experience) => {
    if (participantType === 'individual') {
      const updatedList = indivList.map((m) =>
        (m.mem_id || m.id) === memberId ? { ...m, mem_name: newName, mem_expe: experience } : m
      );
      
      await saveSportAndParticipants(tournamentData.tour_id, {
        sport: tournamentData.sport_name,
        participantType: 'individual',
        participants: updatedList.map(m => ({
          name: m.mem_name || m.name,
          experience: m.mem_expe || m.experience || 'Beginner'
        }))
      });
      
      setIndivList(updatedList);
    } else {
      await updateMember(memberId, { mem_name: newName, mem_expe: experience });
      setTeams((prev) =>
        prev.map((t) => ({
          ...t,
          members: t.members.map((m) =>
            (m.mem_id || m.id) === memberId ? { ...m, mem_name: newName, mem_expe: experience } : m
          ),
        }))
      );
    }
  };

  /* Swap mode drag handlers */
  const dragHandlers = {
    onDragStart: (e, member, fromTeamId) => {
      dragRef.current = { member, fromTeam: fromTeamId };
      setDraggingMemberId(member.mem_id || member.id);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e, toTeamId) => {
      if (dragRef.current.fromTeam && dragRef.current.fromTeam !== toTeamId) {
        e.preventDefault();
        e.currentTarget.classList.add('bg-[#dcfce7]', 'ring-2', 'ring-[#22c55e]', 'ring-inset', 'scale-[1.02]', 'shadow-md', 'z-10', 'rounded-xl');
      }
    },
    onDragLeave: (e) => {
      e.currentTarget.classList.remove('bg-[#dcfce7]', 'ring-2', 'ring-[#22c55e]', 'ring-inset', 'scale-[1.02]', 'shadow-md', 'z-10', 'rounded-xl');
    },
    onDrop: (e, swapTarget, toTeamId) => {
      e.preventDefault();
      e.currentTarget.classList.remove('bg-[#dcfce7]', 'ring-2', 'ring-[#22c55e]', 'ring-inset', 'scale-[1.02]', 'shadow-md', 'z-10', 'rounded-xl');
      setDraggingMemberId(null);
      
      const { member, fromTeam } = dragRef.current;
      if (!member || fromTeam === toTeamId || !swapTarget) return;

      setTeams((prev) => {
        const next = prev.map((t) => {
          if (t.comp_id === fromTeam) {
            const newMembers = t.members.filter(
              (m) => (m.mem_id || m.id) !== (member.mem_id || member.id)
            );
            newMembers.push({ ...swapTarget, comp_id: fromTeam });
            return { ...t, members: newMembers };
          }
          if (t.comp_id === toTeamId) {
            const newMembers = t.members.filter(
              (m) => (m.mem_id || m.id) !== (swapTarget.mem_id || swapTarget.id)
            );
            newMembers.push({ ...member, comp_id: toTeamId });
            return { ...t, members: newMembers };
          }
          return t;
        });
        return next;
      });

      // Track pending swap for confirmation
      setSwapPending((prev) => [
        ...prev,
        { memberId: member.mem_id || member.id, data: { comp_id: toTeamId } },
        { memberId: swapTarget.mem_id || swapTarget.id, data: { comp_id: fromTeam } }
      ]);
      dragRef.current = { member: null, fromTeam: null };
    },
    onDragEnd: () => {
      setDraggingMemberId(null);
      dragRef.current = { member: null, fromTeam: null };
    },
  };

  const handleConfirmSwap = async () => {
    if (swapPending.length === 0) { setSwapMode(false); return; }
    setConfirmingSwap(true);
    try {
      for (const sw of swapPending) {
        await updateMember(sw.memberId, sw.data);
      }
      setSwapPending([]);
      setSwapMode(false);
    } finally {
      setConfirmingSwap(false);
    }
  };

  const handleCancelSwap = () => {
    setTeams(initTeams());
    setSwapPending([]);
    setSwapMode(false);
  };

  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  /*  Render  */
  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
            <FontAwesomeIcon
              icon={participantType === 'individual' ? faUser : faUsers}
              className="text-[#123836] text-sm"
            />
          </div>
          {participantType === 'individual' ? (
            <div>
              <p className="text-sm font-bold text-slate-800">
                {indivList.length} participants
              </p>
              <p className="text-xs text-slate-400">Individual tournament</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800">
                {teams.length} teams
                <span className="font-normal text-slate-400 ml-2">·</span>
                <span className="font-normal text-slate-500 ml-2">{totalMembers} total members</span>
              </p>
              <p className="text-xs text-slate-400">Team tournament</p>
            </div>
          )}
        </div>

        {/* Swap button — only for team tournaments */}
        {participantType === 'team' && (
          <Button
            variant={swapMode ? 'primary' : 'secondary'}
            size="sm"
            icon={faArrowRightArrowLeft}
            onClick={() => {
              if (swapMode) {
                handleCancelSwap();
              } else {
                // Expand all teams when entering swap mode
                const allExpanded = {};
                teams.forEach((t) => { allExpanded[t.comp_id] = true; });
                setExpandedTeams(allExpanded);
                setSwapMode(true);
              }
            }}
          >
            {swapMode ? 'Exit Swap Mode' : 'Swap Members'}
          </Button>
        )}
      </div>

      {/* Swap mode banner */}
      {swapMode && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-[rgba(18,56,54,0.06)] border border-[#123836]/20 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-[#123836] shrink-0" />
          <p className="text-sm font-semibold text-[#123836] flex-1">
            Swap mode active — drag a member and drop them into another team
          </p>
          {swapPending.length > 0 && (
            <span className="text-xs font-bold text-[#123836] bg-[#123836]/10 px-2 py-1 rounded-full">
              {swapPending.length} pending
            </span>
          )}
        </div>
      )}

      {/* Individual list */}
      {participantType === 'individual' && (
        <IndividualList
          participants={indivList}
          onEdit={(m) => setEditingMember({ id: m.mem_id || m.id, name: m.mem_name || m.name, experience: m.mem_expe })}
        />
      )}

      {/* Team grid */}
      {participantType === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.length === 0 ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-16 text-slate-300 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FontAwesomeIcon icon={faUsers} className="text-3xl mb-3 opacity-40" />
              <span className="text-sm">No teams found</span>
            </div>
          ) : (
            teams.map((team) => (
              <TeamCard
                key={team.comp_id}
                team={team}
                expanded={!!expandedTeams[team.comp_id]}
                onToggle={() => toggleTeam(team.comp_id)}
                onEdit={(m) => setEditingMember({ id: m.mem_id || m.id, name: m.mem_name || m.name, experience: m.mem_expe })}
                swapMode={swapMode}
                dragHandlers={dragHandlers}
                draggingMemberId={draggingMemberId}
              />
            ))
          )}
        </div>
      )}

      {/* Confirm swap bar*/}
      {swapMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#123836] rounded-2xl shadow-2xl animate-[fadeIn_0.25s_ease-out]">
          <p className="text-white text-sm font-semibold">
            {swapPending.length > 0
              ? `${swapPending.length} member${swapPending.length > 1 ? 's' : ''} to swap`
              : 'Drag members between teams'}
          </p>
          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={handleCancelSwap}
              disabled={confirmingSwap}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white border-none cursor-pointer transition-colors disabled:opacity-50"
              aria-label="Cancel swap"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <Button
              size="sm"
              variant="secondary"
              icon={faCheck}
              onClick={handleConfirmSwap}
              loading={confirmingSwap}
              disabled={swapPending.length === 0}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Rename modal */}
      <EditMemberInlineModal
        open={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMemberName}
      />
    </div>
  );
};

export default EditParticipantsTab;
