import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

export default function DashboardCard({ title, value, icon, color = 'bg-[#1A1A1A]', onClick }: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-8 border-b-4 border-r-4 border-[#1A1A1A] bg-[#F8F7F2] hover:bg-white transition-all cursor-pointer relative group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 text-white ${color}`}>
          {icon}
        </div>
        <div className="text-[10px] font-mono font-bold opacity-30 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
          View Module
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-60">{title}</div>
        <div className="text-5xl font-serif font-black italic tracking-tighter leading-none">{value}</div>
      </div>
    </div>
  );
}