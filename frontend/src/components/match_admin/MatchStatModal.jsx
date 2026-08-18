import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faMinus, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom';
import { getMatchStats, createMatchStat, updateMatchStat, deleteMatchStat } from '../../services/MatchService';
import { getStatTemplates } from '../../services/TournamentService';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';

const MatchStatModal = ({ matchId, team1, team2, onClose }) => {
  const { id: tournamentId } = useParams();
  const [stats, setStats] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Stat Form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('INTEGER');
  const [addingError, setAddingError] = useState(null);

  // Modal State
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    loadStatsAndTemplates();
  }, [matchId, tournamentId]);

  const loadStatsAndTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, templatesData] = await Promise.all([
        getMatchStats(matchId),
        tournamentId ? getStatTemplates(tournamentId) : Promise.resolve([])
      ]);
      setStats(statsData);
      setTemplates(templatesData);
    } catch (err) {
      setError('Failed to load match stats.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStat = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setAddingError(null);
      await createMatchStat(matchId, { name: newName.trim(), type: newType });
      setNewName('');
      setNewType('INTEGER');
      setIsAdding(false);
      await loadStatsAndTemplates();
    } catch (err) {
      setAddingError(err.response?.data?.message || 'Failed to add stat.');
    }
  };

  const handleAddGlobalStat = async (template) => {
    try {
      await createMatchStat(matchId, { name: template.name, type: template.type });
      await loadStatsAndTemplates();
    } catch (err) {
      setError('Failed to add global stat.');
    }
  };

  const handleDeleteClick = (statId) => {
    setModalContent({
      title: 'Delete Match Stat',
      description: 'Are you sure you want to delete this stat from the match? This action cannot be undone.',
      intent: 'danger',
      confirmLabel: 'Delete',
      action: () => confirmDelete(statId)
    });
  };

  const confirmDelete = async (statId) => {
    try {
      await deleteMatchStat(matchId, statId);
      setStats(prev => prev.filter(s => s.id !== statId));
    } catch (err) {
      setError('Failed to delete stat.');
    } finally {
      setModalContent(null);
    }
  };

  const handleUpdateValue = async (statId, op, by, value, currentType) => {
    try {
      const payload = currentType === 'INTEGER' ? { op, by } : { op: 'set', value };
      const res = await updateMatchStat(matchId, statId, payload);
      setStats(prev => prev.map(s => s.id === statId ? { ...s, value: res.value } : s));
    } catch (err) {
      setError('Failed to update stat value.');
    }
  };

  const renderStatValueControl = (stat) => {
    if (stat.type === 'INTEGER') {
      return (
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            onClick={() => handleUpdateValue(stat.id, 'decrement', 1, null, 'INTEGER')}
          >
            <FontAwesomeIcon icon={faMinus} className="text-xs" />
          </button>
          <span className="w-12 text-center font-bold text-slate-800">{stat.value || '0'}</span>
          <button 
            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            onClick={() => handleUpdateValue(stat.id, 'increment', 1, null, 'INTEGER')}
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
          </button>
        </div>
      );
    }
    
    // For other types, use a controlled input that saves on blur
    return (
      <StatInput 
        stat={stat} 
        onSave={(val) => handleUpdateValue(stat.id, 'set', null, val, stat.type)} 
      />
    );
  };

  const missingTemplates = templates.filter(t => !stats.find(s => s.name === t.name));

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Match Statistics</h2>
              <p className="text-sm text-slate-500">{team1.name} vs {team2.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded hover:bg-slate-100 text-slate-400">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            
            {loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              <div className="space-y-4">
                {stats.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No stats tracked for this match yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {stats.map(stat => (
                      <div key={stat.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-slate-300">
                        <div>
                          <div className="font-semibold text-slate-800">{stat.name}</div>
                          <div className="text-xs text-slate-400">{stat.type}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          {renderStatValueControl(stat)}
                          <button onClick={() => handleDeleteClick(stat.id)} className="text-slate-300 hover:text-red-500 p-2">
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && (
              <div className="mt-8 flex flex-col gap-4">
                
                {/* Missing Global Stats */}
                {missingTemplates.length > 0 && (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Available Global Stats</h3>
                    <p className="text-xs text-slate-500 mb-3">These stats are defined for the tournament but not yet tracked in this match.</p>
                    <div className="flex flex-wrap gap-2">
                      {missingTemplates.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => handleAddGlobalStat(t)}
                          className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isAdding ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Add Custom Stat</h3>
                    {addingError && <div className="mb-3 text-red-600 text-xs">{addingError}</div>}
                    <form onSubmit={handleAddStat} className="flex gap-3">
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        placeholder="Stat Name" 
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none" 
                        required 
                      />
                      <select 
                        value={newType} 
                        onChange={e => setNewType(e.target.value)}
                        className="w-32 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none"
                      >
                        <option value="INTEGER">Integer</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="TEXT">Text</option>
                        <option value="DURATION">Duration</option>
                        <option value="BOOLEAN">Boolean</option>
                      </select>
                      <Button type="submit" className="text-sm px-4">Add</Button>
                      <Button type="button" variant="secondary" className="text-sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                    </form>
                  </div>
                ) : (
                  <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-sm font-semibold text-[#123836] hover:text-[#1a524e]">
                    <FontAwesomeIcon icon={faPlus} />
                    Add Custom Stat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        open={!!modalContent}
        onClose={() => setModalContent(null)}
        onConfirm={modalContent?.action || (() => setModalContent(null))}
        title={modalContent?.title}
        description={modalContent?.description}
        intent={modalContent?.intent}
        confirmLabel={modalContent?.confirmLabel}
      />
    </>
  );
};

// Extracted component for non-integer inputs to handle local state & onBlur
const StatInput = ({ stat, onSave }) => {
  const [val, setVal] = useState(stat.value || '');
  
  const handleBlur = () => {
    if (val !== (stat.value || '')) {
      onSave(val);
    }
  };

  if (stat.type === 'BOOLEAN') {
    return (
      <select 
        value={val} 
        onChange={e => {
          setVal(e.target.value);
          onSave(e.target.value);
        }}
        className="px-2 py-1.5 border border-slate-300 rounded text-sm outline-none"
      >
        <option value="">-</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input 
      type={stat.type === 'DURATION' ? 'time' : 'text'}
      step={stat.type === 'DURATION' ? '1' : undefined}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={handleBlur}
      placeholder={stat.type === 'PERCENTAGE' ? '0%' : 'Value'}
      className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none text-center"
    />
  );
};

export default MatchStatModal;
