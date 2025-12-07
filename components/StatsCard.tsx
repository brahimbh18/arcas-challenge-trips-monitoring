import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, colorClass }) => {
  return (
    <div className={`p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-lg ${colorClass} relative overflow-hidden group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{value}</h3>
          {trend && <p className="text-xs text-emerald-400 mt-2 font-medium">{trend}</p>}
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <Icon className="w-6 h-6 text-slate-300" />
        </div>
      </div>
    </div>
  );
};