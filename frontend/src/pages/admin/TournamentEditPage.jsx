import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faSliders,
  faUsers,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { getTournamentById, getParticipants } from '../../services/TournamentService';
import EditDetailsTab from '../../components/tournament_admin/edit/EditDetailsTab';
import EditParticipantsTab from '../../components/tournament_admin/edit/EditParticipantsTab';
import EditActionsTab from '../../components/tournament_admin/edit/EditActionsTab';

const TABS = [
  { key: 'details',      label: 'Tournament Details', icon: faSliders },
  { key: 'participants', label: 'Participants',        icon: faUsers   },
  { key: 'actions',      label: 'Tournament Actions',  icon: faPause   },
];

const mapParticipantsToCompetitors = (participants, teamSize, existingCompetitors = []) => {
  return (participants || []).map(p => {
    const existingComp = existingCompetitors.find(c => c.comp_id === p.id);
    
    if (Number(teamSize) === 1) {
      const existingMem = existingComp?.members?.[0];
      return {
        comp_id: p.id,
        comp_name: p.name,
        comp_size: 1,
        comp_logo: p.logo || existingComp?.comp_logo,
        members: [
          {
            mem_id: existingMem?.mem_id || p.id,
            mem_name: p.name,
            mem_expe: p.experience
          }
        ]
      };
    } else {
      return {
        comp_id: p.id,
        comp_name: p.name,
        comp_size: teamSize,
        comp_logo: p.logo || existingComp?.comp_logo,
        members: (p.members || []).map(m => {
          const existingTeamMem = existingComp?.members?.find(em => em.mem_id === m.id);
          return {
            mem_id: existingTeamMem?.mem_id || m.id,
            mem_name: m.name,
            mem_expe: m.experience
          };
        })
      };
    }
  });
};

const TournamentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details');
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTournament = useCallback(async () => {
    const [tourData, participantData] = await Promise.all([
      getTournamentById(id),
      getParticipants(id),
    ]);
    if (!tourData) throw new Error('Tournament not found');
    tourData.competitors = mapParticipantsToCompetitors(
      participantData,
      tourData.team_size,
      tourData.competitors,
    );
    setTournament(tourData);
    return tourData;
  }, [id]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        await loadTournament();
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [loadTournament]);

  /*  Loading state  */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
      </div>
    );
  }

  /*  Error state  */
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 text-red-700 text-sm font-medium">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/tournaments/list')}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer transition-colors"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Back to Tournament List
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] pb-16">
      <div className="max-w-[1100px] mx-auto w-full px-2">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-400">
          <button
            onClick={() => navigate('/admin/tournaments/list')}
            className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-[#123836] bg-transparent border-none cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            Tournament Management
          </button>
          <span>/</span>
          <span className="text-slate-700 font-semibold truncate max-w-[240px]">
            {tournament?.tour_name || 'Edit Tournament'}
          </span>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-[28px] font-bold text-slate-800 mb-1 leading-tight">
            Edit Tournament
          </h1>
          <p className="text-sm font-medium text-slate-400">
            {tournament?.tour_name}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-8 bg-white rounded-xl border border-slate-200 p-1 self-start w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                border-none cursor-pointer transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <FontAwesomeIcon icon={tab.icon} className="text-xs" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content - white card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-8">
          {activeTab === 'details' && (
            <EditDetailsTab
              tournamentId={id}
              initialData={tournament}
            />
          )}
          {activeTab === 'participants' && (
            <EditParticipantsTab
              tournamentData={tournament}
            />
          )}
          {activeTab === 'actions' && (
            <EditActionsTab
              key={[
                id,
                tournament?.tour_status,
                tournament?.tour_pausedate,
                tournament?.tour_startdate,
                tournament?.tour_enddate,
              ].join('-')}
              tournamentId={id}
              tournament={tournament}
              onTournamentRefresh={loadTournament}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default TournamentEditPage;
