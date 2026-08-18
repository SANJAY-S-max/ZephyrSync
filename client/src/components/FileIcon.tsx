import React from 'react';
import {
  FileText, Image, FileAudio, FileVideo, Archive, Table, FileCode, FileWarning, File as FileGeneric, FileSpreadsheet
} from 'lucide-react';

export const FileIcon = ({ extension, className }: { extension: string; className?: string }) => {
  const ext = extension.toLowerCase();
  
  if (['pdf'].includes(ext)) return <FileText className={`text-red-500 ${className}`} />;
  if (['doc', 'docx', 'txt'].includes(ext)) return <FileText className={`text-blue-500 ${className}`} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className={`text-green-500 ${className}`} />;
  if (['ppt', 'pptx'].includes(ext)) return <Table className={`text-orange-500 ${className}`} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <Image className={`text-indigo-500 ${className}`} />;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return <FileAudio className={`text-purple-500 ${className}`} />;
  if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <FileVideo className={`text-pink-500 ${className}`} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive className={`text-amber-600 ${className}`} />;
  if (['json', 'js', 'ts', 'html', 'css', 'java', 'py', 'cpp'].includes(ext)) return <FileCode className={`text-slate-600 ${className}`} />;
  if (['exe', 'bat', 'sh'].includes(ext)) return <FileWarning className={`text-red-600 ${className}`} />;
  
  return <FileGeneric className={`text-slate-400 ${className}`} />;
};
