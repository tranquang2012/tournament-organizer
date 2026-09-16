import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { getTournamentById, generateBracket } from '../../services/TournamentService';
import EliminationMatchTemplate from '../../components/match_admin/EliminationMatchTemplate';
import RoundRobinMatchTemplate from '../../components/match_admin/RoundRobinMatchTemplate';
import RoundScoringMatchTemplate from '../../components/match_admin/RoundScoringMatchTemplate';
import HybridMatchTemplate from '../../components/match_admin/HybridMatchTemplate';

const MatchConfigPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMatches = async () => {
    try {
      setIsGenerating(true);
      await generateBracket(id);
      const tourData = await getTournamentById(id);
      setTournament(tourData);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to generate matches');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const tourData = await getTournamentById(id);
        if (!tourData) throw new Error('Tournament not found');
        setTournament(tourData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
      </div>
    );
  }

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

  const format = tournament?.tour_format;
  const isElimination = format === 'single_elimination' || format === 'double_elimination';
  const isRoundRobin = format === 'round_robin';
  const isRoundScoring = format === 'round_scoring';
  const isHybrid = format === 'hybrid';

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] pb-16">
      <div className="max-w-[1100px] mx-auto w-full px-2">

        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <button
              onClick={() => navigate('/admin/tournaments/list')}
              className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-[#123836] bg-transparent border-none cursor-pointer transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              Tournament Management
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
              className="font-medium text-slate-500 hover:text-[#123836] bg-transparent border-none cursor-pointer transition-colors truncate max-w-[200px]"
            >
              {tournament?.tour_name || 'Tournament'}
            </button>
            <span>/</span>
            <span className="text-slate-700 font-semibold truncate max-w-[200px]">
              Configure Matches
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerateMatches}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#123836] text-white text-sm font-semibold rounded-lg hover:bg-[#0d2a28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Matches'
            )}
          </button>
        </div>

        {/* Dynamic Template rendering based on format */}
        {isElimination ? (
          <EliminationMatchTemplate tournament={tournament} />
        ) : isRoundRobin ? (
          <RoundRobinMatchTemplate tournament={tournament} />
        ) : isRoundScoring ? (
          <RoundScoringMatchTemplate tournament={tournament} />
        ) : isHybrid ? (
          <HybridMatchTemplate tournament={tournament} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Format Not Supported Yet</h2>
            <p className="text-slate-500 font-medium">
              The Match Configuration page for "{format}" format is currently under development.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchConfigPage;
