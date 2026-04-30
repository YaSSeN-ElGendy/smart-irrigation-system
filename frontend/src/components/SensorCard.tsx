import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: string | number | null;
  unit: string;
  icon: React.ReactNode;
  statusText?: string;
  statusColor?: string;
  lastUpdated?: string | null;
}

export function SensorCard({ title, value, unit, icon, statusText, statusColor, lastUpdated }: SensorCardProps) {
  return (
    <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border flex flex-col items-center justify-between text-center transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800/50 text-muted">
           {icon}
        </div>
        <h3 className="text-lg font-semibold text-muted">{title}</h3>
      </div>
      
      <div className="mb-4">
        {value !== null ? (
          <div className="text-5xl font-extrabold text-text tracking-tighter flex items-baseline justify-center gap-1">
            {value}
            <span className="text-2xl text-primary font-bold">{unit}</span>
          </div>
        ) : (
          <div className="text-5xl font-extrabold text-muted tracking-tighter">--</div>
        )}
      </div>

      <div className="h-8 flex items-center justify-center">
        {statusText && (
          <div className={`text-xl font-bold tracking-tight ${statusColor || 'text-text'}`}>
            {statusText}
          </div>
        )}
      </div>

      <div className="text-sm font-medium text-slate-400 mt-6 pt-4 border-t border-border/50 w-full">
        Last update: {lastUpdated || '--:--:--'}
      </div>
    </div>
  );
}
