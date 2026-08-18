# ByteSync

ByteSync is a simple, fast, secure LAN file-sharing application designed for rapid local network transfers. It allows multiple users to connect to a local server over Wi-Fi or Ethernet to upload, download, and share large files easily. The application uses a resumable chunked upload system, ensuring that huge files can be transferred seamlessly and reliably without risking memory overflows. 

With a premium and highly responsive UI, ByteSync provides an effortless file-sharing experience similar to modern cloud storage solutions, but operating entirely on your local network for maximum privacy and speed.

## Features

- **Blazing Fast Local Transfers:** Utilizes local network speed by streaming chunks directly to storage.
- **Chunked Resumable Uploads:** Large files are sliced and uploaded safely.
- **Controlled File Access:** Server admin can enforce `DOWNLOAD` or `READ_ONLY` modes globally.
- **Admin Protection:** Critical server settings can ONLY be modified from the server's local machine (`localhost`).
- **Activity Tracking:** Comprehensive logging of all file uploads, downloads, and user registrations.
- **Responsive Premium UI:** A beautiful interface that works beautifully across desktop, tablet, and mobile browsers.

## Architecture & Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** PostgreSQL (with Prisma ORM).
- **Storage:** Direct local filesystem chunks and files.

---

## 🚀 Getting Started

If you have just cloned this repository from GitHub, follow this detailed step-by-step guide to get ByteSync up and running on your local machine.

### Prerequisites

Make sure you have the following installed on your system before proceeding:
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL Database** - You can install it locally or use a cloud database provider like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).

### 1. Clone the Repository

Clone the project to your local machine and navigate into the project directory:

```bash
git clone https://github.com/your-username/ByteSync.git
cd ByteSync
```

### 2. Install Dependencies

This project uses a monorepo-style structure containing both `client` and `server` folders. To install the Node modules for the root directory and both sub-projects, run the provided helper script:

```bash
npm run install:all
```
*(If you are on Windows and PowerShell throws an Execution Policy error, run `cmd.exe /c "npm run install:all"` instead).*

### 3. Setup Environment Variables

You need to configure the environment variables for the database connection and the application port. 

1. In the root directory, you will find a file named `.env.example`.
2. Rename this file to `.env` (or create a copy).
3. Open `.env` in your code editor and fill in the following details:

```env
# Server Port
PORT=5000

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://username:password@localhost:5432/bytesync?schema=public"

# Admin credentials for initial setup
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="supersecretpassword"
```

### 4. Setup the Database

Before starting the server, you need to push the Prisma schema to your PostgreSQL database to create the necessary tables.

1. Navigate into the `server` directory:
   ```bash
   cd server
   ```
2. Generate the Prisma client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. Navigate back to the root directory:
   ```bash
   cd ..
   ```

### 5. Running the Application Locally

To start the application in development mode, run the following command from the root directory:

```bash
npm run dev
```

This will concurrently start:
- The **Backend Server** on `http://localhost:5000`
- The **Frontend Vite Dev Server** on `http://localhost:5173`

You can now open your browser and navigate to `http://localhost:5173` to view the application! 

> **Note on Local Access:** The Vite development proxy forwards API requests to the backend. It uses `127.0.0.1:5000` internally to prevent IPv6 binding issues in Node 17+.

---

## 🛠 Building for Production

If you want to package the application to run without the development server:

1. Build both the frontend and backend:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

In production mode, the Express backend will automatically serve the built static React files. You only need to navigate to `http://localhost:5000` to access the app.

---

## 🌐 Accessing from Another Device (LAN)

To share files with other devices on your local network:
1. Find your server's local IP address (e.g., `192.168.1.15`). The ByteSync Top Bar displays your network IP automatically when you're running the app.
2. Ensure your computer's firewall allows inbound TCP traffic on port `5000`.
3. On another device connected to the same Wi-Fi router, open a browser and go to `http://192.168.1.15:5000`.

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for full details.
