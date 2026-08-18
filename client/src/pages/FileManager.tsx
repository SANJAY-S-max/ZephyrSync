import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { FileItem } from '../types';
import { FileIcon } from '../components/FileIcon';
import { formatDistanceToNow } from 'date-fns';
import { Search, UploadCloud, Download, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB Default, can be overridden by settings
const CONCURRENCY = 4; // Should ideally read from server settings if passed

interface UploadState {
  id: string;
  file: File;
  progress: number;
  speedBytesPerSec: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
  error?: string;
}

export const FileManager = () => {
  const { serverInfo, user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/files?search=${search}`);
      if (res.data) setFiles(res.data.files);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      fetchFiles();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const canUpload = serverInfo?.settings?.permissionMode === 'UPLOAD_DOWNLOAD';
  // Read Only can't download. Download and Upload_Download can.
  const canDownload = serverInfo?.settings?.permissionMode !== 'READ_ONLY';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Add to upload queue
    const newUploads = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      speedBytesPerSec: 0,
      status: 'pending' as const
    }));

    setUploads(prev => [...prev, ...newUploads]);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Start uploads (fire and forget for this simple implementation)
    newUploads.forEach(startUpload);
  };

  const startUpload = async (upload: UploadState) => {
    const { file, id } = upload;
    
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'uploading' } : u));
    
    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      // 1. Init upload
      const initRes = await api.post('/files/upload/init', {
        originalName: file.name,
        size: file.size,
        totalChunks
      });
      const uploadId = initRes.data.uploadId;

      let lastTime = Date.now();
      let lastUploadedBytes = 0;
      let totalUploadedBytes = 0;

      // 2. Upload chunks (Controlled concurrency could be implemented here with a pool, using sequential for simplicity in this demo)
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('chunk', chunk);

        await api.post('/files/upload/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        totalUploadedBytes += chunk.size;
        
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000; // seconds
        
        if (timeDiff > 0.5 || i === totalChunks - 1) { // update UI every half sec
          const speed = (totalUploadedBytes - lastUploadedBytes) / timeDiff;
          const progress = Math.round((totalUploadedBytes / file.size) * 100);
          
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress, speedBytesPerSec: speed } : u));
          
          lastTime = now;
          lastUploadedBytes = totalUploadedBytes;
        }
      }

      // 3. Complete upload
      await api.post('/files/upload/complete', { uploadId, totalChunks });

      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'completed', progress: 100 } : u));
      fetchFiles(); // Refresh list

      // Clear completed after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== id));
      }, 3000);

    } catch (err: any) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
    }
  };

  const handleDownload = (file: FileItem) => {
    // Standard browser download trigger
    window.location.href = `/api/files/${file.id}/download`;
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const formatBytes = (bytes: number | bigint) => {
    const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Upload & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={!canUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload}
            className={cn(
              "flex items-center space-x-2 px-5 py-2.5 rounded-lg shadow-sm font-medium transition-all",
              canUpload 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            )}
            title={!canUpload ? 'Uploads are disabled by the server administrator.' : ''}
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Upload Queue Manager */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-6">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-blue-800">Transfers ({uploads.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {uploads.map(u => (
              <div key={u.id} className="p-4 flex items-center space-x-4">
                <FileIcon extension={u.file.name.split('.').pop() || ''} className="w-8 h-8 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate pr-4">{u.file.name}</p>
                    <span className="text-xs font-semibold text-slate-600 shrink-0">
                      {u.status === 'completed' ? 'Complete' : u.status === 'error' ? 'Failed' : `${u.progress}%`}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        u.status === 'error' ? "bg-red-500" : u.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.max(u.progress, 2)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
                    <span>{formatBytes(u.file.size)}</span>
                    {u.status === 'uploading' && u.speedBytesPerSec > 0 && (
                      <span>{formatBytes(u.speedBytesPerSec)}/s</span>
                    )}
                    {u.status === 'error' && <span className="text-red-500 truncate ml-4">{u.error}</span>}
                  </div>
                </div>
                
                {u.status === 'error' && (
                  <button onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Size</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Owner</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin" /></div>
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p>No files found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              files.map(file => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <FileIcon extension={file.extension} className="w-6 h-6 shrink-0" />
                      <span className="font-medium text-slate-800 break-all">{file.originalName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell whitespace-nowrap">
                    {formatBytes(BigInt(file.size))}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell whitespace-nowrap">
                    {file.owner.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">
                    {formatDistanceToNow(new Date(file.createdAt))} ago
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownload(file)}
                        disabled={!canDownload}
                        className={cn("p-2 rounded hover:bg-slate-200 transition-colors", canDownload ? "text-indigo-600" : "text-slate-300 cursor-not-allowed")}
                        title={canDownload ? "Download" : "Downloads disabled"}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      {(user?.role === 'ADMIN' || user?.id === file.owner.id) && canUpload && (
                        <button 
                          onClick={() => handleDelete(file.id)}
                          className="p-2 text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
