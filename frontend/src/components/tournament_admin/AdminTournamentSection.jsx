import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import AdminTournamentCard from './AdminTournamentCard';

const AdminTournamentSection = ({ title, pillColorClass, tournaments }) => {
  const [expanded, setExpanded] = useState(false);

  const displayCount = 3;
  const hasMore = tournaments.length > displayCount;
  const visibleTournaments = expanded ? tournaments : tournaments.slice(0, displayCount);

  return (
    <div className="flex flex-col mb-12">
      <div className="flex items-center mb-6">
        <div className={`px-5 py-1.5 rounded-full text-white text-[13px] font-medium shrink-0 ${pillColorClass}`}>
          {title}
        </div>
        <div className="h-px bg-slate-200 w-full ml-6"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTournaments.map((tournament) => (
          <AdminTournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {hasMore && (
        <div className="w-full flex justify-center mt-8">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <FontAwesomeIcon icon={faChevronDown} className={`text-2xl transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminTournamentSection;
