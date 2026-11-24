import React from 'react';
import logoImg from '../assets/logo.png';

export function OminiLogo({ className = "h-8", showBadge = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* OMINI-Study Green Lotus Leaf Icon */}
      <div className="relative h-full aspect-square rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-emerald-700/20 border border-emerald-600/30 flex-shrink-0 bg-[#1E3922]">
        <img
          src={logoImg}
          alt="OMINI-Study"
          className="w-full h-full object-cover"
        />
      </div>

      {/* OMINI-Study Wordmark */}
      <div className="flex items-center">
        <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#1C1A17] font-sans">
          OMINI<span className="text-[#0D9488]">-Study</span>
        </span>
      </div>
    </div>
  );
}

// Export aliases for compatibility across imports
export const MindgraspLogo = OminiLogo;
export default OminiLogo;
