# 💬 Real‑Time Chat Application (MERN + Socket.IO)

A full‑featured WhatsApp‑like messenger with real‑time messaging, image sharing, online status, typing indicators, and user authentication.

## 🚀 Features

- JWT Authentication (signup / login / password reset)
- Real‑time messaging with Socket.IO
- Image upload (Cloudinary)
- Online / offline status with live updates
- Typing indicators & read receipts
- Pin / delete conversations
- Clear chat history
- Responsive design (mobile first)
- Dark mode ready

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Socket.IO Client
- **Backend**: Node.js, Express, MongoDB, Socket.IO, JWT, Cloudinary
- **Deployment**: Render (backend), Vercel (frontend), MongoDB Atlas

## 📦 Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill with your keys
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # optional
npm run dev
```


## 🌐 Environment Variables
## #Backend .env
```text
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

Frontend (only if needed) – no API URL needed because we use Vite proxy in dev, and relative URLs in production (same domain).

### 🚀 Deployment
### Backend (Render)
```
- Push code to GitHub
- Create a new Web Service on Render
- Connect repo, set build command npm install, start command npm start
- Add environment variables (including Cloudinary & MongoDB Atlas)
- Deploy
```

## Frontend (Vercel)
```
- Push code to GitHub
- Import project on Vercel, set framework preset to Vite
- Add environment variable VITE_API_URL if you use absolute URLs (optional)
- Deploy
```

## MongoDB Atlas
```
- Create a free cluster, get connection string
- Replace MONGODB_URI in backend environment
```

## 🧪 Testing
### After deployment, open two browsers or devices, log in with different users, and chat in real time.

## 📄 License
### MIT
```text

---

### Push to GitHub

```bash
# In project root
git init
git add .
git commit -m "Initial commit: complete chat app"
git branch -M main
git remote add origin https://github.com/your-username/chat-app.git
git push -u origin main

(Replace your-username and repo name.)
```

## 🗄️ 2. Set up MongoDB Atlas
```
1. Go to MongoDB Atlas, create a free cluster.

2. Under Database Access, create a database user (user/password).

3. Under Network Access, add IP 0.0.0.0/0 (allow anywhere) – or restrict to your deployment IPs.

4. Get the connection string (e.g., mongodb+srv://user:pass@cluster.mongodb.net/chatdb). Replace chatdb with your database name.
```

## ☁️ 3. Deploy Backend – Render
```
1. Push code to GitHub (as above).

2. Log in to Render, click New + → Web Service.

3. Connect your GitHub repo.

4. Configure:

- Name: chat-backend

- Root Directory: backend (if your repo has both frontend/backend folders)

- Build Command: npm install

- Start Command: npm start

- Environment Variables: Add all keys from your .env (MONGODB_URI, JWT_SECRET, CLOUDINARY_*, FRONTEND_URL).

5. Click Create Web Service.

Wait for deployment. Your backend will be available at https://chat-backend.onrender.com.

⚠️ CORS: In your server.js, update the CORS origin to accept your frontend URL (e.g., https://chat-frontend.vercel.app). You can use an environment variable FRONTEND_URL.
```

## 🌐 4. Deploy Frontend – Vercel
```
1. Push code to GitHub (if not already).

2. Log in to Vercel, click Add New Project → import GitHub repo.

3. Set Root Directory to frontend (if needed).

4. Framework Preset: Vite.

5. Build Command: npm run build (already default).

6. Output Directory: dist.

7. Environment Variables (optional): If you decide to use absolute API URLs, add VITE_API_URL=https://chat-backend.onrender.com. But better to keep relative URLs and let Vercel proxy? Actually for production, Vercel cannot proxy to external backend easily. So we must use absolute URLs.

### Modify frontend to use absolute URLs in production:
```

### Create frontend/.env.production:
```text
VITE_API_URL=https://chat-backend.onrender.com
```

### Then in your frontend code (e.g., api.js), use:
```
const baseURL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL });
```
### With this, the frontend will call https://chat-backend.onrender.com/api/....

### Don’t forget to update WebSocket URL in SocketContext.jsx:
```
const socket = io(import.meta.env.VITE_API_URL || '', { auth: { userId: user._id } });
```
Add VITE_API_URL to Vercel environment variables.

### 8. Click Deploy.

### After deployment, your frontend is live at https://chat-frontend.vercel.app.

## 5. 🔧 5. Final Backend Adjustments

### Update server.js for production CORS and trust proxy
```
import cors from 'cors';
app.set('trust proxy', 1); // if using Render
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```
### Ensure FRONTEND_URL in backend env points to your Vercel URL (e.g., https://chat-frontend.vercel.app).

## 🧪 6. Test on All Devices
- Open the Vercel URL on your phone and laptop.
- Register two users, chat, send images, check online status.
- Refresh the page – the conversation should stay selected.

If anything fails, check:

- Backend logs on Render.
- CORS errors in browser console.
- WebSocket connection: ensure io() uses the same origin as the API.

## ✅ Summary
- GitHub: code hosted.

- MongoDB Atlas: database in cloud.

- Backend (Render): live API + WebSocket.

- Frontend (Vercel): served via CDN.

- Environment variables secured in each platform.

### Your chat app is now production‑ready and accessible from anywhere. 🎉




