import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { format } from 'date-fns';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';
import CalendarSchedule from './CalendarSchedule.jsx';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-slate-800 border ${color} rounded-xl p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('/40', '/20')}`}>
        <Icon className={`h-6 w-6 ${color.replace('border-', 'text-').replace('/40', '')}`} />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { technicians, jobOrders } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const todayJobs = jobOrders.filter(j => j.date === today && j.status === 'active');
    const scheduledIds = new Set(todayJobs.flatMap(j => j.technicianIds || []));
    const scheduled = [...scheduledIds].filter(id => technicians.some(t => t.id === id)).length;
    const available = technicians.length - scheduled;
    return { scheduled, available, total: technicians.length };
  }, [technicians, jobOrders, today]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Technicians"
          value={stats.total}
          color="border-blue-500/40"
        />
        <StatCard
          icon={UserCheck}
          label="Scheduled Today"
          value={stats.scheduled}
          color="border-emerald-500/40"
        />
        <StatCard
          icon={UserX}
          label="Available Today"
          value={stats.available}
          color="border-amber-500/40"
        />
      </div>

      {/* Calendar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h2 className="text-white font-semibold text-lg">Technician Calendar Schedule</h2>
        </div>
        <CalendarSchedule />
      </div>
    </div>
  );
}
