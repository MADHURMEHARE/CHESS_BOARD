import React from 'react';

interface NavItemProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export default function NavItem({ active, icon, label, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-2 py-3 text-sm font-bold transition-all group ${
        active
          ? 'text-[#1A1A1A]'
          : 'text-zinc-400 hover:text-[#1A1A1A]'
      }`}
    >
      <div className={`p-2 transition-colors ${active ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-zinc-300 group-hover:text-[#1A1A1A]'}`}>
        {icon}
      </div>
      <span className="uppercase tracking-widest text-xs italic font-black">{label}</span>
      {active && <div className="ml-auto w-2 h-2 bg-[#B45309] rounded-full" />}
    </button>
  );
}