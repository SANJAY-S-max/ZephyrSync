import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, Server, HardDrive } from 'lucide-react';

export const Settings = () => {
  const { serverInfo, refreshSettings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState(serverInfo?.settings?.permissionMode || 'DOWNLOAD');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.patch('/server/settings', { permissionMode: mode });
      await refreshSettings();
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings. You must be on the server laptop to do this.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800">Server Settings restricted</h4>
          <p className="text-sm text-amber-700 mt-1">
            These settings can only be changed by an Administrator accessing this page directly from the server computer. Remote devices on the LAN cannot change these settings.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
          <Server className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Sharing Permissions</h2>
        </div>
        
        <div className="p-6 space-y-6">
          
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">{success}</div>}

          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="permission" 
                value="READ_ONLY" 
                checked={mode === 'READ_ONLY'} 
                onChange={(e) => setMode(e.target.value as any)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <span className="block text-sm font-semibold text-slate-800">Read Only</span>
                <span className="block text-sm text-slate-500 mt-1">Users can view file metadata but cannot download or upload anything.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="permission" 
                value="DOWNLOAD" 
                checked={mode === 'DOWNLOAD'} 
                onChange={(e) => setMode(e.target.value as any)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <span className="block text-sm font-semibold text-slate-800">Download Only (Recommended)</span>
                <span className="block text-sm text-slate-500 mt-1">Users can browse and download files, but cannot upload or delete.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="permission" 
                value="UPLOAD_DOWNLOAD" 
                checked={mode === 'UPLOAD_DOWNLOAD'} 
                onChange={(e) => setMode(e.target.value as any)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <span className="block text-sm font-semibold text-slate-800">Upload & Download</span>
                <span className="block text-sm text-slate-500 mt-1">Users can upload new files and download existing files.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading || mode === serverInfo?.settings?.permissionMode}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Storage Configuration</h2>
        </div>
        <div className="p-6 text-sm text-slate-600 space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="font-medium">Max File Size</span>
            <span>{serverInfo?.settings?.maxFileSizeMB} MB</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="font-medium">Chunk Size</span>
            <span>{serverInfo?.settings?.chunkSizeMB} MB</span>
          </div>
          <p className="text-xs text-slate-400 pt-2">These settings are configured via environment variables (.env) on the server.</p>
        </div>
      </div>
    </div>
  );
};
