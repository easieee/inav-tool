import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import {
  ChevronLeft, ChevronRight, Calendar,
  UserPlus, Plus
} from 'lucide-react';

function getDateLabel(date) {
  if (isToday(date))     return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date))  return 'Tomorrow';
  return format(date, 'MMM d');
}

export default function TopBar({ calendarDate, onPrev, onNext, onToday, onAddTech, onCreateJob, onGoHome }) {
  const { technicians, jobOrders, canManageData } = useApp();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayJobs = jobOrders.filter(j => j.date === todayStr);
  const scheduledIds = new Set(todayJobs.flatMap(j => j.technicianIds || []));
  const scheduledCount = [...scheduledIds].filter(id => technicians.some(t => t.id === id)).length;
  const availableCount = technicians.length - scheduledCount;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-brand-darker border-b border-white/10 px-5 py-3 flex items-center justify-between gap-4 shadow-md">

      {/* Left group: Home + spacer + Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors cursor-pointer font-sans font-medium"
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Home
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* Stats */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary leading-none mb-0.5">
              Scheduled Today
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {scheduledCount}
              <span className="text-sm font-normal text-white/40 ml-1">/ {technicians.length} techs</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 leading-none mb-0.5">
              Available Now
            </p>
            <p className="text-2xl font-bold text-white/50 leading-none">
              {availableCount}
              <span className="text-sm font-normal text-white/30 ml-1">techs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Calendar navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Date label — click to jump back to today */}
          <button
            onClick={onToday}
            className="flex items-center gap-2 px-4 py-2 border border-white/15 rounded-lg hover:bg-white/5 transition-colors min-w-[130px] justify-center"
            title="Go to today"
          >
            <Calendar className="h-3.5 w-3.5 text-brand-primary shrink-0" />
            <span className={`text-sm font-semibold ${
              isToday(calendarDate) ? 'text-brand-primary' : 'text-white/70'
            }`}>
              {getDateLabel(calendarDate)}
            </span>
          </button>

          <button
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 transition-colors"
            title="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Actions */}
        {canManageData && (
          <button
            onClick={onAddTech}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/15 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + Add Tech
          </button>
        )}

        {canManageData && (
          <button
            onClick={onCreateJob}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Job Order
          </button>
        )}
      </div>
    </div>
  );
}
