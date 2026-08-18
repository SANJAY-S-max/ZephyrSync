export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

export interface ServerSettings {
  permissionMode: 'READ_ONLY' | 'DOWNLOAD' | 'UPLOAD_DOWNLOAD';
  maxFileSizeMB: number;
  chunkSizeMB: number;
}

export interface Activity {
  id: string;
  action: string;
  entityType: string;
  fileName?: string;
  createdAt: string;
  user?: { username: string };
}

export interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: string; // BigInt serialized as string
  createdAt: string;
  owner: { id: string; username: string };
}
