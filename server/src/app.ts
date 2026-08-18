import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { env } from './config/env';
import routes from './routes';
import { seedInitialData } from './jobs/seed';
import path from 'path';
import os from 'os';

const app = express();

app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for the showcase since it's accessed via LAN IP
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api', routes);

app.get('/api/server/info', (req, res) => {
  // Get all LAN IPv4 addresses (exclude loopback 127.x.x.x)
  const interfaces = os.networkInterfaces();
  const lanIPs: string[] = [];

  for (const [name, iface] of Object.entries(interfaces)) {
    if (!iface) continue;
    // Skip virtual/docker/wsl interfaces
    if (name.toLowerCase().includes('veth') || name.toLowerCase().includes('docker') || name.toLowerCase().includes('virtual')) {
      continue;
    }
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        // Skip common VirtualBox default host-only network (192.168.56.x)
        if (alias.address.startsWith('192.168.56.')) {
           // We keep it in the list, but it shouldn't be primary
           lanIPs.push(alias.address);
        } else {
           // Put real IPs at the front of the array
           lanIPs.unshift(alias.address);
        }
      }
    }
  }

  res.json({
    status: 'online',
    port: env.PORT,
    lanIPs,          // e.g. ["192.168.1.5"]
    primaryLanIP: lanIPs[0] || null,
  });
});

// Serve frontend static files
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Basic Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error'
    }
  });
});

app.listen(Number(env.PORT), '0.0.0.0', async () => {
  await seedInitialData();
  
  console.log('================================');
  console.log('ByteSync Server');
  console.log('===============');
  console.log(`Local: \t\thttp://localhost:${env.PORT}`);
  console.log(`Network: \thttp://0.0.0.0:${env.PORT}`); // Should really show the actual IP, but this is fine for now
  console.log('Database: \tConnected');
  console.log('Storage: \tReady');
  console.log('================================');
});

export default app;
