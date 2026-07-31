import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPenToSquare,
  faDiagramProject,
  faChevronRight,
  faTrashCan,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { deleteTournament } from '../../services/TournamentService';
import Button from '../common/Button';

const TournamentActionModal = ({ tournament, onClose, onDeleted }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Dismiss on Escape */
  useEffect(() => {
    if (!tournament) {
      setConfirmDelete(false);
      return;
    }
    const handler = (e) => {
      if (e.key === 'Escape' && !deleting) {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tournament, onClose, confirmDelete, deleting]);

  if (!tournament) return null;

  const { id, title, status } = tournament;

  const badgeColors = {
    Active:    { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', dot: 'bg-[#22c55e]' },
    Upcoming:  { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]', dot: 'bg-[#94a3b8]' },
    Completed: { bg: 'bg-[#dbeafe]', text: 'text-[#1e3a8a]', dot: 'bg-[#3b82f6]' },
  };
  const badge = badgeColors[status] || badgeColors.Upcoming;

  const handleEditTournament = () => {
    onClose();
    setConfirmDelete(false);
    navigate(`/admin/tournaments/${id}/edit`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTournament(id);
      onDeleted?.(id);
      onClose();
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease-out]"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] pointer-events-auto animate-[fadeIn_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tournament
              </p>
              <h2 className="text-[17px] font-bold text-slate-800 leading-snug truncate mb-2">
                {title}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {status}
              </span>
            </div>
            <button
              onClick={handleClose}
              disabled={deleting}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Body */}
          {confirmDelete ? (
            <div className="p-6 flex flex-col items-center text-center animate-[fadeIn_0.2s_ease-out]">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Tournament?</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone and all associated data will be permanently removed.
              </p>
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 !bg-red-500 hover:!bg-red-600 focus:!ring-red-500/20 border-none"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  Yes, Delete
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Action cards */}
              <div className="p-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  What would you like to do?
                </p>

                {/* Edit Tournament */}
                <button
                  onClick={handleEditTournament}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#123836] hover:shadow-sm transition-all duration-200 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0 group-hover:bg-[#123836] transition-colors duration-200">
                    <FontAwesomeIcon
                      icon={faPenToSquare}
                      className="text-[#123836] text-sm group-hover:text-white transition-colors duration-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 mb-0.5">Edit Tournament</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Update details, participants, and banner
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 text-xs shrink-0 group-hover:text-[#123836] transition-colors duration-200" />
                </button>

                {/* Configure Matches */}
                <button
                  onClick={() => {
                    onClose();
                    setConfirmDelete(false);
                    navigate(`/admin/tournaments/${id}/matches`);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#123836] hover:shadow-sm transition-all duration-200 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0 group-hover:bg-[#123836] transition-colors duration-200">
                    <FontAwesomeIcon
                      icon={faDiagramProject}
                      className="text-[#123836] text-sm group-hover:text-white transition-colors duration-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 mb-0.5">Configure Matches</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Manage brackets, schedule matches, and scores
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 text-xs shrink-0 group-hover:text-[#123836] transition-colors duration-200" />
                </button>

                {/* Delete Tournament */}
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent bg-transparent hover:bg-red-50 hover:border-red-100 transition-all duration-200 cursor-pointer text-left group mt-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors duration-200">
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="text-slate-400 text-sm group-hover:text-red-600 transition-colors duration-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-600 group-hover:text-red-600 transition-colors duration-200 mb-0.5">
                      Delete Tournament
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-red-500/80 transition-colors duration-200 leading-relaxed">
                      Permanently remove this tournament
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 text-xs shrink-0 group-hover:text-red-500 transition-colors duration-200" />
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100">
                <button
                  onClick={handleClose}
                  className="w-full h-9 flex items-center justify-center text-sm font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentActionModal;
