import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Activity as ActivityType } from '../types';
import { format } from 'date-fns';
import { UserPlus, LogIn, LogOut, Upload, Download, Trash2, Settings, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export const Activity = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/activity?limit=100');
        if (res.data) setActivities(res.data.activities);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getIcon = (action: string) => {
    if (action.includes('REGISTER')) return <UserPlus className="w-5 h-5" />;
    if (action.includes('LOGIN')) return <LogIn className="w-5 h-5" />;
    if (action.includes('LOGOUT')) return <LogOut className="w-5 h-5" />;
    if (action.includes('UPLOAD')) return <Upload className="w-5 h-5" />;
    if (action.includes('DOWNLOAD')) return <Download className="w-5 h-5" />;
    if (action.includes('DELETE')) return <Trash2 className="w-5 h-5" />;
    if (action.includes('SETTINGS')) return <Settings className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getColor = (action: string) => {
    if (action.includes('REGISTER') || action.includes('LOGIN')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('LOGOUT') || action.includes('DELETE')) return 'text-red-600 bg-red-50';
    if (action.includes('UPLOAD')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DOWNLOAD')) return 'text-indigo-600 bg-indigo-50';
    if (action.includes('SETTINGS')) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">System Activity</h2>
        <p className="text-sm text-slate-500 mt-1">Recent events and file transfers across the network.</p>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No activity recorded yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activities.map(act => (
              <li key={act.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                <div className={cn("p-2 rounded-full shrink-0 mt-0.5", getColor(act.action))}>
                  {getIcon(act.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{act.user ? act.user.username : 'System'}</span>
                    {' '}
                    <span className="text-slate-600 lowercase">{act.action.replace(/_/g, ' ')}</span>
                  </p>
                  {act.fileName && (
                    <p className="text-sm font-medium text-blue-600 truncate mt-0.5">{act.fileName}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(act.createdAt), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
