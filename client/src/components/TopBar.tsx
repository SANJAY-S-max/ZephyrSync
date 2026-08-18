import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Server, Copy, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const TopBar = () => {
  const { serverInfo } = useAuth();
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const getPageName = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/files')) return 'My Files';
    if (path === '/activity') return 'Activity';
    if (path === '/settings') return 'Server Settings';
    return 'ByteSync';
  };

  const getDisplayAddress = () => {
    if (serverInfo?.primaryLanIP) {
      // If we are on localhost/127.0.0.1, show the LAN IP for sharing instead
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const port = window.location.port ? `:${window.location.port}` : '';
        return `${serverInfo.primaryLanIP}${port}`;
      }
    }
    return window.location.host;
  };

  const displayAddress = getDisplayAddress();

  const copyIp = () => {
    const address = `${window.location.protocol}//${displayAddress}`;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-800">{getPageName()}</h1>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
          <Server className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-600 mr-2">
            {displayAddress}
          </span>
          <button 
            onClick={copyIp}
            className="text-slate-400 hover:text-blue-600 transition-colors ml-2 flex items-center justify-center w-6 h-6 rounded"
            title="Copy Server Address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        
        {serverInfo?.settings && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
            Mode: {serverInfo.settings.permissionMode.replace('_', ' ')}
          </div>
        )}
      </div>
    </header>
  );
};
