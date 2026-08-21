import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faFutbol,
  faUsers,
  faGear,
  faPen,
  faRocket,
  faImage,
} from '@fortawesome/free-solid-svg-icons';

const FORMAT_LABELS = {
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  round_robin: 'Round Robin',
  round_scoring: 'Round Scoring',
  hybrid: 'Multi Round (Hybrid)',
};
const ReviewPublishStep = ({ data, onGoToStep, onPublish, publishing }) => {
  const participantCount =
    data.participantType === 'team' && data.teamMode === 'predefine'
      ? (data.teams || []).reduce((sum, t) => sum + t.members.length, 0)
      : (data.participants || []).length;

  const teamCount =
    data.participantType === 'team'
      ? data.teamMode === 'predefine'
        ? (data.teams || []).length
        : Number(data.numberOfTeams) || 0
      : 0;

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0">Review & Publish</h2>
        <p className="text-sm text-slate-400 mt-1 m-0">
          Double-check everything before publishing your tournament
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/*  General Details */}
        <Section icon={faCircleInfo} title="General Details" onEdit={() => onGoToStep(0)}>
          <Row label="Tournament Name" value={data.name || '—'} />
          <Row label="Description" value={data.description || '—'} />
          <Row label="Location" value={data.location || '—'} />
          <Row label="Start Date" value={data.startDate || '—'} />
          <Row label="End Date" value={data.endDate || '—'} />
          {(data.banner || data.defaultBannerSrc) && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-sm text-slate-400 w-[140px] shrink-0">Banner</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={data.banner ? URL.createObjectURL(data.banner) : data.defaultBannerSrc}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-slate-700">
                  {data.banner ? data.banner.name : 'Default banner'}
                </span>
              </div>
            </div>
          )}
        </Section>

        {/*  Sport & Participants  */}
        <Section icon={faFutbol} title="Sport & Participants" onEdit={() => onGoToStep(1)}>
          <Row
            label="Sport"
            value={data.sport || '—'}
          />
          <Row
            label="Participant Type"
            value={data.participantType === 'team' ? 'Team' : 'Individual'}
          />
          {data.participantType === 'team' && (
            <>
              <Row
                label="Team Mode"
                value={data.teamMode === 'predefine' ? 'Pre-defined Teams' : 'Auto-randomize'}
              />
              <Row label="Teams" value={teamCount} />
            </>
          )}
          <Row label="Total Participants" value={participantCount} />

          {/* Team breakdown for pre-defined */}
          {data.participantType === 'team' && data.teamMode === 'predefine' && (data.teams || []).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-50">
              {data.teams.map((team) => (
                <div key={team.id} className="flex items-center gap-2.5 py-1.5">
                  {team.logo && (
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-sm text-slate-600 font-medium">{team.name}</span>
                  <span className="text-xs text-slate-400">
                    ({team.members.length} member{team.members.length !== 1 ? 's' : ''})
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/*  Format Configuration */}
        <Section icon={faGear} title="Format Configuration" onEdit={() => onGoToStep(2)}>
          <Row label="Format" value={FORMAT_LABELS[data.format] || '—'} />
          {data.format === 'hybrid' && (
            <>
              <Row label="Round 1 Groups" value={data.hybridGroups || '—'} />
              <Row label="Advance per Group" value={data.hybridAdvancing || '—'} />
              <Row label="Round 2 Format" value={FORMAT_LABELS[data.hybridSecondRound] || '—'} />
            </>
          )}
          {(data.format === 'round_scoring' || data.hybridSecondRound === 'round_scoring' || Number(data.setsPerMatch) > 1) && (
            <Row label="Games per match" value={data.setsPerMatch || 1} />
          )}
        </Section>
      </div>

      {/* Publish button */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="
            flex items-center gap-2.5 px-8 py-3.5 rounded-xl
            bg-[#123836] text-white text-base font-bold
            border-none cursor-pointer transition-all duration-200
            hover:bg-[#1a4f4c] active:bg-[#0e2c2a]
            shadow-[0_4px_14px_rgba(18,56,54,0.25)]
            hover:shadow-[0_6px_20px_rgba(18,56,54,0.35)]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <FontAwesomeIcon icon={faRocket} />
          {publishing ? 'Publishing...' : 'Publish Tournament'}
        </button>
      </div>
    </div>
  );
};

/* ── Helper sub-components ── */

function Section({ icon, title, onEdit, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(18,56,54,0.08)] flex items-center justify-center">
            <FontAwesomeIcon icon={icon} className="text-[#123836] text-sm" />
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#123836] bg-transparent border-none cursor-pointer hover:underline underline-offset-2 transition-colors"
        >
          <FontAwesomeIcon icon={faPen} className="text-[10px]" />
          Edit
        </button>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="text-sm text-slate-400 w-[140px] shrink-0">{label}</span>
      <span className="text-sm text-slate-700 break-words">{String(value)}</span>
    </div>
  );
}

export default ReviewPublishStep;
