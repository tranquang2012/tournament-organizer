import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faUsers,
  faUser,
  faShuffle,
  faListOl,
  faChevronDown,
  faChevronUp,
  faCloudArrowUp,
  faXmark,
  faImage,
  faFileArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import InputField from '../../common/InputField';
import SelectField from '../../common/SelectField';
import Button from '../../common/Button';
import { commonSports, eSports } from '../../../constants/sports';

/* Default team logos */
import teamLogo1 from '../../../assets/defaultTeamLogos/logo1.jpg';
import teamLogo2 from '../../../assets/defaultTeamLogos/logo2.jpg';
import teamLogo3 from '../../../assets/defaultTeamLogos/logo3.jpg';

const DEFAULT_TEAM_LOGOS = [
  { id: 'logo1', src: teamLogo1 },
  { id: 'logo2', src: teamLogo2 },
  { id: 'logo3', src: teamLogo3 },
];

const EXPERIENCE_OPTIONS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Pro', label: 'Pro' },
];

const EXP_COLORS = {
  Beginner: { text: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Intermediate: { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  Advanced: { text: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  Pro: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

/**
 * Step 2 
 */
const SportParticipantsStep = ({ data, onChange }) => {
  const [newParticipant, setNewParticipant] = useState({ name: '', experience: 'Beginner' });
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogoMode, setNewTeamLogoMode] = useState('default');
  const [newTeamLogoDefault, setNewTeamLogoDefault] = useState(null);
  const [newTeamLogoFile, setNewTeamLogoFile] = useState(null);
  const [newTeamMember, setNewTeamMember] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});
  const csvInputRef = useRef(null);
  const teamLogoInputRef = useRef(null);

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  /*  Sport selection  */
  const handleSportSelect = (sportName) => {
    update('sport', sportName);
  };

  /*  CSV upload  */
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter((l) => l.trim());
      // skip header if present
      const startIdx = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      const newParticipants = [];

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols[0]) {
          newParticipants.push({
            id: `p-${Date.now()}-${i}`,
            name: cols[0],
            experience: cols[1] || 'Beginner',
          });
        }
      }

      update('participants', [...(data.participants || []), ...newParticipants]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /*  Participant helpers  */
  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    const id = `p-${Date.now()}`;
    const participants = [...(data.participants || []), { id, ...newParticipant }];
    update('participants', participants);
    setNewParticipant({ name: '', experience: 'Beginner' });
  };

  const removeParticipant = (id) => {
    update('participants', (data.participants || []).filter((p) => p.id !== id));
  };

  /*  Team helpers  */
  const addTeam = () => {
    if (!newTeamName.trim()) return;
    const id = `t-${Date.now()}`;
    const logoSrc =
      newTeamLogoMode === 'default' && newTeamLogoDefault
        ? newTeamLogoDefault.src
        : newTeamLogoFile
          ? URL.createObjectURL(newTeamLogoFile)
          : DEFAULT_TEAM_LOGOS[0].src;

    const teams = [
      ...(data.teams || []),
      { id, name: newTeamName, logo: logoSrc, members: [] },
    ];
    update('teams', teams);
    setNewTeamName('');
    setNewTeamLogoDefault(null);
    setNewTeamLogoFile(null);
    setNewTeamLogoMode('default');
    setExpandedTeams((prev) => ({ ...prev, [id]: true }));
  };

  const removeTeam = (teamId) => {
    update('teams', (data.teams || []).filter((t) => t.id !== teamId));
  };

  const addTeamMember = (teamId) => {
    const member = newTeamMember[teamId];
    if (!member?.name?.trim()) return;
    const teams = (data.teams || []).map((t) =>
      t.id === teamId
        ? {
          ...t,
          members: [
            ...t.members,
            { id: `m-${Date.now()}`, name: member.name, experience: member.experience || 'Beginner' },
          ],
        }
        : t,
    );
    update('teams', teams);
    setNewTeamMember((prev) => ({ ...prev, [teamId]: { name: '', experience: 'Beginner' } }));
  };

  const removeTeamMember = (teamId, memberId) => {
    const teams = (data.teams || []).map((t) =>
      t.id === teamId
        ? { ...t, members: t.members.filter((m) => m.id !== memberId) }
        : t,
    );
    update('teams', teams);
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  /*  Render  */
  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      {/*  Sport Selection  */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 m-0">Sport Selection</h2>
        <p className="text-sm text-slate-400 mt-1 mb-4 leading-normal">
          Choose the sport for this tournament
        </p>

        {/* Common Sports */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 m-0">
          Common Sports
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
          {commonSports.map((sport) => (
            <button
              key={sport.name}
              type="button"
              onClick={() => handleSportSelect(sport.name)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2
                bg-white cursor-pointer transition-all duration-200 group
                ${data.sport === sport.name
                  ? 'border-[#123836] bg-[rgba(18,56,54,0.03)] shadow-[0_0_0_3px_rgba(18,56,54,0.08)]'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }
              `}
            >
              <img src={sport.icon} alt={sport.name} className="w-10 h-10 object-contain" />
              <span
                className={`text-xs font-medium text-center leading-tight ${data.sport === sport.name ? 'text-[#123836] font-semibold' : 'text-slate-600'
                  }`}
              >
                {sport.name}
              </span>
            </button>
          ))}
        </div>

        {/* E-Sports */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 m-0">
          E-Sports
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
          {eSports.map((sport) => (
            <button
              key={sport.name}
              type="button"
              onClick={() => handleSportSelect(sport.name)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2
                bg-white cursor-pointer transition-all duration-200 group
                ${data.sport === sport.name
                  ? 'border-[#123836] bg-[rgba(18,56,54,0.03)] shadow-[0_0_0_3px_rgba(18,56,54,0.08)]'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }
              `}
            >
              <img src={sport.icon} alt={sport.name} className="w-10 h-10 object-contain" />
              <span
                className={`text-xs font-medium text-center leading-tight ${data.sport === sport.name ? 'text-[#123836] font-semibold' : 'text-slate-600'
                  }`}
              >
                {sport.name}
              </span>
            </button>
          ))}
        </div>


      </div>

      {/*  Add Participants Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        {/* Section header + type toggle */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faUsers} className="text-[#123836]" />
            <h3 className="text-lg font-bold text-slate-800 m-0">Add Participants</h3>
          </div>
        </div>

        {/* Participant type toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 mb-6">
          {[
            { key: 'individual', label: 'Individual', icon: faUser },
            { key: 'team', label: 'Team', icon: faUsers },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => update('participantType', key)}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                border-none cursor-pointer transition-all duration-200
                ${data.participantType === key
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <FontAwesomeIcon icon={icon} className="text-xs" />
              {label}
            </button>
          ))}
        </div>

        {/*  INDIVIDUAL MODE  */}
        {data.participantType === 'individual' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="flex flex-col gap-5">
              {/* CSV Upload */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="
                  flex flex-col items-center justify-center gap-2 px-6 py-8
                  rounded-xl border-2 border-dashed border-slate-200
                  cursor-pointer transition-all duration-200
                  hover:border-slate-300 bg-slate-50/50
                "
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFileArrowUp} className="text-slate-400 text-xl" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Upload CSV</span>
                <span className="text-xs text-slate-400">Browse or drag file here</span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-1 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    csvInputRef.current?.click();
                  }}
                >
                  Browse File
                </Button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </div>

              {/* Manual Entry */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
                <h4 className="text-sm font-bold text-slate-800 m-0 mb-4">Manual Entry</h4>
                <div className="flex flex-col gap-3">
                  <InputField
                    label="Participant Name"
                    placeholder="e.g. Nguyen Van A or Team A"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant((p) => ({ ...p, name: e.target.value }))}
                  />
                  <SelectField
                    label="Experience"
                    options={EXPERIENCE_OPTIONS}
                    value={newParticipant.experience}
                    onChange={(e) => setNewParticipant((p) => ({ ...p, experience: e.target.value }))}
                  />
                  <Button
                    onClick={addParticipant}
                    disabled={!newParticipant.name.trim()}
                    fullWidth
                  >
                    Add Participant
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT  */}
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 w-10">
                      #
                    </th>
                    <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                      Name
                    </th>
                    <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 text-center">
                      Experience
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {(data.participants || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-300">
                        No participants added yet
                      </td>
                    </tr>
                  ) : (
                    (data.participants || []).map((p, idx) => {
                      const exp = EXP_COLORS[p.experience] || EXP_COLORS.Beginner;
                      return (
                        <tr key={p.id} className="border-b border-slate-100/60 last:border-b-0">
                          <td className="px-5 py-3 text-sm text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">{p.name}</td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ color: exp.text, background: exp.bg }}
                            >
                              {p.experience}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => removeParticipant(p.id)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors"
                            >
                              <FontAwesomeIcon icon={faXmark} className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*  TEAM MODE  */}
        {data.participantType === 'team' && (
          <div>
            {/* Team sub-mode toggle */}
            <div className="flex items-center gap-3 mb-5">
              <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                {[
                  { key: 'predefine', label: 'Pre-define Teams', icon: faListOl },
                  { key: 'randomize', label: 'Auto-randomize', icon: faShuffle },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update('teamMode', key)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                      border-none cursor-pointer transition-all duration-200
                      ${data.teamMode === key
                        ? 'bg-[#123836] text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={icon} className="text-xs" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <InputField
                label="Number of members in a team"
                type="number"
                placeholder="e.g. 5"
                value={data.membersPerTeam || ''}
                onChange={(e) => update('membersPerTeam', e.target.value)}
                required
                className="max-w-[250px]"
              />
            </div>

            {/*  Pre-define Teams  */}
            {data.teamMode === 'predefine' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT  */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faUsers} className="text-slate-500 text-sm" />
                    <h4 className="text-sm font-bold text-slate-800 m-0">Create Team</h4>
                  </div>

                  <div className="flex flex-col gap-4">
                    <InputField
                      label="Team Name"
                      placeholder="e.g. Team Alpha"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />

                    {/* Team Logo */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700">Team Logo</label>

                      <div className="flex items-center gap-3">
                        {/* Logo preview */}
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {newTeamLogoMode === 'default' && newTeamLogoDefault ? (
                            <img src={newTeamLogoDefault.src} alt="Team logo" className="w-full h-full object-cover" />
                          ) : newTeamLogoFile ? (
                            <img src={URL.createObjectURL(newTeamLogoFile)} alt="Team logo" className="w-full h-full object-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faImage} className="text-slate-300 text-lg" />
                          )}
                        </div>

                        {/* Toggle buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewTeamLogoMode('default')}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-200
                              ${newTeamLogoMode === 'default'
                                ? 'border-[#123836] text-[#123836] bg-[rgba(18,56,54,0.04)]'
                                : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                              }
                            `}
                          >
                            Use default
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTeamLogoMode('custom');
                              teamLogoInputRef.current?.click();
                            }}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-200
                              ${newTeamLogoMode === 'custom'
                                ? 'border-[#123836] text-[#123836] bg-[rgba(18,56,54,0.04)]'
                                : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                              }
                            `}
                          >
                            Upload Logo
                          </button>
                          <input
                            ref={teamLogoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewTeamLogoFile(file);
                                setNewTeamLogoMode('custom');
                              }
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Default logo grid */}
                      {newTeamLogoMode === 'default' && (
                        <div className="flex gap-2 mt-2">
                          {DEFAULT_TEAM_LOGOS.map((logo) => (
                            <button
                              key={logo.id}
                              type="button"
                              onClick={() => setNewTeamLogoDefault(logo)}
                              className={`
                                w-11 h-11 rounded-full overflow-hidden border-2 p-0
                                cursor-pointer transition-all duration-200
                                ${newTeamLogoDefault?.id === logo.id
                                  ? 'border-[#123836] shadow-[0_0_0_2px_rgba(18,56,54,0.15)]'
                                  : 'border-slate-100 hover:border-slate-200'
                                }
                              `}
                            >
                              <img src={logo.src} alt="Default logo" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={addTeam}
                      disabled={!newTeamName.trim()}
                      fullWidth
                    >
                      Add Team
                    </Button>
                  </div>
                </div>

                {/* RIGHT  */}
                <div className="flex flex-col gap-3">
                  {(data.teams || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300 bg-slate-50/50 rounded-xl border border-slate-100">
                      <FontAwesomeIcon icon={faUsers} className="text-3xl mb-3 opacity-40" />
                      <span className="text-sm">No teams created yet</span>
                    </div>
                  ) : (
                    (data.teams || []).map((team) => (
                      <div
                        key={team.id}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
                      >
                        {/* Team header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Logo */}
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 m-0 leading-tight">{team.name}</p>
                            <p className="text-xs text-slate-400 m-0">
                              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeTeam(team.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleTeamExpand(team.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-none bg-transparent cursor-pointer transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={expandedTeams[team.id] ? faChevronUp : faChevronDown}
                              className="text-xs"
                            />
                          </button>
                        </div>

                        {/* Expanded content */}
                        {expandedTeams[team.id] && (
                          <div className="border-t border-slate-100 px-4 py-3">
                            {/* Add member inline row */}
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="text"
                                placeholder="Member Name"
                                value={newTeamMember[team.id]?.name || ''}
                                onChange={(e) =>
                                  setNewTeamMember((prev) => ({
                                    ...prev,
                                    [team.id]: { ...(prev[team.id] || { experience: 'Beginner' }), name: e.target.value },
                                  }))
                                }
                                onKeyDown={(e) => e.key === 'Enter' && addTeamMember(team.id)}
                                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#123836] transition-colors"
                              />
                              <div className="relative shrink-0">
                                <select
                                  value={newTeamMember[team.id]?.experience || 'Beginner'}
                                  onChange={(e) =>
                                    setNewTeamMember((prev) => ({
                                      ...prev,
                                      [team.id]: { ...(prev[team.id] || {}), experience: e.target.value },
                                    }))
                                  }
                                  className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 cursor-pointer outline-none focus:border-[#123836] transition-colors"
                                >
                                  {EXPERIENCE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"
                                />
                              </div>
                              <Button
                                onClick={() => addTeamMember(team.id)}
                                disabled={!newTeamMember[team.id]?.name?.trim()}
                                className="shrink-0"
                              >
                                Add
                              </Button>
                            </div>

                            {/* Member list */}
                            {team.members.map((m, idx) => {
                              const exp = EXP_COLORS[m.experience] || EXP_COLORS.Beginner;
                              return (
                                <div key={m.id} className="flex items-center gap-3 py-2 text-sm">
                                  <span className="text-slate-400 w-6 text-right shrink-0">{idx + 1}.</span>
                                  <span className="flex-1 text-slate-700">{m.name}</span>
                                  <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{ color: exp.text, background: exp.bg }}
                                  >
                                    {m.experience}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeTeamMember(team.id, m.id)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors"
                                  >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                  </button>
                                </div>
                              );
                            })}

                            {team.members.length === 0 && (
                              <p className="text-xs text-slate-300 text-center py-3 m-0">
                                No members yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Auto-randomize mode ── */}
            {data.teamMode === 'randomize' && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 m-0">
                  Player Pool (will be randomized into teams)
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT — CSV + Manual */}
                  <div className="flex flex-col gap-5">
                    {/* CSV Upload */}
                    <div
                      onClick={() => csvInputRef.current?.click()}
                      className="
                        flex flex-col items-center justify-center gap-2 px-6 py-6
                        rounded-xl border-2 border-dashed border-slate-200
                        cursor-pointer transition-all duration-200
                        hover:border-slate-300 bg-slate-50/50
                      "
                    >
                      <FontAwesomeIcon icon={faFileArrowUp} className="text-slate-400 text-lg" />
                      <span className="text-sm font-semibold text-slate-700">Upload CSV</span>
                      <span className="text-xs text-slate-400">Browse or drag file here</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-1 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          csvInputRef.current?.click();
                        }}
                      >
                        Browse File
                      </Button>
                    </div>

                    {/* Manual Entry */}
                    <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
                      <h4 className="text-sm font-bold text-slate-800 m-0 mb-4">Manual Entry</h4>
                      <div className="flex flex-col gap-3">
                        <InputField
                          label="Player Name"
                          placeholder="e.g. Nguyen Van A"
                          value={newParticipant.name}
                          onChange={(e) => setNewParticipant((p) => ({ ...p, name: e.target.value }))}
                        />
                        <SelectField
                          label="Experience"
                          options={EXPERIENCE_OPTIONS}
                          value={newParticipant.experience}
                          onChange={(e) => setNewParticipant((p) => ({ ...p, experience: e.target.value }))}
                        />
                        <Button
                          onClick={addParticipant}
                          disabled={!newParticipant.name.trim()}
                          fullWidth
                        >
                          Add Player
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — Player Table */}
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200/60">
                          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 w-10">#</th>
                          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Name</th>
                          <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 text-center">Experience</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {(data.participants || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-300">
                              No players added yet
                            </td>
                          </tr>
                        ) : (
                          (data.participants || []).map((p, idx) => {
                            const exp = EXP_COLORS[p.experience] || EXP_COLORS.Beginner;
                            return (
                              <tr key={p.id} className="border-b border-slate-100/60 last:border-b-0">
                                <td className="px-5 py-3 text-sm text-slate-400">{idx + 1}</td>
                                <td className="px-5 py-3 text-sm font-medium text-slate-700">{p.name}</td>
                                <td className="px-5 py-3 text-center">
                                  <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{ color: exp.text, background: exp.bg }}
                                  >
                                    {p.experience}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={() => removeParticipant(p.id)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors"
                                  >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3 m-0">
                  {(data.participants || []).length} player{(data.participants || []).length !== 1 ? 's' : ''} added
                  {data.membersPerTeam > 0 && (
                    <> · will be split into teams of {data.membersPerTeam}</>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SportParticipantsStep;
