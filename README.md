# ByteSync

ByteSync is a simple, fast, secure LAN file-sharing application designed for rapid local network transfers.

## Features

- **Blazing Fast Local Transfers:** Utilizes network speed by streaming chunks.
- **Chunked Resumable Uploads:** Large files are sliced and uploaded safely.
- **Controlled File Access:** Admin can set `DOWNLOAD` or `READ_ONLY` mode.
- **Admin Protection:** Settings can ONLY be changed from the server machine (`localhost`).
- **Activity Tracking:** Comprehensive logging of all file and user events.
- **Responsive Design:** Premium UI that works beautifully across desktop, tablet, and mobile.

## Architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** Neon PostgreSQL with Prisma ORM.
- **Storage:** Direct local filesystem chunks and files.

## Prerequisites

- Node.js v18+
- Neon PostgreSQL Database

## Installation

1. Clone or download the project.
2. Run installation for root, client, and server:
   ```bash
   npm run install:all
   ```

## Configuration

1. Rename `.env.example` to `.env` in the root directory.
2. Fill in the `DATABASE_URL` with your Neon PostgreSQL connection string.
3. Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Database Setup

Initialize the Prisma schema:
```bash
cd server
npx prisma generate
npx prisma db push
```
*(Or use `npx prisma migrate dev` if you prefer migrations)*

## Running Locally

To run the application in development mode (starts both frontend and backend concurrently):
```bash
npm run dev
```
The server will run on port `5000` (or as configured in `.env`), and Vite will proxy API requests automatically.

## Building for Production

To build both the frontend and backend:
```bash
npm run build
```

Then, you can start the production server:
```bash
npm start
```
The Express server will automatically serve the built static React files from `/client/dist`.

## Accessing from Another Device (LAN)

1. Find your server's IP address (e.g., `192.168.x.x`). You can copy it directly from the ByteSync Top Bar!
2. Ensure your Windows/Linux firewall allows inbound TCP traffic on port `5000`.
3. Open a browser on any device on the same Wi-Fi and navigate to `http://192.168.x.x:5000`.

## Security Model

- **Remote LAN users** can register, log in, view files, and (if permitted by settings) download files.
- **Settings modifications** (`/api/server/settings`) are explicitly hardcoded to reject any request that does not originate from a local IP address (`127.0.0.1`, `::1`).
- Files are protected against path traversal vulnerabilities using `uuid` names internally.

## File Storage Architecture

- **`storage/chunks/`**: Temporary storage for ongoing chunked uploads.
- **`storage/files/`**: Final assembled files, stored via UUID to prevent filename collisions.

Enjoy fast and secure local file sharing with ByteSync!
