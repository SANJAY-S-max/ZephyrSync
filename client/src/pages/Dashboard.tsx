import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HardDrive, FileText, Activity as ActivityIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Activity, FileItem } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard = () => {
  const { serverInfo, user } = useAuth();
  const [stats, setStats] = useState({ files: 0, storageBytes: 0n });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [filesRes, actRes] = await Promise.all([
          api.get('/files?limit=5'),
          api.get('/activity?limit=5')
        ]);
        
        if (filesRes.data) {
          setRecentFiles(filesRes.data.files);
          setStats({
            files: filesRes.data.total,
            // Calculate storage total roughly for dashboard
            storageBytes: filesRes.data.files.reduce((acc: bigint, f: any) => acc + BigInt(f.size), 0n)
          });
        }
        if (actRes.data) {
          setRecentActivity(actRes.data.activities);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatBytes = (bytes: bigint) => {
    if (bytes === 0n) return '0 B';
    const k = 1024n;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let b = bytes;
    while (b >= k && i < sizes.length - 1) {
      b /= k;
      i++;
    }
    return `${b.toString()} ${sizes[i]}`;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Storage Used</p>
            <p className="text-2xl font-bold text-slate-800">{formatBytes(stats.storageBytes)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Files</p>
            <p className="text-2xl font-bold text-slate-800">{stats.files}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Current User</p>
            <p className="text-2xl font-bold text-slate-800">{user?.username}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Server Status</p>
            <p className="text-2xl font-bold text-slate-800 capitalize">{serverInfo?.status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Recent Files</h3>
            <Link to="/files" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="p-0 flex-1">
            {recentFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No files uploaded yet</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentFiles.map(file => (
                  <li key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 uppercase font-bold text-xs">
                        {file.extension}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{file.originalName}</p>
                        <p className="text-xs text-slate-500 truncate">{formatBytes(BigInt(file.size))} • {formatDistanceToNow(new Date(file.createdAt))} ago</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            <Link to="/activity" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="p-0 flex-1">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent activity</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map(act => (
                  <li key={act.id} className="p-4 flex flex-col space-y-1 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-slate-800">
                        {act.user ? act.user.username : 'System'} <span className="font-normal text-slate-600">{act.action.replace(/_/g, ' ')}</span>
                      </p>
                      <span className="text-xs text-slate-400 shrink-0 ml-4">{formatDistanceToNow(new Date(act.createdAt))} ago</span>
                    </div>
                    {act.fileName && (
                      <p className="text-xs text-blue-600 truncate">{act.fileName}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
