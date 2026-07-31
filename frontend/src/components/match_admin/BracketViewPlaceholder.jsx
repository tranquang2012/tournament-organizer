import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';

const BracketViewPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
        <FontAwesomeIcon icon={faSitemap} className="text-4xl text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-700 mb-2">Bracket View</h2>
      <p className="text-slate-400 font-medium max-w-md text-center">
        Bracket view placeholder.
      </p>
    </div>
  );
};

export default BracketViewPlaceholder;
