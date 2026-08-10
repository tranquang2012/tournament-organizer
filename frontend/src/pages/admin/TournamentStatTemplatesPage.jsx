import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStatTemplates, createStatTemplate, deleteStatTemplate } from '../../services/TournamentService';
import Button from '../../components/common/Button';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const TournamentStatTemplatesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('INTEGER');
  const [creating, setCreating] = useState(false);
  
  // Modal State
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [id]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getStatTemplates(id);
      setTemplates(data);
    } catch (err) {
      setError('Failed to load stat templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setCreating(true);
      setError(null);
      await createStatTemplate(id, { name: name.trim(), type });
      setName('');
      setType('INTEGER');
      await loadTemplates();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('A template with this name already exists.');
      } else {
        setError('Failed to create template.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (templateId) => {
    setModalContent({
      title: 'Delete Stat Template',
      description: 'Are you sure you want to delete this stat template? This action cannot be undone and will not remove the stat from existing matches, but it will prevent it from being added to new matches.',
      intent: 'danger',
      confirmLabel: 'Delete Template',
      action: () => confirmDelete(templateId)
    });
  };

  const confirmDelete = async (templateId) => {
    try {
      setError(null);
      await deleteStatTemplate(id, templateId);
      await loadTemplates();
    } catch (err) {
      setError('Failed to delete template.');
    } finally {
      setModalContent(null);
    }
  };

  if (loading && templates.length === 0) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stat Templates</h1>
          <p className="text-slate-500">Define global statistics that will be automatically added to all new matches.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/tournaments/list')}>
          Back to Manage
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Template</h2>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Stat Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Yellow Cards, MVP, Possession"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#123836] outline-none"
                required
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#123836] outline-none bg-white"
              >
                <option value="INTEGER">Integer (Number)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="TEXT">Text (String)</option>
                <option value="DURATION">Duration (Time)</option>
                <option value="BOOLEAN">Boolean (Yes/No)</option>
              </select>
            </div>
            <Button type="submit" loading={creating}>
              Add Template
            </Button>
          </form>
        </div>
        
        <div className="p-0">
          {templates.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No templates defined yet. Add one above.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">{t.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteClick(t.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    </div>
  );
};

export default TournamentStatTemplatesPage;
